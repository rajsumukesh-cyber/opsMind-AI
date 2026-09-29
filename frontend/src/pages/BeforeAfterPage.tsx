import React, { useState, useEffect } from 'react';
import { GitCompare, XCircle, CheckCircle2, ArrowRight, Brain, AlertTriangle, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { ModeComparison } from '../types';
import { api } from '../api';

export const BeforeAfterPage: React.FC = () => {
  const [comparison, setComparison] = useState<ModeComparison | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const res = await api.getComparison();
      setComparison(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  if (loading && !comparison) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
        <p className="text-sm text-slate-300 font-medium">
          Running side-by-side comparative diagnosis (Stateless vs Hindsight)...
        </p>
      </div>
    );
  }

  const s = comparison?.stateless;
  const h = comparison?.hindsight;

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Header */}
      <div className="rounded-3xl glass-panel-glow border border-brand-500/30 p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/40">
            Head-to-Head Comparison Mode
          </span>
          <span className="text-xs text-slate-400">Direct Architectural Contrast</span>
        </div>
        <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
          Before vs After: The Power of Hindsight Memory
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
          Evaluating the exact same production incident (checkout-api latency spike) across two AI paradigms:
          Stateless LLM vs OpsMind with Hindsight Memory.
        </p>
      </div>

      {/* Side-by-Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Traditional Stateless AI (BEFORE) */}
        <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 space-y-5 relative">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  WITHOUT MEMORY
                </h3>
                <span className="text-[11px] text-slate-400">Traditional Stateless AI Assistant</span>
              </div>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
              Confidence: {s?.confidence_score}%
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Recalled Historical Memories
              </span>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-rose-300 font-mono">
                0 past incidents matched ("Insufficient historical context")
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Diagnosed Root Cause
              </span>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                {s?.root_cause}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Recommended Remediation Plan
              </span>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <p className="font-semibold text-white">{s?.summary}</p>
                <p className="text-slate-400 italic">Action: {s?.first_action}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Estimated MTTR (Time to Resolution)
              </span>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-rose-400 font-bold font-mono">
                {s?.estimated_mttr}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Operational Deficiencies
              </span>
              <ul className="space-y-1.5">
                {s?.flaws.map((flaw, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{flaw}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: OpsMind with Hindsight (AFTER) */}
        <div className="glass-panel-memory p-6 rounded-3xl border-2 border-emerald-500/50 space-y-5 relative shadow-xl shadow-emerald-950/40">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  WITH HINDSIGHT MEMORY
                </h3>
                <span className="text-[11px] text-emerald-300 font-medium">OpsMind AI SRE Copilot</span>
              </div>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 font-mono">
              Confidence: {h?.confidence_score}%
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-1">
                Recalled Historical Memories
              </span>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-emerald-300 font-mono flex items-center justify-between">
                <span>Matched INC-8401 (94% similarity)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                  RRF Multi-Strategy
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-1">
                Diagnosed Root Cause
              </span>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-slate-100 font-medium">
                {h?.root_cause}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-1">
                Adapted Remediation Plan
              </span>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-1.5">
                <p className="font-semibold text-white">{h?.summary}</p>
                <p className="text-cyan-300 font-mono text-[11px]">Recommended: {h?.first_action}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-1">
                Estimated MTTR (Time to Resolution)
              </span>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-cyber-cyan font-bold font-mono">
                {h?.estimated_mttr} (Reduced from 68 mins)
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-2">
                Hindsight SRE Advantages
              </span>
              <ul className="space-y-1.5">
                {h?.advantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
