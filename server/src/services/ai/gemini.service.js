'use strict';

const env = require('../../config/env');
const logger = require('../../config/logger');
const { analysisSchema } = require('./analysis.schema');
const { analyzeWithRules } = require('./fallback');
const { PRIORITIES, SENTIMENTS } = require('../../config/constants');

let clientPromise = null;

/** Lazily loads the SDK so the app starts fine when the package/key is absent. */
const getModel = async () => {
  if (!env.aiEnabled) return null;
  if (!clientPromise) {
    clientPromise = (async () => {
      // eslint-disable-next-line global-require
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(env.gemini.apiKey);
      return genAI.getGenerativeModel({
        model: env.gemini.model,
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      });
    })().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
};

const SYSTEM_PROMPT = `You are CloudDesk's support triage assistant.
You analyse a customer support ticket and return ONLY a JSON object. No markdown, no code fences, no commentary.

Return exactly this shape:
{
  "summary": "2-4 sentence factual summary of the customer's problem",
  "category": "one short category label",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "FRUSTRATED",
  "missingInformation": ["specific detail the agent still needs", "..."],
  "suggestedResponse": "a polite, ready-to-send reply from a support agent to the customer",
  "recommendedAction": "one sentence telling the agent what to do next internally"
}

Rules:
- Never invent facts, order numbers, refund amounts or policies.
- If the customer says money was deducted but the order failed, treat it as at least HIGH priority.
- missingInformation must be an array (use [] if nothing is missing).
- suggestedResponse must be addressed to the customer and must not promise anything you cannot verify.
- Output valid JSON only.`;

const buildUserPrompt = (ticket) => {
  const history = Array.isArray(ticket.conversation) && ticket.conversation.length
    ? ticket.conversation
        .slice(-12)
        .map((m) => `[${m.role || 'USER'}] ${String(m.body || '').slice(0, 1000)}`)
        .join('\n')
    : '(no replies yet)';

  return `TICKET TITLE: ${ticket.title || '(none)'}
CURRENT CATEGORY: ${ticket.category || '(unclassified)'}
CURRENT PRIORITY: ${ticket.priority || '(unset)'}

DESCRIPTION:
${String(ticket.description || '(none)').slice(0, 6000)}

CONVERSATION HISTORY:
${history}`;
};

/** Pulls a JSON object out of a model response that may be wrapped in prose or fences. */
const extractJson = (text) => {
  const cleaned = String(text || '')
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Model response did not contain parsable JSON');
  }
};

/** Nudges near-miss model output into the enum values before strict validation. */
const coerce = (raw) => {
  const obj = { ...(raw || {}) };
  if (typeof obj.priority === 'string') {
    const p = obj.priority.toUpperCase().trim();
    obj.priority = PRIORITIES.includes(p) ? p : 'MEDIUM';
  }
  if (typeof obj.sentiment === 'string') {
    const s = obj.sentiment.toUpperCase().trim();
    obj.sentiment = SENTIMENTS.includes(s) ? s : 'NEUTRAL';
  }
  if (typeof obj.missingInformation === 'string') {
    obj.missingInformation = obj.missingInformation.split(/\n|;|,/).map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(obj.missingInformation)) obj.missingInformation = [];
  return obj;
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Gemini timed out after ${ms}ms`)), ms)),
  ]);

/**
 * Analyses a ticket. Always resolves - never throws - so callers cannot crash.
 *
 * @returns {Promise<{analysis:object, source:'GEMINI'|'FALLBACK', model:string|null, available:boolean, error:string|null}>}
 */
const analyzeTicket = async (ticket) => {
  const fallbackResult = (error, available) => ({
    analysis: analysisSchema.parse(analyzeWithRules(ticket)),
    source: 'FALLBACK',
    model: null,
    available,
    error,
  });

  if (!env.aiEnabled) {
    return fallbackResult('GEMINI_API_KEY is not configured; using rule-based analysis.', false);
  }

  try {
    const model = await getModel();
    const result = await withTimeout(
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${buildUserPrompt(ticket)}` }] }],
      }),
      env.gemini.timeoutMs
    );

    const text = result?.response?.text?.();
    const parsed = analysisSchema.parse(coerce(extractJson(text)));

    return { analysis: parsed, source: 'GEMINI', model: env.gemini.model, available: true, error: null };
  } catch (err) {
    logger.warn({ err: err.message }, 'Gemini analysis failed - falling back to rule-based analyzer');
    return fallbackResult(`Gemini unavailable: ${err.message}`, false);
  }
};

const getAiStatus = () => ({
  configured: env.aiEnabled,
  model: env.aiEnabled ? env.gemini.model : null,
  provider: 'google-gemini',
});

module.exports = { analyzeTicket, getAiStatus, extractJson, coerce };
