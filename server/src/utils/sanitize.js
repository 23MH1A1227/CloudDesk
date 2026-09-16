'use strict';

const path = require('path');
const crypto = require('crypto');

/**
 * Builds a collision-free, traversal-safe filename.
 * Everything except [a-z0-9-_] is stripped from the original base name.
 */
const safeFileName = (originalName) => {
  const ext = path.extname(originalName || '').toLowerCase().slice(0, 10);
  const base = path
    .basename(originalName || 'file', ext)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'file';
  return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${base}${ext}`;
};

/** Strips a Prisma user record down to a safe API shape (never leaks password). */
const publicUser = (user) => {
  if (!user) return null;
  /* eslint-disable no-unused-vars */
  const { password, ...rest } = user;
  /* eslint-enable no-unused-vars */
  return rest;
};

module.exports = { safeFileName, publicUser };
