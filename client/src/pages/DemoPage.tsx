import React, { useState, useEffect } from 'react';
import {
  Clock,
  DollarSign,
  CheckSquare,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Info,
  HelpCircle,
  Eye,
  Lock,
  Cpu,
  RotateCcw,
  Sliders,
  Check,
} from 'lucide-react';
import { api } from '../services/api.js';
import { FindingCard } from '../components/FindingCard.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { Finding } from '@trustlens/shared';
import { extractPageSignals } from '../extraction/domExtractor.js';

export const DemoPage: React.FC = () => {
  // Demo interactive scenario toggle states
  const [urgencyActive, setUrgencyActive] = useState(true);
  const [countdownSeconds, setCountdownSeconds] = useState(29);
  const [hiddenFeeActive, setHiddenFeeActive] = useState(true);
  const [marketingChecked, setMarketingChecked] = useState(true);
  const [confirmshameActive, setConfirmshameActive] = useState(true);
  const [subscriptionTrapActive, setSubscriptionTrapActive] = useState(true);
  const [trackingChecked, setTrackingChecked] = useState(true);

  // Live TrustLens analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Countdown timer simulation (resets periodically when urgencyActive is true)
  useEffect(() => {
    if (!urgencyActive) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 29));
    }, 1000);
    return () => clearInterval(timer);
  }, [urgencyActive]);

  const formatTimer = (s: number) => {
    return `00:${s < 10 ? `0${s}` : s}`;
  };

  const handleResetToDeceptive = () => {
    setUrgencyActive(true);
    setCountdownSeconds(29);
    setHiddenFeeActive(true);
    setMarketingChecked(true);
    setConfirmshameActive(true);
    setSubscriptionTrapActive(true);
    setTrackingChecked(true);
    setAnalysisResult(null);
    setScanError(null);
  };

  const handleCleanAllPatterns = () => {
    setUrgencyActive(false);
    setHiddenFeeActive(false);
    setMarketingChecked(false);
    setConfirmshameActive(false);
    setSubscriptionTrapActive(false);
    setTrackingChecked(false);
    setAnalysisResult(null);
    setScanError(null);
  };

  // Live scan using real DOM extraction on the rendered page
  const handleRunDemoScan = async () => {
    setAnalyzing(true);
    setScanError(null);
    setAnalysisResult(null);

    try {
      // Extract real DOM signals directly from the current active page!
      const liveSignals = extractPageSignals();

      const res = await api.analyze({
        domain: window.location.hostname || 'localhost',
        pageUrl: window.location.href,
        pageTitle: document.title || 'TrustLens AI Demo Lab',
        pageType: 'demo_environment',
        signals: liveSignals,
      });

      if (res.success && res.data) {
        setAnalysisResult(res.data);
      } else {
        setScanError('Analysis completed without findings or backend reported error.');
      }
    } catch (err: any) {
      setScanError(err.message || 'Failed to communicate with TrustLens analysis engine.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Interactive Controlled Testbed & Live Evaluation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">TrustLens AI Demo Lab</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              This is a controlled evaluation testbed. All elements below are real, interactive DOM
              nodes. Toggle deceptive patterns on or off to witness real-time signal extraction and
              score updates without simulated or hardcoded results.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
            <button
              onClick={handleRunDemoScan}
              disabled={analyzing}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {analyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-200" />
              )}
              <span>{analyzing ? 'Extracting & Analyzing...' : 'Scan Live DOM'}</span>
            </button>

            <button
              onClick={handleResetToDeceptive}
              className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5"
              title="Activate all 6 dark patterns"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
              <span>Reset (All 6 Active)</span>
            </button>

            <button
              onClick={handleCleanAllPatterns}
              className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5"
              title="Clean all patterns to demonstrate zero-risk state"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clean Mode (All Safe)</span>
            </button>
          </div>
        </div>

        {/* Informational Guidance Note */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <span className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>
              Tip: You can also open the installed <strong>TrustLens AI Chrome Extension</strong> on this page and click "Scan" directly.
            </span>
          </span>
          <span className="text-emerald-400 font-medium flex items-center space-x-1">
            <Lock className="w-3 h-3" />
            <span>Zero mock data • Pure live DOM extraction</span>
          </span>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Live DOM Scan Report
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                    analysisResult.analysisMode === 'ai'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>
                    {analysisResult.analysisMode === 'ai'
                      ? 'AI Analysis (Gemini Flash)'
                      : 'Rule-Based Analysis (Local Heuristics Engine)'}
                  </span>
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {analysisResult.findingCount === 0
                  ? 'Clean Page — Zero Deceptive Patterns Detected'
                  : `Identified Deceptive Design Signals (${analysisResult.findingCount})`}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{analysisResult.summary}</p>
            </div>

            <RiskBadge
              score={analysisResult.riskScore}
              level={analysisResult.riskLevel}
              size="lg"
            />
          </div>

          {analysisResult.findings.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Page Verified Clean</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                No artificial timers, hidden ancillary charges, pre-selected tracking, or manipulative
                opt-out phrasing were found in the current DOM state.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.findings.map((f: Finding, i: number) => (
                <FindingCard key={i} finding={f} />
              ))}
            </div>
          )}
        </section>
      )}

      {scanError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{scanError}</span>
        </div>
      )}

      {/* The 6 Visually Distinct Simulated Dark Pattern Lab Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
              Controlled Scenario Sandbox (6 Interactive Cases)
            </h2>
            <p className="text-xs text-slate-500">
              Toggle any case to see how TrustLens adapts to changes in real-world webpage markup.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* 1. Fake Urgency / Countdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase text-red-600 tracking-wider">
                    Case 1: Urgency & Countdown
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${urgencyActive ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {urgencyActive ? 'Manipulative Mode' : 'Clean Mode'}
                  </span>
                </div>
                <button
                  onClick={() => setUrgencyActive(!urgencyActive)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  {urgencyActive ? 'Toggle Safe' : 'Toggle Urgency'}
                </button>
              </div>

              {/* Live Simulated Element */}
              {urgencyActive ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-1 timer-box">
                  <div className="text-red-700 font-mono text-sm font-black flex items-center justify-center space-x-1.5">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span>Special Flash Deal: Only {formatTimer(countdownSeconds)} remaining!</span>
                  </div>
                  <p className="text-[11px] text-red-600">
                    Hurry! Demand is high: Only 2 items left in stock.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                  <div className="text-emerald-700 text-xs font-bold flex items-center justify-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>In Stock • Standard Shipping Available</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Transparent availability without artificial countdown clocks or fabricated scarcity.
                  </p>
                </div>
              )}

              {/* Explanations */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What The User Sees
                  </span>
                  <p className="text-slate-600">
                    {urgencyActive
                      ? 'A prominent ticking countdown claiming the special rate disappears in seconds.'
                      : 'Clear, neutral stock status without pressure tactics.'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects (Observed vs Inferred)
                  </span>
                  <p className="text-slate-600">
                    {urgencyActive
                      ? 'Observed: Active countdown digits paired with scarcity copy ("Only 2 items left"). Inferred: Artificial urgency manufactured to bypass careful consumer comparison.'
                      : 'Observed: Neutral inventory confirmation with no timer syntax.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Hidden Fee / Drip Pricing */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase text-orange-600 tracking-wider">
                    Case 2: Hidden Fees & Drip Pricing
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${hiddenFeeActive ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {hiddenFeeActive ? 'Drip Fee Active' : 'Clean Mode'}
                  </span>
                </div>
                <button
                  onClick={() => setHiddenFeeActive(!hiddenFeeActive)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  {hiddenFeeActive ? 'Toggle Safe' : 'Toggle Fee'}
                </button>
              </div>

              {/* Live Simulated Element */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Product Subtotal</span>
                  <span className="font-bold">₹1,999 ($24.99)</span>
                </div>

                {hiddenFeeActive && (
                  <div className="flex justify-between text-red-600 font-bold bg-red-50 p-1.5 rounded border border-red-200 hidden-fee-item">
                    <span>Mandatory Ancillary Processing Service Fee</span>
                    <span>+₹199 ($2.50)</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-900 font-extrabold border-t pt-1">
                  <span>Final Total</span>
                  <span>{hiddenFeeActive ? '₹2,198 ($27.49)' : '₹1,999 (All Taxes & Fees Included)'}</span>
                </div>
              </div>

              {/* Explanations */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What The User Sees
                  </span>
                  <p className="text-slate-600">
                    {hiddenFeeActive
                      ? 'An unexpected ₹199 processing surcharge appended only at the final payment step.'
                      : 'All-inclusive upfront pricing with zero surprise surcharges.'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects (Observed vs Inferred)
                  </span>
                  <p className="text-slate-600">
                    {hiddenFeeActive
                      ? 'Observed: Fee item labeled "service fee" / "processing surcharge" revealed after base price. Inferred: Drip pricing exploiting checkout sunk-cost fallacy.'
                      : 'Observed: Base total matches final payable charge.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Preselected Advertising Consent */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase text-amber-600 tracking-wider">
                    Case 3: Preselected Advertising Consent
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${marketingChecked ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {marketingChecked ? 'Pre-Checked' : 'Unchecked (Safe)'}
                  </span>
                </div>
                <button
                  onClick={() => setMarketingChecked(!marketingChecked)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  {marketingChecked ? 'Uncheck' : 'Pre-check'}
                </button>
              </div>

              {/* Live Simulated Element */}
              <label className="flex items-start space-x-3 p-3 bg-amber-50/50 border border-amber-200 rounded-xl cursor-pointer">
                <input
                  id="consent_ad_checkbox"
                  type="checkbox"
                  checked={marketingChecked}
                  onChange={(e) => setMarketingChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <div className="text-xs text-slate-800">
                  <span className="font-bold block">Personalized Advertising & Sponsor Outreach</span>
                  <span className="text-slate-600">
                    I agree to share my email and purchase history with commercial advertising affiliates.
                  </span>
                </div>
              </label>

              {/* Explanations */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What The User Sees
                  </span>
                  <p className="text-slate-600">
                    {marketingChecked
                      ? 'A pre-ticked checkbox assuming consent for marketing broadcasts unless manually unchecked.'
                      : 'An unselected opt-in box respecting consumer consent autonomy.'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects (Observed vs Inferred)
                  </span>
                  <p className="text-slate-600">
                    {marketingChecked
                      ? 'Observed: Pre-selected checkbox bound to marketing/advertising keywords. Inferred: Relies on user oversight to harvest promotional opt-ins.'
                      : 'Observed: Clean unchecked state requiring deliberate affirmative consent.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Confirmshaming */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">
                    Case 4: Confirmshaming
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${confirmshameActive ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {confirmshameActive ? 'Guilt Copy Active' : 'Neutral Copy'}
                  </span>
                </div>
                <button
                  onClick={() => setConfirmshameActive(!confirmshameActive)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  {confirmshameActive ? 'Toggle Safe' : 'Toggle Guilt'}
                </button>
              </div>

              {/* Live Simulated Element */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-center">
                <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                  Yes, claim 15% discount
                </button>
                <button className="w-full py-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-semibold hover:underline block">
                  {confirmshameActive
                    ? 'No, I prefer paying more and wasting my money'
                    : 'No thanks, continue without discount'}
                </button>
              </div>

              {/* Explanations */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What The User Sees
                  </span>
                  <p className="text-slate-600">
                    {confirmshameActive
                      ? 'A decline button written to shame or ridicule anyone choosing not to participate.'
                      : 'Neutral, respectful decline option without emotional manipulation.'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects (Observed vs Inferred)
                  </span>
                  <p className="text-slate-600">
                    {confirmshameActive
                      ? 'Observed: Decline control text containing guilt-inducing phrasing ("wasting money", "pay more"). Inferred: Psychologically nudges users against opting out.'
                      : 'Observed: Standard objective action verb ("No thanks, continue").'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Subscription Trap */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase text-rose-600 tracking-wider">
                    Case 5: Subscription Trap (Roach Motel)
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${subscriptionTrapActive ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {subscriptionTrapActive ? 'Trap Active' : 'Transparent Terms'}
                  </span>
                </div>
                <button
                  onClick={() => setSubscriptionTrapActive(!subscriptionTrapActive)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  {subscriptionTrapActive ? 'Toggle Safe' : 'Toggle Trap'}
                </button>
              </div>

              {/* Live Simulated Element */}
              <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">VIP Membership Access</span>
                  <span className="text-xs font-black text-rose-600">
                    {subscriptionTrapActive ? 'FREE FOR 7 DAYS' : '₹999 / MONTH'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {subscriptionTrapActive
                    ? 'Start Free Trial today. Renews automatically at ₹999/month unless cancelled via certified postal mail or telephone support during business hours.'
                    : 'Simple monthly plan with 7-day free trial. Cancel anytime online with 1 click in your account settings.'}
                </p>
              </div>

              {/* Explanations */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What The User Sees
                  </span>
                  <p className="text-slate-600">
                    {subscriptionTrapActive
                      ? 'A bright "Free Trial" headline concealing severe asymmetric cancellation hurdles.'
                      : 'Clear, straightforward monthly subscription terms with online cancellation.'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects (Observed vs Inferred)
                  </span>
                  <p className="text-slate-600">
                    {subscriptionTrapActive
                      ? 'Observed: Promotional "free trial" tied to recurring renewal with burdensome cancellation conditions. Inferred: High friction designed to trap paying subscribers.'
                      : 'Observed: Transparent billing frequency with low-friction digital cancellation.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Pre-selected Tracking Consent */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase text-purple-600 tracking-wider">
                    Case 6: Pre-selected Tracking Consent
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trackingChecked ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {trackingChecked ? 'Pre-Checked' : 'Unchecked (Safe)'}
                  </span>
                </div>
                <button
                  onClick={() => setTrackingChecked(!trackingChecked)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  {trackingChecked ? 'Uncheck' : 'Pre-check'}
                </button>
              </div>

              {/* Live Simulated Element */}
              <label className="flex items-start space-x-3 p-3 bg-purple-50/50 border border-purple-200 rounded-xl cursor-pointer">
                <input
                  id="consent_tracking_checkbox"
                  type="checkbox"
                  checked={trackingChecked}
                  onChange={(e) => setTrackingChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-purple-600 rounded"
                />
                <div className="text-xs text-slate-800">
                  <span className="font-bold block">Cross-Site Behavioral Tracking & Cookies</span>
                  <span className="text-slate-600">
                    Enable cross-site behavioral tracking and device fingerprinting to monitor browsing across external sites.
                  </span>
                </div>
              </label>

              {/* Explanations */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What The User Sees
                  </span>
                  <p className="text-slate-600">
                    {trackingChecked
                      ? 'A pre-checked tracking box enrolling users into cross-site ad networks by default.'
                      : 'An unchecked privacy-preserving toggle requiring informed affirmative consent.'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects (Observed vs Inferred)
                  </span>
                  <p className="text-slate-600">
                    {trackingChecked
                      ? 'Observed: Default-checked tracking permission syntax. Inferred: Circumvents GDPR/CCPA explicit opt-in mandates.'
                      : 'Observed: Privacy-first default with no unsolicited tracking activation.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
