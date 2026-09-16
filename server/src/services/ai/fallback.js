'use strict';

/**
 * Deterministic, rule-based analyser used when Gemini is not configured,
 * unreachable, or returns output that fails validation.
 *
 * It is intentionally simple and explainable: keyword scoring over the ticket
 * text. It never throws, so the application keeps working without AI.
 */

const PRIORITY_RULES = [
  { priority: 'URGENT', keywords: ['urgent', 'immediately', 'asap', 'money deducted', 'fraud', 'unauthorized', 'data loss', 'outage', 'cannot access', 'security'] },
  { priority: 'HIGH', keywords: ['payment failed', 'refund', 'charged', 'not working', 'broken', 'error', 'failed', 'blocked', 'crash', 'deadline'] },
  { priority: 'LOW', keywords: ['question', 'how do i', 'suggestion', 'feature request', 'feedback', 'wondering', 'documentation'] },
];

const CATEGORY_RULES = [
  { category: 'Billing & Payments', keywords: ['payment', 'refund', 'invoice', 'charged', 'billing', 'card', 'transaction', 'upi', 'deducted', 'subscription'] },
  { category: 'Orders & Delivery', keywords: ['order', 'delivery', 'shipment', 'tracking', 'courier', 'dispatch', 'package', 'return'] },
  { category: 'Account & Access', keywords: ['login', 'password', 'account', 'otp', 'sign in', 'locked', 'verification', '2fa'] },
  { category: 'Technical Issue', keywords: ['bug', 'crash', 'error', 'not loading', 'broken', 'slow', 'timeout', 'exception', '500'] },
  { category: 'Product Support', keywords: ['how to', 'feature', 'setup', 'configure', 'install', 'guide'] },
];

const NEGATIVE_WORDS = ['angry', 'terrible', 'worst', 'unacceptable', 'frustrated', 'disappointed', 'ridiculous', 'useless', 'scam', 'never again', 'complaint'];
const STRONG_NEGATIVE = ['unacceptable', 'ridiculous', 'worst', 'scam', 'furious', 'outrageous', 'third time', 'again and again'];
const POSITIVE_WORDS = ['thanks', 'thank you', 'great', 'appreciate', 'resolved', 'happy', 'excellent', 'helpful'];

const countMatches = (text, keywords) => keywords.filter((k) => text.includes(k)).length;

const firstSentences = (text, count = 2) => {
  const parts = String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  return parts.slice(0, count).join(' ').trim();
};

const detectMissingInformation = (text) => {
  const missing = [];
  if (!/\b(order|ticket|invoice|transaction|reference)\s*(id|no\.?|number|#)?\s*[:#]?\s*[a-z0-9-]{4,}/i.test(text)) {
    missing.push('Order / transaction reference number');
  }
  if (!/\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|yesterday|today|last week|on \w+day|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i.test(text)) {
    missing.push('Date and time the issue occurred');
  }
  if (!/\b(screenshot|attached|attachment|image|photo|receipt)\b/i.test(text)) {
    missing.push('Screenshot or receipt showing the problem');
  }
  if (!/\b(chrome|firefox|safari|edge|android|ios|windows|mac|app version|browser|device)\b/i.test(text)) {
    missing.push('Device, browser or app version used');
  }
  return missing.slice(0, 4);
};

const RESPONSE_TEMPLATES = {
  'Billing & Payments':
    'Thank you for reaching out, and I am sorry for the trouble with your payment. I have escalated this to our billing team to trace the transaction. If the amount was debited but the order was not confirmed, it is normally auto-reversed by your bank within 5-7 business days. To speed this up, could you share the transaction reference and the date of the payment? I will keep you updated on this ticket.',
  'Orders & Delivery':
    'Thanks for contacting us about your order. I am checking the current status with our logistics partner now. Could you confirm your order number and the delivery address on file so I can pull up the exact shipment? I will update this ticket as soon as I have tracking details.',
  'Account & Access':
    'Thank you for getting in touch. I understand you are unable to access your account, which is frustrating. For security we cannot reset credentials without verification, so could you confirm the email address registered on the account and whether you received any verification code? I will then guide you through the recovery steps.',
  'Technical Issue':
    'Thank you for the detailed report. I am sorry you ran into this error. To reproduce it on our side, could you tell me which device and browser or app version you are using, and roughly when the issue started? A screenshot of the error message would also help our engineering team investigate faster.',
  'Product Support':
    'Thanks for your question. I would be happy to help you get this set up. Could you let me know which part of the process you are currently stuck on, and what you have already tried? I will then send across step-by-step instructions tailored to your setup.',
  General:
    'Thank you for contacting CloudDesk support. I have received your request and I am looking into it now. Could you share any additional detail or screenshots that might help us understand the issue better? I will update this ticket with my findings shortly.',
};

const ACTION_BY_PRIORITY = {
  URGENT: 'Escalate to a senior agent immediately and acknowledge the customer within 15 minutes.',
  HIGH: 'Assign to an available agent and respond within 2 hours.',
  MEDIUM: 'Queue for the standard support rotation and respond within one business day.',
  LOW: 'Handle in the normal backlog; a knowledge-base article may resolve this.',
};

/**
 * @param {{title?:string, description?:string, category?:string, priority?:string, conversation?:Array}} ticket
 * @returns {object} an object matching the analysis contract
 */
const analyzeWithRules = (ticket = {}) => {
  const conversationText = Array.isArray(ticket.conversation)
    ? ticket.conversation.map((m) => m.body || '').join(' ')
    : '';
  const raw = `${ticket.title || ''} ${ticket.description || ''} ${conversationText}`;
  const text = raw.toLowerCase();

  // Category
  let category = ticket.category || 'General';
  let bestScore = 0;
  for (const rule of CATEGORY_RULES) {
    const score = countMatches(text, rule.keywords);
    if (score > bestScore) {
      bestScore = score;
      category = rule.category;
    }
  }
  if (bestScore === 0 && !ticket.category) category = 'General';

  // Priority
  let priority = 'MEDIUM';
  for (const rule of PRIORITY_RULES) {
    if (countMatches(text, rule.keywords) > 0) {
      priority = rule.priority;
      break;
    }
  }

  // Sentiment
  const negative = countMatches(text, NEGATIVE_WORDS);
  const strong = countMatches(text, STRONG_NEGATIVE);
  const positive = countMatches(text, POSITIVE_WORDS);
  let sentiment = 'NEUTRAL';
  if (strong >= 1 || negative >= 3) sentiment = 'FRUSTRATED';
  else if (negative > positive) sentiment = 'NEGATIVE';
  else if (positive > negative) sentiment = 'POSITIVE';

  const snippet = firstSentences(ticket.description || ticket.title || 'No description provided.');
  const summary =
    `Customer reported: ${snippet}`.slice(0, 900) +
    ` Classified as ${category} with ${priority.toLowerCase()} priority based on keyword analysis.`;

  return {
    summary,
    category,
    priority,
    sentiment,
    missingInformation: detectMissingInformation(raw),
    suggestedResponse: RESPONSE_TEMPLATES[category] || RESPONSE_TEMPLATES.General,
    recommendedAction: ACTION_BY_PRIORITY[priority],
  };
};

module.exports = { analyzeWithRules };
