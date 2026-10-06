import React, { useState } from 'react';
import {
  Search,
  FileText,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Lock,
} from 'lucide-react';
import { api } from '../services/api.js';
import { FindingCard } from '../components/FindingCard.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { Finding, RiskLevel } from '@trustlens/shared';

const LOADING_STEPS = [
  'Inspecting page signals...',
  'Checking consent controls...',
  'Looking for hidden pricing & drip fees...',
  'Analyzing privacy & tracking disclosures...',
  'Preparing your deterministic report...',
];

export const ScanPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'url' | 'privacy'>('url');

  // URL Scan state
  const [url, setUrl] = useState('https://store.demo-shop.local/checkout');
  const [pageTitle, setPageTitle] = useState('Demo Store Checkout');
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any | null>(null);

  // Privacy Policy Analyzer state
  const [policyText, setPolicyText] = useState(
    `We collect your IP address, device identifiers, and browsing history. We may use this data for personalized interest-based advertising and analytics. Your information may be shared with our third-party marketing affiliates and data brokers. We retain your information indefinitely as long as needed for our commercial operations. You may contact support to request deletion where legally mandated.`
  );
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyResult, setPolicyResult] = useState<any | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);

  // URL Scan handler
  const handleUrlScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setScanResult(null);

    // Simulate progress
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 800);

    try {
      const parsedUrl = new URL(url);
      const res = await api.analyze({
        domain: parsedUrl.hostname,
        pageUrl: url,
        pageTitle: pageTitle || parsedUrl.hostname,
        pageType: 'ecommerce_checkout',
        // Mock signals for direct manual scans
        signals: {
          domain: parsedUrl.hostname,
          pageUrl: url,
          pageTitle: pageTitle || parsedUrl.hostname,
          pageType: 'ecommerce_checkout',
          interactiveElements: [
            {
              type: 'button',
              text: 'No, I prefer paying full price',
              visible: true,
              selector: 'button.decline-offer',
            },
          ],
          pricingSignals: [
            {
              type: 'hidden_fee',
              label: 'Mandatory Service Processing Fee',
              amount: '$4.99',
              context: 'Revealed at final step',
              selector: '.fee-item',
            },
            {
              type: 'trial',
              label: 'Start 7-Day Free Trial',
              amount: '$0.00',
              context: 'Auto-renews at $79/yr after 7 days',
              isRecurring: true,
              selector: '.trial-notice',
            },
          ],
          consentSignals: [
            {
              type: 'marketing_precheck',
              label: 'I agree to receive personalized marketing offers from 40+ partners',
              checkedByDefault: true,
              purpose: 'marketing',
              selector: '#opt_in_partners',
            },
          ],
          urgencySignals: [
            {
              type: 'countdown_timer',
              text: 'Offer expires in 00:29!',
              hasTimer: true,
              timerValue: '00:29',
              scarcityClaim: 'Only 2 items left at this price!',
              selector: '.timer-wrap',
            },
          ],
          headings: ['Secure Checkout', 'Review Order'],
          privacySnippets: [],
          isLikelySensitive: false,
          extractedAt: new Date().toISOString(),
        },
      });

      if (res.isSensitivePage) {
        setError(res.message || 'Sensitive page detected.');
      } else if (res.success && res.data) {
        setScanResult(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Page analysis failed.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  // Privacy Policy Analysis handler
  const handlePrivacyAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyText.trim()) return;

    setPolicyLoading(true);
    setPolicyError(null);
    setPolicyResult(null);

    try {
      const res = await api.summarizePrivacyPolicy({ text: policyText });
      if (res.success && res.data) {
        setPolicyResult(res.data);
      }
    } catch (err: any) {
      setPolicyError(err.message || 'Failed to analyze privacy policy.');
    } finally {
      setPolicyLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          TrustLens Analysis Studio
        </h1>
        <p className="text-xs text-slate-500">
          Inspect webpage signals, detect deceptive designs, or audit privacy policies.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('url')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'url'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Webpage Dark Pattern Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'privacy'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Privacy Policy Auditor</span>
        </button>
      </div>

      {/* Tab 1: Webpage URL Scan */}
      {activeTab === 'url' && (
        <div className="space-y-6">
          <form
            onSubmit={handleUrlScan}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold uppercase text-slate-600">Webpage URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/checkout"
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-600">Page Context</label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="Demo Store Checkout"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Input is sanitized and disarmed against prompt injection</span>
              </span>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{loading ? 'Analyzing...' : 'Run Deep Analysis'}</span>
              </button>
            </div>
          </form>

          {/* Loading Indicator */}
          {loading && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">{LOADING_STEPS[loadingStepIdx]}</h3>
              <p className="text-xs text-slate-500">Evaluating signals with deterministic risk engine</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Scan Results */}
          {scanResult && !loading && (
            <div className="space-y-6">
              {/* Score Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400">{scanResult.domain}</span>
                    <h2 className="text-xl font-extrabold text-slate-900">{scanResult.pageTitle}</h2>
                  </div>
                  <RiskBadge score={scanResult.riskScore} level={scanResult.riskLevel} size="lg" />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold block text-slate-900 mb-1">AI & Heuristics Summary</span>
                  {scanResult.summary}
                </div>
              </div>

              {/* Findings List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Detailed Findings ({scanResult.findings.length})
                </h3>

                {scanResult.findings.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border text-center text-xs text-slate-500">
                    No deceptive design patterns or privacy traps identified.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scanResult.findings.map((finding: Finding, i: number) => (
                      <FindingCard key={i} finding={finding} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Privacy Policy Auditor */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <form
            onSubmit={handlePrivacyAnalyze}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-600">
                Paste Privacy Policy Excerpt
              </label>
              <textarea
                rows={6}
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                placeholder="Paste privacy policy text here..."
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-blue-500 leading-relaxed"
              />
              <span className="text-[11px] text-slate-400">
                Text length: {policyText.length} characters
              </span>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={policyLoading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
              >
                {policyLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>{policyLoading ? 'Auditing Policy...' : 'Audit Privacy Policy'}</span>
              </button>
            </div>
          </form>

          {policyError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{policyError}</span>
            </div>
          )}

          {policyResult && !policyLoading && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase text-blue-600">Executive Summary</span>
                <p className="text-xs text-slate-700 leading-relaxed bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
                  {policyResult.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Data Collected */}
                <div className="p-4 rounded-xl border bg-slate-50 space-y-2">
                  <span className="font-bold text-slate-900 block">1. What Data is Collected</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {policyResult.dataCollected?.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Collection Purposes */}
                <div className="p-4 rounded-xl border bg-slate-50 space-y-2">
                  <span className="font-bold text-slate-900 block">2. Why It Is Collected</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {policyResult.purposes?.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Third-Party Sharing */}
                <div className="p-4 rounded-xl border bg-slate-50 space-y-2">
                  <span className="font-bold text-slate-900 block">3. Who It May Be Shared With</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {policyResult.sharing?.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Tracking & Profiling */}
                <div className="p-4 rounded-xl border bg-slate-50 space-y-2">
                  <span className="font-bold text-slate-900 block">4. Tracking & Behavioral Profiling</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {policyResult.trackingIndicators?.map((item: string, idx: number) => (
                      <li key={idx}>Tracking: {item}</li>
                    ))}
                    {policyResult.profilingIndicators?.map((item: string, idx: number) => (
                      <li key={idx}>Profiling: {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Retention & Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-900 block">5. Retention Period</span>
                  <p className="text-slate-600">{policyResult.retention}</p>
                </div>

                <div className="p-4 rounded-xl border bg-slate-50 space-y-1">
                  <span className="font-bold text-slate-900 block">6. User Controls & Opt-Outs</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    {policyResult.userControls?.map((ctrl: string, idx: number) => (
                      <li key={idx}>{ctrl}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Concerns */}
              {policyResult.concerns?.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-amber-900 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Important Consumer Concerns</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-amber-800">
                    {policyResult.concerns.map((c: string, idx: number) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
