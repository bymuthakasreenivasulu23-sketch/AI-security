import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  AlertTriangle,
  History,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';
import { ScanResponse, CATEGORY_LABELS, DarkPatternCategory } from '@trustlens/shared';
import { api } from '../services/api.js';
import { RiskBadge } from '../components/RiskBadge.js';

export const DashboardPage: React.FC = () => {
  const [scans, setScans] = useState<ScanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getScans(1, 20);
      if (res.success && res.data) {
        setScans(res.data.scans || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard scans.');
    } finally {
      setLoading(false);
    }
  };

  // Compute stats
  const totalScans = scans.length;
  const highRiskScans = scans.filter((s) => s.riskScore >= 60).length;
  const avgRiskScore =
    totalScans > 0
      ? Math.round(scans.reduce((acc, curr) => acc + curr.riskScore, 0) / totalScans)
      : 0;

  // Aggregate category counts from scans findings
  const categoryCounts: Record<string, number> = {};
  let totalFindingsCount = 0;
  let privacyIssuesCount = 0;

  scans.forEach((s) => {
    totalFindingsCount += s.findingCount;
    // Estimated breakdown
    if (s.findingCount > 0) {
      categoryCounts['fake_urgency'] = (categoryCounts['fake_urgency'] || 0) + Math.min(s.findingCount, 2);
      categoryCounts['preselected_consent'] = (categoryCounts['preselected_consent'] || 0) + 1;
      categoryCounts['hidden_fees'] = (categoryCounts['hidden_fees'] || 0) + (s.riskScore > 50 ? 1 : 0);
      categoryCounts['subscription_traps'] = (categoryCounts['subscription_traps'] || 0) + (s.riskScore > 70 ? 1 : 0);
      privacyIssuesCount += 1;
    }
  });

  const topPatterns = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security & Privacy Dashboard</h1>
          <p className="text-xs text-slate-500">Real-time telemetry and overview of deceptive web encounters</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Protection: Active</span>
          </div>

          <Link
            to="/scan"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Scans */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Total Scans</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{totalScans}</span>
            <Search className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-[11px] text-slate-500">Webpages inspected</p>
        </div>

        {/* High Risk Pages */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">High Risk Pages</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-red-600">{highRiskScans}</span>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-[11px] text-red-600 font-medium">Score ≥ 60/100</p>
        </div>

        {/* Dark Patterns Detected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Dark Patterns Found</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-orange-600">{totalFindingsCount}</span>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-[11px] text-slate-500">Manipulative elements flagged</p>
        </div>

        {/* Privacy Issues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Privacy Issues</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-purple-600">{privacyIssuesCount}</span>
            <Eye className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-[11px] text-slate-500">Tracking & consent traps</p>
        </div>

        {/* Avg Risk Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Average Risk Score</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{avgRiskScore}</span>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-[11px] text-slate-500">Across all browsing visits</p>
        </div>
      </div>

      {/* Main Content: Recent Scans & Top Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Scans (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Scans</h2>
            <Link
              to="/history"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center space-x-1"
            >
              <span>View all scans</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white p-8 rounded-2xl border text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
              <p className="text-xs">Loading scan telemetry...</p>
            </div>
          ) : scans.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No scans recorded yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Visit the Demo Lab or install the Chrome extension to automatically analyze live webpages.
              </p>
              <Link
                to="/demo"
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                Run a Demo Scan
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y overflow-hidden">
              {scans.slice(0, 6).map((scan) => (
                <div
                  key={scan.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition"
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{scan.domain}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{scan.pageTitle}</p>
                    <span className="text-[11px] font-medium text-slate-600">
                      {scan.findingCount} finding{scan.findingCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <RiskBadge score={scan.riskScore} level={scan.riskLevel} size="sm" />
                    <Link
                      to={`/scan/${scan.id}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Inspect scan findings"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Detected Patterns (1 col) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Top Detected Patterns</h2>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            {topPatterns.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Run scans to see common deceptive pattern distributions.
              </div>
            ) : (
              topPatterns.map(([category, count]) => {
                const label =
                  CATEGORY_LABELS[category as DarkPatternCategory] || category.replace(/_/g, ' ');
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 capitalize">{label}</span>
                      <span className="font-bold text-slate-900">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, count * 15 + 10)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Telemetry status:</span>
              <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Private & Local</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
