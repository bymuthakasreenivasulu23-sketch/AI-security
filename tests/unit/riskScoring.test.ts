import { describe, it, expect } from 'vitest';
import { calculateDeterministicRiskScore } from '../../server/src/utils/riskScoring.js';
import { Finding } from '@trustlens/shared';

describe('Deterministic Risk Scoring Engine', () => {
  it('should return score 0 and low risk for empty findings', () => {
    const result = calculateDeterministicRiskScore([]);
    expect(result.score).toBe(0);
    expect(result.level).toBe('low');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('should calculate higher risk score for high and critical findings', () => {
    const findings: Finding[] = [
      {
        category: 'hidden_fees',
        title: 'Hidden service fee',
        severity: 'critical',
        confidence: 0.95,
        evidence: '$15 service fee added at checkout',
        explanation: 'Concealed fee added late',
        potentialImpact: 'Overpaying for product',
        recommendation: 'Check final total',
        sourceElement: '.fee',
      },
      {
        category: 'fake_countdown',
        title: 'Expiring timer',
        severity: 'high',
        confidence: 0.9,
        evidence: 'Expires in 00:30',
        explanation: 'Artificial timer creates rush',
        potentialImpact: 'Hasty purchase',
        recommendation: 'Do not rush',
        sourceElement: '.timer',
      },
    ];

    const result = calculateDeterministicRiskScore(findings);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(['high', 'critical']).toContain(result.level);
    expect(result.severityWeights.critical).toBe(1);
    expect(result.severityWeights.high).toBe(1);
  });

  it('should produce identical score deterministically for the same inputs', () => {
    const findings: Finding[] = [
      {
        category: 'confirmshaming',
        title: 'Manipulative opt-out',
        severity: 'medium',
        confidence: 0.85,
        evidence: 'No, I prefer paying full price',
        explanation: 'Emotional shaming',
        potentialImpact: 'Opting into unwanted subscription',
        recommendation: 'Ignore shaming',
        sourceElement: 'button',
      },
    ];

    const res1 = calculateDeterministicRiskScore(findings);
    const res2 = calculateDeterministicRiskScore(findings);
    expect(res1.score).toBe(res2.score);
    expect(res1.level).toBe(res2.level);
  });
});
