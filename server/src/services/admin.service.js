'use strict';

const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { getPagination, buildMeta } = require('../utils/pagination');
const { USER_SELECT } = require('./auth.service');
const audit = require('./audit.service');

// ---------------------------------------------------------------- users

const listUsers = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.role) where.role = query.role;
  if (query.isActive !== undefined && query.isActive !== '') {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { ...USER_SELECT, _count: { select: { tickets: true, assignedTickets: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
};

const createUser = async (actor, data) => {
  const email = data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await prisma.user.create({
    data: {
      email,
      name: data.name.trim(),
      role: data.role,
      password: await bcrypt.hash(data.password, env.bcryptSaltRounds),
    },
    select: USER_SELECT,
  });

  await audit.record({
    action: 'USER_CREATED',
    actorId: actor.id,
    entity: 'User',
    entityId: user.id,
    metadata: { role: user.role },
  });
  return user;
};

const updateUser = async (actor, id, data) => {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound('User not found');

  if (actor.id === id && data.role && data.role !== actor.role) {
    throw ApiError.badRequest('You cannot change your own role');
  }
  if (actor.id === id && data.isActive === false) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  const updates = {};
  if (data.name) updates.name = data.name.trim();
  if (data.role) updates.role = data.role;
  if (data.isActive !== undefined) updates.isActive = data.isActive;
  if (data.password) updates.password = await bcrypt.hash(data.password, env.bcryptSaltRounds);

  const user = await prisma.user.update({ where: { id }, data: updates, select: USER_SELECT });

  await audit.record({
    action: 'USER_UPDATED',
    actorId: actor.id,
    entity: 'User',
    entityId: id,
    metadata: { changes: Object.keys(updates) },
  });
  return user;
};

const deleteUser = async (actor, id) => {
  if (actor.id === id) throw ApiError.badRequest('You cannot delete your own account');
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound('User not found');

  await prisma.user.delete({ where: { id } });
  await audit.record({
    action: 'USER_DELETED',
    actorId: actor.id,
    entity: 'User',
    entityId: id,
    metadata: { email: target.email },
  });
  return true;
};

const listAgents = () =>
  prisma.user.findMany({
    where: { role: { in: ['SUPPORT_AGENT', 'ADMIN'] }, isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });

// ---------------------------------------------------------------- categories

const slugify = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const listCategories = (includeInactive = false) =>
  prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { tickets: true } } },
  });

const createCategory = async (actor, data) => {
  const category = await prisma.category.create({
    data: {
      name: data.name.trim(),
      slug: slugify(data.name),
      description: data.description || null,
      color: data.color || '#6366f1',
    },
  });
  await audit.record({
    action: 'CATEGORY_CREATED',
    actorId: actor.id,
    entity: 'Category',
    entityId: category.id,
  });
  return category;
};

const updateCategory = async (actor, id, data) => {
  const updates = {};
  if (data.name) {
    updates.name = data.name.trim();
    updates.slug = slugify(data.name);
  }
  if (data.description !== undefined) updates.description = data.description || null;
  if (data.color) updates.color = data.color;
  if (data.isActive !== undefined) updates.isActive = data.isActive;

  const category = await prisma.category.update({ where: { id }, data: updates });
  await audit.record({
    action: 'CATEGORY_UPDATED',
    actorId: actor.id,
    entity: 'Category',
    entityId: id,
  });
  return category;
};

const deleteCategory = async (actor, id) => {
  // Tickets keep existing with categoryId set to NULL (onDelete: SetNull).
  await prisma.category.delete({ where: { id } });
  await audit.record({
    action: 'CATEGORY_DELETED',
    actorId: actor.id,
    entity: 'Category',
    entityId: id,
  });
  return true;
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listAgents,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
