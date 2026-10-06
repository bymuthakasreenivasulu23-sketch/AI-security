import React, { useEffect, useState } from 'react';
import { Shield, Save, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { DEFAULT_USER_SETTINGS, Settings } from '@trustlens/shared';
import { fetchUserSettings, updateUserSettings, getApiBaseUrl } from '../services/apiService.js';

export const Options: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_USER_SETTINGS });
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:5000/api');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const url = await getApiBaseUrl();
      setApiBaseUrl(url);

      const serverSettings = await fetchUserSettings();
      if (serverSettings) {
        setSettings(serverSettings);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);

    // Save API Base URL to chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.set({ apiBaseUrl });
    }

    try {
      await updateUserSettings(settings);
      setSaveStatus('Settings updated successfully.');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('Failed to update remote settings, saved locally.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleClearLocalData = () => {
    if (confirm('Are you sure you want to clear all locally cached scan results?')) {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.clear(() => {
          alert('Local scan cache cleared.');
        });
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 font-sans text-slate-800">
      <header className="flex items-center space-x-3 pb-4 border-b border-slate-200">
        <div className="p-2 bg-blue-600 rounded-xl text-white">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">TrustLens AI — Extension Options</h1>
          <p className="text-xs text-slate-500">Configure real-time privacy controls and detection settings</p>
        </div>
      </header>

      {saveStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{saveStatus}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Detection Preferences */}
        <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2">Analysis & Detection</h2>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800">Automatic Scanning</span>
              <p className="text-xs text-slate-500">
                Analyze pages when visiting to proactively flag deceptive patterns.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_scan}
              onChange={(e) => setSettings({ ...settings, auto_scan: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800">AI-Powered Deep Reasoning</span>
              <p className="text-xs text-slate-500">
                Use Gemini AI to analyze nuanced language, subtle coercion, and disclaimers.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.ai_analysis}
              onChange={(e) => setSettings({ ...settings, ai_analysis: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800">Show Low-Confidence Signals</span>
              <p className="text-xs text-slate-500">
                Display experimental or marginal findings with lower confidence scores.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.show_low_confidence}
              onChange={(e) => setSettings({ ...settings, show_low_confidence: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>
        </section>

        {/* Privacy & Safety Safeguards */}
        <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2">Privacy & Telemetry</h2>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800">Sensitive Page Protection</span>
              <p className="text-xs text-slate-500">
                Automatically pause analysis on banking, health, and password screens.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.sensitive_page_protection}
              onChange={(e) =>
                setSettings({ ...settings, sensitive_page_protection: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-semibold text-slate-800">Telemetry & Analytics</span>
              <p className="text-xs text-slate-500">
                Disabled by default. TrustLens never tracks your web browsing behavior.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.telemetry_enabled}
              onChange={(e) => setSettings({ ...settings, telemetry_enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-slate-800">Risk Notification Threshold</label>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {settings.risk_notification_threshold} / 100
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={settings.risk_notification_threshold}
              onChange={(e) =>
                setSettings({ ...settings, risk_notification_threshold: parseInt(e.target.value, 10) })
              }
              className="w-full accent-blue-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              Badge alert triggers when overall risk score meets or exceeds this threshold.
            </p>
          </div>
        </section>

        {/* Backend Connectivity */}
        <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2">Backend Connection</h2>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              API Base URL
            </label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 focus:outline-blue-500"
              placeholder="http://localhost:5000/api"
            />
            <p className="text-xs text-slate-500 mt-1">
              Location of your self-hosted TrustLens backend server.
            </p>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleClearLocalData}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Local Storage Cache</span>
          </button>

          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
