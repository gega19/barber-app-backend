import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env if DATABASE_URL is not set (env.ts should have loaded it, but just in case)
if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL) {
  const possiblePaths = [
    path.join(__dirname, '..', '..', '.env'),
    path.join(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  
  for (const envPath of possiblePaths) {
    try {
      const result = dotenv.config({ path: envPath });
      if (!result.error) {
        break;
      }
    } catch (error) {
      // Continue to next path
    }
  }
}

// Use DATABASE_PUBLIC_URL as fallback if DATABASE_URL is not available
// This helps when Railway's internal network has issues
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || '';
if (!process.env.DATABASE_URL && process.env.DATABASE_PUBLIC_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL;
  console.log('⚠️  Using DATABASE_PUBLIC_URL as DATABASE_URL (internal URL not available)');
}

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

