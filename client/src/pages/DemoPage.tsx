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
} from 'lucide-react';
import { api } from '../services/api.js';
import { FindingCard } from '../components/FindingCard.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { Finding } from '@trustlens/shared';
import { extractPageSignals } from '../extraction/domExtractor.js';

export const DemoPage: React.FC = () => {
  // Demo interactive states
  const [countdownSeconds, setCountdownSeconds] = useState(29);
  const [marketingChecked, setMarketingChecked] = useState(true);
  const [trackingChecked, setTrackingChecked] = useState(true);

  // Live TrustLens analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Countdown timer simulation (resets periodically as a simulated dark pattern)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 29));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (s: number) => {
    return `00:${s < 10 ? `0${s}` : s}`;
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
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Interactive Audit & Hackathon Demo Lab</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">TrustLens AI Demo Lab</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Explore how TrustLens detects manipulative website patterns in real time. The elements
            below are live, real DOM controls simulating deceptive designs. Click "Scan Live DOM" to
            extract and analyze signals directly from this rendered page.
          </p>
        </div>

        <button
          onClick={handleRunDemoScan}
          disabled={analyzing}
          className="flex-shrink-0 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition flex items-center space-x-2 disabled:opacity-50"
        >
          {analyzing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-blue-200" />
          )}
          <span>{analyzing ? 'Extracting & Analyzing DOM...' : 'Scan Live DOM With TrustLens'}</span>
        </button>
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
                      ? 'AI Analysis (Gemini 3.8 Flash)'
                      : 'Rule-Based Analysis (Local Heuristics Engine)'}
                  </span>
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Identified Deceptive Design Signals ({analysisResult.findingCount})
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{analysisResult.summary}</p>
            </div>

            <RiskBadge
              score={analysisResult.riskScore}
              level={analysisResult.riskLevel}
              size="lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisResult.findings.map((f: Finding, i: number) => (
              <FindingCard key={i} finding={f} />
            ))}
          </div>
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
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
          Simulated Dark Pattern Lab (6 Live Test Cases)
        </h2>
        <p className="text-xs text-slate-500">
          Each card below presents a live UI simulation alongside educational breakdowns of user perception, detection logic, and consumer harm.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* 1. Fake Urgency / Countdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-black uppercase text-red-600 tracking-wider">
                  Case 1: Fake Urgency & Countdown
                </span>
                <Clock className="w-4 h-4 text-red-500" />
              </div>

              {/* Live Simulated Element */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-1 timer-box">
                <div className="text-red-700 font-mono text-sm font-black flex items-center justify-center space-x-1.5">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>Special Flash Deal: Only {formatTimer(countdownSeconds)} remaining!</span>
                </div>
                <p className="text-[11px] text-red-600">
                  Hurry! Demand is high: Only 2 items left in stock.
                </p>
              </div>

              {/* Explanations */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What The User Sees
                  </span>
                  <p className="text-slate-600">
                    A prominent ticking countdown timer claiming the discount will disappear in seconds.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects
                  </span>
                  <p className="text-slate-600">
                    Active timer digits combined with FOMO scarcity copy without verification of inventory constraints.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    Why It Matters
                  </span>
                  <p className="text-slate-600">
                    Manufactures false urgency, prompting impulse buys before comparing alternatives.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Hidden Fee / Drip Pricing */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-black uppercase text-orange-600 tracking-wider">
                  Case 2: Hidden Fees & Drip Pricing
                </span>
                <DollarSign className="w-4 h-4 text-orange-500" />
              </div>

              {/* Live Simulated Element */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Product Subtotal</span>
                  <span className="font-bold">$24.99 (₹1,999)</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold bg-red-50 p-1.5 rounded border border-red-200 hidden-fee-item">
                  <span>Mandatory Ancillary Processing Service Fee</span>
                  <span>+₹199 ($6.50)</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold border-t pt-1">
                  <span>Final Total</span>
                  <span>₹2,198 ($31.49)</span>
                </div>
              </div>

              {/* Explanations */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What The User Sees
                  </span>
                  <p className="text-slate-600">
                    An unexpected extra fee introduced only at the final confirmation step.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects
                  </span>
                  <p className="text-slate-600">
                    Surcharges and "service fees" separated from upfront unit price disclosures.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    Why It Matters
                  </span>
                  <p className="text-slate-600">
                    Distorts accurate price comparison by exploiting sunk cost after checkout investment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Preselected Advertising Consent */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-black uppercase text-amber-600 tracking-wider">
                  Case 3: Preselected Advertising Consent
                </span>
                <CheckSquare className="w-4 h-4 text-amber-500" />
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
                    A pre-ticked checkbox automatically opting the user into commercial marketing emails.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects
                  </span>
                  <p className="text-slate-600">
                    `checked` attribute active by default on non-essential marketing permissions.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    Why It Matters
                  </span>
                  <p className="text-slate-600">
                    Violates consent autonomy by relying on user inattention to harvest contacts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Confirmshaming */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">
                  Case 4: Confirmshaming
                </span>
                <HelpCircle className="w-4 h-4 text-indigo-500" />
              </div>

              {/* Live Simulated Element */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-center">
                <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                  Yes, give me the discount
                </button>
                <button className="w-full py-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-semibold hover:underline block">
                  No, I prefer paying more and wasting my money
                </button>
              </div>

              {/* Explanations */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What The User Sees
                  </span>
                  <p className="text-slate-600">
                    A decline button phrased to guilt-trip or ridicule anyone choosing not to accept.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects
                  </span>
                  <p className="text-slate-600">
                    Emotionally coercive keywords ("prefer paying more", "hate saving") on opt-out anchors.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    Why It Matters
                  </span>
                  <p className="text-slate-600">
                    Manipulates user emotions to override logical decisions to decline subscriptions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Subscription Trap */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-black uppercase text-rose-600 tracking-wider">
                  Case 5: Subscription Trap (Roach Motel)
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>

              {/* Live Simulated Element */}
              <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">VIP Premium Membership</span>
                  <span className="text-xs font-black text-rose-600">FREE FOR 7 DAYS</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Start Free Trial today. Renews automatically at ₹999/month ($120/year) unless
                  cancelled via certified postal mail or telephone support during business hours.
                </p>
              </div>

              {/* Explanations */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What The User Sees
                  </span>
                  <p className="text-slate-600">
                    "Start Free Trial" headline obscuring automatic recurring billing terms.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects
                  </span>
                  <p className="text-slate-600">
                    Trial claims combined with recurring charge syntax and friction-heavy cancellation requirements.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    Why It Matters
                  </span>
                  <p className="text-slate-600">
                    Traps users into unexpected recurring charges with deliberately difficult opt-out paths.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Pre-selected Tracking Consent */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-black uppercase text-purple-600 tracking-wider">
                  Case 6: Pre-selected Tracking Consent
                </span>
                <Eye className="w-4 h-4 text-purple-500" />
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
                  <span className="font-bold block">Personalized Tracking & Cross-Site Cookies</span>
                  <span className="text-slate-600">
                    Enable cross-site behavioral tracking and fingerprinting to monitor browsing across external sites.
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
                    Default-enabled tracking permission bundled into general browsing interactions.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    What TrustLens Detects
                  </span>
                  <p className="text-slate-600">
                    Pre-selected cookies and cross-site tracking indicators bypassing explicit opt-in.
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">
                    Why It Matters
                  </span>
                  <p className="text-slate-600">
                    Exposes browsing history and device profiles to third-party data brokers without informed consent.
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
