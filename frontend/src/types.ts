export interface Incident {
  id: string;
  title: string;
  service: string;
  severity: string;
  environment: string;
  description: string;
  symptoms: string[];
  logs: string;
  metrics?: Record<string, any>;
  status: 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';
  created_at: string;
  resolved_at?: string;
  root_cause?: string;
  resolution?: string;
  resolved_by?: string;
  actions?: ActionItem[];
  feedback?: IncidentFeedback;
  analysis_cache?: PipelineAnalysis;
}

export interface ActionItem {
  id: string;
  incident_id: string;
  step: number;
  title: string;
  command: string;
  risk: 'SAFE' | 'MEDIUM' | 'HIGH';
  requires_approval: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'ESCALATED';
  notes?: string;
  modified_command?: string;
  created_at: string;
  acted_at?: string;
  rationale?: string;
}

export interface IncidentFeedback {
  id?: string;
  incident_id: string;
  rating: number;
  feedback_text: string;
  was_helpful: boolean;
  created_at?: string;
}

export interface WowMemoryItem {
  past_incident_title: string;
  similarity_score: string;
  similarity_pct: number;
  strategy: string;
  previous_root_cause: string;
  successful_resolution: string;
  document_id: string;
  relevance_rank: number;
}

export interface MemoryFact {
  id: string;
  text: string;
  type: string;
  bank_id: string;
  context?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  entities?: string[];
  confidence?: number;
  occurred_at?: string;
}

export interface RecallResultItem {
  fact: MemoryFact;
  score: number;
  strategy_scores?: Record<string, number>;
  explanation?: string;
}

export interface PipelineAnalysis {
  mode: 'hindsight' | 'stateless';
  execution_time_seconds: number;
  analysis: {
    service: string;
    severity: string;
    symptoms: string[];
    error_signatures: string[];
    blast_radius: string;
    environment: string;
    telemetry_summary: string;
  };
  memory: {
    similar_incidents_count: number;
    recalled_incidents: RecallResultItem[];
    recalled_runbooks: RecallResultItem[];
    recalled_learnings: RecallResultItem[];
    recalled_preferences: RecallResultItem[];
    wow_chain: WowMemoryItem[];
    has_memory: boolean;
  };
  investigation: {
    probable_root_cause: string;
    confidence_score: number;
    confidence_label: string;
    risk_level: string;
    evidence_chain: string[];
    memory_influence_summary: string;
    hypothesis: string;
  };
  plan: {
    mode: string;
    plan_type: string;
    estimated_mttr: string;
    summary: string;
    actions: ActionItem[];
    memory_grounding: string;
  };
}

export interface DashboardStats {
  active_incidents: number;
  resolved_incidents: number;
  total_incidents: number;
  average_mttr_minutes: number;
  memory_recall_count: number;
  learning_events_count: number;
  total_facts_stored: number;
  evolution_stage: number;
  recurring_problems: { service: string; count: number }[];
  remote_hindsight_active: boolean;
}

export interface EvolutionMilestone {
  interaction: number;
  stage_name: string;
  description: string;
  confidence_pct: number;
  mttr_minutes: number;
  memory_recall_count: number;
  similar_incidents_found: number;
  personalization_level: string;
  sample_behavior: string;
  achieved: boolean;
}

export interface LearningEvolutionData {
  current_stage: number;
  total_learning_events: number;
  learning_events: any[];
  milestones: EvolutionMilestone[];
  progression_curve: {
    interaction: number;
    mttr: number;
    confidence: number;
    recalls: number;
    verified_resolutions: number;
  }[];
  metrics_summary: {
    mttr_reduction_pct: number;
    confidence_gain_pct: string;
    total_recalls: number;
    total_facts_stored: number;
    observations_consolidated: number;
  };
}

export interface PostMortem {
  id: string;
  incident_id: string;
  executive_summary: string;
  timeline: { time: string; event: string }[];
  root_cause_analysis: string;
  preventative_actions: string[];
  created_at?: string;
}

export interface ModeComparison {
  incident_title: string;
  service: string;
  stateless: {
    mode: string;
    recalled_memories_count: number;
    confidence_score: number;
    root_cause: string;
    estimated_mttr: string;
    summary: string;
    first_action: string;
    flaws: string[];
  };
  hindsight: {
    mode: string;
    recalled_memories_count: number;
    confidence_score: number;
    root_cause: string;
    estimated_mttr: string;
    summary: string;
    first_action: string;
    advantages: string[];
  };
}
