'use strict';

const { z } = require('zod');
const { PRIORITIES, SENTIMENTS } = require('../../config/constants');

/**
 * The contract every analysis must satisfy before it is persisted or returned.
 * Model output is untrusted input: it is coerced and clamped here.
 */
const analysisSchema = z.object({
  summary: z.string().trim().min(1).max(1200),
  category: z.string().trim().min(1).max(80),
  priority: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toUpperCase() : v),
    z.enum(PRIORITIES)
  ),
  sentiment: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toUpperCase() : v),
    z.enum(SENTIMENTS)
  ),
  missingInformation: z
    .array(z.string().trim().min(1).max(200))
    .max(8)
    .default([]),
  suggestedResponse: z.string().trim().min(1).max(3000),
  recommendedAction: z.string().trim().min(1).max(400),
});

module.exports = { analysisSchema };
