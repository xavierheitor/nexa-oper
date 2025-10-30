import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  storageKey: process.env.STORAGE_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ],
};

// Validações
if (!config.storageKey) {
  throw new Error('STORAGE_KEY is required');
}

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

