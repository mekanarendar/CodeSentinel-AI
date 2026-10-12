import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileCode,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Review, Severity } from '../types/index.ts';
import { SeverityBadge } from '../components/common/SeverityBadge.tsx';
import { FindingCard } from '../components/review/FindingCard.tsx';

interface ReviewDetailPageProps {
  reviewId: string;
  onNavigate: (path: string) => void;
}

export const ReviewDetailPage: React.FC<ReviewDetailPageProps> = ({ reviewId, onNavigate }) => {
  const [review, setReview] = useState<Review | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReview(reviewId)
      .then(setReview)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [reviewId]);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading audit report...</div>;
  }

  if (!review) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm text-slate-500">Review not found or access denied.</p>
        <button
          onClick={() => onNavigate('/history')}
          className="text-xs text-cyan-500 font-semibold hover:underline"
        >
          Return to History
        </button>
      </div>
    );
  }

  const exportHtml = () => {
    window.open(`/api/v1/reviews/${reviewId}/export?format=html`, '_blank');
  };

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(review, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit-${review.title.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredFindings = review.findings.filter((f) => {
    if (filterSeverity === 'all') return true;
    return f.severity.toLowerCase() === filterSeverity.toLowerCase();
  });

  return (
    <div className="space-y-8">
      {/* Back button & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('/history')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Audit History</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={exportJson}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={exportHtml}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export HTML Report</span>
          </button>
        </div>
      </div>

      {/* Review Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {review.title}
            </h1>
            <SeverityBadge severity={review.riskLevel} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="font-mono uppercase font-semibold text-slate-700 dark:text-slate-300">
              {review.language}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(review.createdAt).toLocaleString()}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {review.stats?.executionTimeMs || 0}ms execution
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-3xl font-black text-cyan-500">
              {review.overallScore} / 100
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Quality Score
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Executive Summary
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {review.summary}
        </p>
      </div>

      {/* Findings Filters */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Findings Breakdown ({filteredFindings.length})
        </h3>

        <div className="flex items-center gap-2">
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterSeverity === sev
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </div>
  );
};
