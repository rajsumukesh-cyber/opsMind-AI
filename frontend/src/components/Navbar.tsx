import React from 'react';
import { Brain, Sparkles, Activity, ShieldCheck, Play, RefreshCw, Sun, Moon } from 'lucide-react';
import { DashboardStats } from '../types';

interface NavbarProps {
  stats: DashboardStats | null;
  onOpenDemo: () => void;
  onRefresh: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  onOpenDemo,
  onRefresh,
  darkMode,
  setDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel px-6 py-3 flex items-center justify-between">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyber-cyan flex items-center justify-center shadow-lg shadow-brand-500/25">
          <Brain className="w-6 h-6 text-white animate-pulse-subtle" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-xl tracking-tight text-white">
              OpsMind <span className="text-brand-400">AI</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              v1.0 Hackathon
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            "An AI Incident Response Agent That Remembers, Learns, and Gets Better."
          </p>
        </div>
      </div>

      {/* Real-time Status Telemetry */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Memory Layer Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-emerald-500/30">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 -ml-3.5" />
          <span className="text-xs font-medium text-slate-200">
            Hindsight Memory: <strong className="text-emerald-400">Active</strong>
          </span>
          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono">
            {stats?.total_facts_stored ?? 18} Facts
          </span>
        </div>

        {/* Evolution Stage Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-brand-500/30">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-medium text-slate-200">
            Learning Stage: <strong className="text-brand-300">{stats?.evolution_stage ?? 1}/10</strong>
          </span>
        </div>

        {/* MTTR Reduction */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/30">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-200">
            Avg MTTR: <strong className="text-cyan-300">{stats?.average_mttr_minutes.toFixed(1) ?? '6.4'} min</strong>
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">-94%</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* One-Click Hackathon Demo Mode */}
        <button
          onClick={onOpenDemo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 border border-brand-400/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current text-white" />
          <span>⚡ 1-Click Demo Mode</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          title="Refresh telemetry"
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/5 transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Dark/Light toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle theme"
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/5 transition cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-400" />}
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-300">
            SRE
          </div>
          <div className="hidden sm:block text-left text-xs">
            <p className="font-semibold text-slate-200 leading-tight">Lead On-Call</p>
            <p className="text-[10px] text-slate-400">Reliability Eng</p>
          </div>
        </div>
      </div>
    </header>
  );
};
