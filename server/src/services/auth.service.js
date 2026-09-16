'use strict';

const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');
const { publicUser } = require('../utils/sanitize');
const audit = require('./audit.service');

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
};

const register = async ({ email, password, name }, meta = {}) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const hashed = await bcrypt.hash(password, env.bcryptSaltRounds);

  // Public self-registration always creates a CUSTOMER.
  // Agent and admin accounts are created by an admin via /api/admin/users.
  const user = await prisma.user.create({
    data: { email: normalizedEmail, password: hashed, name: name.trim(), role: 'CUSTOMER' },
    select: USER_SELECT,
  });

  await audit.record({
    action: 'USER_REGISTERED',
    actorId: user.id,
    entity: 'User',
    entityId: user.id,
    ip: meta.ip,
  });

  return { user, token: signToken({ sub: user.id, role: user.role }) };
};

const login = async ({ email, password }, meta = {}) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Same generic message for unknown email and wrong password (no user enumeration).
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  await audit.record({
    action: 'USER_LOGIN',
    actorId: user.id,
    entity: 'User',
    entityId: user.id,
    ip: meta.ip,
  });

  return { user: publicUser(user), token: signToken({ sub: user.id, role: user.role }) };
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const updateProfile = async (userId, data) => {
  const updates = {};
  if (data.name) updates.name = data.name.trim();
  if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl || null;

  if (data.newPassword) {
    const current = await prisma.user.findUnique({ where: { id: userId } });
    if (!current) throw ApiError.notFound('User not found');
    const matches = await bcrypt.compare(data.currentPassword || '', current.password);
    if (!matches) throw ApiError.badRequest('Current password is incorrect');
    updates.password = await bcrypt.hash(data.newPassword, env.bcryptSaltRounds);
  }

  const user = await prisma.user.update({ where: { id: userId }, data: updates, select: USER_SELECT });

  await audit.record({ action: 'USER_UPDATED', actorId: userId, entity: 'User', entityId: userId });
  return user;
};

module.exports = { register, login, getProfile, updateProfile, USER_SELECT };
