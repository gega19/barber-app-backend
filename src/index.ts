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
import uploadRoutes from './routes/upload.routes';
import appointmentRoutes from './routes/appointment.routes';
import promotionRoutes from './routes/promotion.routes';
import reviewRoutes from './routes/review.routes';
import paymentMethodRoutes from './routes/payment-method.routes';
import barberAvailabilityRoutes from './routes/barber-availability.routes';
import statsRoutes from './routes/stats.routes';
import userRoutes from './routes/user.routes';
import path from 'path';
import express from 'express';
import http from 'http';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { createSocketServer } from './socket/socket.server';

const app = createApp();

// Middleware para servir archivos estáticos con headers correctos
app.use('/uploads', (req, res, next) => {
  // Establecer headers CORS primero
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res: express.Response, filePath: string, stat: any) => {
    // Determinar Content-Type basado en extensión
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (['.jpg', '.jpeg'].includes(ext)) {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    } else if (ext === '.mp4') {
      contentType = 'video/mp4';
    } else if (ext === '.mov') {
      contentType = 'video/quicktime';
    } else if (ext === '.avi') {
      contentType = 'video/x-msvideo';
    }
    
    // Establecer Content-Type explícitamente
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  },
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/workplaces', workplaceRoutes);
app.use('/api/workplace-media', workplaceMediaRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/barber-media', barberMediaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/barber-availability', barberAvailabilityRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);

// Error Handling Middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.warn('⚠️  Database connection failed:', (dbError as Error).message);
      console.warn('⚠️  Server starting without database connection...');
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

