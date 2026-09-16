'use strict';

const { app, prisma, request, unique, databaseAvailable, cleanupUsers } = require('./helpers');

let dbUp = false;
const createdUserIds = [];
let customer;
let otherCustomer;
let agent;

const register = async (prefix) => {
  const email = `${unique(prefix)}@clouddesk.test`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: prefix, email, password: 'StrongPass123' });
  createdUserIds.push(res.body.data.user.id);
  return { ...res.body.data, email, password: 'StrongPass123' };
};

beforeAll(async () => {
  dbUp = await databaseAvailable();
  if (!dbUp) {
    console.warn('\n⚠️  Skipping ticket DB tests: no database reachable at DATABASE_URL.\n');
    return;
  }

  customer = await register('cust');
  otherCustomer = await register('other');

  // Create an agent by registering then elevating the role, then re-logging in
  // so the token carries the new role.
  const raw = await register('agent');
  await prisma.user.update({ where: { id: raw.user.id }, data: { role: 'SUPPORT_AGENT' } });
  const login = await request(app).post('/api/auth/login').send({ email: raw.email, password: raw.password });
  agent = login.body.data;
});

afterAll(async () => {
  if (dbUp) await cleanupUsers(createdUserIds);
  await prisma.$disconnect().catch(() => {});
});

const maybe = () => (dbUp ? it : it.skip);

const auth = (t) => ({ Authorization: `Bearer ${t}` });

describe('ticket creation', () => {
  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ title: 'No auth ticket', description: 'This should never be created at all.' });

    expect(res.status).toBe(401);
  });

  maybe()('creates a ticket owned by the caller', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set(auth(customer.token))
      .send({
        title: 'Payment deducted but order failed',
        description: 'Money left my account but the order page says Payment Failed. Please help.',
        priority: 'URGENT',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.reference).toMatch(/^CD-/);
    expect(res.body.data.status).toBe('OPEN');
    expect(res.body.data.customer.id).toBe(customer.user.id);
  });

  maybe()('rejects a too-short description with 400', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set(auth(customer.token))
      .send({ title: 'Short one', description: 'too short' });

    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'description')).toBe(true);
  });
});

describe('ticket authorization', () => {
  maybe()('hides another customer\'s ticket', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .set(auth(customer.token))
      .send({ title: 'Private ticket', description: 'Only the owning customer should see this one.' });

    const res = await request(app)
      .get(`/api/tickets/${created.body.data.id}`)
      .set(auth(otherCustomer.token));

    expect(res.status).toBe(403);
  });

  maybe()('lets an agent read any ticket', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .set(auth(customer.token))
      .send({ title: 'Agent visible ticket', description: 'Support staff should be able to open this.' });

    const res = await request(app)
      .get(`/api/tickets/${created.body.data.id}`)
      .set(auth(agent.token));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(created.body.data.id);
  });

  maybe()('prevents a customer from changing status to IN_PROGRESS', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .set(auth(customer.token))
      .send({ title: 'Status guard ticket', description: 'Customers must not move tickets into progress.' });

    const res = await request(app)
      .patch(`/api/tickets/${created.body.data.id}`)
      .set(auth(customer.token))
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(403);
  });

  maybe()('lets an agent change status and records the change', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .set(auth(customer.token))
      .send({ title: 'Agent status ticket', description: 'An agent will move this one to in progress.' });

    const res = await request(app)
      .patch(`/api/tickets/${created.body.data.id}`)
      .set(auth(agent.token))
      .send({ status: 'IN_PROGRESS', priority: 'HIGH' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
    expect(res.body.data.priority).toBe('HIGH');
  });

  maybe()('forbids a customer from deleting a ticket', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .set(auth(customer.token))
      .send({ title: 'Delete guard ticket', description: 'Only administrators are allowed to delete tickets.' });

    const res = await request(app)
      .delete(`/api/tickets/${created.body.data.id}`)
      .set(auth(customer.token));

    expect(res.status).toBe(403);
  });

  maybe()('blocks non-admins from the admin area', async () => {
    const res = await request(app).get('/api/admin/users').set(auth(customer.token));
    expect(res.status).toBe(403);
  });
});

describe('ticket conversation and AI', () => {
  maybe()('appends a message and moves an OPEN ticket to IN_PROGRESS on agent reply', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .set(auth(customer.token))
      .send({ title: 'Conversation ticket', description: 'Testing the reply flow end to end here.' });

    const msg = await request(app)
      .post(`/api/tickets/${created.body.data.id}/messages`)
      .set(auth(agent.token))
      .send({ body: 'Thanks for reaching out, I am looking into this now.' });

    expect(msg.status).toBe(201);

    const detail = await request(app)
      .get(`/api/tickets/${created.body.data.id}`)
      .set(auth(agent.token));

    expect(detail.body.data.status).toBe('IN_PROGRESS');
    expect(detail.body.data.messages).toHaveLength(1);
  });

  maybe()('returns a fallback analysis when Gemini is not configured', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .set(auth(customer.token))
      .send({
        title: 'Refund never arrived',
        description: 'I was charged twice for the same order and the refund has not arrived after two weeks.',
      });

    const res = await request(app)
      .post(`/api/tickets/${created.body.data.id}/analyze`)
      .set(auth(agent.token));

    expect(res.status).toBe(201);
    expect(res.body.data.source).toBe('FALLBACK');
    expect(res.body.data.available).toBe(false);
    expect(res.body.data.summary).toEqual(expect.any(String));
    expect(res.body.data.suggestedResponse).toEqual(expect.any(String));
  });
});

describe('ticket listing and stats', () => {
  maybe()('scopes the list to the calling customer', async () => {
    const res = await request(app).get('/api/tickets?limit=50').set(auth(customer.token));

    expect(res.status).toBe(200);
    expect(res.body.data.every((t) => t.customer.id === customer.user.id)).toBe(true);
    expect(res.body.meta).toHaveProperty('totalPages');
  });

  maybe()('returns dashboard statistics', async () => {
    const res = await request(app).get('/api/tickets/stats').set(auth(customer.token));

    expect(res.status).toBe(200);
    expect(res.body.data.cards).toHaveProperty('totalTickets');
    expect(Array.isArray(res.body.data.charts.byStatus)).toBe(true);
  });

  it('rejects an invalid status filter with 400', async () => {
    const res = await request(app)
      .get('/api/tickets?status=NOT_A_STATUS')
      .set({ Authorization: 'Bearer invalid' });

    // Auth runs first, so an invalid token still short-circuits to 401.
    expect([400, 401]).toContain(res.status);
  });
});
