import React, { useState } from 'react';
import {
  FolderGit2,
  UploadCloud,
  FileArchive,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Review } from '../types/index.ts';
import { FindingCard } from '../components/review/FindingCard.tsx';
import { SeverityBadge } from '../components/common/SeverityBadge.tsx';

export const ProjectAnalyzerPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Review | null>(null);
  const [projectStats, setProjectStats] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!projectName) {
        setProjectName(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) {
      setError('Please select a project ZIP archive to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProjectStats(null);

    try {
      const res = await api.analyzeProjectUpload(file, projectName || 'Project Audit');
      setResult(res.review);
      setProjectStats(res.projectStats);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze project archive.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <FolderGit2 className="w-6 h-6 text-cyan-500" />
          <span>Multi-File Project Analyzer</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload compressed project repositories (.zip) for automated cross-file dependency and security architecture review.
        </p>
      </div>

      {/* Upload Box */}
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-1/2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. backend-api-service"
              className="w-full text-sm py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="w-full sm:w-1/2 flex items-center gap-2 pt-6">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Zip Slip Defense Enabled (Max 25MB • Excludes node_modules, .git, binaries)</span>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-slate-50/50 dark:bg-slate-950/40">
          <input
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
            {file ? <FileArchive className="w-7 h-7 text-emerald-500" /> : <UploadCloud className="w-7 h-7" />}
          </div>
          {file ? (
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-white">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for audit
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-white">
                Click to browse or drop your project ZIP archive
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports archives up to 25MB containing source code
              </p>
            </div>
          )}
        </label>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleUploadAndAnalyze}
            disabled={loading || !file}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting & Auditing Repository...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Analyze Full Project</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Project Audit Results */}
      {result && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {result.title}
                </h2>
                <SeverityBadge severity={result.riskLevel} />
              </div>
              <p className="text-xs text-slate-500">
                {projectStats?.totalFilesAnalyzed || 0} source files analyzed ({projectStats?.excludedFiles || 0} vendor files excluded)
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-right">
              <div className="text-2xl font-black text-cyan-500">
                {result.overallScore} / 100
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Project Score
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Architectural Overview
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              {result.summary}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cross-File Findings ({result.findings.length})
            </h3>
            {result.findings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
