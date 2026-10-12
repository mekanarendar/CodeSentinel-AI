import React, { useEffect, useState } from 'react';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Review, ComparisonResult } from '../types/index.ts';
import { FindingCard } from '../components/review/FindingCard.tsx';

export const ReviewComparePage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [baselineId, setBaselineId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getReviews().then((list) => {
      setReviews(list);
      if (list.length >= 2) {
        setBaselineId((list[1]._id || list[1].id) as string);
        setTargetId((list[0]._id || list[0].id) as string);
      }
    });
  }, []);

  const handleCompare = async () => {
    if (!baselineId || !targetId) {
      setError('Please select both a baseline review and a comparison target.');
      return;
    }

    if (baselineId === targetId) {
      setError('Please choose two different reviews to compare.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.compareReviews(baselineId, targetId);
      setComparison(res);
    } catch (err: any) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <GitCompare className="w-6 h-6 text-cyan-500" />
          <span>Review Diff & Comparison Engine</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Compare any two audits to analyze defect resolution, newly introduced vulnerabilities, and quality score trajectories.
        </p>
      </div>

      {/* Selectors */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Baseline Review (Older Audit)
            </label>
            <select
              value={baselineId}
              onChange={(e) => setBaselineId(e.target.value)}
              className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select baseline review...</option>
              {reviews.map((r) => {
                const id = (r._id || r.id) as string;
                return (
                  <option key={id} value={id}>
                    {r.title} ({r.overallScore}% • {new Date(r.createdAt).toLocaleDateString()})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Comparison Target (Newer Audit)
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select comparison target...</option>
              {reviews.map((r) => {
                const id = (r._id || r.id) as string;
                return (
                  <option key={id} value={id}>
                    {r.title} ({r.overallScore}% • {new Date(r.createdAt).toLocaleDateString()})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleCompare}
            disabled={loading || !baselineId || !targetId}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 text-xs transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Computing Findings Diff...</span>
              </>
            ) : (
              <>
                <span>Execute Comparison</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Summary Metric Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Audit Delta Summary
              </h3>
              <p className="text-xs text-slate-500 max-w-xl">
                {comparison.summary}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div
                  className={`text-2xl font-black ${
                    comparison.scoreDelta >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {comparison.scoreDelta >= 0 ? `+${comparison.scoreDelta}` : comparison.scoreDelta}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Score Change
                </div>
              </div>

              <div className="text-center border-l border-slate-200 dark:border-slate-800 pl-6">
                <div className="text-2xl font-black text-emerald-500">
                  {comparison.resolvedFindings.length}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Resolved
                </div>
              </div>

              <div className="text-center border-l border-slate-200 dark:border-slate-800 pl-6">
                <div className="text-2xl font-black text-red-500">
                  {comparison.newFindings.length}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  New Issues
                </div>
              </div>
            </div>
          </div>

          {/* Resolved Issues Section */}
          {comparison.resolvedFindings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Resolved Defects ({comparison.resolvedFindings.length})</span>
              </h3>
              <div className="space-y-3">
                {comparison.resolvedFindings.map((f) => (
                  <FindingCard key={f.id} finding={f} />
                ))}
              </div>
            </div>
          )}

          {/* New Issues Section */}
          {comparison.newFindings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Newly Introduced Defects ({comparison.newFindings.length})</span>
              </h3>
              <div className="space-y-3">
                {comparison.newFindings.map((f) => (
                  <FindingCard key={f.id} finding={f} />
                ))}
              </div>
            </div>
          )}

          {/* Persistent Issues Section */}
          {comparison.persistentFindings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Persistent Findings ({comparison.persistentFindings.length})
              </h3>
              <div className="space-y-3">
                {comparison.persistentFindings.map((f) => (
                  <FindingCard key={f.id} finding={f} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
