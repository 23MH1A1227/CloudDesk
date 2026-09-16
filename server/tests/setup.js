'use strict';

// Test-time defaults. A real DATABASE_URL must still be provided by the
// environment (see README → Testing) for the DB-backed suites to run.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-used-in-production';
process.env.LOG_LEVEL = 'silent';
process.env.GEMINI_API_KEY = '';
process.env.STORAGE_DRIVER = 'local';
