'use strict';

const prisma = require('../config/prisma');

const STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

/** Scopes statistics to what the calling role is allowed to see. */
const scopeFor = (user) => (user.role === 'CUSTOMER' ? { customerId: user.id } : {});

const groupToMap = (rows, key) =>
  rows.reduce((acc, row) => {
    acc[row[key]] = row._count?._all ?? row._count ?? 0;
    return acc;
  }, {});

/** Average first-response time in hours, computed from real ticket timestamps. */
const averageResponseHours = async (where) => {
  const rows = await prisma.ticket.findMany({
    where: { ...where, firstResponseAt: { not: null } },
    select: { createdAt: true, firstResponseAt: true },
    take: 1000,
    orderBy: { createdAt: 'desc' },
  });
  if (!rows.length) return null;
  const totalMs = rows.reduce((sum, t) => sum + (t.firstResponseAt - t.createdAt), 0);
  return Number((totalMs / rows.length / 3_600_000).toFixed(2));
};

const satisfactionScore = async (where) => {
  const result = await prisma.ticket.aggregate({
    where: { ...where, satisfaction: { not: null } },
    _avg: { satisfaction: true },
    _count: { satisfaction: true },
  });
  return {
    average: result._avg.satisfaction ? Number(result._avg.satisfaction.toFixed(2)) : null,
    responses: result._count.satisfaction,
  };
};

/** Tickets created vs resolved per day over the last N days. */
const ticketsOverTime = async (where, days = 14) => {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const tickets = await prisma.ticket.findMany({
    where: { ...where, createdAt: { gte: since } },
    select: { createdAt: true, resolvedAt: true },
  });

  const buckets = new Map();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), { date: d.toISOString().slice(0, 10), created: 0, resolved: 0 });
  }

  for (const t of tickets) {
    const createdKey = t.createdAt.toISOString().slice(0, 10);
    if (buckets.has(createdKey)) buckets.get(createdKey).created += 1;
    if (t.resolvedAt) {
      const resolvedKey = t.resolvedAt.toISOString().slice(0, 10);
      if (buckets.has(resolvedKey)) buckets.get(resolvedKey).resolved += 1;
    }
  }

  return [...buckets.values()];
};

const getDashboardStats = async (user) => {
  const where = scopeFor(user);

  const [total, byStatus, byPriority, byCategoryRows, avgHours, satisfaction, timeline] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ['priority'], where, _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ['categoryId'], where, _count: { _all: true } }),
    averageResponseHours(where),
    satisfactionScore(where),
    ticketsOverTime(where),
  ]);

  const statusMap = groupToMap(byStatus, 'status');
  const priorityMap = groupToMap(byPriority, 'priority');

  const categories = await prisma.category.findMany({ select: { id: true, name: true, color: true } });
  const categoryLookup = Object.fromEntries(categories.map((c) => [c.id, c]));

  const assignedToMe =
    user.role === 'SUPPORT_AGENT'
      ? await prisma.ticket.count({ where: { assigneeId: user.id, status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING'] } } })
      : null;

  return {
    cards: {
      totalTickets: total,
      openTickets: statusMap.OPEN || 0,
      inProgressTickets: statusMap.IN_PROGRESS || 0,
      pendingTickets: statusMap.PENDING || 0,
      resolvedTickets: (statusMap.RESOLVED || 0) + (statusMap.CLOSED || 0),
      urgentTickets: priorityMap.URGENT || 0,
      assignedToMe,
      averageResponseHours: avgHours,
      satisfaction,
    },
    charts: {
      byStatus: STATUSES.map((status) => ({ name: status, value: statusMap[status] || 0 })),
      byPriority: PRIORITIES.map((priority) => ({ name: priority, value: priorityMap[priority] || 0 })),
      byCategory: byCategoryRows.map((row) => ({
        name: row.categoryId ? categoryLookup[row.categoryId]?.name || 'Unknown' : 'Uncategorised',
        color: row.categoryId ? categoryLookup[row.categoryId]?.color : '#94a3b8',
        value: row._count._all,
      })),
      overTime: timeline,
    },
  };
};

const getAdminAnalytics = async () => {
  const base = await getDashboardStats({ role: 'ADMIN' });

  const [userCounts, agentRows, sentimentRows, totalUsers, activeUsers] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.ticket.groupBy({
      by: ['assigneeId'],
      where: { assigneeId: { not: null } },
      _count: { _all: true },
    }),
    prisma.aIAnalysis.groupBy({ by: ['sentiment'], _count: { _all: true } }),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  const agents = await prisma.user.findMany({
    where: { id: { in: agentRows.map((r) => r.assigneeId).filter(Boolean) } },
    select: { id: true, name: true },
  });
  const agentLookup = Object.fromEntries(agents.map((a) => [a.id, a.name]));

  return {
    ...base,
    users: {
      total: totalUsers,
      active: activeUsers,
      byRole: groupToMap(userCounts, 'role'),
    },
    charts: {
      ...base.charts,
      agentWorkload: agentRows.map((row) => ({
        name: agentLookup[row.assigneeId] || 'Unknown',
        value: row._count._all,
      })),
      sentiment: sentimentRows.map((row) => ({ name: row.sentiment, value: row._count._all })),
    },
  };
};

const getSystemStats = async () => {
  const [users, tickets, messages, attachments, analyses, notifications, auditLogs] = await Promise.all([
    prisma.user.count(),
    prisma.ticket.count(),
    prisma.ticketMessage.count(),
    prisma.attachment.count(),
    prisma.aIAnalysis.count(),
    prisma.notification.count(),
    prisma.auditLog.count(),
  ]);

  return {
    records: { users, tickets, messages, attachments, analyses, notifications, auditLogs },
    runtime: {
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
  };
};

module.exports = { getDashboardStats, getAdminAnalytics, getSystemStats };
