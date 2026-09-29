import React, { useState, useEffect } from 'react';
import {
  Brain,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Activity,
  Sparkles,
  ArrowRight,
  RefreshCw,
  GitCompare,
  Check,
  X,
  Edit3,
  Flame,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import { Incident, ActionItem, PipelineAnalysis } from '../types';
import { api } from '../api';
import { MemoryRecallAnimation } from '../components/MemoryRecallAnimation';
import { AgentPipelineVisualizer } from '../components/AgentPipelineVisualizer';
import { HumanApprovalModal } from '../components/HumanApprovalModal';
import { ResolveModal } from '../components/ResolveModal';

interface InvestigationPageProps {
  incidentId: string;
  onNavigate: (page: any, incidentId?: string) => void;
  onRefreshData: () => void;
}

export const InvestigationPage: React.FC<InvestigationPageProps> = ({
  incidentId,
  onNavigate,
  onRefreshData,
}) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [analysis, setAnalysis] = useState<PipelineAnalysis | null>(null);
  const [mode, setMode] = useState<'hindsight' | 'stateless'>('hindsight');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Modals state
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const fetchIncidentAndAnalyze = async (targetMode = mode) => {
    try {
      setLoading(true);
      const inc = await api.getIncident(incidentId);
      setIncident(inc);

      // Trigger analysis
      setAnalyzing(true);
      const res = await api.analyzeIncident(incidentId, targetMode);
      setIncident(res.incident);
      setAnalysis(res.analysis_result);
    } catch (err) {
      console.error('Failed to load incident:', err);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (incidentId) {
      fetchIncidentAndAnalyze(mode);
    }
  }, [incidentId]);

  const handleModeSwitch = (newMode: 'hindsight' | 'stateless') => {
    setMode(newMode);
    fetchIncidentAndAnalyze(newMode);
  };

  const handleActionDecision = async (
    actionId: string,
    decision: 'approve' | 'reject' | 'modify' | 'escalate',
    notes: string,
    modifiedCommand?: string
  ) => {
    try {
      await api.takeAction(incidentId, actionId, decision, notes, modifiedCommand);
      // Refresh
      const updated = await api.getIncident(incidentId);
      setIncident(updated);
      onRefreshData();
    } catch (err) {
      console.error(err);
      alert('Failed to update action');
    }
  };

  const handleResolve = async (rootCause: string, resolution: string, rating: number, feedback: string) => {
    await api.resolveIncident(incidentId, rootCause, resolution);
    await api.submitFeedback(incidentId, rating, feedback, true);
    const updated = await api.getIncident(incidentId);
    setIncident(updated);
    onRefreshData();
  };

  if (loading && !incident) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
        <p className="text-sm text-slate-300 font-medium">
          Dispatching OpsMind Multi-Agent Investigation Pipeline...
        </p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-slate-400">Incident not found.</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isResolved = incident.status === 'RESOLVED';
  const wowChain = analysis?.memory?.wow_chain || [];
  const topRec = analysis?.plan?.actions?.[1]?.title || analysis?.plan?.actions?.[0]?.title || '';

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-slate-400">
              {incident.id}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-mono font-bold text-brand-300">
              {incident.service}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                incident.severity === 'SEV1'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {incident.severity}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isResolved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
              }`}
            >
              {incident.status}
            </span>
          </div>
          <h1 className="font-display font-black text-2xl text-white">
            {incident.title}
          </h1>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher Toggle: Hindsight vs Stateless */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-700 text-xs">
            <button
              onClick={() => handleModeSwitch('hindsight')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'hindsight'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Hindsight Mode</span>
            </button>
            <button
              onClick={() => handleModeSwitch('stateless')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'stateless'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Stateless Mode</span>
            </button>
          </div>

          {/* Resolve Button */}
          {!isResolved ? (
            <button
              onClick={() => setShowResolveModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolve & Learn</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('postmortem', incident.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/10 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-cyber-cyan" />
              <span>Post-Mortem</span>
            </button>
          )}
        </div>
      </div>

      {/* Agent Pipeline Visualizer */}
      <AgentPipelineVisualizer isResolved={isResolved} />

      {/* Mode Alert Banner if Stateless */}
      {mode === 'stateless' && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="text-white block font-bold">
              Comparing in Stateless Mode (No Historical Memory)
            </strong>
            OpsMind is diagnosing this incident without querying its Hindsight memory banks.
            Notice how confidence drops to ~38% and generic exploratory restarts are recommended.
            Switch back to <strong>Hindsight Mode</strong> to see context-aware precision.
          </div>
        </div>
      )}

      {/* WOW MOMENT: Memory Recall Animation (Only in Hindsight Mode) */}
      {mode === 'hindsight' && (
        <MemoryRecallAnimation
          wowChain={wowChain}
          currentService={incident.service}
          currentRecommendation={topRec}
        />
      )}

      {/* Main Grid: Current Incident Context & AI Investigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Current Incident Telemetry & Evidence */}
        <div className="space-y-5">
          {/* Incident Telemetry Card */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Incident Telemetry
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {incident.environment}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400">Description:</span>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {incident.description}
              </p>
            </div>

            {incident.symptoms && incident.symptoms.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400">Observed Symptoms:</span>
                <ul className="mt-1 space-y-1">
                  {incident.symptoms.map((s, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {incident.logs && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  Service Logs:
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-48 leading-relaxed">
                  {incident.logs}
                </pre>
              </div>
            )}
          </div>

          {/* Hindsight Cross-Bank Matches */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Hindsight Recalled Context</span>
            </h4>

            {mode === 'stateless' ? (
              <p className="text-xs text-slate-500 italic">
                Insufficient historical context (Stateless Mode active).
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">
                    Organizational Runbook
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {analysis?.memory?.recalled_runbooks?.[0]?.fact?.text?.slice(0, 140) ||
                      'Checkout API SRE Runbook v3.2: Verify active connection count in Grafana before restarting.'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                    Learning Memory (Verified Rule)
                  </span>
                  <p className="text-slate-300 text-[11px]">
                    {analysis?.memory?.recalled_learnings?.[0]?.fact?.text?.slice(0, 140) ||
                      'Always rollback release first when connection pool exhausts post-deploy; avoids upstream cascade.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Analysis & Actionable Remediation Plan */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Root Cause Investigation Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                  Agent 3 — Root Cause Investigator
                </span>
                <h3 className="font-display font-black text-lg text-white">
                  Diagnosed Probable Root Cause
                </h3>
              </div>

              {/* Confidence Meter */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xl font-black font-display text-white">
                    {analysis?.investigation?.confidence_score ?? 94}%
                  </div>
                  <p className="text-[10px] text-slate-400">Agent Confidence</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-300">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-brand-500/30">
              <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                {analysis?.investigation?.probable_root_cause ||
                  'HikariCP connection pool exhaustion triggered by recent deployment holding database locks.'}
              </p>
            </div>

            {/* Evidence Chain */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Grounding Evidence Chain:
              </span>
              <div className="space-y-2">
                {(analysis?.investigation?.evidence_chain || [
                  'Recalled Incident INC-8401 (94% similarity) had identical symptom profile',
                  'Connection pool saturation (50/50 active) directly matches post-deployment schema lock signature',
                  'Learning Memory confirms rolling back deployment immediately frees locked connection handles',
                ]).map((ev, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Remediation Plan with Human-in-the-Loop Actions */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  Agent 4 — Resolution Planner
                </span>
                <h3 className="font-display font-black text-lg text-white">
                  Prioritized Remediation Actions
                </h3>
              </div>

              <div className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                MTTR: {analysis?.plan?.estimated_mttr ?? '4 - 8 mins'}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {analysis?.plan?.summary ||
                'Targeted rollback & pool expansion adapted directly from successful resolution of INC-8401.'}
            </p>

            {/* Action Items List */}
            <div className="space-y-3 pt-2">
              {(incident.actions && incident.actions.length > 0
                ? incident.actions
                : analysis?.plan?.actions || []
              ).map((act, index) => {
                const isPending = act.status === 'PENDING';
                const isApproved = act.status === 'APPROVED';
                const isRejected = act.status === 'REJECTED';

                return (
                  <div
                    key={act.id || index}
                    className={`p-4 rounded-2xl border transition-all ${
                      isApproved
                        ? 'border-emerald-500/50 bg-emerald-950/20'
                        : isRejected
                        ? 'border-rose-500/30 bg-rose-950/20 opacity-60'
                        : act.requires_approval
                        ? 'border-amber-500/40 bg-slate-900/90 shadow-md shadow-amber-500/5'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {act.step}
                        </span>
                        <h5 className="text-xs font-bold text-white">{act.title}</h5>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            act.risk === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : act.risk === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {act.risk} RISK
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-500/30 text-emerald-200'
                              : isRejected
                              ? 'bg-rose-500/30 text-rose-200'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {act.status}
                        </span>
                      </div>
                    </div>

                    {/* Command */}
                    {act.command && (
                      <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto my-2">
                        {act.command}
                      </div>
                    )}

                    {act.rationale && (
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {act.rationale}
                      </p>
                    )}

                    {/* Human Approval Action Controls */}
                    {act.requires_approval && isPending && (
                      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/5">
                        <button
                          onClick={() => setSelectedAction(act)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Human Approval Required</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning Summary if Incident is Resolved */}
          {isResolved && (
            <div className="glass-panel-memory p-6 rounded-3xl border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-400" />
                <h4 className="font-display font-bold text-sm text-white">
                  Agent 5 (Learning Agent) Outcome
                </h4>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Incident was successfully mitigated and resolved. SRE feedback and verified actions have been retained into{' '}
                <strong>Hindsight Learning Memory</strong>. Future incidents on {incident.service} will recognize this failure mode immediately.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Human Approval Modal */}
      {selectedAction && (
        <HumanApprovalModal
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          onDecision={handleActionDecision}
        />
      )}

      {/* Resolve Incident & Feedback Modal */}
      {showResolveModal && (
        <ResolveModal
          incidentId={incident.id}
          defaultRootCause={analysis?.investigation?.probable_root_cause}
          defaultResolution={topRec}
          onClose={() => setShowResolveModal(false)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
};
