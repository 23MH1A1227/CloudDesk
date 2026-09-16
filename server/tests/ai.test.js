'use strict';

const { analyzeWithRules } = require('../src/services/ai/fallback');
const { analysisSchema } = require('../src/services/ai/analysis.schema');
const { analyzeTicket } = require('../src/services/ai/gemini.service');
const { extractJson, coerce } = require('../src/services/ai/gemini.service');

describe('rule-based fallback analyzer', () => {
  const paymentTicket = {
    title: 'Payment deducted but order failed',
    description:
      'The money was deducted from my card but the order shows Payment Failed. This is unacceptable, it is the third time.',
  };

  it('produces output matching the analysis contract', () => {
    const result = analysisSchema.parse(analyzeWithRules(paymentTicket));

    expect(result.category).toBe('Billing & Payments');
    expect(['HIGH', 'URGENT']).toContain(result.priority);
    expect(result.sentiment).toBe('FRUSTRATED');
    expect(Array.isArray(result.missingInformation)).toBe(true);
    expect(result.suggestedResponse.length).toBeGreaterThan(20);
  });

  it('never throws on empty input', () => {
    expect(() => analysisSchema.parse(analyzeWithRules({}))).not.toThrow();
    expect(() => analysisSchema.parse(analyzeWithRules())).not.toThrow();
  });

  it('detects a positive sentiment', () => {
    const result = analyzeWithRules({
      title: 'Thank you',
      description: 'Thanks, the issue is resolved and I am happy with the help. Excellent service.',
    });
    expect(result.sentiment).toBe('POSITIVE');
  });
});

describe('model output handling', () => {
  it('extracts JSON wrapped in code fences', () => {
    const parsed = extractJson('```json\n{"summary":"hi"}\n```');
    expect(parsed.summary).toBe('hi');
  });

  it('extracts JSON surrounded by prose', () => {
    const parsed = extractJson('Here you go: {"summary":"hi"} hope that helps');
    expect(parsed.summary).toBe('hi');
  });

  it('coerces sloppy enum casing and string arrays', () => {
    const out = coerce({ priority: ' high ', sentiment: 'negative', missingInformation: 'a, b' });
    expect(out.priority).toBe('HIGH');
    expect(out.sentiment).toBe('NEGATIVE');
    expect(out.missingInformation).toEqual(['a', 'b']);
  });

  it('rejects invalid enum values at the schema boundary', () => {
    expect(() =>
      analysisSchema.parse({
        summary: 's',
        category: 'c',
        priority: 'CATASTROPHIC',
        sentiment: 'NEUTRAL',
        missingInformation: [],
        suggestedResponse: 'r',
        recommendedAction: 'a',
      })
    ).toThrow();
  });
});

describe('analyzeTicket without an API key', () => {
  it('resolves with a usable fallback analysis instead of throwing', async () => {
    const result = await analyzeTicket({ title: 'Refund not received', description: 'I was charged twice for my order.' });

    expect(result.source).toBe('FALLBACK');
    expect(result.available).toBe(false);
    expect(result.error).toMatch(/not configured/i);
    expect(() => analysisSchema.parse(result.analysis)).not.toThrow();
  });
});
