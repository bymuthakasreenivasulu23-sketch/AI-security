import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { ScanResponse, Finding } from '@trustlens/shared';
import { RiskBadge } from '../components/RiskBadge.js';
import { FindingCard } from '../components/FindingCard.js';
import {
  ArrowLeft,
  Trash2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export const ScanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadScanDetails(id);
    }
  }, [id]);

  const loadScanDetails = async (scanId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getScanById(scanId);
      if (res.success && res.data) {
        setScan(res.data);
      } else {
        setError('Scan not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve scan report.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Permanently delete this scan report?')) return;
    setDeleting(true);
    try {
      await api.deleteScan(id);
      navigate('/history');
    } catch (err: any) {
      alert(err.message || 'Failed to delete scan.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading scan report...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Scan Report Unavailable</h2>
        <p className="text-xs text-slate-500">{error || 'Record does not exist.'}</p>
        <Link
          to="/history"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scan History</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* Back button & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scan History</span>
        </Link>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{deleting ? 'Deleting...' : 'Delete Scan'}</span>
        </button>
      </div>

      {/* Main Scan Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400">{scan.domain}</span>
            <h1 className="text-2xl font-black text-slate-900">{scan.pageTitle}</h1>
            <a
              href={scan.pageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span className="truncate max-w-md">{scan.pageUrl}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <RiskBadge score={scan.riskScore} level={scan.riskLevel} size="lg" />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span>Scanned on: {new Date(scan.createdAt).toLocaleString()}</span>
          <span>•</span>
          <span>Category Context: {scan.pageType}</span>
          <span>•</span>
          <span className="font-semibold text-slate-800">
            {scan.findingCount} finding{scan.findingCount === 1 ? '' : 's'} recorded
          </span>
        </div>
      </div>

      {/* Findings */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Evidence-Based Findings
        </h2>

        {!scan.findings || scan.findings.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Deceptive Patterns Detected</h3>
            <p className="text-xs text-slate-500">
              This webpage respects standard consumer opt-out and pricing disclosures.
            </p>
          </div>
        ) : (
          scan.findings.map((f: Finding & { id?: string }, idx: number) => (
            <FindingCard key={f.id || idx} finding={f} />
          ))
        )}
      </div>
    </div>
  );
};
