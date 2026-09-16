'use strict';

const prisma = require('../config/prisma');
const logger = require('../config/logger');

/**
 * Audit logging must never break the request it is recording,
 * so failures are logged and swallowed.
 */
const record = async ({ action, actorId = null, entity, entityId = null, metadata = null, ip = null }) => {
  try {
    await prisma.auditLog.create({
      data: { action, actorId, entity, entityId, metadata: metadata ?? undefined, ip },
    });
  } catch (err) {
    logger.error({ err: err.message, action }, 'Failed to write audit log');
  }
};

const list = async ({ skip, limit, action, actorId }) => {
  const where = {};
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, name: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total };
};

module.exports = { record, list };
