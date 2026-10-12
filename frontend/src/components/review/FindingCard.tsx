import React, { useState } from 'react';
import { Finding } from '../../types/index.ts';
import { SeverityBadge } from '../common/SeverityBadge.tsx';
import { AlertCircle, CheckCircle, ShieldAlert, ChevronDown, ChevronUp, Copy, Check, Terminal } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState(finding.verificationStatus || 'unverified');

  const copyFix = () => {
    if (finding.suggestedFix) {
      navigator.clipboard.writeText(finding.suggestedFix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden transition-all">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <SeverityBadge severity={finding.severity} />
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
            {finding.category}
          </span>
          {finding.filePath && (
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">
              {finding.filePath}:{finding.lineNumber || 1}
            </span>
          )}
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            {finding.title}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setStatus(e.target.value as any)}
            className="text-xs py-1 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="unverified">Unverified</option>
            <option value="confirmed">Confirmed Issue</option>
            <option value="false_positive">False Positive</option>
          </select>

          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 dark:border-slate-800 text-sm">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Description
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {finding.description}
            </p>
          </div>

          {finding.evidence && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>Evidence Code</span>
              </div>
              <div className="font-mono text-xs p-3 rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <code>{finding.evidence}</code>
              </div>
            </div>
          )}

          {finding.impact && (
            <div className="p-3 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs">
              <span className="font-semibold text-amber-600 dark:text-amber-400">Impact Assessment: </span>
              <span className="text-slate-700 dark:text-slate-300">{finding.impact}</span>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Remediation Recommendation
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
              {finding.recommendation}
            </p>
          </div>

          {finding.suggestedFix && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Suggested Code Fix
                </span>
                <button
                  onClick={copyFix}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Fix'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs p-3.5 rounded-lg bg-slate-900 text-emerald-300 border border-slate-800 overflow-x-auto">
                <code>{finding.suggestedFix}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
