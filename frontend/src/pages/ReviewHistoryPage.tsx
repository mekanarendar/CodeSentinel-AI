import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  GitCompare,
  Code2,
  FolderGit2,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Review } from '../types/index.ts';
import { SeverityBadge } from '../components/common/SeverityBadge.tsx';

interface ReviewHistoryPageProps {
  onNavigate: (path: string) => void;
}

export const ReviewHistoryPage: React.FC<ReviewHistoryPageProps> = ({ onNavigate }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadReviews = () => {
    setLoading(true);
    api.getReviews()
      .then(setReviews)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this code review? This action cannot be undone.')) {
      await api.deleteReview(id);
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== id));
    }
  };

  const filtered = reviews.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.summary.toLowerCase().includes(search.toLowerCase());
    const matchesLang = !languageFilter || r.language.toLowerCase() === languageFilter.toLowerCase();
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-cyan-500" />
            <span>Audit History & Archives</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse and inspect all historical code reviews, vulnerability reports, and project audits.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/compare')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 self-start"
        >
          <GitCompare className="w-4 h-4 text-cyan-500" />
          <span>Compare Reviews</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews by title or summary..."
            className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="text-xs font-medium py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Languages</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
            <option value="java">Java</option>
          </select>
        </div>
      </div>

      {/* Reviews Table / List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((rev) => {
              const id = (rev._id || rev.id) as string;
              return (
                <div
                  key={id}
                  onClick={() => onNavigate(`/review/${id}`)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      {rev.type === 'project' ? (
                        <FolderGit2 className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Code2 className="w-4 h-4 text-cyan-500" />
                      )}
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {rev.title}
                      </h4>
                      <SeverityBadge severity={rev.riskLevel} />
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                      {rev.summary}
                    </p>

                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span className="font-mono uppercase">{rev.language}</span>
                      <span>•</span>
                      <span>{rev.stats?.totalFindings || 0} findings</span>
                      <span>•</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-sm font-black text-cyan-500">
                        {rev.overallScore}/100
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">Score</div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(id, e)}
                      title="Delete Review"
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            {loading ? 'Loading reviews from database...' : 'No matching code reviews found.'}
          </div>
        )}
      </div>
    </div>
  );
};
