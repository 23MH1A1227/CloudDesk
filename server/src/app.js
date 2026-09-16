'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');

const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./config/prisma');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const { errorHandler } = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimit');
const { getAiStatus } = require('./services/ai/gemini.service');
const storage = require('./services/storage');

const app = express();

// Behind a load balancer (ALB / nginx) so rate limiting sees the real client IP.
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.isProduction ? undefined : false,
  })
);

const allowedOrigins = env.clientOrigin.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / curl / server-to-server requests with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (!env.isTest) {
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));
}

// Locally uploaded attachments. When S3 is enabled, URLs point at the bucket instead.
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../', env.storage.uploadDir), {
    index: false,
    dotfiles: 'deny',
    maxAge: '1h',
  })
);

app.get('/health', async (_req, res) => {
  let database = 'up';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'down';
  }

  res.status(200).json({
    status: 'ok',
    service: 'clouddesk-api',
    version: '1.0.0',
    environment: env.nodeEnv,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    dependencies: {
      database,
      ai: getAiStatus().configured ? 'configured' : 'fallback',
      storage: storage.activeDriver(),
    },
  });
});

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
