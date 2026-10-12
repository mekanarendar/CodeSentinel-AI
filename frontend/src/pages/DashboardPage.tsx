import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  FolderGit2,
  Code2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  FileCode,
  Clock,
  Plus,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { DashboardStats } from '../types/index.ts';
import { SeverityBadge } from '../components/common/SeverityBadge.tsx';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Security & Quality Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Aggregated metrics calculated directly from persisted code reviews and project audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/project-analyzer')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <FolderGit2 className="w-4 h-4 text-blue-500" />
            <span>Upload Archive</span>
          </button>
          <button
            onClick={() => onNavigate('/review')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Code Review</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>Overall Quality Score</span>
            <TrendingUp className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats ? `${stats.averageQualityScore}%` : '100%'}
            </span>
            <span className="text-xs text-emerald-500 font-semibold">
              {stats && stats.totalReviews > 0 ? 'Live average' : 'Baseline'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats ? stats.averageQualityScore : 100}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>Total Code Reviews</span>
            <Code2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats ? stats.totalReviews : 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {stats?.totalProjects || 0} active projects audited
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>Critical Vulnerabilities</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-extrabold text-red-500">
            {stats ? stats.criticalVulnerabilities : 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Requires immediate remediation
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>High & Medium Issues</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-500">
            {stats ? stats.highSeverityIssues + stats.mediumSeverityIssues : 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {stats ? stats.lowSeverityIssues : 0} low severity findings
          </p>
        </div>
      </div>

      {/* Languages & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Language Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-500" />
            <span>Language Distribution</span>
          </h3>

          {stats && Object.keys(stats.languages || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.languages).map(([lang, count]) => (
                <div key={lang} className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase font-semibold text-slate-700 dark:text-slate-300">
                    {lang}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {count} review{count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No language data yet. Submit your first code snippet to begin telemetry.
            </div>
          )}
        </div>

        {/* Recent Code Reviews */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-500" />
              <span>Recent Code Reviews</span>
            </h3>
            <button
              onClick={() => onNavigate('/history')}
              className="text-xs text-cyan-500 hover:underline font-semibold"
            >
              View All History
            </button>
          </div>

          {stats && stats.recentReviews && stats.recentReviews.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recentReviews.map((rev) => (
                <div
                  key={rev._id || rev.id}
                  onClick={() => onNavigate(`/review/${rev._id || rev.id}`)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {rev.title}
                      </span>
                      <SeverityBadge severity={rev.riskLevel} />
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span className="font-mono uppercase">{rev.language}</span>
                      <span>•</span>
                      <span>{rev.stats?.totalFindings || 0} findings</span>
                      <span>•</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-cyan-500">
                        {rev.overallScore}/100
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">Quality Score</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
                <Code2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                No Reviews Submitted Yet
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                Paste code directly into the Code Review Studio or upload a project archive to get automated security and quality analysis.
              </p>
              <button
                onClick={() => onNavigate('/review')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20"
              >
                Analyze Code Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
