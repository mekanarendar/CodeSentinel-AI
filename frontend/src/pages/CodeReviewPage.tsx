import React, { useState, useEffect } from 'react';
import {
  Code2,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Loader2,
  FileText,
  Sliders,
} from 'lucide-react';
import { CodeEditor } from '../components/editor/CodeEditor.tsx';
import { FindingCard } from '../components/review/FindingCard.tsx';
import { SeverityBadge } from '../components/common/SeverityBadge.tsx';
import { api } from '../services/api.ts';
import { Review, Project } from '../types/index.ts';

const SAMPLE_CODES: Record<string, string> = {
  typescript: `// Sample: Payment processor with vulnerabilities
import type { Request, Response } from 'express';

export async function processPayment(req: Request, res: Response) {
  const { userId, amount, cardNumber, cvv } = req.body;
  
  // Sensitive log exposing customer card data
  console.log("Processing payment for user " + userId + " with card: " + cardNumber);

  // Insecure raw query with direct string interpolation (SQL Injection)
  const query = "SELECT balance FROM accounts WHERE user_id = '" + userId + "'";
  const balance = await db.query(query);

  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  // Hardcoded secret fallback
  const paymentGatewayKey = "sk_live_94819482049182309124";

  // Silent swallow
  try {
    await executeTransfer(userId, amount, paymentGatewayKey);
  } catch (err) {
    // Unhandled exception suppressed
  }

  return res.json({ success: true });
}`,

  python: `# Sample Python service with eval & unsafe deserialization
import pickle
import os

def load_user_session(data_payload):
    # CRITICAL: Insecure deserialization via pickle
    session_obj = pickle.loads(data_payload)
    return session_obj

def run_custom_filter(filter_formula, record):
    # CRITICAL: Unsafe dynamic eval execution
    return eval(f"record.{filter_formula}")

DATABASE_PASSWORD = "SuperSecretDbPassword123!"
`,

  go: `package main

import (
    "database/sql"
    "fmt"
    "net/http"
)

func queryUser(w http.ResponseWriter, r *http.Request) {
    username := r.URL.Query().Get("username")
    // SQL injection vulnerability via Sprintf
    query := fmt.Sprintf("SELECT id, email FROM users WHERE username = '%s'", username)
    row := db.QueryRow(query)
    // ...
}
`,
};

export const CodeReviewPage: React.FC = () => {
  const [language, setLanguage] = useState('typescript');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState(SAMPLE_CODES.typescript);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Review | null>(null);
  const [redactionNotice, setRedactionNotice] = useState<string[] | null>(null);

  useEffect(() => {
    api.getProjects()
      .then(setProjects)
      .catch(() => {});
  }, []);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (SAMPLE_CODES[newLang]) {
      setCode(SAMPLE_CODES[newLang]);
    }
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Please provide code to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setRedactionNotice(null);

    try {
      const response = await api.analyzeCode({
        code,
        language,
        title: title || `${language.toUpperCase()} Analysis`,
        projectId: selectedProjectId || undefined,
      });

      setResult(response.review);
      if (response.redactionInfo?.secretsDetected) {
        setRedactionNotice(response.redactionInfo.secretTypes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze code snippet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <Code2 className="w-6 h-6 text-cyan-500" />
          <span>Code Review Studio</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Paste or write code in any of the 12+ supported languages for instant static and AI-powered security auditing.
        </p>
      </div>

      {/* Editor Controls */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Language selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="go">Go</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
              <option value="php">PHP</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
            </select>
          </div>

          {/* Project dropdown */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Link to Project (Optional)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-medium py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">No Project Assigned</option>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Snippet Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. auth-middleware.ts"
              className="text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 w-48"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCode('')}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Clear Editor"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleAnalyze}
            disabled={loading || !code.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Auditing Code...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Code Review</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Secret Redaction Alert if triggered */}
      {redactionNotice && redactionNotice.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-500 text-xs">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Pre-flight Redaction Applied: </span>
            <span>
              Detected sensitive secrets ({redactionNotice.join(', ')}). They were automatically masked prior to AI submission.
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Container */}
      <CodeEditor
        language={language}
        value={code}
        onChange={setCode}
        height="380px"
      />

      {/* Review Results */}
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
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>{result.stats.linesOfCodeAnalyzed} lines analyzed</span>
                <span>•</span>
                <span>Completed in {result.stats.executionTimeMs}ms</span>
                <span>•</span>
                <span>Score calculated deterministically</span>
              </p>
            </div>

            {/* Score circle / box */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="text-right">
                <div className="text-2xl font-black text-cyan-500">
                  {result.overallScore} / 100
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Quality Score
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Executive Summary
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              {result.summary}
            </p>
          </div>

          {/* Priorities & Positives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.recommendedPriorities && result.recommendedPriorities.length > 0 && (
              <div className="p-4 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-xs">
                <h4 className="font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Recommended Priorities</span>
                </h4>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                  {result.recommendedPriorities.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.positiveObservations && result.positiveObservations.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Positive Architectural Notes</span>
                </h4>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                  {result.positiveObservations.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Findings List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Detailed Findings ({result.findings.length})
              </h3>
              <span className="text-xs text-slate-500">
                {result.stats.criticalCount} Critical • {result.stats.highCount} High • {result.stats.mediumCount} Medium
              </span>
            </div>

            {result.findings.length > 0 ? (
              result.findings.map((finding) => (
                <FindingCard key={finding.id} finding={finding} />
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-xl text-xs text-slate-500">
                Zero security or quality defects identified. Code complies with configured rules.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
