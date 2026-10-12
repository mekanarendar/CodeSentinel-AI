import React from 'react';
import {
  LayoutDashboard,
  Code2,
  FolderGit2,
  History,
  GitCompare,
  FolderKanban,
  Settings,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, navigate }) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Code Review Studio', path: '/review', icon: Code2 },
    { label: 'Project Analyzer', path: '/project-analyzer', icon: FolderGit2 },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Review History', path: '/history', icon: History },
    { label: 'Review Comparison', path: '/compare', icon: GitCompare },
    { label: 'System & Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Platform Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 font-semibold border border-cyan-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-500' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 text-amber-500 font-semibold mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Security Guardrail</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
          Pre-flight scanner actively masks credentials and API tokens before AI processing.
        </p>
      </div>
    </aside>
  );
};
