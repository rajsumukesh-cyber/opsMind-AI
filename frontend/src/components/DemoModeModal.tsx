import React, { useState } from 'react';
import { Play, CheckCircle, ArrowRight, Brain, Zap, Clock, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../api';

interface DemoModeModalProps {
  onClose: () => void;
  onNavigateTo: (page: any) => void;
  onRefreshData: () => void;
}

export const DemoModeModal: React.FC<DemoModeModalProps> = ({
  onClose,
  onNavigateTo,
  onRefreshData,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [demoComplete, setDemoComplete] = useState(false);

  const demoSteps = [
    {
      num: 1,
      title: 'Seed Historical Incident Memory & Runbooks',
      desc: 'Initializes Hindsight memory banks with historical incidents, runbooks, and SRE policies.',
    },
    {
      num: 2,
      title: 'Submit Incident #1 (Unseen Deployment Failure)',
      desc: 'Simulates API Latency Spike on checkout-api. Agent performs initial cold investigation.',
    },
    {
      num: 3,
      title: 'Resolve Incident #1 & Submit Engineer Feedback',
      desc: 'SRE verifies rollback fix. Agent 5 (Learning Agent) retains this verified pattern into Hindsight.',
    },
    {
      num: 4,
      title: 'Submit Incident #5 (Recurring Latency Incident)',
      desc: 'Identical symptoms emerge 2 weeks later. Hindsight instantly recalls Incident #1!',
    },
    {
      num: 5,
      title: 'Reveal Improved Recommendation & Learning Curve',
      desc: 'Shows how MTTR dropped from 68 mins to 4 mins and confidence increased from 38% to 94%.',
    },
  ];

  const runStep = async (stepNum: number) => {
    setIsRunning(true);
    setCurrentStep(stepNum);

    try {
      if (stepNum === 1) {
        setLogs((prev) => [...prev, '⚡ [Step 1] Loading historical incidents & runbooks into Hindsight...']);
        await api.runDemoStep(1);
        setLogs((prev) => [...prev, '✅ Hindsight memory banks initialized with 18 facts & 5 verified runbooks.']);
      } else if (stepNum === 2) {
        setLogs((prev) => [...prev, '⚡ [Step 2] Submitting Incident #1: checkout-api latency spike...']);
        const res = await api.runDemoStep(2);
        setLogs((prev) => [
          ...prev,
          `✅ Incident #1 diagnosed without prior precedent. Initial confidence: ${res.result?.investigation?.confidence_score}%.`,
        ]);
      } else if (stepNum === 3) {
        setLogs((prev) => [...prev, '⚡ [Step 3] SRE applies verified rollback and submits 5-star feedback...']);
        await api.runDemoStep(3);
        setLogs((prev) => [
          ...prev,
          '✅ Agent 5 Learning Agent retained verified fix into Hindsight learning-memory bank.',
        ]);
      } else if (stepNum === 4) {
        setLogs((prev) => [...prev, '⚡ [Step 4] Submitting similar Incident #5 on checkout-api...']);
        const res = await api.runDemoStep(4);
        setLogs((prev) => [
          ...prev,
          `🌟 WOW MOMENT: OpsMind recalled Incident #1 with ${res.result?.investigation?.confidence_score}% confidence!`,
        ]);
      } else if (stepNum === 5) {
        setLogs((prev) => [...prev, '⚡ [Step 5] Analyzing Learning Evolution curve...']);
        setLogs((prev) => [
          ...prev,
          '🏆 Demo Complete: OpsMind demonstrated STORE → RECALL → REASON → ACT → FEEDBACK → LEARN.',
        ]);
        setDemoComplete(true);
      }
      onRefreshData();
    } catch (err: any) {
      setLogs((prev) => [...prev, `❌ Error: ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const runAutomatedDemo = async () => {
    setLogs(['🚀 Starting automated 60-second Hackathon demonstration...']);
    for (let s = 1; s <= 5; s++) {
      await runStep(s);
      await new Promise((r) => setTimeout(r, 1200));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl glass-panel-glow rounded-3xl border-2 border-brand-500/50 p-6 shadow-2xl relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyber-cyan flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-xl text-white">
                One-Click Hackathon Demo Mode
              </h3>
              <p className="text-xs text-brand-300 font-medium">
                Experience the 60-second "Every Incident Makes OpsMind Smarter" pitch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* 5 Step Progress Timeline */}
        <div className="space-y-2.5 mb-5">
          {demoSteps.map((step) => {
            const isDone = currentStep > step.num || (demoComplete && currentStep >= step.num);
            const isCurrent = currentStep === step.num && isRunning;

            return (
              <div
                key={step.num}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isDone
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                    : isCurrent
                    ? 'border-brand-500 bg-brand-950/40 text-brand-200 animate-pulse'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4" /> : step.num}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-100">{step.title}</h5>
                    <p className="text-[11px] text-slate-400">{step.desc}</p>
                  </div>
                </div>

                <button
                  disabled={isRunning}
                  onClick={() => runStep(step.num)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-brand-600 hover:bg-brand-500 text-white'
                  }`}
                >
                  {isDone ? 'Re-run' : isCurrent ? 'Running...' : 'Run Step'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Live Execution Logs */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 h-32 overflow-y-auto mb-5 space-y-1">
          {logs.length === 0 ? (
            <span className="text-slate-500">Click "Run Automated Demo" or trigger individual steps above.</span>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <button
            onClick={runAutomatedDemo}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-brand-500/30 disabled:opacity-50 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isRunning ? 'Running Demo Sequence...' : '▶ Run Automated 60s Demo'}</span>
          </button>

          {demoComplete && (
            <button
              onClick={() => {
                onClose();
                onNavigateTo('evolution');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition cursor-pointer"
            >
              <span>View Learning Evolution</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
