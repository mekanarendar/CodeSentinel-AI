import React, { useEffect, useState } from 'react';
import {
  Settings,
  User as UserIcon,
  Shield,
  Database,
  Cpu,
  Trash2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { api } from '../services/api.ts';
import { SystemHealth } from '../types/index.ts';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-cyan-500" />
          <span>System & Account Configuration</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your authenticated identity, database architecture state, and security engine policies.
        </p>
      </div>

      {/* User Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-cyan-500" />
          <span>Authenticated Developer Identity</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block mb-1">Developer Name</span>
            <span className="font-semibold text-slate-900 dark:text-white">{user?.name}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block mb-1">Primary Email</span>
            <span className="font-semibold text-slate-900 dark:text-white">{user?.email}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block mb-1">Role & Permissions</span>
            <span className="font-semibold text-cyan-500 uppercase">{user?.role}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-400 block mb-1">Authentication Standard</span>
            <span className="font-semibold text-emerald-500">JWT (Short-Lived 15m + Rotated Refresh)</span>
          </div>
        </div>
      </div>

      {/* Database & Runtime Diagnostics */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-500" />
          <span>Database & Environment Architecture</span>
        </h3>

        {health ? (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-400">Database Engine State</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {health.database.mode === 'mongodb' ? 'Active MongoDB Daemon' : 'Resilient In-Memory Storage Active'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-400">AI Review Provider</span>
              <span className="font-bold text-cyan-500">
                {health.capabilities.aiProvider}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-400">Pre-flight Secret Redactor</span>
              <span className="font-bold text-emerald-500">Active (Multi-Regex Pattern Engine)</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Loading diagnostic health probe...</div>
        )}
      </div>

      {/* Data Retention & Privacy Policies */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-500" />
          <span>Data Retention & Security Policies</span>
        </h3>
        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
          <li>Temporary project zip uploads are extracted in isolated memory buffers and cleaned immediately.</li>
          <li>Credentials and API keys are redacted prior to external AI transmission.</li>
          <li>Users retain absolute ownership and can delete projects and associated audit logs at any time.</li>
        </ul>
      </div>
    </div>
  );
};
