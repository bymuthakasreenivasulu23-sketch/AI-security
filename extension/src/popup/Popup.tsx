import React, { useEffect, useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Settings as SettingsIcon,
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Finding, RiskLevel, SeverityLevel } from '@trustlens/shared';
import { sendAnalysisRequest } from '../services/apiService.js';

interface ScanData {
  scanId?: string;
  domain?: string;
  pageUrl?: string;
  pageTitle?: string;
  riskScore: number;
  riskLevel: RiskLevel;
  findingCount: number;
  summary?: string;
  findings: Finding[];
  isSensitivePage?: boolean;
  message?: string;
  analysisMode?: 'ai' | 'rule_based';
}

const LOADING_STEPS = [
  'Inspecting page...',
  'Checking consent controls...',
  'Looking for hidden pricing...',
  'Analyzing privacy signals...',
  'Preparing your report...',
];

export const Popup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);
  const [activeTabInfo, setActiveTabInfo] = useState<{ id?: number; url?: string; title?: string }>({});

  useEffect(() => {
    // Cycle loading progress steps when scanning
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 900);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    // Get active tab and load cached scan data if present
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          setActiveTabInfo({ id: tab.id, url: tab.url, title: tab.title });
          chrome.storage.local.get([`scan_${tab.id}`], (result) => {
            const cached = result[`scan_${tab.id}`];
            if (cached) {
              setScanData(cached);
            } else {
              // Trigger initial scan
              triggerScan(tab.id, false);
            }
          });
        }
      });
    } else {
      // Mock demo data for standalone dev viewing
      setScanData({
        riskScore: 72,
        riskLevel: 'high',
        findingCount: 3,
        summary: 'Detected 3 deceptive UI patterns designed to accelerate checkout.',
        findings: [
          {
            category: 'hidden_fees',
            title: 'Undisclosed Service Fee Added at Checkout',
            severity: 'high',
            confidence: 0.92,
            evidence: 'Mandatory service fee of $4.99 applied on final step',
            explanation: 'The fee was concealed during upfront browsing and item selection.',
            potentialImpact: 'You end up paying more than the advertised unit price.',
            recommendation: 'Check the total itemized cost before submitting payment.',
            sourceElement: '.fee-row',
          },
          {
            category: 'preselected_consent',
            title: 'Preselected Marketing & Tracking Consent',
            severity: 'medium',
            confidence: 0.95,
            evidence: 'Checkbox "Subscribe to partner marketing updates" pre-checked',
            explanation: 'Consent is assumed by default unless you explicitly uncheck the box.',
            potentialImpact: 'Your email and preferences will be shared with marketing vendors.',
            recommendation: 'Uncheck the box before submitting the form.',
            sourceElement: 'input[name="marketing_opt_in"]',
          },
          {
            category: 'fake_urgency',
            title: 'Expiring Countdown Timer Creates Artificial Pressure',
            severity: 'medium',
            confidence: 0.88,
            evidence: 'Banner: "Special offer expires in 04:19"',
            explanation: 'The timer resets upon reload and is not tied to actual inventory scarcity.',
            potentialImpact: 'Rushes your decision before comparing alternative vendors.',
            recommendation: 'Do not rush. Take your time to review the offer details.',
            sourceElement: 'div.countdown',
          },
        ],
      });
    }
  }, []);

  const triggerScan = async (tabId?: number, force = false) => {
    setLoading(true);
    setError(null);
    setLoadingStepIdx(0);

    try {
      if (typeof chrome !== 'undefined' && chrome.tabs && tabId) {
        // Request DOM signals from content script
        chrome.tabs.sendMessage(
          tabId,
          { type: 'ANALYZE_CURRENT_PAGE' },
          async (response) => {
            if (chrome.runtime.lastError || !response?.signals) {
              // Try fallback with tab url and title
              executeScanWithFallback(tabId, force);
              return;
            }

            try {
              const res = await sendAnalysisRequest({
                domain: response.signals.domain,
                pageUrl: response.signals.pageUrl,
                pageTitle: response.signals.pageTitle,
                pageType: response.signals.pageType,
                signals: response.signals,
                forceAnalysis: force,
              });

              if (res.isSensitivePage) {
                setScanData({
                  riskScore: 0,
                  riskLevel: 'low',
                  findingCount: 0,
                  findings: [],
                  isSensitivePage: true,
                  message: res.message,
                });
              } else if (res.success && res.data) {
                setScanData(res.data);
                chrome.storage.local.set({ [`scan_${tabId}`]: res.data });
              }
            } catch (err: any) {
              setError(err.message || 'Analysis failed. Could not reach backend.');
            } finally {
              setLoading(false);
            }
          }
        );
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred while scanning.');
      setLoading(false);
    }
  };

  const executeScanWithFallback = async (tabId: number, force: boolean) => {
    try {
      const url = activeTabInfo.url || 'https://example.com';
      const domain = new URL(url).hostname;
      const res = await sendAnalysisRequest({
        domain,
        pageUrl: url,
        pageTitle: activeTabInfo.title || domain,
        forceAnalysis: force,
      });

      if (res.isSensitivePage) {
        setScanData({
          riskScore: 0,
          riskLevel: 'low',
          findingCount: 0,
          findings: [],
          isSensitivePage: true,
          message: res.message,
        });
      } else if (res.success && res.data) {
        setScanData(res.data);
        chrome.storage.local.set({ [`scan_${tabId}`]: res.data });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to TrustLens backend service.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'moderate':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'mild':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'low':
      default:
        return 'bg-blue-100 text-blue-800 border border-blue-300';
    }
  };

  const openDashboard = () => {
    const url = scanData?.scanId
      ? `http://localhost:5173/scan/${scanData.scanId}`
      : 'http://localhost:5173/dashboard';
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  const openOptions = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('http://localhost:5173/settings', '_blank');
    }
  };

  return (
    <div className="w-[380px] min-h-[500px] bg-slate-50 font-sans text-slate-800 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">TrustLens AI</h1>
            <p className="text-[11px] text-blue-300 font-medium">Dark Pattern & Privacy Trap Detector</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
            Protected
          </span>
          <button
            onClick={openOptions}
            title="Extension Settings"
            className="p-1 text-slate-400 hover:text-white transition rounded hover:bg-slate-800"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="p-4 flex-1 overflow-y-auto space-y-3">
        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-800">{LOADING_STEPS[loadingStepIdx]}</p>
            <p className="text-xs text-slate-500">Analyzing local DOM signals securely</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 space-y-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <h3 className="font-semibold text-sm">Analysis Unavailable</h3>
            </div>
            <p className="text-xs text-red-600 leading-relaxed">{error}</p>
            <button
              onClick={() => triggerScan(activeTabInfo.id, false)}
              className="mt-2 text-xs font-semibold px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Sensitive Page Warning Banner */}
        {!loading && scanData?.isSensitivePage && (
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-slate-700">
              <Lock className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-sm">Sensitive Page Detected</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatic analysis is paused for your privacy. This page appears to handle banking,
              authentication, or personal records.
            </p>
            <button
              onClick={() => triggerScan(activeTabInfo.id, true)}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
            >
              Analyze Manually
            </button>
          </div>
        )}

        {/* Scan Results Card */}
        {!loading && !error && scanData && !scanData.isSensitivePage && (
          <>
            {/* Visual Risk Indicator Card */}
            <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between ${getRiskColor(scanData.riskLevel)}`}>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Overall Risk</span>
                  {scanData.analysisMode && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/80 border border-black/10">
                      {scanData.analysisMode === 'ai' ? 'AI Analysis' : 'Rule-Based Analysis'}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black">{scanData.riskScore}</span>
                  <span className="text-xs font-bold">/ 100</span>
                  <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-white/70 shadow-2xs">
                    {scanData.riskLevel}
                  </span>
                </div>
                <p className="text-xs opacity-90">
                  {scanData.findingCount === 0
                    ? 'No deceptive patterns detected'
                    : `${scanData.findingCount} potential issue${scanData.findingCount === 1 ? '' : 's'} identified`}
                </p>
              </div>

              <div className="p-2.5 rounded-full bg-white/80 shadow-2xs">
                {scanData.riskScore >= 60 ? (
                  <ShieldAlert className="w-7 h-7 text-orange-600" />
                ) : (
                  <ShieldCheck className="w-7 h-7 text-emerald-600" />
                )}
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                Detected Signals ({scanData.findings.length})
              </h2>

              {scanData.findings.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center py-6">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Clean Interface Detected</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    No deceptive consent, hidden fees, or fake countdowns were identified on this page.
                  </p>
                </div>
              ) : (
                scanData.findings.map((finding, idx) => {
                  const isExpanded = expandedFinding === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition hover:border-slate-300"
                    >
                      <button
                        onClick={() => setExpandedFinding(isExpanded ? null : idx)}
                        className="w-full text-left p-3 flex items-start justify-between space-x-2 focus:outline-hidden"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${getSeverityBadge(
                                finding.severity
                              )}`}
                            >
                              {finding.severity}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {Math.round(finding.confidence * 100)}% match
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-800 leading-snug">
                            {finding.title}
                          </h3>
                        </div>
                        <div className="text-slate-400 pt-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 text-xs space-y-2">
                          <div>
                            <span className="font-semibold text-slate-600 block text-[10px] uppercase">
                              Evidence
                            </span>
                            <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 font-mono text-[11px] break-words">
                              "{finding.evidence}"
                            </p>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-600 block text-[10px] uppercase">
                              Why it matters
                            </span>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {finding.explanation}
                            </p>
                          </div>

                          <div>
                            <span className="font-semibold text-slate-600 block text-[10px] uppercase">
                              Recommendation
                            </span>
                            <p className="text-blue-700 text-[11px] bg-blue-50/80 p-2 rounded border border-blue-100 leading-relaxed font-medium">
                              💡 {finding.recommendation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="p-3 bg-white border-t border-slate-200 flex items-center justify-between space-x-2">
        <button
          onClick={() => triggerScan(activeTabInfo.id, false)}
          disabled={loading}
          className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Scan Again</span>
        </button>

        <button
          onClick={openDashboard}
          className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center space-x-1.5 shadow-sm"
        >
          <span>View Details</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
};
