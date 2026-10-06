import {
  Finding,
  PageSignals,
  AIAnalysis,
  ConsentAnalysis,
  PricingAnalysis,
  PrivacyAnalysis,
} from '@trustlens/shared';
import { calculateDeterministicRiskScore } from '../utils/riskScoring.js';

export function analyzeSignalsRuleBased(signals: PageSignals): AIAnalysis {
  const findings: Finding[] = [];

  // 1. Urgency / Countdown Signals
  for (const urg of signals.urgencySignals || []) {
    const textLower = urg.text.toLowerCase();
    if (urg.hasTimer || textLower.match(/\b(00:\d{2}|\d{1,2}:\d{2}|expires in|countdown)\b/)) {
      findings.push({
        category: 'fake_countdown',
        title: 'Countdown timer creates artificial purchase pressure',
        severity: 'medium',
        confidence: 0.88,
        evidence: urg.text || 'Countdown timer element detected',
        explanation:
          'The page uses a countdown clock to induce urgency. Unless tied to an actual expiring inventory or event, resetable timers are designed to rush user judgment.',
        potentialImpact:
          'You may make a hasty purchase decision without verifying pricing or comparing alternatives.',
        recommendation:
          'Take a moment to pause. Refresh the page or check back later to see if the offer persists.',
        sourceElement: urg.selector || 'timer-element',
      });
    }

    if (
      urg.scarcityClaim ||
      textLower.match(/\b(only \d+ left|in high demand|\d+ people are viewing|almost sold out)\b/)
    ) {
      findings.push({
        category: 'fake_scarcity',
        title: 'Scarcity claim may induce fear of missing out (FOMO)',
        severity: 'low',
        confidence: 0.82,
        evidence: urg.scarcityClaim || urg.text,
        explanation:
          'The page displays limited-quantity or high-demand notices which may be dynamically generated rather than based on real-time stock levels.',
        potentialImpact: 'Encourages impulse purchases before you have evaluated necessity.',
        recommendation: 'Evaluate your need for the item objectively rather than reacting to stock pressure.',
        sourceElement: urg.selector || 'scarcity-element',
      });
    }
  }

  // 2. Consent / Checkbox Signals
  for (const consent of signals.consentSignals || []) {
    const labelLower = consent.label.toLowerCase();
    if (
      consent.checkedByDefault &&
      (labelLower.includes('marketing') ||
        labelLower.includes('partner') ||
        labelLower.includes('advertising') ||
        labelLower.includes('newsletter') ||
        labelLower.includes('promo') ||
        labelLower.includes('tracking'))
    ) {
      findings.push({
        category: 'preselected_consent',
        title: 'Pre-selected marketing or tracking consent',
        severity: 'high',
        confidence: 0.94,
        evidence: `Pre-checked checkbox: "${consent.label}"`,
        explanation:
          'Consent checkboxes for non-essential marketing communications or third-party data sharing are enabled by default.',
        potentialImpact:
          'Your personal contact details and behavioral data may be automatically enrolled in marketing campaigns or shared with partners.',
        recommendation:
          'Uncheck pre-selected boxes that are not essential for your primary transaction or service.',
        sourceElement: consent.selector || 'input[type="checkbox"]',
      });
    }

    if (consent.isRejectHiddenOrSubtle) {
      findings.push({
        category: 'accept_reject_imbalance',
        title: 'Asymmetrical cookie consent choices (Deceptive Hierarchy)',
        severity: 'high',
        confidence: 0.89,
        evidence: 'Accept action is prominent while Reject is absent, hidden, or buried in submenus.',
        explanation:
          'The interface makes granting consent effortless with a single click while requiring multiple complex steps or obscure links to decline tracking.',
        potentialImpact:
          'Users are nudge-manipulated into accepting invasive tracking cookies due to interface friction.',
        recommendation:
          'Look for "Manage Preferences", "More Options", or "Decline" buttons before clicking the bright primary button.',
        sourceElement: consent.selector || '.cookie-banner',
      });
    }
  }

  // 3. Pricing / Fee Signals
  for (const price of signals.pricingSignals || []) {
    const labelLower = price.label.toLowerCase();
    if (
      labelLower.includes('service fee') ||
      labelLower.includes('processing fee') ||
      labelLower.includes('handling fee') ||
      labelLower.includes('convenience fee') ||
      labelLower.includes('hidden fee')
    ) {
      findings.push({
        category: 'hidden_fees',
        title: 'Additional ancillary fee added to order',
        severity: 'high',
        confidence: 0.86,
        evidence: `${price.label}: ${price.amount || 'disclosed late in checkout'}`,
        explanation:
          'An additional fee appears late in the interaction flow rather than being included in the initially advertised headline price.',
        potentialImpact:
          'The actual final payment is significantly higher than the upfront cost presented when selecting the product.',
        recommendation:
          'Compare the final total with competitors including all mandatory surcharges before finalizing payment.',
        sourceElement: price.selector || '.price-breakdown',
      });
    }

    if (
      price.isRecurring ||
      labelLower.includes('auto-renew') ||
      labelLower.includes('renews at') ||
      labelLower.includes('subscription') ||
      labelLower.includes('free trial')
    ) {
      findings.push({
        category: 'subscription_traps',
        title: 'Free trial transitions into recurring subscription charges',
        severity: 'high',
        confidence: 0.85,
        evidence: price.context || price.label,
        explanation:
          'The offer emphasizes a "free trial" or discounted introductory tier, but binds the account into recurring automatic payments with terms that may be easy to overlook.',
        potentialImpact:
          'You may be billed unexpected recurring charges if cancellation is difficult or renewal notices are silent.',
        recommendation:
          'Check subscription cancellation terms and set a reminder on your personal calendar before the renewal date.',
        sourceElement: price.selector || '.subscription-notice',
      });
    }
  }

  // 4. Interactive Elements (Buttons, Confirmshaming, Misleading Hierarchy)
  for (const el of signals.interactiveElements || []) {
    const textLower = el.text.toLowerCase();

    // Confirmshaming detection
    if (
      textLower.includes('no, i prefer paying full price') ||
      textLower.includes("no thanks, i hate saving") ||
      textLower.includes("no, i don't want to save") ||
      textLower.includes('no, i prefer to be unprotected') ||
      textLower.includes("i don't care about privacy") ||
      textLower.includes("no, i'll pay more")
    ) {
      findings.push({
        category: 'confirmshaming',
        title: 'Emotionally manipulative opt-out language (Confirmshaming)',
        severity: 'medium',
        confidence: 0.95,
        evidence: `Button / Link text: "${el.text}"`,
        explanation:
          'The decline option is phrased to shame or guilt the user into accepting the offer by implying poor judgment if they decline.',
        potentialImpact:
          'Emotional pressure nudges you into giving up personal info or subscribing against your real preferences.',
        recommendation:
          'Do not feel pressured by emotional phrasing. Declining is your right.',
        sourceElement: el.selector || 'button.decline-link',
      });
    }
  }

  // Calculate deterministic score
  const scoreBreakdown = calculateDeterministicRiskScore(findings);

  let summary = '';
  if (findings.length === 0) {
    summary =
      'Analysis completed. No obvious dark patterns or deceptive consent mechanisms were detected on this page.';
  } else {
    summary = `Detected ${findings.length} potential deceptive design pattern(s) or privacy concern(s). ${scoreBreakdown.reasons.join(' ')}`;
  }

  return {
    overallRiskScore: scoreBreakdown.score,
    riskLevel: scoreBreakdown.level,
    summary,
    findings,
  };
}

export function analyzePrivacyPolicyRuleBased(text: string): PrivacyAnalysis {
  const lower = text.toLowerCase();

  const dataCollected: string[] = [];
  if (lower.includes('ip address') || lower.includes('device identifier') || lower.includes('browser type')) {
    dataCollected.push('Technical device and network identifiers (IP address, browser type)');
  }
  if (lower.includes('email') || lower.includes('phone') || lower.includes('name')) {
    dataCollected.push('Personal contact information (name, email address)');
  }
  if (lower.includes('location') || lower.includes('geolocation') || lower.includes('gps')) {
    dataCollected.push('Geographical location data');
  }
  if (lower.includes('purchase history') || lower.includes('payment information') || lower.includes('transaction')) {
    dataCollected.push('Financial and transaction records');
  }
  if (lower.includes('browsing') || lower.includes('pages viewed') || lower.includes('clicks')) {
    dataCollected.push('On-site behavioral and interaction activity');
  }

  const purposes: string[] = [];
  if (lower.includes('service') || lower.includes('provide')) purposes.push('Core service provision and contract fulfillment');
  if (lower.includes('analytic') || lower.includes('improve')) purposes.push('Usage analytics and product improvement');
  if (lower.includes('marketing') || lower.includes('promotional') || lower.includes('advertising')) {
    purposes.push('Marketing communications and targeted promotional campaigns');
  }

  const sharing: string[] = [];
  if (lower.includes('third party') || lower.includes('third-party') || lower.includes('partners')) {
    sharing.push('Third-party service providers, vendors, and strategic partners');
  }
  if (lower.includes('affiliate') || lower.includes('subsidiaries')) {
    sharing.push('Corporate group entities and affiliates');
  }
  if (lower.includes('law enforcement') || lower.includes('legal obligation') || lower.includes('court order')) {
    sharing.push('Law enforcement and regulatory authorities when legally requested');
  }

  const trackingIndicators: string[] = [];
  if (lower.includes('cookie') || lower.includes('web beacon') || lower.includes('pixel')) {
    trackingIndicators.push('Cookies, web beacons, and tracking pixels are deployed');
  }
  if (lower.includes('cross-site') || lower.includes('across websites')) {
    trackingIndicators.push('Potential cross-site browsing tracking indicated');
  }

  const profilingIndicators: string[] = [];
  if (lower.includes('profile') || lower.includes('personalize') || lower.includes('interest-based')) {
    profilingIndicators.push('Activity is analyzed to build interest-based profiles for tailored content and ads');
  }

  const userControls: string[] = [];
  if (lower.includes('opt-out') || lower.includes('opt out')) userControls.push('Opt-out mechanisms available for marketing communications');
  if (lower.includes('delete') || lower.includes('erasure')) userControls.push('Right to request deletion of personal information');
  if (lower.includes('access') || lower.includes('download')) userControls.push('Right to access or download stored records');

  const concerns: string[] = [];
  if (lower.includes('sell') || lower.includes('share for valuable consideration')) {
    concerns.push('Policy indicates data may be shared or sold to advertising networks');
  }
  if (lower.includes('as long as necessary') || lower.includes('indefinitely')) {
    concerns.push('Data retention timeline is open-ended or vaguely specified');
  }

  return {
    summary:
      'This privacy policy outlines data handling practices, detailing collection of device and contact info, usage for analytics and marketing, and sharing with third-party service providers.',
    dataCollected: dataCollected.length > 0 ? dataCollected : ['General interaction data'],
    purposes: purposes.length > 0 ? purposes : ['Service delivery and maintenance'],
    sharing: sharing.length > 0 ? sharing : ['Third-party infrastructure providers'],
    trackingIndicators: trackingIndicators.length > 0 ? trackingIndicators : ['Standard session cookies'],
    profilingIndicators: profilingIndicators.length > 0 ? profilingIndicators : ['None explicitly identified'],
    retention: lower.includes('retention')
      ? 'Retained for duration of active relationship plus statutory obligation periods'
      : 'Retained as needed for operational and legal compliance purposes',
    userControls: userControls.length > 0 ? userControls : ['Account deletion or contact support'],
    sensitiveDataIndicators: lower.includes('biometric') || lower.includes('health') ? ['Sensitive personal data may be collected'] : [],
    concerns: concerns.length > 0 ? concerns : ['Verify third-party advertising partner policies'],
    uncertainties: ['Exact duration of third-party cookie persistence may depend on specific ad networks.'],
  };
}
