import React from 'react';
import { Brain, ArrowDown, CheckCircle2, History, Sparkles, Lightbulb, Target } from 'lucide-react';
import { WowMemoryItem } from '../types';

interface MemoryRecallAnimationProps {
  wowChain: WowMemoryItem[];
  currentService: string;
  currentRecommendation: string;
}

export const MemoryRecallAnimation: React.FC<MemoryRecallAnimationProps> = ({
  wowChain,
  currentService,
  currentRecommendation,
}) => {
  if (!wowChain || wowChain.length === 0) {
    return (
      <div className="glass-panel p-5 rounded-2xl border border-slate-700/50 text-center text-slate-400 text-xs">
        <Brain className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
        No historical precedents found for this pattern in Hindsight memory banks.
      </div>
    );
  }

  const memory = wowChain[0];

  return (
    <div className="relative overflow-hidden rounded-2xl glass-panel-memory border-2 border-indigo-500/40 p-6 shadow-2xl shadow-indigo-950/60">
      {/* Background glowing particles */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-44 h-44 bg-cyber-cyan/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-400/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyber-cyan flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Brain className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-lg text-white tracking-wide">
                OpsMind remembered...
              </h3>
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-500/30 text-brand-200 border border-brand-400/40">
                <Sparkles className="w-3 h-3 text-brand-300" />
                Hindsight Recall Match
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              Correlated current symptoms against organizational incident memory layers
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black font-display text-cyber-cyan text-glow-cyan">
            {memory.similarity_score}
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Pattern Similarity
          </p>
        </div>
      </div>

      {/* Visual Memory Provenance Chain: Past Incident -> Similarity -> Previous Root Cause -> Resolution -> Current Recommendation */}
      <div className="space-y-4">
        {/* Step 1: Past Incident */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 transition-all hover:border-brand-500/40">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-slate-300">
            <History className="w-4 h-4 text-brand-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                1. Historical Incident Recalled
              </span>
              <span className="text-xs font-mono text-slate-400">
                Doc ID: {memory.document_id}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-100 mt-1">
              {memory.past_incident_title}
            </p>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex justify-center -my-2">
          <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Step 2: Previous Root Cause */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 transition-all hover:border-amber-500/40">
          <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-600/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
            <Target className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              2. Identified Historical Root Cause
            </span>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed">
              {memory.previous_root_cause}
            </p>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex justify-center -my-2">
          <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Step 3: Previously Successful Resolution */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 transition-all hover:border-emerald-500/60">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-600/40 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                3. Proven Historical Resolution (Verified by SRE)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                MTTR 4 mins
              </span>
            </div>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed font-medium">
              {memory.successful_resolution}
            </p>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex justify-center -my-2">
          <div className="w-6 h-6 rounded-full bg-brand-900/80 border border-brand-400/40 flex items-center justify-center text-brand-300 animate-bounce">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Step 4: Adapted Current Recommendation */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-brand-900/70 via-indigo-900/60 to-slate-900/80 border-2 border-brand-500/50 shadow-lg shadow-brand-500/10">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0 mt-0.5 text-white">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyber-cyan">
                4. OpsMind Adapted Recommendation for {currentService}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/30 text-brand-200 font-bold">
                Tailored with Team Preferences
              </span>
            </div>
            <p className="text-sm text-white font-medium mt-1 leading-relaxed">
              {currentRecommendation || memory.successful_resolution}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
