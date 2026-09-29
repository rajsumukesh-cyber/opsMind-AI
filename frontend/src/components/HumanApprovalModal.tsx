import React, { useState } from 'react';
import { ShieldAlert, Check, X, Edit3, AlertTriangle, Terminal } from 'lucide-react';
import { ActionItem } from '../types';

interface HumanApprovalModalProps {
  action: ActionItem | null;
  onClose: () => void;
  onDecision: (
    actionId: string,
    decision: 'approve' | 'reject' | 'modify' | 'escalate',
    notes: string,
    modifiedCommand?: string
  ) => void;
}

export const HumanApprovalModal: React.FC<HumanApprovalModalProps> = ({
  action,
  onClose,
  onDecision,
}) => {
  if (!action) return null;

  const [notes, setNotes] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [command, setCommand] = useState(action.command || '');

  const handleAction = (type: 'approve' | 'reject' | 'modify' | 'escalate') => {
    onDecision(action.id, type, notes, isModifying ? command : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl glass-panel rounded-2xl border border-amber-500/40 shadow-2xl p-6 relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Human-in-the-Loop Action Approval
            </h3>
            <p className="text-xs text-slate-400">
              OpsMind requires SRE sign-off before executing production command changes.
            </p>
          </div>
        </div>

        {/* Action Details */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Step {action.step}: {action.title}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              RISK: {action.risk}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-brand-400" />
                Target Command:
              </span>
              <button
                type="button"
                onClick={() => setIsModifying(!isModifying)}
                className="text-brand-400 hover:text-brand-300 text-xs font-medium cursor-pointer"
              >
                {isModifying ? 'Reset Command' : 'Edit Command'}
              </button>
            </div>

            {isModifying ? (
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-lg bg-black/60 border border-brand-500/50 text-xs font-mono text-cyan-300 focus:outline-none"
              />
            ) : (
              <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
                {command}
              </div>
            )}
          </div>

          {action.rationale && (
            <p className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-white/5">
              <strong className="text-brand-300">Agent Rationale:</strong> {action.rationale}
            </p>
          )}
        </div>

        {/* Engineer Notes */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            SRE On-Call Verification Notes (Recorded into Hindsight Learning)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Verified replica lag is <1s before executing rollback"
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* 4 Decision Actions: Approve, Reject, Modify, Escalate */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleAction('approve')}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Approve</span>
          </button>

          <button
            onClick={() => handleAction('reject')}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Reject</span>
          </button>

          <button
            onClick={() => handleAction('modify')}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Modify</span>
          </button>

          <button
            onClick={() => handleAction('escalate')}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Escalate</span>
          </button>
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          Dismiss modal without action
        </button>
      </div>
    </div>
  );
};
