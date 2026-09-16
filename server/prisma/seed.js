'use strict';

/**
 * CloudDesk development seed.
 *
 * ⚠️  DEVELOPMENT CREDENTIALS ONLY.
 * These accounts exist so you can explore the app locally. Never run this
 * script against a production database, and never reuse these passwords.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

const DEV_USERS = [
  { email: 'customer@clouddesk.dev', name: 'Aarav Sharma', role: 'CUSTOMER', password: 'Customer@123' },
  { email: 'customer2@clouddesk.dev', name: 'Meera Nair', role: 'CUSTOMER', password: 'Customer@123' },
  { email: 'agent@clouddesk.dev', name: 'Rohan Verma', role: 'SUPPORT_AGENT', password: 'Agent@123' },
  { email: 'admin@clouddesk.dev', name: 'Priya Iyer', role: 'ADMIN', password: 'Admin@123' },
];

const CATEGORIES = [
  { name: 'Billing & Payments', description: 'Refunds, failed payments, invoices', color: '#f43f5e' },
  { name: 'Orders & Delivery', description: 'Order status, shipping and returns', color: '#f59e0b' },
  { name: 'Account & Access', description: 'Login, password and verification issues', color: '#6366f1' },
  { name: 'Technical Issue', description: 'Bugs, errors and performance problems', color: '#0ea5e9' },
  { name: 'Product Support', description: 'How-to questions and setup help', color: '#10b981' },
];

const slugify = (v) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Seeding CloudDesk development data...');

  // ---- users
  const users = {};
  for (const u of DEV_USERS) {
    const password = await bcrypt.hash(u.password, SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password, isActive: true },
      create: { email: u.email, name: u.name, role: u.role, password },
    });
    users[u.email] = user;
  }
  console.log(`   ✓ ${DEV_USERS.length} users`);

  // ---- categories
  const categories = {};
  for (const c of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: { description: c.description, color: c.color },
      create: { name: c.name, slug: slugify(c.name), description: c.description, color: c.color },
    });
    categories[c.name] = category;
  }
  console.log(`   ✓ ${CATEGORIES.length} categories`);

  const customer = users['customer@clouddesk.dev'];
  const customer2 = users['customer2@clouddesk.dev'];
  const agent = users['agent@clouddesk.dev'];

  // ---- tickets (idempotent: skip if the reference already exists)
  const TICKETS = [
    {
      reference: 'CD-SEED01',
      title: 'Payment deducted but order shows Payment Failed',
      description:
        'I ordered a laptop yesterday for Rs. 62,999. The amount was deducted from my account immediately and I received the bank SMS, but the order page still shows "Payment Failed" and the order is not in my orders list. I have attached the bank statement screenshot. This is urgent because the offer price ends today and I need either the order confirmed or a refund.',
      status: 'OPEN',
      priority: 'URGENT',
      category: 'Billing & Payments',
      customer,
      assignee: null,
      createdAt: daysAgo(1),
      messages: [],
    },
    {
      reference: 'CD-SEED02',
      title: 'Cannot log in - OTP never arrives',
      description:
        'For the last three days I have been unable to log into my account. Every time I request the OTP it says "code sent" but nothing arrives on my registered mobile number or email. I have checked my spam folder. I am using Chrome on Windows 11.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'Account & Access',
      customer: customer2,
      assignee: agent,
      createdAt: daysAgo(4),
      firstResponseAt: daysAgo(4 - 0.1),
      messages: [
        { author: agent, body: 'Thanks for reaching out. I can see delivery failures on your registered number. Could you confirm the last four digits of the mobile number on the account so I can re-verify it?' },
        { author: customer2, body: 'Sure, it ends with 4417. I have not changed the number in over a year.' },
      ],
    },
    {
      reference: 'CD-SEED03',
      title: 'Order delivered to the wrong address',
      description:
        'My order CD-99120 was marked delivered on the tracking page, but I never received it. The courier photo shows a building that is not mine. I would like a replacement or a full refund.',
      status: 'PENDING',
      priority: 'HIGH',
      category: 'Orders & Delivery',
      customer,
      assignee: agent,
      createdAt: daysAgo(6),
      firstResponseAt: daysAgo(5.8),
      messages: [
        { author: agent, body: 'I am very sorry about this. I have raised a delivery investigation with the courier partner. They usually respond within 48 hours and I will update you as soon as I hear back.' },
      ],
    },
    {
      reference: 'CD-SEED04',
      title: 'Dashboard charts fail to load on Safari',
      description:
        'When I open the analytics dashboard in Safari 17 on macOS, the charts area stays blank and the console shows a 500 error from /api/tickets/stats. It works correctly in Chrome.',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      category: 'Technical Issue',
      customer: customer2,
      assignee: agent,
      createdAt: daysAgo(11),
      firstResponseAt: daysAgo(10.7),
      resolvedAt: daysAgo(9),
      satisfaction: 5,
      messages: [
        { author: agent, body: 'Thanks for the detailed report - that was a date parsing bug specific to Safari. We shipped a fix this morning. Could you hard-refresh and confirm?' },
        { author: customer2, body: 'Confirmed, the charts load fine now. Thanks for the quick turnaround!' },
      ],
    },
    {
      reference: 'CD-SEED05',
      title: 'How do I export my ticket history?',
      description:
        'I would like to download all my past support tickets as a CSV file for my records. Is there an export option somewhere in the profile section, or do I need to request it from support?',
      status: 'CLOSED',
      priority: 'LOW',
      category: 'Product Support',
      customer,
      assignee: agent,
      createdAt: daysAgo(15),
      firstResponseAt: daysAgo(14.9),
      resolvedAt: daysAgo(14),
      closedAt: daysAgo(13),
      satisfaction: 4,
      messages: [
        { author: agent, body: 'Great question. Ticket export lives under Profile → Data, and the CSV is emailed to your registered address within a few minutes. Let me know if it does not arrive.' },
      ],
    },
  ];

  let created = 0;
  for (const t of TICKETS) {
    const existing = await prisma.ticket.findUnique({ where: { reference: t.reference } });
    if (existing) continue;

    const ticket = await prisma.ticket.create({
      data: {
        reference: t.reference,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        customerId: t.customer.id,
        assigneeId: t.assignee ? t.assignee.id : null,
        categoryId: categories[t.category].id,
        createdAt: t.createdAt,
        firstResponseAt: t.firstResponseAt || null,
        resolvedAt: t.resolvedAt || null,
        closedAt: t.closedAt || null,
        satisfaction: t.satisfaction || null,
      },
    });

    for (const [i, m] of t.messages.entries()) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: m.author.id,
          body: m.body,
          createdAt: new Date(t.createdAt.getTime() + (i + 1) * 3600 * 1000),
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: t.customer.id,
        type: 'TICKET_CREATED',
        title: `Ticket ${ticket.reference} created`,
        body: ticket.title,
        link: `/tickets/${ticket.id}`,
        isRead: t.status === 'CLOSED',
        createdAt: t.createdAt,
      },
    });

    created += 1;
  }
  console.log(`   ✓ ${created} tickets (${TICKETS.length - created} already present)`);

  await prisma.auditLog.create({
    data: {
      action: 'USER_CREATED',
      actorId: users['admin@clouddesk.dev'].id,
      entity: 'Seed',
      metadata: { note: 'Development seed executed' },
    },
  });

  console.log('\n✅ Seed complete. DEVELOPMENT login credentials:\n');
  for (const u of DEV_USERS) {
    console.log(`   ${u.role.padEnd(14)} ${u.email.padEnd(28)} ${u.password}`);
  }
  console.log('\n   ⚠️  Development only — change these before deploying anywhere.\n');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
