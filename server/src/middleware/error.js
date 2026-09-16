'use strict';

const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const logger = require('../config/logger');

/** Translates known error shapes into a consistent JSON envelope. */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      message = `A record with this ${target} already exists`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Resource not found';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Related record does not exist';
    } else {
      statusCode = 400;
      message = 'Database request failed';
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database unavailable. Is PostgreSQL running and DATABASE_URL correct?';
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid database query';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON body';
  }

  if (statusCode >= 500) {
    logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled error');
    if (env.isProduction) {
      message = 'Internal server error';
      details = undefined;
    }
  } else {
    logger.warn({ path: req.originalUrl, method: req.method, statusCode, message }, 'Request failed');
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.isProduction || statusCode < 500 ? {} : { stack: err.stack }),
  });
};

module.exports = { errorHandler, ApiError };
