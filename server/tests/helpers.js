'use strict';

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

const unique = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

/** Registers a fresh CUSTOMER and returns { user, token, password }. */
const registerCustomer = async (overrides = {}) => {
  const payload = {
    name: overrides.name || 'Test Customer',
    email: overrides.email || `${unique('customer')}@clouddesk.test`,
    password: overrides.password || 'TestPass123',
  };

  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`registerCustomer failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return { ...res.body.data, password: payload.password };
};

/** Promotes an existing user to a role directly in the DB (test convenience). */
const promote = (userId, role) => prisma.user.update({ where: { id: userId }, data: { role } });

const loginAs = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res;
};

/** Removes every user created by a test run, cascading to their tickets. */
const cleanupUsers = async (ids = []) => {
  if (!ids.length) return;
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
};

const databaseAvailable = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

module.exports = { app, prisma, request, unique, registerCustomer, promote, loginAs, cleanupUsers, databaseAvailable };
