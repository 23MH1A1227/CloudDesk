'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  // Rate limiting only gets in the way of the integration test suite.
  skip: () => env.isTest,
  message: { success: false, message: 'Too many requests, please slow down and try again later.' },
};

const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
});

const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  message: { success: false, message: 'Too many authentication attempts. Try again later.' },
});

const aiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'AI analysis rate limit reached. Try again in a minute.' },
});

module.exports = { apiLimiter, authLimiter, aiLimiter };
