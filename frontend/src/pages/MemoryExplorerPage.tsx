import React, { useState, useEffect } from 'react';
import { Database, Search, Brain, Tag, Layers, RefreshCw, Sparkles, Filter } from 'lucide-react';
import { MemoryFact } from '../types';
import { api } from '../api';

export const MemoryExplorerPage: React.FC = () => {
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchMemory = async () => {
    try {
      setLoading(true);
      const [statsRes, searchRes] = await Promise.all([
        api.getMemoryStats(),
        api.searchMemory(searchQuery, selectedBank === 'all' ? undefined : selectedBank),
      ]);
      setStats(statsRes);
      setFacts(searchRes.facts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, [selectedBank]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemory();
  };

  const banks = [
    { id: 'all', name: 'All Memory Banks' },
    { id: 'incident-memory', name: 'Incident Memory (8 facts)' },
    { id: 'organizational-memory', name: 'Organizational Runbooks (4 facts)' },
    { id: 'learning-memory', name: 'Learning Memory (4 facts)' },
    { id: 'team-preferences', name: 'Team Preferences (2 facts)' },
  ];

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Header */}
      <div className="rounded-3xl glass-panel-glow border border-brand-500/30 p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/40">
            Biomimetic Memory Store
          </span>
          <span className="text-xs text-slate-400">4 Isolated Banks with Retain & Recall</span>
        </div>
        <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
          Hindsight Memory Explorer
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
          Inspect extracted facts, entity relationships, tags, and consolidated observations.
          OpsMind uses 4-strategy retrieval (Semantic, BM25, Graph, Temporal) across these banks.
        </p>
      </div>

      {/* Top Banks Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'incident-memory', name: 'Incident Memory', facts: stats?.banks?.['incident-memory']?.fact_count ?? 8, mission: 'Symptoms, telemetry, errors, root causes', color: 'border-cyan-500/40' },
          { id: 'organizational-memory', name: 'Organizational Memory', facts: stats?.banks?.['organizational-memory']?.fact_count ?? 4, mission: 'Runbooks, architectural topology, SLAs', color: 'border-indigo-500/40' },
          { id: 'learning-memory', name: 'Learning Memory', facts: stats?.banks?.['learning-memory']?.fact_count ?? 4, mission: 'Verified resolutions, feedback, pattern graphs', color: 'border-emerald-500/40' },
          { id: 'team-preferences', name: 'Team Preferences', facts: stats?.banks?.['team-preferences']?.fact_count ?? 2, mission: 'Approval requirements, safety guardrails', color: 'border-amber-500/40' },
        ].map((b) => (
          <div key={b.id} className={`p-4 rounded-2xl glass-panel border ${b.color} space-y-1`}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">{b.name}</h4>
              <span className="font-mono text-xs font-bold text-brand-300">{b.facts} facts</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">{b.mission}</p>
          </div>
        ))}
      </div>

      {/* Search Bar & Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search facts by keyword, service, error code, or tag..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold cursor-pointer transition"
          >
            Search
          </button>
        </form>

        {/* Bank Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {banks.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBank(b.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedBank === b.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Facts List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Found {facts.length} facts in memory</span>
          <span className="font-mono">RRF 4-Strategy Multi-Ranking</span>
        </div>

        {facts.map((fact) => (
          <div
            key={fact.id}
            className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-brand-500/30 transition space-y-2.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {fact.id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 font-mono">
                  {fact.bank_id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                  Type: {fact.type}
                </span>
              </div>

              {fact.context && (
                <span className="text-[11px] text-slate-400 font-medium">
                  Context: {fact.context}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-100 font-mono leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              {fact.text}
            </p>

            {/* Tags */}
            {fact.tags && fact.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Tag className="w-3 h-3 text-slate-500" />
                {fact.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-900 text-slate-300 border border-slate-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
