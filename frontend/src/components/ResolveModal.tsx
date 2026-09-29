import React, { useState } from 'react';
import { CheckCircle2, Star, Brain, Sparkles, Send } from 'lucide-react';

interface ResolveModalProps {
  incidentId: string;
  defaultRootCause?: string;
  defaultResolution?: string;
  onClose: () => void;
  onResolve: (rootCause: string, resolution: string, rating: number, feedback: string) => Promise<void>;
}

export const ResolveModal: React.FC<ResolveModalProps> = ({
  incidentId,
  defaultRootCause = '',
  defaultResolution = '',
  onClose,
  onResolve,
}) => {
  const [rootCause, setRootCause] = useState(defaultRootCause);
  const [resolution, setResolution] = useState(defaultResolution);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState(
    'OpsMind accurately identified the historical precedent and suggested a verified rollback that resolved the incident.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onResolve(rootCause, resolution, rating, feedback);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-emerald-500/40 shadow-2xl p-6 relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Resolve Incident & Retain Learning
            </h3>
            <p className="text-xs text-slate-400">
              Triggers Agent 5 (Learning Agent) to convert this resolution into Hindsight memory.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirmed Root Cause
            </label>
            <input
              type="text"
              required
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Effective Remediation / Resolution Applied
            </label>
            <textarea
              required
              rows={2}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* SRE Rating */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Diagnostic Quality Rating (Shapes Agent Confidence)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer transition hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-400 ml-2">
                {rating === 5 ? '5/5 (High Precision)' : `${rating}/5`}
              </span>
            </div>
          </div>

          {/* Engineer Feedback for Hindsight */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Engineer Feedback & Operational Notes
            </label>
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Info callout */}
          <div className="p-3 rounded-xl bg-brand-950/40 border border-brand-500/30 flex items-start gap-2.5">
            <Brain className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-brand-200/90 leading-relaxed">
              Upon resolving, OpsMind retains this resolution into <strong>Hindsight Learning Memory</strong>.
              Similar future incidents will recall this verified fix with higher confidence.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Storing Learning...' : 'Resolve & Update Hindsight'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
