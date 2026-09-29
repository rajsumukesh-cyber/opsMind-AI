import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, AlertTriangle, Brain, Sparkles, Printer, Download, Clock } from 'lucide-react';
import { PostMortem, Incident } from '../types';
import { api } from '../api';

interface PostMortemPageProps {
  incidentId?: string;
  incidents: Incident[];
}

export const PostMortemPage: React.FC<PostMortemPageProps> = ({
  incidentId,
  incidents,
}) => {
  const defaultId = incidentId || incidents.find((i) => i.status === 'RESOLVED')?.id || 'INC-8401';
  const [selectedId, setSelectedId] = useState<string>(defaultId);
  const [postmortem, setPostmortem] = useState<PostMortem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrGeneratePostMortem = async (id: string) => {
    try {
      setLoading(true);
      try {
        const res = await api.getPostMortem(id);
        setPostmortem(res);
      } catch (e) {
        // Generate if not present
        const genRes = await api.generatePostMortem(id);
        setPostmortem(genRes.postmortem);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      fetchOrGeneratePostMortem(selectedId);
    }
  }, [selectedId]);

  const targetIncident = incidents.find((i) => i.id === selectedId);

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Header */}
      <div className="rounded-3xl glass-panel-glow border border-brand-500/30 p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/40">
            SRE Executive Review
          </span>
          <span className="text-xs text-slate-400">Automated Post-Mortem & Preventative Learnings</span>
        </div>
        <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
          Incident Post-Mortem Report
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
          Synthesizes timeline events, telemetry signals, verified root cause, and how OpsMind updated Hindsight
          memory to inoculate the service against similar future outages.
        </p>
      </div>

      {/* Selector & Print Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400">Incident:</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono font-bold focus:outline-none focus:border-brand-500"
          >
            {incidents.map((i) => (
              <option key={i.id} value={i.id}>
                {i.id} — {i.title.slice(0, 45)}...
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Main Post-Mortem Document */}
      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
        {/* Document Header */}
        <div className="border-b border-white/10 pb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-brand-400">
              POST-MORTEM REPORT: {selectedId}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Status: RESOLVED & LEARNED
            </span>
          </div>
          <h2 className="text-xl font-display font-black text-white">
            {targetIncident?.title || 'Production Incident Post-Mortem'}
          </h2>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
            <span>Service: <strong className="text-slate-200">{targetIncident?.service}</strong></span>
            <span>Severity: <strong className="text-rose-400">{targetIncident?.severity}</strong></span>
            <span>Environment: <strong className="text-slate-200">{targetIncident?.environment}</strong></span>
            <span>Resolved By: <strong className="text-slate-200">{targetIncident?.resolved_by || 'SRE On-Call'}</strong></span>
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            1. Executive Summary
          </h3>
          <p className="text-xs text-slate-200 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 leading-relaxed">
            {postmortem?.executive_summary ||
              `Service ${targetIncident?.service} experienced critical latency spikes affecting downstream transactions. OpsMind utilized Hindsight memory to immediately correlate the telemetry with past incident patterns, allowing SREs to apply a verified rollback within 4 minutes.`}
          </p>
        </div>

        {/* Incident Timeline */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. Incident Chronology & Decision Timeline</span>
          </h3>
          <div className="space-y-2">
            {(postmortem?.timeline || [
              { time: 'T-00:00', event: 'Anomaly detected via Prometheus p99 latency alert' },
              { time: 'T+00:02', event: 'OpsMind Memory Retriever matched historical pattern in Hindsight' },
              { time: 'T+00:03', event: 'SRE On-Call approved rollback remediation plan' },
              { time: 'T+00:06', event: 'Service recovery verified; p99 normalized to 110ms' },
            ]).map((t, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs">
                <span className="font-mono text-cyan-300 font-bold w-20 shrink-0">{t.time}</span>
                <span className="text-slate-300">{t.event}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Root Cause Analysis */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            3. Confirmed Root Cause Analysis
          </h3>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono">
            {postmortem?.root_cause_analysis || targetIncident?.root_cause || 'Release v2.4.1 introduced unindexed join query on orders table, holding DB connection pool locks.'}
          </div>
        </div>

        {/* Preventative Action Items */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            4. Preventative Action Items & SRE Follow-ups
          </h3>
          <div className="space-y-2">
            {(postmortem?.preventative_actions || [
              'Add automated slow-query regression check to CI/CD pipeline',
              'Tune connection pool timeouts and configure automated alerting at 80% saturation',
              'Record learned failure pattern in Hindsight organizational-memory bank for future automated recall',
            ]).map((act, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hindsight Memory Impact */}
        <div className="p-5 rounded-2xl glass-panel-memory border border-indigo-500/40 space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              5. Hindsight Memory Impact
            </h4>
          </div>
          <p className="text-xs text-indigo-200 leading-relaxed">
            This incident resolution was analyzed by Agent 5 (Learning Agent) and committed as a permanent observation in{' '}
            <strong className="text-white">learning-memory</strong>. If {targetIncident?.service} experiences connection pool exhaustion or p99 spikes again, OpsMind will surface this postmortem and resolution with ~94% confidence.
          </p>
        </div>
      </div>
    </div>
  );
};
