import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { DEFAULT_USER_SETTINGS, Settings } from '@trustlens/shared';
import {
  Shield,
  Save,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Lock,
  EyeOff,
  Cpu,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_USER_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load user settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);
    setError(null);
    try {
      const res = await api.updateSettings(settings);
      if (res.success) {
        setSaveStatus('Preferences saved successfully.');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save settings.');
    }
  };

  const handleClearHistory = async () => {
    if (
      !confirm(
        'Warning: This will permanently delete all scan records and stored findings. Are you sure?'
      )
    ) {
      return;
    }
    try {
      await api.clearUserData();
      alert('All stored scans and findings have been permanently cleared.');
    } catch (e: any) {
      alert(e.message || 'Failed to clear user data.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans text-slate-800">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security & Privacy Settings</h1>
        <p className="text-xs text-slate-500">
          Configure real-time detection parameters, AI reasoning, and data retention rules.
        </p>
      </div>

      {saveStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{saveStatus}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Detection Engine */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center space-x-2 border-b pb-3">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Detection Engine Configuration</h2>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800 block">Automatic Scanning</span>
              <p className="text-xs text-slate-500">
                Proactively inspect webpage DOM signals when navigating to new pages.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_scan}
              onChange={(e) => setSettings({ ...settings, auto_scan: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800 block">AI-Powered Deep Reasoning</span>
              <p className="text-xs text-slate-500">
                Leverage Google Gemini 3.8 Flash to interpret deceptive nuance and disclaimers.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.ai_analysis}
              onChange={(e) => setSettings({ ...settings, ai_analysis: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800 block">Show Low-Confidence Signals</span>
              <p className="text-xs text-slate-500">
                Include lower-confidence or experimental pattern detections in scan reports.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.show_low_confidence}
              onChange={(e) => setSettings({ ...settings, show_low_confidence: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>
        </section>

        {/* Privacy Safeguards */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center space-x-2 border-b pb-3">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Privacy Safeguards</h2>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800 block">Sensitive Page Protection</span>
              <p className="text-xs text-slate-500">
                Automatically pause analysis when on banking, healthcare, government, or login pages.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.sensitive_page_protection}
              onChange={(e) =>
                setSettings({ ...settings, sensitive_page_protection: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800 block">Telemetry & Analytics</span>
              <p className="text-xs text-slate-500">
                Disabled by default. TrustLens never transmits your browsing activity to remote trackers.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.telemetry_enabled}
              onChange={(e) => setSettings({ ...settings, telemetry_enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-slate-800">
                Risk Notification Threshold
              </label>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {settings.risk_notification_threshold} / 100
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="5"
              value={settings.risk_notification_threshold}
              onChange={(e) =>
                setSettings({ ...settings, risk_notification_threshold: parseInt(e.target.value, 10) })
              }
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-1">
              Trigger high-priority alerts when a page risk score meets or exceeds this value.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Data Retention Period (Days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={settings.retention_days}
              onChange={(e) =>
                setSettings({ ...settings, retention_days: parseInt(e.target.value, 10) || 30 })
              }
              className="w-32 text-xs p-2 rounded-lg border border-slate-300 focus:outline-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Automatically purge metadata for scans older than this timeframe.
            </p>
          </div>
        </section>

        {/* Data Erasure & Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={handleClearHistory}
            className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History & Delete All Data</span>
          </button>

          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
