'use strict';

const { PrismaClient } = require('@prisma/client');
const env = require('./env');

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__clouddeskPrisma ||
  new PrismaClient({
    log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });

if (!env.isProduction) {
  globalForPrisma.__clouddeskPrisma = prisma;
}

module.exports = prisma;
