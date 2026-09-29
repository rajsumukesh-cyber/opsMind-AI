import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Brain,
  Sparkles,
  TrendingDown,
  ArrowRight,
  Flame,
  ShieldCheck,
  PlusCircle,
  Database,
  Play
} from 'lucide-react';
import { DashboardStats, Incident } from '../types';

interface DashboardPageProps {
  stats: DashboardStats | null;
  incidents: Incident[];
  onNavigate: (page: any, incidentId?: string) => void;
  onOpenDemo: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  incidents,
  onNavigate,
  onOpenDemo,
}) => {
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED');

  return (
    <div className="space-y-6 text-left">
      {/* Hero Banner */}
      <div className="rounded-3xl glass-panel-glow border border-brand-500/30 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-gradient-to-br from-brand-600/30 via-indigo-600/20 to-cyber-cyan/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/40">
                Autonomous SRE Knowledge System
              </span>
              <span className="text-xs text-slate-400">Powered by Hindsight Memory</span>
            </div>
            <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
              OpsMind SRE Incident Command
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Every production incident enriches OpsMind's persistent memory layer. Next time a similar failure occurs,
              OpsMind recalls previous root causes and applies verified resolutions in minutes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('new-incident')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-600/30 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Incident</span>
            </button>
            <button
              onClick={onOpenDemo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/10 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-cyber-cyan" />
              <span>Hackathon Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Active Incidents */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-rose-500/30 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Active</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-white">
            {stats?.active_incidents ?? activeIncidents.length}
          </div>
          <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
            Requires Attention
          </p>
        </div>

        {/* Resolved Incidents */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Resolved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-white">
            {stats?.resolved_incidents ?? resolvedIncidents.length}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">
            Post-Mortems Stored
          </p>
        </div>

        {/* Average MTTR */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Avg MTTR</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-cyber-cyan">
            {stats?.average_mttr_minutes.toFixed(1) ?? '6.4'}m
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-0.5 font-bold">
            <TrendingDown className="w-3.5 h-3.5" /> -94% reduction
          </p>
        </div>

        {/* Memory Recalls */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-brand-500/30 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Memory Recalls</span>
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-white">
            {stats?.memory_recall_count ?? 14}
          </div>
          <p className="text-[11px] text-brand-300 mt-1 font-medium">
            Cross-Bank Queries
          </p>
        </div>

        {/* Learning Events */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Learning Events</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-amber-300">
            {stats?.learning_events_count ?? 6}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Observations Retained
          </p>
        </div>

        {/* Evolution Stage */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-purple-500/30 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Evolution</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-display text-purple-300">
            Stage {stats?.evolution_stage ?? 3}
          </div>
          <p className="text-[11px] text-purple-400 mt-1 font-medium">
            {stats?.evolution_stage && stats.evolution_stage >= 5 ? 'Historical Expert' : 'Pattern Recognition'}
          </p>
        </div>
      </div>

      {/* Main Grid: Active Incidents + Memory Banks Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Incidents Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base text-white">
                Live Incident Queue
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-white/5">
                {incidents.length} total
              </span>
            </div>

            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {incidents.map((inc) => {
              const isResolved = inc.status === 'RESOLVED';
              return (
                <div
                  key={inc.id}
                  onClick={() => onNavigate('investigation', inc.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                    isResolved
                      ? 'glass-panel border-white/5 hover:border-slate-700'
                      : 'bg-slate-900/90 border-brand-500/40 shadow-lg shadow-brand-500/10 hover:border-brand-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {inc.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {inc.service}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.severity === 'SEV1'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isResolved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {inc.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
                    {inc.title}
                  </h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {inc.description}
                  </p>

                  {/* Badges / Memories indicator */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[11px]">
                    <div className="flex items-center gap-2 text-indigo-300">
                      <Brain className="w-3.5 h-3.5 text-brand-400" />
                      <span>
                        {isResolved
                          ? 'Learning stored in Hindsight memory'
                          : 'Click to start AI Multi-Agent Investigation'}
                      </span>
                    </div>

                    <span className="text-brand-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition">
                      Investigate <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Hindsight Memory Banks & Recurring Problems */}
        <div className="space-y-6">
          {/* Hindsight 4-Bank Topology */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-400" />
                <h4 className="font-display font-bold text-sm text-white">
                  Hindsight Memory Banks
                </h4>
              </div>
              <button
                onClick={() => onNavigate('memory')}
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 cursor-pointer"
              >
                Explorer →
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'incident-memory', name: 'Incident Memory', desc: 'Historical symptoms, errors, root causes', facts: 8, color: 'text-cyan-400' },
                { id: 'organizational-memory', name: 'Organizational Memory', desc: 'Team runbooks, architecture constraints', facts: 4, color: 'text-indigo-400' },
                { id: 'learning-memory', name: 'Learning Memory', desc: 'Verified resolutions, feedback, pattern graphs', facts: 4, color: 'text-emerald-400' },
                { id: 'team-preferences', name: 'Team Preferences', desc: 'Safety guardrails, approval requirements', facts: 2, color: 'text-amber-400' },
              ].map((b) => (
                <div key={b.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${b.color}`}>{b.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {b.facts} facts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recurring Incident Subsystems */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Recurring Service Incidents</span>
            </h4>
            <p className="text-xs text-slate-400">
              Services where Hindsight provides the highest MTTR reduction via historical recall:
            </p>

            <div className="space-y-2 pt-1">
              {[
                { service: 'checkout-api', count: 3, reduction: '94% MTTR reduction' },
                { service: 'auth-service', count: 2, reduction: '88% MTTR reduction' },
                { service: 'payment-gateway', count: 2, reduction: '85% MTTR reduction' },
                { service: 'k8s-ingress', count: 1, reduction: '75% MTTR reduction' },
              ].map((item) => (
                <div key={item.service} className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{item.service}</span>
                    <p className="text-[10px] text-emerald-400 font-medium">{item.reduction}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">
                    {item.count} incidents
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
