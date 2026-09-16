'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',

  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 10),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    timeoutMs: toInt(process.env.AI_TIMEOUT_MS, 20000),
  },

  storage: {
    driver: (process.env.STORAGE_DRIVER || 'local').toLowerCase(),
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    maxUploadSizeMb: toInt(process.env.MAX_UPLOAD_SIZE_MB, 5),
  },

  aws: {
    region: process.env.AWS_REGION || '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
  },

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 300),
    authMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};

env.isProduction = env.nodeEnv === 'production';
env.isTest = env.nodeEnv === 'test';

// In development/test a fallback secret keeps the app runnable, but production
// must fail fast rather than sign tokens with a guessable key.
if (!env.jwtSecret) {
  if (env.isProduction) {
    throw new Error('JWT_SECRET is required in production. Set it in your environment.');
  }
  env.jwtSecret = 'clouddesk-development-only-secret-do-not-use-in-production';
}

env.aiEnabled = Boolean(env.gemini.apiKey);
env.s3Enabled =
  env.storage.driver === 's3' &&
  Boolean(env.aws.region && env.aws.s3Bucket && env.aws.accessKeyId && env.aws.secretAccessKey);

module.exports = env;
