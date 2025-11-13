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
  
  // Manejo manual de OPTIONS PRIMERO (antes de CORS) para asegurar que siempre responda
  app.options('*', (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = config.nodeEnv === 'development' 
      ? ['*']
      : [
          config.cors.origin,
          'https://barber-app-backoffice.onrender.com',
          'https://barber-app-backend-kj6s.onrender.com',
        ].filter(Boolean);
    
    if (config.nodeEnv === 'development' || !origin || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
    }
    res.sendStatus(200);
  });
  
  // CORS Configuration
  // En desarrollo, permitir todos los orígenes
  // En producción, permitir el origen del backoffice y otros orígenes configurados
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Permitir solicitudes sin origen (ej: Postman, mobile apps)
      if (!origin) {
        return callback(null, true);
      }
      
      // En desarrollo, permitir todos
      if (config.nodeEnv === 'development') {
        return callback(null, true);
      }
      
      // En producción, verificar contra orígenes permitidos
      const allowedOrigins = [
        config.cors.origin,
        'https://barber-app-backoffice.onrender.com',
        'https://barber-app-backend-kj6s.onrender.com',
      ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // En lugar de rechazar, permitir si es un origen de Render
        if (origin.includes('.onrender.com')) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 horas
  };
  
  app.use(cors(corsOptions));
  
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

