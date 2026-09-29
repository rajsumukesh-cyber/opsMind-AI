import React, { useState } from 'react';
import { Settings, ShieldCheck, Database, Key, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api';

export const SettingsPage: React.FC<{ onRefreshData: () => void }> = ({ onRefreshData }) => {
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [hindsightUrl, setHindsightUrl] = useState('http://localhost:8888');
  const [groqKeyMasked, setGroqKeyMasked] = useState('gsk_••••••••••••••••••••••••••••••••••••••••');
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.seedMemory();
      setMessage('✅ Successfully seeded Hindsight memory banks with historical SRE incidents & runbooks.');
      onRefreshData();
    } catch (err: any) {
      setMessage(`❌ Failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset Hindsight memory back to initial state?')) return;
    setSeeding(true);
    try {
      await api.resetMemory();
      setMessage('✅ Memory reset to clean initial state.');
      onRefreshData();
    } catch (err: any) {
      setMessage(`❌ Failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-12">
      {/* Header */}
      <div className="rounded-3xl glass-panel-glow border border-brand-500/30 p-6 relative overflow-hidden">
        <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
          System Configuration & AI Models
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
          Manage Groq LLM model inference, Hindsight persistent memory connections, and demo database state.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-brand-950/60 border border-brand-500/40 text-xs text-brand-200">
          {message}
        </div>
      )}

      {/* Groq Configuration */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold">
            G
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white">Groq AI Inference Engine</h3>
            <p className="text-xs text-slate-400">High-speed SRE reasoning and tool function-calling</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
            >
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
              <option value="qwen/qwen3-32b">qwen/qwen3-32b</option>
              <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Groq API Key</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={groqKeyMasked}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 font-mono focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-bold">
                Configured via .env
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hindsight Memory Layer Configuration */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-brand-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white">Hindsight Biomimetic Memory Layer</h3>
            <p className="text-xs text-slate-400">Persistent multi-strategy storage (Incident, Org, Learning, Preferences)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Hindsight Endpoint URL</label>
            <input
              type="text"
              value={hindsightUrl}
              onChange={(e) => setHindsightUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Operational Mode</label>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Automatic Dual-Engine Mode</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                Cloud / Embedded Resilient
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Data Management */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="font-display font-bold text-sm text-white">Demo Data & Memory Controls</h3>
        <p className="text-xs text-slate-400">
          Reset memory or seed enterprise historical incidents, runbooks, and feedback events for live demos.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>Re-Seed Default Memories</span>
          </button>

          <button
            onClick={handleReset}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <span>Reset Memory to Clean Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
