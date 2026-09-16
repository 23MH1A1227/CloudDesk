'use strict';

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

/** Verifies the Bearer token and attaches the current user to req.user. */
const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }

  let payload;
  try {
    payload = verifyToken(header.slice(7).trim());
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid token'
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, isActive: true, avatarUrl: true },
  });

  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');

  req.user = user;
  next();
});

/** Restricts a route to one or more roles. Use after authenticate. */
const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`));
    }
    return next();
  };

module.exports = { authenticate, authorize };
