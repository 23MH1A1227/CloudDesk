'use strict';

const { z } = require('zod');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-zA-Z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Enter a valid email address').max(160),
  password,
});

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    avatarUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
    currentPassword: z.string().optional(),
    newPassword: password.optional(),
  })
  .refine((d) => !d.newPassword || Boolean(d.currentPassword), {
    message: 'Current password is required to set a new password',
    path: ['currentPassword'],
  });

module.exports = { registerSchema, loginSchema, updateProfileSchema };
