import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Clock,
  DollarSign,
  CheckSquare,
  Eye,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Lock,
  Cpu,
  Sparkles,
  ChevronRight,
  FileSearch,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI-Powered Real-Time Consumer Protection</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            See What Websites <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Really Want From You.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            TrustLens AI detects dark patterns and privacy traps before they influence your
            decisions. Built with privacy-first local DOM analysis and Google Gemini reasoning.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/demo"
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
            >
              <span>Try a Demo Scan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/scan"
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-sm shadow-2xs transition flex items-center justify-center space-x-2"
            >
              <FileSearch className="w-4 h-4 text-slate-600" />
              <span>Analyze Privacy Policy</span>
            </Link>
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Passwords & cards never inspected</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Local DOM filtering first</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Zero browsing telemetry</span>
            </span>
          </div>
        </div>
      </section>

      {/* Common Dark Pattern Showcase */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Common Deceptive Designs
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Patterns We Expose In Real Time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fake Urgency */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-blue-300 transition">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl w-fit">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Fake Urgency & Timers</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Countdowns that reset on refresh and deceptive "Only 2 left in stock!" alerts designed
              to manufacture false FOMO and rush purchases.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[11px] text-red-600">
              "Deal expires in 00:29! 14 people viewing this right now."
            </div>
          </div>

          {/* Hidden Fees */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-blue-300 transition">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl w-fit">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hidden Fees & Drip Pricing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Concealing mandatory ancillary fees, service charges, or automatic gratuities until
              the final credit card step.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[11px] text-orange-600">
              "Subtotal: $25.00 + $6.50 mandatory service fee applied"
            </div>
          </div>

          {/* Preselected Consent */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-blue-300 transition">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Preselected Consent</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Default-checked marketing checkboxes and asymmetrical cookie banners with bright
              "Accept All" buttons while burying "Decline".
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[11px] text-amber-600">
              "☑ Share my browsing preferences with advertising affiliates"
            </div>
          </div>

          {/* Privacy Tracking */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-blue-300 transition">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Third-Party Tracking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vague privacy clauses that grant broad behavioral profiling rights and persistent
              cross-site data brokerage.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[11px] text-purple-600">
              "Data may be shared with commercial sponsors for personalization."
            </div>
          </div>

          {/* Roach Motel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-blue-300 transition">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl w-fit">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Subscription Traps</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instant 1-click subscription signup paired with deliberately hidden or phone-call-only
              cancellation barriers (Roach Motel).
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[11px] text-rose-600">
              "Start Free 7-Day Trial (auto-renews annually at $129.00)"
            </div>
          </div>

          {/* Confirmshaming */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-blue-300 transition">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Confirmshaming</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Emotionally manipulative copy on decline buttons that shames you for opting out or
              protecting your budget.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[11px] text-blue-600">
              "No, I prefer paying full price and wasting money."
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 text-white py-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 rounded-3xl max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Engineered for Speed & Privacy
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold">How TrustLens AI Protects You</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 space-y-2 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-2xl font-black text-blue-400">1</span>
              <h4 className="font-bold text-sm">Local DOM Scan</h4>
              <p className="text-xs text-slate-400">
                Throttled MutationObserver extracts visible buttons, pricing, and checkboxes.
              </p>
            </div>

            <div className="p-4 space-y-2 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-2xl font-black text-blue-400">2</span>
              <h4 className="font-bold text-sm">Privacy Scrubbing</h4>
              <p className="text-xs text-slate-400">
                Passwords, form values, and personal identifiers are permanently excluded.
              </p>
            </div>

            <div className="p-4 space-y-2 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-2xl font-black text-blue-400">3</span>
              <h4 className="font-bold text-sm">Gemini AI Audit</h4>
              <p className="text-xs text-slate-400">
                Backend Gemini 3.8 Flash evaluates signals against strict dark-pattern guardrails.
              </p>
            </div>

            <div className="p-4 space-y-2 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-2xl font-black text-blue-400">4</span>
              <h4 className="font-bold text-sm">Deterministic Score</h4>
              <p className="text-xs text-slate-400">
                An explainable 0–100 risk score alerts you with clear actionable recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Ready to experience manipulative-free browsing?
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Try the interactive demo lab or load the Manifest V3 extension in Chrome today.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/demo"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition"
          >
            Launch Interactive Demo Lab
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition"
          >
            Go to User Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
};
