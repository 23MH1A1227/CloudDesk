'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const service = require('../services/notification.service');

const list = asyncHandler(async (req, res) => {
  const result = await service.listForUser(req.user.id, req.query);
  res.json({
    success: true,
    data: result.items,
    meta: { ...result.meta, unreadCount: result.unreadCount },
  });
});

const unreadCount = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { unreadCount: await service.unreadCount(req.user.id) } });
});

const markRead = asyncHandler(async (req, res) => {
  const updated = await service.markAsRead(req.user.id, req.params.id);
  if (!updated) throw ApiError.notFound('Notification not found');
  res.json({ success: true, message: 'Notification marked as read' });
});

const markAllRead = asyncHandler(async (req, res) => {
  const count = await service.markAllAsRead(req.user.id);
  res.json({ success: true, message: `${count} notification(s) marked as read`, data: { count } });
});

module.exports = { list, unreadCount, markRead, markAllRead };
