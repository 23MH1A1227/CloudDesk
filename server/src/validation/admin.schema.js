'use strict';

const { z } = require('zod');

const roles = ['CUSTOMER', 'SUPPORT_AGENT', 'ADMIN'];

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128).regex(/[a-zA-Z]/).regex(/[0-9]/),
  role: z.enum(roles),
});

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    role: z.enum(roles).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).max(128).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  role: z.enum(roles).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().trim().max(120).optional(),
});

const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #6366f1').optional(),
});

const updateCategorySchema = categorySchema.partial().extend({ isActive: z.boolean().optional() });

const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  action: z.string().trim().max(60).optional(),
  actorId: z.string().uuid().optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
  categorySchema,
  updateCategorySchema,
  auditQuerySchema,
};
