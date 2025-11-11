import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './env';

export const createApp = (): Application => {
  const app = express();

  // Security Middleware
  // En desarrollo, desactivar CSP para evitar problemas con imágenes
  const helmetConfig: any = {
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  };

  // Solo en producción aplicar CSP estricto
  if (config.nodeEnv === 'production') {
    helmetConfig.contentSecurityPolicy = {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "http:", "https:", "*"],
        connectSrc: ["'self'", "http:", "https:", "*"],
        fontSrc: ["'self'", "data:", "*"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "http:", "https:", "blob:", "*"],
        frameSrc: ["'none'"],
      },
    };
  } else {
    // En desarrollo, desactivar CSP completamente
    helmetConfig.contentSecurityPolicy = false;
  }

  app.use(helmet(helmetConfig));
  
  // CORS Configuration - Permitir todos los orígenes en desarrollo
  app.use(cors({
    origin: config.nodeEnv === 'development' ? true : config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  
  // Body Parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Compression
  app.use(compression());
  
  // Logging
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }
  
  // Health Check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not configured',
    });
  });
  
  // Debug endpoint (only in development)
  if (config.nodeEnv === 'development') {
    app.get('/debug/env', (req, res) => {
      res.json({
        DATABASE_URL: process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
        cwd: process.cwd(),
      });
    });
  }
  
  // API Routes will be added here
  app.get('/api', (req, res) => {
    res.json({
      message: 'Welcome to Barber App API',
      version: '1.0.0',
    });
  });
  
  return app;
};

