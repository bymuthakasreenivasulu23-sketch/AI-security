import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { ScanResponse, RiskLevel } from '@trustlens/shared';
import { RiskBadge } from '../components/RiskBadge.js';
import {
  History,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [scans, setScans] = useState<ScanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    loadScans(page);
  }, [page]);

  const loadScans = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getScans(pageNum, 20);
      if (res.success && res.data) {
        setScans(res.data.scans || []);
        setPagination({
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scan entry?')) return;
    try {
      await api.deleteScan(id);
      setScans((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete scan.');
    }
  };

  // Filter scans
  const filteredScans = scans.filter((s) => {
    const matchesDomain =
      s.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pageTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = selectedRisk === 'all' || s.riskLevel.toLowerCase() === selectedRisk;
    return matchesDomain && matchesRisk;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Scan History</h1>
          <p className="text-xs text-slate-500">
            Audit logs of inspected domains. HTML is never retained for privacy.
          </p>
        </div>

        <button
          onClick={() => loadScans(page)}
          className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border rounded-lg transition flex items-center space-x-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by domain or title..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="text-xs py-2.5 px-3 rounded-xl border border-slate-300 bg-white focus:outline-blue-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="mild">Mild</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Scans List / Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border text-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
          <p className="text-xs">Loading records...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No matching scan entries</h3>
          <p className="text-xs text-slate-500">
            {searchQuery || selectedRisk !== 'all'
              ? 'Try modifying your filter or search terms.'
              : 'Scan pages with the extension or manual analyzer to view history here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Domain / Page</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Issues Found</th>
                  <th className="py-3 px-4">Scan Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 space-y-0.5">
                      <span className="font-bold text-slate-900 block">{scan.domain}</span>
                      <span className="text-slate-500 truncate max-w-sm block">{scan.pageTitle}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <RiskBadge score={scan.riskScore} level={scan.riskLevel} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {scan.findingCount} finding{scan.findingCount === 1 ? '' : 's'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/scan/${scan.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold transition"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      <button
                        onClick={() => handleDeleteScan(scan.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                        title="Delete scan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
