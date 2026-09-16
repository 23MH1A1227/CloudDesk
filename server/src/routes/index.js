'use strict';

const router = require('express').Router();
const { getAiStatus } = require('../services/ai/gemini.service');
const storage = require('../services/storage');

router.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'CloudDesk API',
    version: '1.0.0',
    ai: getAiStatus(),
    storage: { driver: storage.activeDriver() },
    endpoints: ['/api/auth', '/api/tickets', '/api/notifications', '/api/categories', '/api/admin'],
  });
});

router.use('/auth', require('./auth.routes'));
router.use('/tickets', require('./ticket.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/categories', require('./category.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
