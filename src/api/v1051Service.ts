import { api } from './client'

export type DataQuality = 'REAL' | 'INSUFFICIENT' | 'STALE' | 'PROXY'

export interface AlphaLabSummary {
  generated: number
  executed: number
  evaluated: number
  win_rate: number
  gross_return: number
  net_return: number
  after_cost_return: number
  after_turnover_return: number
  data_quality: DataQuality
  avg_execution_slippage: number
  avg_expected_return: number
  avg_actual_return: number
  avg_pnl_pct: number
  avg_confidence: number
}

export interface AlphaLabBucketBreakdown {
  bucket: string
  count: number
  avg_actual_return: number
}

export interface AlphaLabSnapshot {
  lookback_days: number
  summary: AlphaLabSummary
  origin_breakdown?: Array<{
    mode: string
    count: number
    ratio: number
  }>
  signal_integrity?: {
    sample_size: number
    origin_breakdown: Array<{
      mode: string
      count: number
      ratio: number
    }>
    origin_known: number
    origin_known_ratio: number
    canonical_payload_ready: number
    canonical_payload_ratio: number
    native_transition_ready: number
    native_transition_ratio: number
  }
  rollout?: {
    stage: string
    flags: Record<string, boolean>
    recommended_next_step?: string
  }
  current_regime: {
    regime: string
    confidence: number
    classification_date: string | null
    reasoning?: string | null
  } | null
  regime_tape: Array<{
    id: number
    regime: string
    confidence: number
    classification_date: string | null
  }>
  strategy_scorecards: Array<{
    strategy_id: string
    strategy_name: string
    style?: string | null
    generated: number
    evaluated: number
    win_rate: number
    gross_return: number
    net_return: number
    after_cost_return: number
    after_turnover_return: number
    data_quality: DataQuality
    avg_expected_return: number
    avg_actual_return: number
    alpha_gap: number
    avg_confidence: number
    origin_breakdown?: Array<{
      mode: string
      count: number
      ratio: number
    }>
    regime_breakdown: AlphaLabBucketBreakdown[]
    capacity_breakdown: AlphaLabBucketBreakdown[]
  }>
  decay_monitor: Array<{
    strategy_id: string
    strategy_name: string
    recent_win_rate: number
    previous_win_rate: number
    win_rate_delta: number
    recent_alpha_gap: number
    previous_alpha_gap: number
    recent_sample_size: number
    previous_sample_size: number
    data_quality: DataQuality
  }>
  shadow_book: {
    total: number
    closed: number
    win_rate: number
    false_reject_rate: number
    missed_alpha_pct: number
    avoided_loss_pct: number
    protection_benefit_pct: number
    avg_pnl_pct: number
    rejection_breakdown: Array<{
      reason: string
      count: number
      avg_pnl_pct: number
    }>
  }
  recent_signals: Array<{
    signal_id: string
    symbol: string
    direction: string
    status: string
    strategy_name?: string | null
    confidence: number
    expected_return: number
    actual_return?: number | null
    origin_mode?: string
    signal_payload_version?: string | null
    signal_transition_count?: number
    data_quality: DataQuality
    generated_at: string | null
  }>
}

export interface GovernanceSnapshot {
  rollout?: {
    stage: string
    flags: Record<string, boolean>
    recommended_next_step?: string
  }
  funnel: {
    discovery: number
    limited?: number
    retired?: number
    paper: number
    shadow_live: number
    challenger: number
    production: number
  }
  pipeline: Array<{
    strategy_id: string
    name: string
    style?: string | null
    version: number
    is_active: boolean
    last_run_status?: string | null
    last_run_at?: string | null
    run_count: number
    stage: string
    governance_note?: string | null
    evidence_chain: {
      backtest: boolean
      paper: boolean
      shadow: boolean
      execution: boolean
      calibration: boolean
      rollback_ready: boolean
    }
    promotion_blockers: string[]
    rollback_suggestion: string
    hard_gate_ready?: boolean
    hit_rate: number
    avg_signal_strength: number
    scanned_total: number
    hits: number
  }>
  hard_gate_candidates?: number
  experiments: Array<{
    id: number
    experiment_name: string
    param_key: string
    status: string
    start_date?: string | null
    end_date?: string | null
    control_win_rate?: number | null
    treatment_win_rate?: number | null
    p_value?: number | null
    passed_significance: boolean
    auto_applied: boolean
  }>
  insight_summary: {
    total: number
    validated: number
    active: number
  }
  recent_insights: Array<{
    id: number
    insight_type: string
    title: string
    summary: string
    confidence: number
    validated: boolean
    active: boolean
    created_at?: string | null
  }>
  recent_runs: Array<{
    run_id: string
    strategy_id: string
    strategy_name: string
    status: string
    created_at?: string | null
    finished_at?: string | null
    hit_rate: number
    avg_signal_strength: number
    hits: number
  }>
}

export const v1051Api = {
  getAlphaLabSnapshot: (lookbackDays = 90) =>
    api.get<AlphaLabSnapshot>('/v1/alpha-lab/snapshot', { params: { lookback_days: lookbackDays } }),

  getGovernancePipeline: (limit = 20) =>
    api.get<GovernanceSnapshot>('/v1/governance/pipeline', { params: { limit } }),
}