import React from 'react';
import { Shield, Lock, EyeOff, FileCheck, CheckCircle2 } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans text-slate-800">
      <div className="space-y-2 border-b pb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Privacy-First Architecture</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          TrustLens AI Privacy Charter
        </h1>
        <p className="text-xs text-slate-500">
          Our technical guarantees regarding data minimization, security, and consumer rights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rule 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero Password or Sensitive Input Inspection</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Password inputs, payment credit card fields, authentication tokens, and private messages
            are filtered in local memory before any analysis occurs. TrustLens will never read or
            transmit your credentials.
          </p>
        </div>

        {/* Rule 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Local DOM Extraction First</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            We never send full webpage HTML trees over the network. Only anonymized, structured
            signals (e.g. button labels, cookie checkboxes, countdown timers) are processed.
          </p>
        </div>

        {/* Rule 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Telemetry OFF by Default</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            TrustLens does not track or profile your browsing activity. Telemetry is strictly
            opt-in and turned OFF by default in all extension installations.
          </p>
        </div>

        {/* Rule 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Full User Data Erasure Rights</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            You retain absolute control over your scan history. With one click in the Settings page,
            all stored scan metadata and findings are permanently removed from the database.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3">
        <h2 className="text-base font-bold flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span>Sensitive Page Auto-Pause Shield</span>
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          When TrustLens detects that you have navigated to a banking portal, healthcare account,
          government identity system, or password manager, automatic background analysis is
          immediately suspended. Analysis is only performed if you explicitly choose to run a manual
          scan.
        </p>
      </div>
    </div>
  );
};
