import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  SearchCode,
  Clock,
  Database,
  TrendingUp,
  GitCompare,
  History,
  FileText,
  Settings,
  Flame,
  Brain,
  Sparkles
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'new-incident'
  | 'investigation'
  | 'timeline'
  | 'memory'
  | 'evolution'
  | 'before-after'
  | 'history'
  | 'postmortem'
  | 'settings';

interface SidebarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  activeIncidentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  activeIncidentsCount,
}) => {
  const navItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-incident' as PageId, label: 'New Incident', icon: PlusCircle, highlight: true },
    { id: 'investigation' as PageId, label: 'AI Investigation', icon: SearchCode, badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined },
    { id: 'timeline' as PageId, label: 'Incident Timeline', icon: Clock },
    { id: 'memory' as PageId, label: 'Hindsight Memory', icon: Database },
    { id: 'evolution' as PageId, label: 'Learning Evolution', icon: TrendingUp, star: true },
    { id: 'before-after' as PageId, label: 'Before vs After', icon: GitCompare },
    { id: 'history' as PageId, label: 'Incident History', icon: History },
    { id: 'postmortem' as PageId, label: 'Post-Mortem', icon: FileText },
    { id: 'settings' as PageId, label: 'Settings & Models', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-white/10 glass-panel flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)]">
      {/* Navigation Links */}
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Agentic Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-600/30 text-brand-200 border border-brand-500/40 shadow-sm shadow-brand-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {/* Special Badges */}
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5 text-rose-400 fill-current" />
                  {item.badge}
                </span>
              )}

              {item.star && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  KEY DEMO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Persistent Hindsight Callout Footer */}
      <div className="p-4 m-3 rounded-2xl glass-panel-memory border border-indigo-500/30 text-left">
        <div className="flex items-center gap-2 mb-1.5">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white">Biomimetic Memory</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
          STORE → RECALL → REASON → ACT → FEEDBACK → LEARN
        </p>
        <div className="text-[10px] font-mono text-cyan-300/80 bg-slate-950/60 p-2 rounded-lg border border-cyan-500/20">
          "Every incident makes OpsMind smarter."
        </div>
      </div>
    </aside>
  );
};
