import React from 'react';
import { Severity, RiskLevel } from '../../types/index.ts';

interface SeverityBadgeProps {
  severity: Severity | RiskLevel;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/30',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    info: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    clean: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  };

  const style = styles[severity.toLowerCase()] || styles.info;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${style} ${className}`}
    >
      {severity}
    </span>
  );
};
