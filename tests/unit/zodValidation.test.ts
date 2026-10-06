import { describe, it, expect } from 'vitest';
import {
  AIAnalysisSchema,
  AnalyzeRequestSchema,
  FindingSchema,
  PageSignalsSchema,
  SettingsSchema,
} from '@trustlens/shared';

describe('Zod Validation Schemas', () => {
  it('validates a compliant Finding object', () => {
    const validFinding = {
      category: 'fake_urgency',
      title: 'Countdown timer creates pressure',
      severity: 'medium',
      confidence: 0.91,
      evidence: 'Only 02:14 left!',
      explanation: 'The page uses a countdown to encourage you to make a decision quickly.',
      potentialImpact: 'You may purchase without having enough time to compare alternatives.',
      recommendation: 'Check whether the offer still exists after the timer expires.',
      sourceElement: 'div.countdown',
    };

    const result = FindingSchema.safeParse(validFinding);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid finding with unsupported severity or confidence out of bounds', () => {
    const invalidFinding = {
      category: 'fake_urgency',
      title: 'Invalid finding',
      severity: 'extreme', // Invalid severity
      confidence: 1.5, // > 1.0
      evidence: 'evidence',
      explanation: 'explanation',
      potentialImpact: 'impact',
      recommendation: 'rec',
      sourceElement: 'el',
    };

    const result = FindingSchema.safeParse(invalidFinding);
    expect(result.success).toBe(false);
  });

  it('validates a complete AIAnalysis structure', () => {
    const validAnalysis = {
      overallRiskScore: 75,
      riskLevel: 'high',
      summary: 'High risk dark patterns detected.',
      findings: [],
    };

    const result = AIAnalysisSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
  });

  it('rejects an AIAnalysis with risk score > 100', () => {
    const invalidAnalysis = {
      overallRiskScore: 120, // out of range
      riskLevel: 'critical',
      summary: 'Bad score',
      findings: [],
    };

    const result = AIAnalysisSchema.safeParse(invalidAnalysis);
    expect(result.success).toBe(false);
  });

  it('validates compliant AnalyzeRequest', () => {
    const validReq = {
      domain: 'example.com',
      pageUrl: 'https://example.com/shop',
      pageTitle: 'Shop Example',
      pageType: 'ecommerce',
    };

    const result = AnalyzeRequestSchema.safeParse(validReq);
    expect(result.success).toBe(true);
  });

  it('validates analysisMode with AnalysisModeSchema and inside AIAnalysisSchema', () => {
    const { AnalysisModeSchema } = require('@trustlens/shared');
    expect(AnalysisModeSchema.safeParse('ai').success).toBe(true);
    expect(AnalysisModeSchema.safeParse('rule_based').success).toBe(true);
    expect(AnalysisModeSchema.safeParse('unknown').success).toBe(false);

    const validAiResult = AIAnalysisSchema.safeParse({
      overallRiskScore: 40,
      riskLevel: 'moderate',
      summary: 'Moderate findings detected.',
      findings: [],
      analysisMode: 'ai',
    });
    expect(validAiResult.success).toBe(true);
  });

  it('validates PageSignals with multi-currency pricing symbols (₹, $, €, £, ¥)', () => {
    const signals = {
      domain: 'international-shop.local',
      pageUrl: 'https://international-shop.local/cart',
      pageTitle: 'Global Cart',
      pricingSignals: [
        { type: 'price', label: 'INR Price', amount: '₹199' },
        { type: 'price', label: 'USD Price', amount: '$49.99' },
        { type: 'price', label: 'EUR Price', amount: '€39.50' },
        { type: 'price', label: 'GBP Price', amount: '£29.00' },
        { type: 'price', label: 'JPY Price', amount: '¥3,500' },
      ],
      interactiveElements: [],
      consentSignals: [],
      urgencySignals: [],
      headings: [],
      privacySnippets: [],
      isLikelySensitive: false,
    };

    const parsed = PageSignalsSchema.safeParse(signals);
    expect(parsed.success).toBe(true);
  });
});
