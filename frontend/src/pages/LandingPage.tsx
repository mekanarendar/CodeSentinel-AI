import React from 'react';
import {
  ShieldCheck,
  Zap,
  Lock,
  GitBranch,
  Terminal,
  CheckCircle2,
  ArrowRight,
  Cpu,
  FileCode2,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation */}
      <header className="h-16 border-b border-slate-800/80 px-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            CodeSentinel <span className="text-cyan-400">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('/login')}
            className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('/register')}
            className="text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg font-semibold shadow-md shadow-cyan-500/20 transition-all"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <Cpu className="w-3.5 h-3.5" /> Next-Gen Static & AI Code Intelligence
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl text-slate-100 leading-tight">
          Precision Code Reviews & <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
            Automated Security Auditing
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          CodeSentinel AI analyzes codebases across 12+ languages for critical vulnerabilities, logical defects, and performance anti-patterns with pre-flight secret redaction and transparent quality scoring.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => onNavigate('/register')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-7 py-3.5 rounded-xl font-bold shadow-lg shadow-cyan-500/25 transition-all text-base"
          >
            <span>Launch Code Reviewer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('/login')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all text-base"
          >
            Access Dashboard
          </button>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Pre-flight Secret Redactor</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Detects API keys, AWS credentials, and private keys before processing to prevent accidental transmission of confidential data.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <FileCode2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-File Project Analyzer</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload project ZIP archives with strict Zip Slip protection, automatic dependency filtering, and holistic cross-file defect synthesis.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Deterministic Quality Scoring</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Transparent, repeatable mathematical scoring based on verified findings and lines of code. No mysterious LLM hallucinations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        CodeSentinel AI • Enterprise-Grade Code Intelligence Platform
      </footer>
    </div>
  );
};
