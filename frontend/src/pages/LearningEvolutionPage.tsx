import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  BarChart2,
  RefreshCw,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { LearningEvolutionData, EvolutionMilestone } from '../types';
import { api } from '../api';

export const LearningEvolutionPage: React.FC = () => {
  const [data, setData] = useState<LearningEvolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<number>(5);

  const fetchEvolution = async () => {
    try {
      setLoading(true);
      const res = await api.getLearningEvolution();
      setData(res);
      if (res.current_stage) {
        setSelectedMilestone(res.current_stage >= 5 ? 5 : 3);
      }
    } catch (err) {
      console.error('Failed to load evolution data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvolution();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
        <p className="text-sm text-slate-300 font-medium">
          Loading Hindsight Learning Evolution Telemetry...
        </p>
      </div>
    );
  }

  const milestones = data?.milestones || [];
  const currentMilestone = milestones.find((m) => m.interaction === selectedMilestone) || milestones[2];
  const chartData = data?.progression_curve || [];

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl glass-panel-glow border border-brand-500/30 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-gradient-to-br from-brand-600/30 via-indigo-600/20 to-cyber-cyan/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/40">
                Core Innovation Showcase
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Learning Velocity
              </span>
            </div>
            <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
              Hindsight Learning Evolution Dashboard
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Demonstrates how OpsMind transitions from a generic assistant to a personalized organizational SRE expert
              as incidents occur, resolutions are verified, and feedback is stored.
            </p>
          </div>

          <div className="text-right p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              MTTR Reduction
            </span>
            <div className="text-3xl font-black font-display text-emerald-400">
              68m → 4m
            </div>
            <p className="text-[11px] text-emerald-300 font-semibold mt-0.5">
              -94.1% Resolution Time
            </p>
          </div>
        </div>
      </div>

      {/* 4 Interactive Milestones (Interaction 1, 3, 5, 10) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-400" />
            <span>Learning Progression Milestones (Click to Inspect)</span>
          </h3>
          <span className="text-xs text-slate-400">
            Current Stage: <strong className="text-brand-300">{data?.current_stage ?? 5}/10</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestones.map((m) => {
            const isSelected = selectedMilestone === m.interaction;
            return (
              <button
                key={m.interaction}
                onClick={() => setSelectedMilestone(m.interaction)}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-brand-400 bg-slate-900/90 shadow-xl shadow-brand-500/20 scale-[1.02]'
                    : 'glass-panel border-white/5 hover:border-slate-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-400 to-cyber-cyan" />
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
                    Interaction #{m.interaction}
                  </span>
                  <span className="text-xs font-bold text-cyber-cyan">
                    {m.confidence_pct}% Conf
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
                  {m.stage_name}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                  {m.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-400 font-mono">
                  <span>MTTR: {m.mttr_minutes}m</span>
                  <span>Recalls: {m.memory_recall_count}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Milestone Deep-Dive Comparison */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 font-bold">
              #{currentMilestone.interaction}
            </div>
            <div>
              <h4 className="font-display font-bold text-lg text-white">
                {currentMilestone.stage_name}
              </h4>
              <p className="text-xs text-slate-400">
                Personalization Level: <strong className="text-brand-300">{currentMilestone.personalization_level}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Confidence</span>
              <strong className="text-brand-300 text-sm">{currentMilestone.confidence_pct}%</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Avg MTTR</span>
              <strong className="text-cyan-300 text-sm">{currentMilestone.mttr_minutes} mins</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Recalled Memories</span>
              <strong className="text-emerald-400 text-sm">{currentMilestone.memory_recall_count}</strong>
            </div>
          </div>
        </div>

        {/* Behavioral Difference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
              Without Memory (Stateless AI Assistant)
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Generic diagnosis. Suggests exploratory restarts, generic health checks, and slow manual log audits.
              Has zero recollection of previous occurrences on this service.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              With Hindsight Memory (OpsMind Behavior)
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              "{currentMilestone.sample_behavior}"
            </p>
          </div>
        </div>
      </div>

      {/* Progression Charts (MTTR Reduction & Confidence Gain) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: MTTR Reduction Line Chart */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-display font-bold text-sm text-white">
                Mean Time to Resolution (MTTR) Improvement
              </h4>
              <p className="text-xs text-slate-400">Minutes to resolve incident as memories accumulate</p>
            </div>
            <span className="text-xs font-bold text-emerald-400">-94% MTTR</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="mttrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="interaction" stroke="#64748b" tickFormatter={(v) => `Int #${v}`} fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="mttr" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#mttrGradient)" name="MTTR (Minutes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Recommendation Confidence & Recalls */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-display font-bold text-sm text-white">
                Agent Confidence & Recalled Memory Facts
              </h4>
              <p className="text-xs text-slate-400">Confidence gain (%) and cross-bank memory matches</p>
            </div>
            <span className="text-xs font-bold text-brand-400">38% → 98%</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="interaction" stroke="#64748b" tickFormatter={(v) => `Int #${v}`} fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="confidence" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} name="Confidence (%)" />
                <Line type="monotone" dataKey="recalls" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Recalls Count" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Learning Events Table */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Hindsight Continuous Learning Events</span>
        </h4>
        <p className="text-xs text-slate-400">
          Chronological record of verified resolutions and engineer feedback synthesized into Hindsight memory:
        </p>

        <div className="space-y-3">
          {(data?.learning_events && data.learning_events.length > 0 ? data.learning_events : [
            {
              id: 'evt_1',
              incident_id: 'INC-8401',
              service: 'checkout-api',
              symptoms: 'p99 latency >4.8s, HikariCP pool lockup',
              root_cause: 'Unindexed query in deployment holding connection locks',
              resolution: 'Rollback deployment immediately; do NOT restart pods without rollback',
              feedback: 'Spot on. Rolled back in 4 minutes.',
              rating: 5,
              timestamp: '2026-09-27T10:20:00Z',
            },
            {
              id: 'evt_2',
              incident_id: 'INC-7922',
              service: 'auth-service',
              symptoms: 'Redis MOVED redirection errors post Sentinel failover',
              root_cause: 'JVM DNS cache TTL infinity pointing to old Redis master IP',
              resolution: 'Set networkaddress.cache.ttl=10 and execute rolling restart',
              feedback: 'Saved 1 hour of troubleshooting. DNS cache was indeed the culprit.',
              rating: 5,
              timestamp: '2026-09-25T14:15:00Z',
            }
          ]).map((evt: any) => (
            <div key={evt.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-300">{evt.incident_id}</span>
                  <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono text-[10px]">
                    {evt.service}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">★ {evt.rating}/5 Rating</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(evt.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                <div>
                  <strong className="text-slate-400 block text-[10px] uppercase">Root Cause:</strong>
                  <span>{evt.root_cause}</span>
                </div>
                <div>
                  <strong className="text-slate-400 block text-[10px] uppercase">Learned Fix:</strong>
                  <span className="text-emerald-300 font-medium">{evt.resolution}</span>
                </div>
              </div>

              {evt.feedback && (
                <div className="pt-2 border-t border-white/5 text-slate-400 italic">
                  " {evt.feedback} "
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
