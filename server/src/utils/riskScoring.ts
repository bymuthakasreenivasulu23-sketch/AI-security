import {
  Finding,
  RiskLevel,
  RiskScoreBreakdown,
  SeverityLevel,
} from '@trustlens/shared';

// Base severity points
const SEVERITY_BASE_POINTS: Record<SeverityLevel, number> = {
  critical: 35,
  high: 22,
  medium: 12,
  low: 5,
};

// High-manipulation categories that add an intensity multiplier
const HIGH_MANIPULATION_CATEGORIES = new Set([
  'fake_countdown',
  'fake_urgency',
  'fake_scarcity',
  'confirmshaming',
  'hidden_fees',
  'drip_pricing',
  'subscription_traps',
  'roach_motel',
  'forced_consent',
]);

const PRIVACY_RISK_CATEGORIES = new Set([
  'third_party_tracking',
  'privacy_invasive_defaults',
  'excessive_data_collection',
  'preselected_consent',
  'bundled_consent',
  'unclear_data_sharing',
  'unclear_data_retention',
  'prechecked_marketing',
]);

export function calculateDeterministicRiskScore(findings: Finding[]): RiskScoreBreakdown {
  if (!findings || findings.length === 0) {
    return {
      score: 0,
      level: 'low',
      severityWeights: { critical: 0, high: 0, medium: 0, low: 0 },
      confidenceMultiplier: 1,
      manipulationIntensity: 0,
      privacyImpactFactor: 0,
      reasons: ['No deceptive design patterns or privacy traps were identified on this page.'],
    };
  }

  let totalWeightedPoints = 0;
  const severityCount: Record<SeverityLevel, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  let manipulationCategoryCount = 0;
  let privacyCategoryCount = 0;
  let cumulativeConfidence = 0;
  const reasons: string[] = [];

  for (const finding of findings) {
    const severity: SeverityLevel =
      finding.severity && ['critical', 'high', 'medium', 'low'].includes(finding.severity)
        ? (finding.severity as SeverityLevel)
        : 'low';
    const basePoints = SEVERITY_BASE_POINTS[severity] || 5;
    const confidence = Math.max(0.1, Math.min(1.0, finding.confidence || 0.7));

    severityCount[severity] = severityCount[severity] + 1;
    cumulativeConfidence += confidence;

    // Weight points by confidence
    const findingPoints = basePoints * confidence;
    totalWeightedPoints += findingPoints;

    if (HIGH_MANIPULATION_CATEGORIES.has(finding.category)) {
      manipulationCategoryCount++;
    }
    if (PRIVACY_RISK_CATEGORIES.has(finding.category)) {
      privacyCategoryCount++;
    }
  }

  const avgConfidence = cumulativeConfidence / findings.length;

  // Manipulation intensity bonus (0 to 15 points)
  const manipulationIntensity = Math.min(15, manipulationCategoryCount * 4);

  // Privacy impact bonus (0 to 15 points)
  const privacyImpactFactor = Math.min(15, privacyCategoryCount * 3.5);

  // Diminishing returns scaling for multiple issues
  // Prevents simple linear explosion while accurately penalizing multiple severe violations
  let rawScore = totalWeightedPoints + manipulationIntensity + privacyImpactFactor;

  // Dampen if many low severity items
  if (severityCount.critical === 0 && severityCount.high === 0 && rawScore > 45) {
    rawScore = 45 + (rawScore - 45) * 0.4;
  }

  // Ensure critical finding guarantees at least HIGH (>=60)
  if (severityCount.critical > 0 && rawScore < 65) {
    rawScore = 65 + severityCount.critical * 5;
  }

  // Bound score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Determine standard risk level
  let level: RiskLevel = 'low';
  if (finalScore >= 80) {
    level = 'critical';
  } else if (finalScore >= 60) {
    level = 'high';
  } else if (finalScore >= 40) {
    level = 'moderate';
  } else if (finalScore >= 20) {
    level = 'mild';
  } else {
    level = 'low';
  }

  // Build human-readable explanations
  if (severityCount.critical > 0) {
    reasons.push(
      `Detected ${severityCount.critical} critical severity issue(s) indicating active deception or entrapment.`
    );
  }
  if (severityCount.high > 0) {
    reasons.push(`Detected ${severityCount.high} high-severity manipulative design pattern(s).`);
  }
  if (manipulationCategoryCount > 0) {
    reasons.push(
      `Found ${manipulationCategoryCount} pattern(s) specifically designed to pressure decisions (e.g. timers, scarcity, confirmshaming).`
    );
  }
  if (privacyCategoryCount > 0) {
    reasons.push(
      `Found ${privacyCategoryCount} privacy trap indicator(s) affecting consent or tracking defaults.`
    );
  }

  return {
    score: finalScore,
    level,
    severityWeights: severityCount,
    confidenceMultiplier: Math.round(avgConfidence * 100) / 100,
    manipulationIntensity,
    privacyImpactFactor,
    reasons,
  };
}
