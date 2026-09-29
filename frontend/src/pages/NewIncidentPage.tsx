import React, { useState } from 'react';
import { PlusCircle, Terminal, AlertTriangle, Sparkles, Send, ArrowRight } from 'lucide-react';
import { api } from '../api';

interface NewIncidentPageProps {
  onIncidentCreated: (incidentId: string) => void;
}

export const NewIncidentPage: React.FC<NewIncidentPageProps> = ({ onIncidentCreated }) => {
  const [service, setService] = useState('checkout-api');
  const [severity, setSeverity] = useState('SEV1');
  const [environment, setEnvironment] = useState('production');
  const [title, setTitle] = useState('API Latency Spike on checkout-api after deployment');
  const [description, setDescription] = useState(
    'p99 latency spiked from 120ms to 4800ms. Endpoints failing with HTTP 504 Gateway Timeout.'
  );
  const [symptoms, setSymptoms] = useState('Elevated p99 latency >4.8s\nHikariCP pool saturation 50/50\nDownstream gateway timeouts');
  const [logs, setLogs] = useState(
    '2026-09-28T00:10:02Z [WARN] com.zaxxer.hikari.pool.HikariPool - pool-checkout - Connection is not available, request timed out after 30005ms.\n' +
    '2026-09-28T00:10:05Z [ERROR] c.o.c.CheckoutService - Transaction failed for cart 99241: HikariPool-1 - Connection timeout.\n' +
    '2026-09-28T00:10:12Z [WARN] ingress.nginx - upstream server temporarily disabled while connecting to upstream'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick preset templates
  const presets = [
    {
      label: '🛒 Checkout API Latency Spike',
      service: 'checkout-api',
      severity: 'SEV1',
      title: 'API Latency Spike on checkout-api after deployment',
      description: 'p99 latency spiked from 120ms to 4800ms. Endpoints failing with HTTP 504 Gateway Timeout.',
      symptoms: 'Elevated p99 latency >4.8s\nHikariCP pool saturation 50/50\nDownstream gateway timeouts',
      logs: '2026-09-28T00:10:02Z [WARN] com.zaxxer.hikari.pool.HikariPool - pool-checkout - Connection is not available, request timed out after 30005ms.\n2026-09-28T00:10:05Z [ERROR] c.o.c.CheckoutService - Transaction failed: HikariPool-1 - Connection timeout.'
    },
    {
      label: '🔑 Auth Redis Cluster Failover',
      service: 'auth-service',
      severity: 'SEV1',
      title: 'Session verification failure post Redis Sentinel failover',
      description: 'User login and token validation requests failing with HTTP 500 across all pods.',
      symptoms: 'HTTP 500 on /oauth/token\nJedisClusterMaxRedirectionsException\nMOVED cluster redirection loops',
      logs: 'redis.clients.jedis.exceptions.JedisClusterMaxRedirectionsException: Too many Cluster redirections?\nJedisMovedDataException: MOVED 12182 10.0.4.12:6379'
    },
    {
      label: '💳 Payment Webhook Deadlock',
      service: 'payment-gateway',
      severity: 'SEV2',
      title: 'Database ShareLock deadlock during payment webhook retry burst',
      description: 'Inbound Stripe webhook processing delayed by 15 minutes. PostgreSQL CPU utilization at 98%.',
      symptoms: 'Webhook queue backlog >8,500 messages\nPostgreSQL CPU at 98%\nTransaction deadlock exceptions',
      logs: 'postgresql[4192]: ERROR: deadlock detected\nProcess 4192 waits for ShareLock on transaction 8812; blocked by process 4199.'
    },
    {
      label: '🌐 Ingress Envoy Memory Leak',
      service: 'k8s-ingress',
      severity: 'SEV2',
      title: 'OOMKilled pods in ingress-nginx namespace',
      description: 'Intermittent connection resets and Envoy proxy restarts under sustained keep-alive traffic.',
      symptoms: 'CrashLoopBackOff on ingress pods\nOOMKilled exit code 137\nKeep-alive connection drops',
      logs: 'kernel: Out of memory: Kill process 124 (envoy) score 950\nkubelet: Container ingress-controller failed liveness probe'
    }
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setService(p.service);
    setSeverity(p.severity);
    setTitle(p.title);
    setDescription(p.description);
    setSymptoms(p.symptoms);
    setLogs(p.logs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const symptomList = symptoms
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await api.createIncident({
        service,
        severity,
        environment,
        title,
        description,
        symptoms: symptomList,
        logs,
      });

      if (res.incident?.id) {
        onIncidentCreated(res.incident.id);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit incident. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div>
        <h2 className="font-display font-black text-2xl text-white">
          Declare Production Incident
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Submit telemetry to dispatch the 5-Agent SRE Pipeline and initiate Hindsight memory recall.
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="p-4 rounded-2xl glass-panel border border-brand-500/20 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Quick Load Realistic DevOps Incident Presets:
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {presets.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-brand-900/40 text-slate-200 hover:text-brand-200 border border-slate-700/80 hover:border-brand-500/50 text-xs font-medium transition cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Service
            </label>
            <input
              type="text"
              required
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-brand-500 font-semibold"
            >
              <option value="SEV1">SEV1 — Critical (Customer Facing Outage)</option>
              <option value="SEV2">SEV2 — Major (Service Degraded / High Latency)</option>
              <option value="SEV3">SEV3 — Minor (Intermittent Degradation)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Environment
            </label>
            <input
              type="text"
              required
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Incident Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-brand-500 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Description & Context
          </label>
          <textarea
            rows={2}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-brand-500 leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Key Symptoms (One per line)
          </label>
          <textarea
            rows={3}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-brand-500 font-mono leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyber-cyan" />
              Raw Pod Logs / Stack Traces
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Used for error signature parsing</span>
          </label>
          <textarea
            rows={4}
            value={logs}
            onChange={(e) => setLogs(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono focus:outline-none focus:border-brand-500 leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-cyber-cyan hover:from-brand-500 hover:to-cyber-cyan text-white text-xs font-bold transition shadow-lg shadow-brand-500/25 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Dispatching Agents...' : 'Dispatch AI Investigation Pipeline'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
