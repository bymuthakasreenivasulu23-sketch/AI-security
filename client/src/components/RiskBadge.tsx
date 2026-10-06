import React from 'react';
import { RiskLevel, SeverityLevel } from '@trustlens/shared';
import { ShieldAlert, ShieldCheck, AlertTriangle, Shield } from 'lucide-react';

interface RiskBadgeProps {
  score?: number;
  level: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  score,
  level,
  size = 'md',
  showScore = true,
}) => {
  const normLevel = level.toLowerCase();

  const getStyles = () => {
    switch (normLevel) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'mild':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'low':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getIcon = () => {
    if (normLevel === 'critical' || normLevel === 'high') {
      return <ShieldAlert className="w-4 h-4 flex-shrink-0" />;
    }
    if (normLevel === 'moderate' || normLevel === 'mild') {
      return <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
    }
    return <ShieldCheck className="w-4 h-4 flex-shrink-0" />;
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-sm px-3 py-1 space-x-1.5',
    lg: 'text-base px-4 py-2 space-x-2 font-bold',
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-lg border font-semibold tracking-wide uppercase ${getStyles()} ${sizeClasses}`}
      role="status"
      aria-label={`Risk level: ${normLevel}${score !== undefined ? `, Score: ${score}/100` : ''}`}
    >
      {getIcon()}
      {showScore && score !== undefined && (
        <span className="font-mono font-bold mr-1">{score}</span>
      )}
      <span>{normLevel}</span>
    </div>
  );
};

export const SeverityBadge: React.FC<{ severity: SeverityLevel | string }> = ({
  severity,
}) => {
  const s = severity.toLowerCase();
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  return (
    <span
      className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
        styles[s] || styles.low
      }`}
    >
      {s}
    </span>
  );
};
