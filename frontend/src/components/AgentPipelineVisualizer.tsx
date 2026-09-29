import React from 'react';
import { Microscope, Brain, GitCommit, ListChecks, GraduationCap, CheckCircle } from 'lucide-react';

interface AgentPipelineVisualizerProps {
  currentStage?: 'analyzing' | 'retrieving' | 'investigating' | 'planning' | 'learning' | 'complete';
  isResolved?: boolean;
}

export const AgentPipelineVisualizer: React.FC<AgentPipelineVisualizerProps> = ({
  currentStage = 'complete',
  isResolved = false,
}) => {
  const agents = [
    {
      id: 1,
      name: 'Agent 1 — Incident Analyzer',
      role: 'Symptoms, severity, telemetry & blast radius',
      icon: Microscope,
      activeColor: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40',
      done: true,
    },
    {
      id: 2,
      name: 'Agent 2 — Memory Retriever',
      role: 'Queries Hindsight for historical incidents & runbooks',
      icon: Brain,
      activeColor: 'text-indigo-400 border-indigo-500/50 bg-indigo-950/40',
      done: true,
      hindsight: true,
    },
    {
      id: 3,
      name: 'Agent 3 — Root Cause Investigator',
      role: 'Combines current telemetry + recalled memories',
      icon: GitCommit,
      activeColor: 'text-amber-400 border-amber-500/50 bg-amber-950/40',
      done: true,
    },
    {
      id: 4,
      name: 'Agent 4 — Resolution Planner',
      role: 'Prioritized remediation + Human Approval guardrails',
      icon: ListChecks,
      activeColor: 'text-purple-400 border-purple-500/50 bg-purple-950/40',
      done: true,
    },
    {
      id: 5,
      name: 'Agent 5 — Learning Agent',
      role: 'Stores verified resolution & feedback into Hindsight',
      icon: GraduationCap,
      activeColor: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40',
      done: isResolved,
      hindsight: true,
    },
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>Agentic Pipeline Orchestration</span>
          <span className="text-[10px] font-normal text-slate-400">(5 Specialized Agents)</span>
        </h4>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-slate-300 font-medium">
            {isResolved ? 'All 5 Agents Completed' : 'Human Approval Required'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.id}
              className={`p-3 rounded-xl border transition-all ${
                agent.done
                  ? agent.activeColor
                  : 'border-slate-800 bg-slate-900/40 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-slate-900/60 border border-current/20">
                  <Icon className="w-4 h-4" />
                </div>
                {agent.done && (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {agent.hindsight && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-brand-500/30 text-brand-200 font-bold">
                    HINDSIGHT
                  </span>
                )}
              </div>
              <p className="text-xs font-bold leading-tight truncate text-slate-100">
                {agent.name}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {agent.role}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
