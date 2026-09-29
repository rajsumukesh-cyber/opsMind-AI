import {
  Incident,
  DashboardStats,
  LearningEvolutionData,
  PipelineAnalysis,
  PostMortem,
  ModeComparison,
  MemoryFact
} from './types';

const API_BASE = '/api';

export const api = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getRecentActivity(): Promise<any> {
    const res = await fetch(`${API_BASE}/dashboard/recent-activity`);
    if (!res.ok) throw new Error('Failed to fetch recent activity');
    return res.json();
  },

  // Incidents
  async listIncidents(service?: string): Promise<Incident[]> {
    const url = service ? `${API_BASE}/incidents?service=${encodeURIComponent(service)}` : `${API_BASE}/incidents`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncident(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch incident');
    return res.json();
  },

  async createIncident(data: Partial<Incident>): Promise<{ incident: Incident }> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create incident');
    return res.json();
  },

  async analyzeIncident(id: string, mode: 'hindsight' | 'stateless' = 'hindsight'): Promise<{ incident: Incident; analysis_result: PipelineAnalysis }> {
    const res = await fetch(`${API_BASE}/incidents/${id}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) throw new Error('Failed to analyze incident');
    return res.json();
  },

  async takeAction(incidentId: string, actionId: string, actionType: 'approve' | 'reject' | 'modify' | 'escalate', notes?: string, modifiedCommand?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_id: actionId,
        action_type: actionType,
        notes: notes || '',
        modified_command: modifiedCommand,
      }),
    });
    if (!res.ok) throw new Error('Failed to record action decision');
    return res.json();
  },

  async resolveIncident(incidentId: string, rootCause: string, resolution: string, resolvedBy?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        root_cause: rootCause,
        resolution,
        resolved_by: resolvedBy || 'SRE On-Call',
      }),
    });
    if (!res.ok) throw new Error('Failed to resolve incident');
    return res.json();
  },

  async submitFeedback(incidentId: string, rating: number, feedbackText: string, wasHelpful = true): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating,
        feedback_text: feedbackText,
        was_recommendation_helpful: wasHelpful,
      }),
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return res.json();
  },

  // Memory
  async getMemoryStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/memory/stats`);
    if (!res.ok) throw new Error('Failed to fetch memory stats');
    return res.json();
  },

  async searchMemory(query = '', bankId?: string): Promise<{ facts: MemoryFact[]; count: number }> {
    const url = new URL(`${API_BASE}/memory/search`, window.location.origin);
    if (query) url.searchParams.set('q', query);
    if (bankId) url.searchParams.set('bank_id', bankId);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to search memory');
    return res.json();
  },

  async seedMemory(): Promise<any> {
    const res = await fetch(`${API_BASE}/memory/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed memory');
    return res.json();
  },

  async resetMemory(): Promise<any> {
    const res = await fetch(`${API_BASE}/memory/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset memory');
    return res.json();
  },

  // Learning Evolution & Comparison
  async getLearningEvolution(): Promise<LearningEvolutionData> {
    const res = await fetch(`${API_BASE}/learning/evolution`);
    if (!res.ok) throw new Error('Failed to fetch learning evolution');
    return res.json();
  },

  async getComparison(): Promise<ModeComparison> {
    const res = await fetch(`${API_BASE}/learning/comparison`);
    if (!res.ok) throw new Error('Failed to fetch comparison');
    return res.json();
  },

  // Post-Mortem
  async getPostMortem(incidentId: string): Promise<PostMortem> {
    const res = await fetch(`${API_BASE}/postmortem/${incidentId}`);
    if (!res.ok) throw new Error('Failed to fetch postmortem');
    return res.json();
  },

  async generatePostMortem(incidentId: string): Promise<{ postmortem: PostMortem }> {
    const res = await fetch(`${API_BASE}/postmortem/generate/${incidentId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate postmortem');
    return res.json();
  },

  // Hackathon Demo Mode
  async runDemoStep(step: number): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/run-step/${step}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to run demo step ${step}`);
    return res.json();
  },

  async runFullDemo(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/full-scenario`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run full demo scenario');
    return res.json();
  },
};
