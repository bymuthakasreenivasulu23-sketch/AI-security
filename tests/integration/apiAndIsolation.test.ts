import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../server/src/db/index.js';
import { analyzeSignalsRuleBased } from '../../server/src/ai/fallbackAnalyzer.js';
import { PageSignals } from '@trustlens/shared';

describe('Database User Isolation & Heuristic Analysis', () => {
  beforeEach(async () => {
    await db.init();
  });

  it('enforces strict data isolation between two distinct users', async () => {
    const userA = await db.getOrCreateUser('alice@test.local', 'Alice');
    const userB = await db.getOrCreateUser('bob@test.local', 'Bob');

    expect(userA.id).not.toBe(userB.id);

    // User A creates a scan
    const scanA = await db.createScan(
      {
        user_id: userA.id,
        domain: 'alice-private-store.com',
        page_url: 'https://alice-private-store.com',
        page_title: 'Alice Cart',
        page_type: 'cart',
        risk_score: 55,
        risk_level: 'moderate',
        finding_count: 1,
      },
      [
        {
          category: 'hidden_fees',
          title: 'Alice Fee',
          severity: 'medium',
          confidence: 0.85,
          evidence: '$5 processing fee',
          explanation: 'Hidden fee',
          potential_impact: 'Higher cost',
          recommendation: 'Check fee',
          source_element: '.fee',
        },
      ]
    );

    // User B attempts to access User A's scan
    const accessedByB = await db.getScanById(userB.id, scanA.scan.id);
    expect(accessedByB).toBeNull(); // Access blocked!

    // User A can access their own scan
    const accessedByA = await db.getScanById(userA.id, scanA.scan.id);
    expect(accessedByA).not.toBeNull();
    expect(accessedByA?.scan.id).toBe(scanA.scan.id);

    // User B attempts to delete User A's scan
    const deleteByB = await db.deleteScan(userB.id, scanA.scan.id);
    expect(deleteByB).toBe(false); // Unauthorized deletion failed!

    // Verify scan still exists for User A
    const stillExists = await db.getScanById(userA.id, scanA.scan.id);
    expect(stillExists).not.toBeNull();
  });

  it('safely handles malicious SQL injection strings in domain or URL parameters', async () => {
    const user = await db.getOrCreateUser('sql-test@test.local', 'Tester');
    const maliciousDomain = "store.com'; DROP TABLE scans; --";

    const saved = await db.createScan(
      {
        user_id: user.id,
        domain: maliciousDomain,
        page_url: `https://${maliciousDomain}/test`,
        page_title: 'Injected Page',
        page_type: 'test',
        risk_score: 20,
        risk_level: 'mild',
        finding_count: 0,
      },
      []
    );

    expect(saved.scan.domain).toBe(maliciousDomain);

    // Verify table wasn't dropped and queries still succeed
    const fetched = await db.getScanById(user.id, saved.scan.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.scan.id).toBe(saved.scan.id);
  });

  it('accurately identifies fake urgency and preselected consent using rule engine', () => {
    const sampleSignals: PageSignals = {
      domain: 'shop-test.com',
      pageUrl: 'https://shop-test.com/checkout',
      pageTitle: 'Shop Checkout',
      pageType: 'checkout',
      interactiveElements: [
        {
          type: 'button',
          text: 'No, I prefer paying full price',
          visible: true,
          selector: 'button.decline',
        },
      ],
      pricingSignals: [
        {
          type: 'fee',
          label: 'Mandatory Service Fee',
          amount: '$4.99',
          selector: '.fee',
        },
      ],
      consentSignals: [
        {
          type: 'checkbox',
          label: 'Send me promotional marketing emails from partners',
          checkedByDefault: true,
          selector: '#marketing_opt',
        },
      ],
      urgencySignals: [
        {
          type: 'timer',
          text: 'Expires in 00:29!',
          hasTimer: true,
          timerValue: '00:29',
          selector: '.timer',
        },
      ],
      headings: ['Checkout'],
      privacySnippets: [],
      isLikelySensitive: false,
    };

    const analysis = analyzeSignalsRuleBased(sampleSignals);
    expect(analysis.findings.length).toBeGreaterThanOrEqual(4);
    expect(analysis.overallRiskScore).toBeGreaterThan(50);

    const categories = analysis.findings.map((f) => f.category);
    expect(categories).toContain('fake_countdown');
    expect(categories).toContain('preselected_consent');
    expect(categories).toContain('hidden_fees');
    expect(categories).toContain('confirmshaming');
    expect(analysis.analysisMode).toBe('rule_based');
  });

  it('evaluates completely clean page signals with 0 findings and low risk score', () => {
    const cleanSignals: PageSignals = {
      domain: 'clean-portal.org',
      pageUrl: 'https://clean-portal.org/articles',
      pageTitle: 'Articles Library',
      pageType: 'informational',
      interactiveElements: [],
      pricingSignals: [],
      consentSignals: [],
      urgencySignals: [],
      headings: ['Articles'],
      privacySnippets: [],
      isLikelySensitive: false,
    };

    const analysis = analyzeSignalsRuleBased(cleanSignals);
    expect(analysis.findings.length).toBe(0);
    expect(analysis.overallRiskScore).toBe(0);
    expect(analysis.riskLevel).toBe('low');
    expect(analysis.analysisMode).toBe('rule_based');
  });

  it('detects INR ₹ hidden fees and subscription recurring traps accurately', () => {
    const signals: PageSignals = {
      domain: 'shop-india.local',
      pageUrl: 'https://shop-india.local/checkout',
      pageTitle: 'Order Review',
      pricingSignals: [
        {
          type: 'fee',
          label: 'Service Convenience Handling Charge',
          amount: '₹199',
          selector: '.inr-fee',
        },
        {
          type: 'trial',
          label: 'Free 7-day trial vip access',
          amount: '₹0',
          isRecurring: true,
          context: 'Auto-renews at ₹999/month',
          selector: '.vip-trial',
        },
      ],
      interactiveElements: [],
      consentSignals: [],
      urgencySignals: [],
      headings: [],
      privacySnippets: [],
      isLikelySensitive: false,
    };

    const analysis = analyzeSignalsRuleBased(signals);
    const categories = analysis.findings.map((f) => f.category);
    expect(categories).toContain('hidden_fees');
    expect(categories).toContain('subscription_traps');
    expect(analysis.overallRiskScore).toBeGreaterThan(40);
  });
});
