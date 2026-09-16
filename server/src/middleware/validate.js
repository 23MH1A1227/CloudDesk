'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Validates req.body / req.query / req.params against Zod schemas.
 * Parsed (and coerced) values replace the originals.
 */
const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query ?? {});
    if (schemas.params) req.params = schemas.params.parse(req.params ?? {});
    return next();
  } catch (err) {
    if (err.name === 'ZodError') {
      const details = err.errors.map((e) => ({
        field: e.path.join('.') || '(root)',
        message: e.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    return next(err);
  }
};

module.exports = validate;
