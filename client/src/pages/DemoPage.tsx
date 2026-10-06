import React, { useState, useEffect } from 'react';
import {
  Clock,
  DollarSign,
  CheckSquare,
  AlertTriangle,
  Flame,
  Search,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api.js';
import { FindingCard } from '../components/FindingCard.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { Finding } from '@trustlens/shared';

export const DemoPage: React.FC = () => {
  // Demo interactive states
  const [countdownSeconds, setCountdownSeconds] = useState(29);
  const [showHiddenFee, setShowHiddenFee] = useState(true);
  const [marketingChecked, setMarketingChecked] = useState(true);
  const [trackingChecked, setTrackingChecked] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  // Live TrustLens analysis state for this demo page
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // Countdown timer simulation (resets periodically as a dark pattern!)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 29));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (s: number) => {
    return `00:${s < 10 ? `0${s}` : s}`;
  };

  const handleRunDemoScan = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Send the intentionally simulated signals matching the exact 6 patterns
      const res = await api.analyze({
        domain: window.location.hostname,
        pageUrl: window.location.href,
        pageTitle: 'TrustLens AI Demo Environment — Simulated Checkout',
        pageType: 'demo_test_page',
        signals: {
          domain: window.location.hostname,
          pageUrl: window.location.href,
          pageTitle: 'TrustLens AI Demo Environment',
          pageType: 'demo_test_page',
          interactiveElements: [
            {
              type: 'button',
              text: 'No, I prefer paying full price and wasting money',
              visible: true,
              selector: 'button.confirmshame-btn',
            },
            {
              type: 'button',
              text: 'Claim 50% Off Before Timer Dies',
              visible: true,
              selector: 'button.claim-btn',
            },
          ],
          pricingSignals: [
            {
              type: 'hidden_fee',
              label: 'Mandatory Ancillary Processing Service Fee',
              amount: '$6.50',
              context: 'Appears late on step 3 after subtotal was $24.99',
              selector: '.hidden-fee-row',
            },
            {
              type: 'subscription_trap',
              label: 'Start Free 7-Day Trial',
              amount: '$0.00',
              context: 'Silently auto-renews at $119/year after 7 days without explicit prompt',
              isRecurring: true,
              selector: '.subscription-notice',
            },
          ],
          consentSignals: [
            {
              type: 'preselected_consent',
              label: 'Personalized advertising and third-party data sharing',
              checkedByDefault: true,
              purpose: 'marketing',
              selector: '#consent_personalized_ads',
            },
            {
              type: 'preselected_consent',
              label: 'Allow personalized cross-site tracking cookies',
              checkedByDefault: true,
              purpose: 'tracking',
              selector: '#consent_tracking_cookies',
            },
          ],
          urgencySignals: [
            {
              type: 'countdown_timer',
              text: `Special offer expires in ${formatTimer(countdownSeconds)}!`,
              hasTimer: true,
              timerValue: formatTimer(countdownSeconds),
              scarcityClaim: 'High demand: Only 2 left in stock! 18 people viewing right now.',
              selector: '.timer-box',
            },
          ],
          headings: ['TrustLens AI Demo Environment', 'Simulated E-Commerce Checkout'],
          privacySnippets: [],
          isLikelySensitive: false,
          extractedAt: new Date().toISOString(),
        },
      });

      if (res.success && res.data) {
        setAnalysisResult(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Analysis error');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Demo Warning Banner */}
      <div className="p-4 bg-amber-500/10 border-2 border-amber-500 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-800 font-extrabold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>TrustLens AI Demo Environment</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            This page intentionally simulates 6 widespread dark patterns and privacy traps for
            testing and verification. All elements below are simulated mockups.
          </p>
        </div>

        <button
          onClick={handleRunDemoScan}
          disabled={analyzing}
          className="flex-shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2 disabled:opacity-50"
        >
          {analyzing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-blue-200" />
          )}
          <span>{analyzing ? 'Scanning Demo DOM...' : 'Scan This Page With TrustLens'}</span>
        </button>
      </div>

      {/* Live Scan Results Section if scanned */}
      {analysisResult && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-700 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Live Scan Verification
              </span>
              <h2 className="text-xl font-extrabold text-white">TrustLens Detection Report</h2>
              <p className="text-xs text-slate-400 mt-1">{analysisResult.summary}</p>
            </div>
            <RiskBadge
              score={analysisResult.riskScore}
              level={analysisResult.riskLevel}
              size="lg"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Patterns Caught ({analysisResult.findings.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.findings.map((f: Finding, i: number) => (
                <FindingCard key={i} finding={f} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Simulated Store Interface Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        {/* Store Top Bar */}
        <div className="bg-slate-800 text-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <span className="font-bold tracking-tight">AcmeStore — Mock Checkout</span>
          <span className="text-slate-400">SECURE DEMO ENVIRONMENT</span>
        </div>

        {/* 1. Fake Countdown & Scarcity */}
        <div className="bg-red-600 text-white p-4 text-center timer-box space-y-1 shadow-inner">
          <div className="inline-flex items-center space-x-2 font-mono text-sm font-black bg-red-700/80 px-3 py-1 rounded-lg">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>Special Flash Sale: Offer expires in {formatTimer(countdownSeconds)}</span>
          </div>
          <p className="text-xs text-red-100 flex items-center justify-center space-x-1">
            <Flame className="w-3.5 h-3.5" />
            <span>High demand! Only 2 items left at this price. 18 people viewing right now.</span>
          </p>
        </div>

        {/* Store Main Form */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">
              Review Your Cart & Options
            </h2>

            {/* Cart item */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-sm">
              <div>
                <span className="font-bold text-slate-800 block">Pro Cloud Optimizer v2</span>
                <span className="text-xs text-slate-500">License: 1-Year Standard Tier</span>
              </div>
              <span className="font-bold text-slate-900">$24.99</span>
            </div>

            {/* 5. Subscription Trap */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 subscription-notice">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase">Special Upgrade</span>
                <span className="text-xs font-black text-indigo-600">$0.00 TODAY</span>
              </div>
              <p className="text-xs text-indigo-800 font-medium">
                Start Free 7-Day VIP Trial (auto-renews automatically at $119.00/year until cancelled
                via phone support).
              </p>
            </div>

            {/* 3 & 6. Prechecked Consent & Privacy Trap */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                Communication & Privacy Preferences
              </h3>

              {/* 3. Prechecked consent */}
              <label className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  id="consent_personalized_ads"
                  type="checkbox"
                  checked={marketingChecked}
                  onChange={(e) => setMarketingChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded"
                />
                <div className="text-xs text-slate-700">
                  <span className="font-bold block">Personalized Advertising Consent</span>
                  <span>
                    I agree to receive targeted promotional communications and allow AcmeStore to share
                    my email and order behavior with 50+ commercial marketing sponsors.
                  </span>
                </div>
              </label>

              {/* 6. Privacy trap */}
              <label className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  id="consent_tracking_cookies"
                  type="checkbox"
                  checked={trackingChecked}
                  onChange={(e) => setTrackingChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded"
                />
                <div className="text-xs text-slate-700">
                  <span className="font-bold block">Cross-Site Behavioral Tracking</span>
                  <span>
                    Allow persistent third-party advertising cookies and fingerprinting to monitor
                    browsing activity across external partner websites.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Hidden Fee / Order Summary (1 col) */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Order Summary</h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>$24.99</span>
              </div>

              {/* 2. Hidden Fee */}
              {showHiddenFee && (
                <div className="flex justify-between text-red-600 font-semibold hidden-fee-row bg-red-50 p-1.5 rounded">
                  <span>Mandatory Service Fee</span>
                  <span>+$6.50</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax</span>
                <span>$2.52</span>
              </div>

              <div className="border-t pt-2 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Amount Due</span>
                <span>$34.01</span>
              </div>
            </div>

            {/* 4. Confirmshaming Buttons */}
            <div className="space-y-2 pt-2">
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition claim-btn">
                Complete Purchase & Claim $10 Bonus
              </button>

              <button className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-[11px] font-semibold text-center hover:underline confirmshame-btn block">
                No, I prefer paying full price and wasting money
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
