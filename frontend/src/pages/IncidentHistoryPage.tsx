import React, { useState } from 'react';
import { History, Search, Filter, ArrowRight, Brain, CheckCircle2, Flame, Clock } from 'lucide-react';
import { Incident } from '../types';

interface IncidentHistoryPageProps {
  incidents: Incident[];
  onNavigate: (page: any, incidentId?: string) => void;
}

export const IncidentHistoryPage: React.FC<IncidentHistoryPageProps> = ({
  incidents,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || inc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Header */}
      <div className="rounded-3xl glass-panel-glow border border-brand-500/30 p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/40">
            Historical Incident Repository
          </span>
          <span className="text-xs text-slate-400">Indexed in Hindsight incident-memory</span>
        </div>
        <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
          Incident History & Post-Mortem Archive
        </h1>
        <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
          Review all resolved and active production incidents. Each resolved incident has contributed to OpsMind's
          collective operational intelligence.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by title, service, error signature, or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'RESOLVED', 'OPEN', 'INVESTIGATING'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-white/5 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Title & Context</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((inc) => {
                const isResolved = inc.status === 'RESOLVED';
                return (
                  <tr key={inc.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                      {inc.id}
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-semibold text-white truncate">{inc.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{inc.description}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-brand-300">
                      {inc.service}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.severity === 'SEV1'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isResolved
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(inc.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onNavigate('investigation', inc.id)}
                        className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition cursor-pointer"
                      >
                        Investigate
                      </button>
                      {isResolved && (
                        <button
                          onClick={() => onNavigate('postmortem', inc.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition cursor-pointer"
                        >
                          Postmortem
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
