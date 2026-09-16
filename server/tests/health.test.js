'use strict';

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

afterAll(async () => {
  await prisma.$disconnect().catch(() => {});
});

describe('GET /health', () => {
  it('returns 200 with service metadata', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('clouddesk-api');
    expect(res.body.dependencies).toHaveProperty('database');
    expect(res.body.dependencies).toHaveProperty('storage');
  });
});

describe('unknown routes', () => {
  it('returns a 404 envelope', async () => {
    const res = await request(app).get('/api/this-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});

describe('GET /api', () => {
  it('reports AI and storage configuration', async () => {
    const res = await request(app).get('/api');

    expect(res.status).toBe(200);
    expect(res.body.ai.provider).toBe('google-gemini');
    // No GEMINI_API_KEY in the test env, so AI must report itself unconfigured.
    expect(res.body.ai.configured).toBe(false);
    expect(res.body.storage.driver).toBe('local');
  });
});
