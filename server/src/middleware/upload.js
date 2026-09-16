'use strict';

const path = require('path');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS } = require('../config/constants');

// Files are buffered in memory so the same middleware works for both the
// local disk driver and the S3 driver without a temp-file dance.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}. Allowed: PNG, JPG, PDF.`));
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(ApiError.badRequest(`Unsupported file extension: ${ext || '(none)'}.`));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.storage.maxUploadSizeMb * 1024 * 1024,
    files: 1,
  },
});

/** Single-file upload with multer errors translated into ApiError. */
const uploadSingle = (field) => (req, res, next) =>
  upload.single(field)(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.payloadTooLarge(`File exceeds ${env.storage.maxUploadSizeMb}MB limit`));
      }
      return next(ApiError.badRequest(`Upload error: ${err.message}`));
    }
    return next(err);
  });

module.exports = { uploadSingle };
