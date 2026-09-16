'use strict';

const fs = require('fs/promises');
const path = require('path');
const env = require('../../config/env');
const { safeFileName } = require('../../utils/sanitize');

const uploadRoot = path.resolve(__dirname, '../../../', env.storage.uploadDir);

const ensureDir = async () => {
  await fs.mkdir(uploadRoot, { recursive: true });
};

/** Writes the buffer to ./uploads and returns a URL served by /uploads. */
const put = async (file) => {
  await ensureDir();
  const fileName = safeFileName(file.originalname);
  const destination = path.join(uploadRoot, fileName);

  // Defence in depth: refuse anything that escapes the upload root.
  if (!destination.startsWith(uploadRoot + path.sep)) {
    throw new Error('Resolved upload path escaped the upload directory');
  }

  await fs.writeFile(destination, file.buffer);
  return { fileName, url: `/uploads/${fileName}`, storage: 'local' };
};

const remove = async (fileName) => {
  const target = path.join(uploadRoot, path.basename(fileName));
  await fs.unlink(target).catch(() => {});
};

module.exports = { put, remove, uploadRoot, driver: 'local' };
