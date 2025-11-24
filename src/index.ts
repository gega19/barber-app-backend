import 'reflect-metadata';
import './types/express';

// Import config first - it will load .env with explicit paths
import { config } from './config/env';
// Import prisma AFTER env is loaded to ensure DATABASE_URL is set
import prisma from './config/prisma';
import { createApp } from './config/app';
import authRoutes from './routes/auth.routes';
import barberRoutes from './routes/barber.routes';
import specialtyRoutes from './routes/specialty.routes';
import workplaceRoutes from './routes/workplace.routes';
import workplaceMediaRoutes from './routes/workplace-media.routes';
import serviceRoutes from './routes/service.routes';
import barberMediaRoutes from './routes/barber-media.routes';
import barberCourseRoutes from './routes/barber-course.routes';
import uploadRoutes from './routes/upload.routes';
import appointmentRoutes from './routes/appointment.routes';
import promotionRoutes from './routes/promotion.routes';
import reviewRoutes from './routes/review.routes';
import paymentMethodRoutes from './routes/payment-method.routes';
import barberAvailabilityRoutes from './routes/barber-availability.routes';
import statsRoutes from './routes/stats.routes';
import analyticsRoutes from './routes/analytics.routes';
import userRoutes from './routes/user.routes';
import fcmTokenRoutes from './routes/fcm-token.routes';
import campaignRoutes from './routes/campaign.routes';
import appVersionRoutes from './routes/app-version.routes';
import legalDocumentRoutes from './routes/legal-document.routes';
import path from 'path';
import express from 'express';
import http from 'http';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { createSocketServer } from './socket/socket.server';
import { initializeFirebaseAdmin } from './config/firebase-admin';

const app = createApp();

// Servir archivos APK estáticos
app.use('/uploads/apk', express.static(path.join(__dirname, '../uploads/apk'), {
  setHeaders: (res: express.Response, filePath: string) => {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// NOTA: Ya no servimos otros archivos estáticos desde /uploads porque ahora usamos Cloudinary
// Los archivos se suben directamente a Cloudinary y se devuelve la URL completa

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/workplaces', workplaceRoutes);
app.use('/api/workplace-media', workplaceMediaRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/barber-media', barberMediaRoutes);
app.use('/api/barber-courses', barberCourseRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/barber-availability', barberAvailabilityRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fcm-tokens', fcmTokenRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/legal', legalDocumentRoutes);

// Rutas de app version (públicas y admin)
app.use('/api/app', appVersionRoutes);
app.use('/api/admin/app', appVersionRoutes);

// Error Handling Middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize Firebase Admin SDK
    initializeFirebaseAdmin();
    
    // Test database connection and apply pending migrations
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      
      // Verify connection with a simple query
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection verified');
      
      // Try to apply any pending migrations
      try {
        const { execSync } = require('child_process');
        console.log('🔄 Checking for pending migrations...');
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          cwd: process.cwd(),
          env: process.env 
        });
        console.log('✅ Migrations check completed');
      } catch (migrateError) {
        // If migrations fail, log but don't stop the server
        console.warn('⚠️  Could not apply migrations automatically:', (migrateError as Error).message);
        console.warn('⚠️  You may need to run migrations manually: npx prisma migrate deploy');
      }
    } catch (dbError) {
      const error = dbError as Error;
      const isInternalUrlError = error.message.includes('postgres.railway.internal');
      
      // If internal URL fails and we have public URL, suggest using it
      if (isInternalUrlError && process.env.DATABASE_PUBLIC_URL) {
        console.error('❌ Internal database URL failed:', error.message);
        console.error('💡 Solution: Update DATABASE_URL in Railway to use DATABASE_PUBLIC_URL');
        console.error('   1. Go to your backend service in Railway');
        console.error('   2. Go to Variables tab');
        console.error('   3. Update DATABASE_URL to use the value from DATABASE_PUBLIC_URL');
        console.error('   4. Or temporarily set DATABASE_URL = DATABASE_PUBLIC_URL');
      } else {
        console.error('❌ Database connection failed:', error.message);
      }
      
      console.error('❌ DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
      console.error('❌ DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL ? 'Set (hidden)' : 'NOT SET');
      console.error('❌ Please check:');
      console.error('   1. PostgreSQL service is running in Railway');
      console.error('   2. DATABASE_URL or DATABASE_PUBLIC_URL variable is configured');
      console.error('   3. Both services are in the same Railway project');
      console.error('   4. Database service is not paused');
      console.error('');
      console.error('⚠️  Server starting without database connection...');
      console.error('⚠️  API endpoints will fail until database is connected');
    }
    
    // Create HTTP server
    const httpServer = http.createServer(app);
    
    // Initialize Socket.IO server
    createSocketServer(httpServer);
    
    // Start listening
    // In production (Render), listen on 0.0.0.0 to accept external connections
    const host = config.nodeEnv === 'production' ? '0.0.0.0' : 'localhost';
    httpServer.listen(config.port, host, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Barber App Backend Server Running                        ║
║                                                               ║
║   Environment: ${config.nodeEnv.padEnd(47)}║
║   Host:        ${host.padEnd(47)}║
║   Port:        ${config.port.toString().padEnd(47)}║
║   URL:         http://${host}:${config.port.toString().padEnd(35)}║
║                                                               ║
║   Health Check: http://${host}:${config.port}/health${' '.repeat(12)}║
║   API Docs:     http://${host}:${config.port}/api${' '.repeat(17)}║
║   Socket.IO:    ws://${host}:${config.port.toString().padEnd(33)}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

