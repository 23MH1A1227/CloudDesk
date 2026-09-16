'use strict';

const env = require('../../config/env');
const logger = require('../../config/logger');
const local = require('./local.storage');

/**
 * Chooses the storage driver at call time.
 * S3 activates only when STORAGE_DRIVER=s3 AND all AWS variables are present;
 * otherwise everything falls back to local disk so the app runs without AWS.
 */
const getDriver = () => {
  if (env.s3Enabled) {
    // eslint-disable-next-line global-require
    return require('./s3.storage');
  }
  if (env.storage.driver === 's3') {
    logger.warn('STORAGE_DRIVER=s3 but AWS configuration is incomplete - using local storage');
  }
  return local;
};

module.exports = {
  put: (file) => getDriver().put(file),
  remove: (fileName, storage) => (storage === 's3' && env.s3Enabled ? getDriver() : local).remove(fileName),
  activeDriver: () => getDriver().driver,
};
