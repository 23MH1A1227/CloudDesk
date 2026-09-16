'use strict';

const router = require('express').Router();
const controller = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', controller.list);
router.get('/unread-count', controller.unreadCount);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

module.exports = router;
