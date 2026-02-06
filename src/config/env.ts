import dotenv from 'dotenv';
import path from 'path';

// Always try to load .env - it's safe to call multiple times
// Try multiple possible paths (CommonJS - __dirname is available)
const possiblePaths = [
  path.join(__dirname, '..', '..', '.env'),
  path.join(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env'),
];

let loaded = false;
for (const envPath of possiblePaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      loaded = true;
      console.log(`✅ Loaded .env from: ${envPath}`);
      break;
    }
  } catch (error) {
    // Continue to next path
  }
}

if (!loaded) {
  // Fallback: try default location
  dotenv.config();
}

// Railway provides both DATABASE_URL (internal) and DATABASE_PUBLIC_URL (public)
// Use public URL as fallback if internal URL is not available or fails
const getDatabaseUrl = () => {
  // Prefer internal URL (faster, more secure) but fallback to public URL
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // Fallback to public URL if internal URL is not set
  if (process.env.DATABASE_PUBLIC_URL) {
    console.log('⚠️  Using DATABASE_PUBLIC_URL as fallback (DATABASE_URL not set)');
    return process.env.DATABASE_PUBLIC_URL;
  }
  return '';
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  database: {
    url: getDatabaseUrl(),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },
  
  socket: {
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '60000', 10),
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000', 10),
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || process.env.CORS_ORIGIN || '*',
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'barber-app',
  },
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || '',
  },

  phoneCodeCooldownSeconds: parseInt(
    process.env.PHONE_CODE_COOLDOWN_SECONDS || '60',
    10,
  ),

  competition: {
    pointsPerAppointment: parseInt(
      process.env.COMPETITION_POINTS_PER_APPOINTMENT || '10',
      10,
    ),
    maxPointsPerClientPerPeriod: parseInt(
      process.env.COMPETITION_MAX_POINTS_PER_CLIENT_PER_PERIOD || '0',
      10,
    ) || undefined, // 0 = no cap
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

