'use strict';

const { app, prisma, request, unique, databaseAvailable, cleanupUsers } = require('./helpers');

let dbUp = false;
const createdUserIds = [];

beforeAll(async () => {
  dbUp = await databaseAvailable();
  if (!dbUp) {
    console.warn('\n⚠️  Skipping auth DB tests: no database reachable at DATABASE_URL.\n');
  }
});

afterAll(async () => {
  if (dbUp) await cleanupUsers(createdUserIds);
  await prisma.$disconnect().catch(() => {});
});

const maybe = () => (dbUp ? it : it.skip);

describe('POST /api/auth/register', () => {
  maybe()('creates a CUSTOMER and returns a token', async () => {
    const email = `${unique('reg')}@clouddesk.test`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New Person', email, password: 'StrongPass123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.role).toBe('CUSTOMER');
    expect(res.body.data.user).not.toHaveProperty('password');

    createdUserIds.push(res.body.data.user.id);
  });

  maybe()('rejects a duplicate email with 409', async () => {
    const email = `${unique('dup')}@clouddesk.test`;
    const first = await request(app)
      .post('/api/auth/register')
      .send({ name: 'First', email, password: 'StrongPass123' });
    createdUserIds.push(first.body.data.user.id);

    const second = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Second', email, password: 'StrongPass123' });

    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
  });

  it('rejects an invalid email with 400 and field details', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bad Email', email: 'not-an-email', password: 'StrongPass123' });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'email')).toBe(true);
  });

  it('rejects a weak password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Weak', email: `${unique('weak')}@clouddesk.test`, password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'password')).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  maybe()('signs in with correct credentials', async () => {
    const email = `${unique('login')}@clouddesk.test`;
    const password = 'StrongPass123';
    const reg = await request(app).post('/api/auth/register').send({ name: 'Login User', email, password });
    createdUserIds.push(reg.body.data.user.id);

    const res = await request(app).post('/api/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(email);
  });

  maybe()('rejects a wrong password with 401', async () => {
    const email = `${unique('badpw')}@clouddesk.test`;
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bad PW', email, password: 'StrongPass123' });
    createdUserIds.push(reg.body.data.user.id);

    const res = await request(app).post('/api/auth/login').send({ email, password: 'WrongPass123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  maybe()('does not leak whether an email exists', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: `${unique('ghost')}@clouddesk.test`, password: 'StrongPass123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });

  maybe()('returns the current user for a valid token', async () => {
    const email = `${unique('me')}@clouddesk.test`;
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Me User', email, password: 'StrongPass123' });
    createdUserIds.push(reg.body.data.user.id);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.data.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user).not.toHaveProperty('password');
  });
});
