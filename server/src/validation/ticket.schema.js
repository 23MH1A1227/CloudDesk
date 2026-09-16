'use strict';

const { z } = require('zod');
const { TICKET_STATUSES, PRIORITIES } = require('../config/constants');

const idParam = z.object({ id: z.string().uuid('Invalid identifier') });

const createTicketSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().trim().min(15, 'Please describe the issue in at least 15 characters').max(8000),
  priority: z.enum(PRIORITIES).optional(),
  categoryId: z.string().uuid().optional().nullable().or(z.literal('')),
});

const updateTicketSchema = z
  .object({
    title: z.string().trim().min(5).max(150).optional(),
    status: z.enum(TICKET_STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    categoryId: z.string().uuid().nullable().optional().or(z.literal('')),
    assigneeId: z.string().uuid().nullable().optional().or(z.literal('')),
    satisfaction: z.number().int().min(1).max(5).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

const listTicketsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  categoryId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  scope: z.enum(['all', 'mine', 'unassigned']).optional(),
  search: z.string().trim().max(120).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const messageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(8000),
  isInternal: z.boolean().optional(),
});

module.exports = { idParam, createTicketSchema, updateTicketSchema, listTicketsSchema, messageSchema };
