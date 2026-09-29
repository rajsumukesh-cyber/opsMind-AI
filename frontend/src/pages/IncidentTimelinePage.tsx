import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Brain, ShieldCheck, ArrowRight, Terminal } from 'lucide-react';
import { Incident } from '../types';

interface IncidentTimelinePageProps {
  incidents: Incident[];
  onNavigate: (page: any, incidentId?: string) => void;
}

export const IncidentTimelinePage: React.FC<IncidentTimelinePageProps> = ({
  incidents,
  onNavigate,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || 'INC-8401');
  const incident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const events = [
    {
      time: 'T-00:00:00',
      title: 'Prometheus Alert Fired: p99 Latency > 4.5s',
      desc: `Service ${incident?.service || 'checkout-api'} breached SLA threshold. HTTP 504 Gateway Timeouts detected.`,
      icon: AlertTriangle,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    },
    {
      time: 'T+00:01:12',
      title: 'Agent 1 (Incident Analyzer) Parsed Telemetry',
      desc: 'Extracted HikariCP connection pool lockup signature and flagged as SEV1 production outage.',
      icon: Terminal,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      time: 'T+00:01:45',
      title: 'Agent 2 (Memory Retriever) Queried Hindsight Banks',
      desc: 'Matched historical incident INC-8401 with 94% similarity. Recalled SRE Runbook v3.2.',
      icon: Brain,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
    {
      time: 'T+00:02:20',
      title: 'Agent 3 (Root Cause Investigator) Formulated Hypothesis',
      desc: 'Confirmed unindexed query in recent release holding connection pool handles. Confidence: 94%.',
      icon: ShieldCheck,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      time: 'T+00:03:05',
      title: 'Agent 4 (Resolution Planner) Requested SRE Approval',
      desc: 'Recommended immediate deployment rollback. SRE On-Call clicked Approve.',
      icon: ShieldCheck,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      time: 'T+00:06:40',
      title: 'Deployment Rolled Back & Telemetry Normalized',
      desc: 'HikariCP active connections dropped from 50 to 14. p99 response time returned to 110ms.',
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      time: 'T+00:08:15',
      title: 'Agent 5 (Learning Agent) Retained Experience into Hindsight',
      desc: 'SRE submitted 5-star feedback. Permanent observation stored for future automated recall.',
      icon: Brain,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
  ];

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Header */}
      <div className="rounded-3xl glass-panel-glow border border-brand-500/30 p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/40">
            Chronological Audit Log
          </span>
          <span className="text-xs text-slate-400">STORE → RECALL → REASON → ACT → FEEDBACK → LEARN</span>
        </div>
        <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
          Incident Response Timeline
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
          High-fidelity trace of alerts, multi-agent reasoning, Hindsight memory recall events, human decisions, and final learning retain.
        </p>
      </div>

      {/* Select Incident Dropdown */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-brand-400" />
          <div>
            <span className="text-xs font-semibold text-slate-300">Selected Incident:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white">{incident?.id}</span>
              <span className="text-xs text-slate-400">— {incident?.title}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('investigation', incident?.id)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition cursor-pointer"
        >
          <span>Open in Investigation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-brand-500 before:via-indigo-500 before:to-emerald-500">
        {events.map((evt, idx) => {
          const Icon = evt.icon;
          return (
            <div key={idx} className="relative flex items-start gap-4">
              <div
                className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 -ml-6.5 shadow-md ${evt.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 glass-panel p-4 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{evt.title}</h4>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {evt.time}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{evt.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
