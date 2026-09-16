'use strict';

const pino = require('pino');
const env = require('./env');

const transport =
  env.nodeEnv === 'development'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
    : undefined;

const logger = pino({
  level: env.isTest ? 'silent' : env.logLevel,
  transport,
  // Never let credentials reach the log stream.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'password',
      'token',
      'GEMINI_API_KEY',
      'AWS_SECRET_ACCESS_KEY',
    ],
    censor: '[redacted]',
  },
});

module.exports = logger;
