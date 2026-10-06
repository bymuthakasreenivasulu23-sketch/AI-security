import React from 'react';
import { CATEGORY_LABELS, DARK_PATTERN_CATEGORIES, DarkPatternCategory } from '@trustlens/shared';
import { Shield, Sparkles, Cpu, Layers } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 font-sans text-slate-800">
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">About TrustLens AI</h1>
        <p className="text-xs text-slate-500">
          The next-generation defensive shield against deceptive UI/UX architecture and consumer manipulation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Deterministic Risk Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unlike opaque LLM systems that guess arbitrary risk scores, TrustLens uses a
            deterministic mathematical formula factoring finding severity, confidence multipliers,
            and manipulation intensity.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Gemini 3.8 Flash AI</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Google Gemini powers the contextual semantic analysis, detecting subtle confirmshaming,
            ambiguous cancellation terms, and misleading pricing disclaimers with speed and precision.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Prompt Injection Defense</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All webpage signals are treated as untrusted data. Strict system prompt boundaries and
            input neutralizers ensure adversarial instructions embedded in webpages cannot compromise the model.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
          Complete Deceptive Pattern Taxonomy ({DARK_PATTERN_CATEGORIES.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {DARK_PATTERN_CATEGORIES.map((cat: DarkPatternCategory, i: number) => (
            <div
              key={cat}
              className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex items-center space-x-2"
            >
              <span className="font-mono text-slate-400 text-[10px] w-5">{i + 1}.</span>
              <span className="font-semibold text-slate-800">{CATEGORY_LABELS[cat] || cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
