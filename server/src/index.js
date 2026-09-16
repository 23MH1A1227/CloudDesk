'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./config/prisma');

const server = app.listen(env.port, () => {
  logger.info(`CloudDesk API listening on http://localhost:${env.port} [${env.nodeEnv}]`);
  logger.info(`AI: ${env.aiEnabled ? `Gemini (${env.gemini.model})` : 'disabled - using rule-based fallback'}`);
  logger.info(`Storage: ${env.s3Enabled ? `S3 (${env.aws.s3Bucket})` : 'local disk'}`);
  if (!env.databaseUrl) {
    logger.warn('DATABASE_URL is not set - database requests will fail. Copy .env.example to .env.');
  }
});

const shutdown = async (signal) => {
  logger.info(`${signal} received - shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
  // Force exit if connections refuse to drain.
  setTimeout(() => process.exit(1), 10000).unref();
};

['SIGTERM', 'SIGINT'].forEach((signal) => process.on(signal, () => shutdown(signal)));

process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled promise rejection'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception - exiting');
  process.exit(1);
});

module.exports = server;
