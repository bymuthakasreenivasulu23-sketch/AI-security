import React, { useState } from 'react';
import { Finding, FeedbackType } from '@trustlens/shared';
import { SeverityBadge } from './RiskBadge.js';
import {
  AlertCircle,
  HelpCircle,
  Info,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Check,
  Code,
} from 'lucide-react';
import { api } from '../services/api.js';

interface FindingCardProps {
  finding: Finding & { id?: string };
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const [feedbackSent, setFeedbackSent] = useState<FeedbackType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFeedback = async (type: FeedbackType) => {
    if (!finding.id || feedbackSent) return;
    setSubmitting(true);
    try {
      await api.submitFeedback(finding.id, type);
      setFeedbackSent(type);
    } catch (e) {
      console.warn('Feedback failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 hover:border-slate-300 transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <SeverityBadge severity={finding.severity} />
            <span className="text-xs text-slate-500 font-medium">
              Confidence: {Math.round(finding.confidence * 100)}%
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              {finding.category}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 leading-snug">
            {finding.title}
          </h3>
        </div>

        {/* User Feedback */}
        {finding.id && (
          <div className="flex items-center space-x-1 flex-shrink-0">
            {feedbackSent ? (
              <span className="text-xs text-emerald-600 font-medium flex items-center space-x-1 bg-emerald-50 px-2 py-1 rounded">
                <Check className="w-3.5 h-3.5" />
                <span>Feedback sent</span>
              </span>
            ) : (
              <>
                <button
                  onClick={() => handleFeedback('accurate')}
                  disabled={submitting}
                  title="Accurate finding"
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFeedback('false_positive')}
                  disabled={submitting}
                  title="False positive"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Evidence */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
          <Code className="w-3.5 h-3.5" />
          <span>Extracted Evidence</span>
        </span>
        <p className="text-xs font-mono text-slate-800 break-words bg-white p-2 rounded border border-slate-200">
          "{finding.evidence}"
        </p>
      </div>

      {/* Grid: Why it matters & Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 space-y-1">
          <span className="font-bold text-slate-700 flex items-center space-x-1">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Why this matters</span>
          </span>
          <p className="text-slate-600 leading-relaxed">{finding.explanation}</p>
        </div>

        <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-1">
          <span className="font-bold text-amber-800 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Potential consumer harm</span>
          </span>
          <p className="text-amber-900 leading-relaxed">{finding.potentialImpact}</p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="p-3.5 bg-blue-50/80 rounded-lg border border-blue-200 text-xs flex items-start space-x-2.5">
        <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-blue-900">What you can do</span>
          <p className="text-blue-800 leading-relaxed">{finding.recommendation}</p>
        </div>
      </div>

      {finding.sourceElement && (
        <div className="text-[11px] text-slate-400 font-mono">
          Element Selector: <span className="text-slate-600">{finding.sourceElement}</span>
        </div>
      )}
    </article>
  );
};
