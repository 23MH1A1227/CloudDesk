'use strict';

const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { getPagination, buildMeta } = require('../utils/pagination');

/** Fire-and-forget creation: a failed notification must not fail the parent action. */
const notify = async ({ userId, type, title, body, link = null }) => {
  if (!userId) return null;
  try {
    return await prisma.notification.create({ data: { userId, type, title, body, link } });
  } catch (err) {
    logger.error({ err: err.message, type }, 'Failed to create notification');
    return null;
  }
};

const notifyMany = async (userIds, payload) => {
  const unique = [...new Set(userIds.filter(Boolean))];
  await Promise.all(unique.map((userId) => notify({ ...payload, userId })));
};

const listForUser = async (userId, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const where = { userId };
  if (query.unread === 'true' || query.unread === true) where.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { items, unreadCount, meta: buildMeta(total, page, limit) };
};

const markAsRead = async (userId, id) => {
  const result = await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
  return result.count > 0;
};

const markAllAsRead = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return result.count;
};

const unreadCount = (userId) => prisma.notification.count({ where: { userId, isRead: false } });

module.exports = { notify, notifyMany, listForUser, markAsRead, markAllAsRead, unreadCount };
