'use strict';

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { getPagination, buildMeta } = require('../utils/pagination');
const { generateTicketReference } = require('../utils/reference');
const audit = require('./audit.service');
const notifications = require('./notification.service');
const storage = require('./storage');
const { analyzeTicket } = require('./ai/gemini.service');

const USER_BRIEF = { id: true, name: true, email: true, role: true, avatarUrl: true };

const TICKET_INCLUDE = {
  customer: { select: USER_BRIEF },
  assignee: { select: USER_BRIEF },
  category: { select: { id: true, name: true, slug: true, color: true } },
  _count: { select: { messages: true, attachments: true } },
};

const TICKET_DETAIL_INCLUDE = {
  ...TICKET_INCLUDE,
  messages: {
    orderBy: { createdAt: 'asc' },
    include: { author: { select: USER_BRIEF } },
  },
  attachments: {
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: USER_BRIEF } },
  },
  aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
};

/** Customers may only touch their own tickets; agents and admins see everything. */
const assertCanAccess = (ticket, user) => {
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (user.role === 'CUSTOMER' && ticket.customerId !== user.id) {
    throw ApiError.forbidden('You can only access your own tickets');
  }
  return ticket;
};

const staffIds = async () => {
  const staff = await prisma.user.findMany({
    where: { role: { in: ['SUPPORT_AGENT', 'ADMIN'] }, isActive: true },
    select: { id: true },
  });
  return staff.map((s) => s.id);
};

const buildWhere = (user, query = {}) => {
  const where = {};

  if (user.role === 'CUSTOMER') {
    where.customerId = user.id;
  } else if (query.scope === 'mine') {
    where.assigneeId = user.id;
  } else if (query.scope === 'unassigned') {
    where.assigneeId = null;
  }

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.assigneeId && user.role !== 'CUSTOMER') where.assigneeId = query.assigneeId;
  if (query.customerId && user.role !== 'CUSTOMER') where.customerId = query.customerId;

  if (query.search) {
    const term = String(query.search).trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { reference: { contains: term, mode: 'insensitive' } },
    ];
  }

  return where;
};

const listTickets = async (user, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const where = buildWhere(user, query);

  const sortField = ['createdAt', 'updatedAt', 'priority', 'status'].includes(query.sortBy)
    ? query.sortBy
    : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortField]: sortOrder },
      include: TICKET_INCLUDE,
    }),
    prisma.ticket.count({ where }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
};

const getTicket = async (user, id) => {
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: TICKET_DETAIL_INCLUDE });
  assertCanAccess(ticket, user);

  // Customers never see internal agent notes.
  if (user.role === 'CUSTOMER') {
    ticket.messages = ticket.messages.filter((m) => !m.isInternal);
  }
  return ticket;
};

const createTicket = async (user, data, meta = {}) => {
  let categoryId = data.categoryId || null;
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw ApiError.badRequest('Selected category does not exist');
  }

  const ticket = await prisma.ticket.create({
    data: {
      reference: generateTicketReference(),
      title: data.title.trim(),
      description: data.description.trim(),
      priority: data.priority || 'MEDIUM',
      categoryId,
      customerId: user.id,
    },
    include: TICKET_INCLUDE,
  });

  await audit.record({
    action: 'TICKET_CREATED',
    actorId: user.id,
    entity: 'Ticket',
    entityId: ticket.id,
    metadata: { reference: ticket.reference, title: ticket.title },
    ip: meta.ip,
  });

  await notifications.notify({
    userId: user.id,
    type: 'TICKET_CREATED',
    title: `Ticket ${ticket.reference} created`,
    body: `We received your request "${ticket.title}" and our team will respond shortly.`,
    link: `/tickets/${ticket.id}`,
  });

  await notifications.notifyMany(await staffIds(), {
    type: 'TICKET_CREATED',
    title: `New ticket ${ticket.reference}`,
    body: `${user.name} submitted: ${ticket.title}`,
    link: `/tickets/${ticket.id}`,
  });

  return ticket;
};

const updateTicket = async (user, id, data, meta = {}) => {
  const existing = await prisma.ticket.findUnique({ where: { id } });
  assertCanAccess(existing, user);

  const updates = {};
  const isStaff = user.role !== 'CUSTOMER';

  if (isStaff) {
    if (data.status && data.status !== existing.status) {
      updates.status = data.status;
      if (data.status === 'RESOLVED') updates.resolvedAt = new Date();
      if (data.status === 'CLOSED') updates.closedAt = new Date();
    }
    if (data.priority) updates.priority = data.priority;
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId || null;
    if (data.assigneeId !== undefined) updates.assigneeId = data.assigneeId || null;
    if (data.title) updates.title = data.title.trim();
  } else {
    // A customer may only rate a resolved ticket or close their own ticket.
    if (data.satisfaction !== undefined) updates.satisfaction = data.satisfaction;
    if (data.status === 'CLOSED') {
      updates.status = 'CLOSED';
      updates.closedAt = new Date();
    }
    if (!Object.keys(updates).length) {
      throw ApiError.forbidden('Customers can only close or rate their own tickets');
    }
  }

  if (!Object.keys(updates).length) {
    return prisma.ticket.findUnique({ where: { id }, include: TICKET_INCLUDE });
  }

  const ticket = await prisma.ticket.update({ where: { id }, data: updates, include: TICKET_INCLUDE });

  await audit.record({
    action: updates.status ? 'TICKET_STATUS_CHANGED' : 'TICKET_UPDATED',
    actorId: user.id,
    entity: 'Ticket',
    entityId: ticket.id,
    metadata: { changes: updates, from: { status: existing.status, priority: existing.priority } },
    ip: meta.ip,
  });

  if (updates.status) {
    await notifications.notify({
      userId: ticket.customerId,
      type: 'TICKET_STATUS_CHANGED',
      title: `Ticket ${ticket.reference} is now ${updates.status.replace('_', ' ').toLowerCase()}`,
      body: `${user.name} changed the status of "${ticket.title}".`,
      link: `/tickets/${ticket.id}`,
    });
  }

  if (updates.assigneeId && updates.assigneeId !== existing.assigneeId) {
    await audit.record({
      action: 'TICKET_ASSIGNED',
      actorId: user.id,
      entity: 'Ticket',
      entityId: ticket.id,
      metadata: { assigneeId: updates.assigneeId },
    });
    await notifications.notify({
      userId: updates.assigneeId,
      type: 'TICKET_ASSIGNED',
      title: `Ticket ${ticket.reference} assigned to you`,
      body: ticket.title,
      link: `/tickets/${ticket.id}`,
    });
  }

  return ticket;
};

const deleteTicket = async (user, id, meta = {}) => {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (user.role !== 'ADMIN') throw ApiError.forbidden('Only administrators can delete tickets');

  await prisma.ticket.delete({ where: { id } });
  await audit.record({
    action: 'TICKET_DELETED',
    actorId: user.id,
    entity: 'Ticket',
    entityId: id,
    metadata: { reference: ticket.reference },
    ip: meta.ip,
  });
  return true;
};

const addMessage = async (user, ticketId, { body, isInternal = false }, meta = {}) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  assertCanAccess(ticket, user);

  const internal = user.role === 'CUSTOMER' ? false : Boolean(isInternal);

  const message = await prisma.ticketMessage.create({
    data: { ticketId, authorId: user.id, body: body.trim(), isInternal: internal },
    include: { author: { select: USER_BRIEF } },
  });

  const ticketUpdates = {};
  if (user.role !== 'CUSTOMER') {
    if (!ticket.firstResponseAt) ticketUpdates.firstResponseAt = new Date();
    if (ticket.status === 'OPEN') ticketUpdates.status = 'IN_PROGRESS';
  } else if (ticket.status === 'RESOLVED') {
    // Customer replied after resolution - reopen it.
    ticketUpdates.status = 'IN_PROGRESS';
    ticketUpdates.resolvedAt = null;
  }

  if (Object.keys(ticketUpdates).length) {
    await prisma.ticket.update({ where: { id: ticketId }, data: ticketUpdates });
  } else {
    await prisma.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } });
  }

  await audit.record({
    action: 'TICKET_MESSAGE_SENT',
    actorId: user.id,
    entity: 'TicketMessage',
    entityId: message.id,
    metadata: { ticketId, isInternal: internal },
    ip: meta.ip,
  });

  if (!internal) {
    if (user.role === 'CUSTOMER') {
      const recipients = ticket.assigneeId ? [ticket.assigneeId] : await staffIds();
      await notifications.notifyMany(recipients, {
        type: 'TICKET_REPLIED',
        title: `Customer replied on ${ticket.reference}`,
        body: body.slice(0, 140),
        link: `/tickets/${ticketId}`,
      });
    } else {
      await notifications.notify({
        userId: ticket.customerId,
        type: 'TICKET_REPLIED',
        title: `Support replied to ${ticket.reference}`,
        body: body.slice(0, 140),
        link: `/tickets/${ticketId}`,
      });
    }
  }

  return message;
};

const addAttachment = async (user, ticketId, file, meta = {}) => {
  if (!file) throw ApiError.badRequest('No file was uploaded');

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  assertCanAccess(ticket, user);

  const stored = await storage.put(file);

  const attachment = await prisma.attachment.create({
    data: {
      ticketId,
      uploadedById: user.id,
      fileName: stored.fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storage: stored.storage,
      url: stored.url,
    },
    include: { uploadedBy: { select: USER_BRIEF } },
  });

  await audit.record({
    action: 'ATTACHMENT_UPLOADED',
    actorId: user.id,
    entity: 'Attachment',
    entityId: attachment.id,
    metadata: { ticketId, size: file.size, mimeType: file.mimetype },
    ip: meta.ip,
  });

  return attachment;
};

/** Runs AI analysis and persists the result. Falls back safely if Gemini is down. */
const runAnalysis = async (user, ticketId, meta = {}) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      category: { select: { name: true } },
      messages: { orderBy: { createdAt: 'asc' }, include: { author: { select: { role: true } } } },
    },
  });
  assertCanAccess(ticket, user);

  const { analysis, source, model, available, error } = await analyzeTicket({
    title: ticket.title,
    description: ticket.description,
    category: ticket.category?.name || null,
    priority: ticket.priority,
    conversation: ticket.messages
      .filter((m) => !m.isInternal)
      .map((m) => ({ role: m.author.role, body: m.body })),
  });

  const record = await prisma.aIAnalysis.create({
    data: {
      ticketId,
      summary: analysis.summary,
      category: analysis.category,
      priority: analysis.priority,
      sentiment: analysis.sentiment,
      missingInformation: analysis.missingInformation,
      suggestedResponse: analysis.suggestedResponse,
      recommendedAction: analysis.recommendedAction,
      source,
      model,
      available,
      error,
    },
  });

  await audit.record({
    action: 'AI_ANALYSIS_REQUESTED',
    actorId: user.id,
    entity: 'AIAnalysis',
    entityId: record.id,
    metadata: { ticketId, source, available },
    ip: meta.ip,
  });

  await notifications.notify({
    userId: user.id,
    type: 'AI_ANALYSIS_COMPLETED',
    title: `AI analysis ready for ${ticket.reference}`,
    body: available ? 'Gemini analysis completed.' : 'Rule-based analysis used (AI unavailable).',
    link: `/tickets/${ticketId}`,
  });

  return record;
};

const getLatestAnalysis = async (user, ticketId) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  assertCanAccess(ticket, user);
  return prisma.aIAnalysis.findFirst({ where: { ticketId }, orderBy: { createdAt: 'desc' } });
};

module.exports = {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  addMessage,
  addAttachment,
  runAnalysis,
  getLatestAnalysis,
};
