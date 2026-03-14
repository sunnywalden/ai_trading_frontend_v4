/** V10: AI 自主引擎 API */
import { api } from './client'

export type AutonomyLevel = 'FULL' | 'SEMI' | 'ADVISORY'

export interface CooldownSymbol {
  symbol: string
  direction: string
  executed_at: string
  expires_at: string
  remaining_minutes: number
}

export interface AutonomyStatus {
  account_id?: string | null
  level: AutonomyLevel
  paused: boolean
  circuit_breaker_triggered: boolean
  daily_trades_today: number
  daily_trades_today_autonomous?: number
  daily_trades_today_broker?: number | null
  daily_trades_today_broker_tz?: string | null
  daily_trades_today_broker_date?: string | null
  max_daily_trades: number
  revoke_window_minutes: number
  signal_pipeline?: Record<string, number>  // 各状态信号数量
  failed_trades_today?: number
  positions_source?: string | null
  positions_count_truth?: number
  audit_source?: string | null
  regime_truth?: {
    regime: string
    confidence: number
    source: string
  }
  rollout?: {
    stage: string
    flags: Record<string, boolean>
  }
  signal_integrity?: {
    sample_size: number
    origin_counts: Record<string, number>
    canonical_payload_ready: number
    canonical_payload_ratio: number
    native_transition_ready: number
    native_transition_ratio: number
  }
  cooldown_symbols?: CooldownSymbol[]
  cooldown_minutes?: number
  closing_flow?: {
    closing_signals_today: number
    fast_path_signals_today: number
    force_exit_signals_today: number
    closing_failures_today: number
  }
  signal_quality?: {
    elite_signals_today: number
    high_quality_signals_today: number
    pending_elite_signals: number
    quota_exempt_signals_today: number
  }
  gross_exposure_allocator?: {
    current_regime: string
    effective_target_gross_exposure_pct: number
    target_gross_exposure_by_regime: Record<string, number>
    current_gross_exposure_pct?: number
    distance_to_target_gross_exposure_pct?: number
    remaining_to_max_gross_exposure_pct?: number
  }
}

export interface SignalPipelineItem {
  signal_id: string
  symbol: string
  type: string
  source?: string | null
  status: string
  direction: string
  quantity: number | null
  quantity_mode?: string | null
  quantity_value?: number | null
  strength: number
  priority: number
  notes: string | null
  order_id: string | null
  execution_path?: 'STANDARD' | 'FAST_CLOSE' | 'FORCE_EXIT' | string
  closing_intent?: boolean
  force_exit?: boolean
  bypass_reason?: string | null
  signal_quality_tier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'ELITE' | string | null
  signal_quality_score?: number | null
  signal_quality_quota_exempt?: boolean
  strategy_id?: string | null
  strategy_run_id?: string | null
  strategy_name?: string | null
  strategy_version?: number | null
  target_universe?: string | null
  resolved_market?: string | null
  selection_mode?: string | null
  fallback_reason?: string | null
  fallback_to_default_symbols?: boolean | null
  gross_exposure_allocator?: {
    regime: string
    base_target: number
    target_cap: number
    max_cap: number
    leverage_multiplier: number
    is_cap_hit: boolean
    is_max_hit: boolean
    reason?: string | null
  }
  executed_at: string | null
  created_at: string
  funnel_result?: 'PASSED' | 'REJECTED' | null
  funnel_rejected_at_layer?: number | null
  funnel_rejection_reason?: string | null
  rejection_stage?: string | null
  rejection_detail?: string | null
  signal_origin_mode?: string | null
  signal_payload_version?: string | null
  signal_transition_count?: number
  signal_transition_source?: string | null
  latest_transition_to_status?: string | null
  signal_integrity_ready?: boolean
}

export interface SignalGenerationStrategyRun {
  run_id: string
  strategy_id: string
  strategy_name: string
  strategy_version?: number | null
  target_universe?: string | null
  finished_at?: string | null
  signals_generated: number
}

export interface SignalGenerationSummary {
  strategy_scope_note?: string | null
  strategy_runs_processed: number
  signals_before_dedup: number
  signals_by_strategy: Record<string, number>
  strategy_runs_used: SignalGenerationStrategyRun[]
  runtime_scan?: {
    triggered?: boolean
    run_id?: string
    strategy_id?: string
    strategy_name?: string
    target_universe?: string
    reason?: string
    error?: string
  }
}

export interface TriggerFullCycleResponse {
  success: boolean
  signals_generated: number
  signals_validated: number
  executed: number
  signal_generation_summary?: SignalGenerationSummary
  details: any
}

export interface TriggerCapacityGuardAction {
  symbol: string
  score: number
  recommendation: string
  risk_level?: string | null
  target_position?: number | null
  signal_created: string
}

export interface TriggerCapacityGuardResult {
  current_positions: number
  max_positions: number
  overflow: number
  pending_exit_symbols: string[]
  created_exit_signals: number
  details: TriggerCapacityGuardAction[]
  status: string
}

export interface TriggerCapacityGuardResponse {
  success: boolean
  account_id: string
  regime: string | null
  max_positions: number
  result: TriggerCapacityGuardResult
}

export interface MarketUniverseMarketStatus {
  market: 'US' | 'HK' | string
  active_symbols: number
  last_synced_at?: string | null
  stale: boolean
}

export interface MarketUniverseStatusResponse {
  status: string
  degraded: boolean
  degraded_reasons: string[]
  markets: MarketUniverseMarketStatus[]
  recent_fallback_runs_24h: number
  checked_at: string
}

// ── V11.0.1 Capital Intelligence 类型 ────────────────────────────────────

export interface FrictionSignalState {
  symbol: string
  direction: string
  regime: string
  rejection_count: number
  last_conviction: number | null
  threshold_at_rejection: number | null
  soft_relief_used_count: number
  composite_score: number | null
  resonance_bonus: number | null
  soft_relief_eligible: boolean
}

export interface FrictionStateResponse {
  throttled_signals: FrictionSignalState[]
  count: number
  feature_enabled: boolean
}

export interface FalseHoldAlert {
  account_id: string
  symbol: string
  score: number
  recommendation: string
  cycle_count: number
  alerted_at: string
}

export interface FalseHoldAlertsResponse {
  alerts: FalseHoldAlert[]
  count: number
  feature_enabled: boolean
}

export interface MetaStateCapitalState {
  equity: number
  positions_count?: number
  gross_notional?: number
  gross_exposure_pct?: number
  idle_cash_ratio: number
}

export interface MetaStateModelState {
  active_friction_tickers: number
  soft_relief_eligible_count: number
  false_hold_count: number
  total_blocked_signals: number
}

export interface ImprovementCandidate {
  id: number
  account_id: string
  candidate_type: string
  target_module: string
  target_param: string
  current_value?: number | null
  suggested_value?: number | null
  confidence: number
  trigger_source?: string | null
  status: string
  evidence_summary?: string | null
  expected_impact?: string | null
  validation_plan?: string | null
  reviewed_at?: string | null
  created_at?: string | null
}

export interface MetaStateSnapshot {
  snapshot_id: string
  generated_at: string
  throttled_signals: FrictionSignalState[]
  false_hold_alerts: FalseHoldAlert[]
  capital_state: MetaStateCapitalState
  model_state: MetaStateModelState
  improvement_candidates?: ImprovementCandidate[]
  _cached?: boolean
}

export interface AuditLogEntry {
  id: number
  decision_type: string
  symbol?: string
  direction?: string
  quantity?: number
  quantity_mode?: string | null
  quantity_value?: number | null
  risk_gate_passed: boolean
  ai_reasoning?: string
  order_id?: string
  revoked_at?: string
  circuit_breaker_triggered: boolean
  execution_path?: 'STANDARD' | 'FAST_CLOSE' | 'FORCE_EXIT' | string
  closing_intent?: boolean
  force_exit?: boolean
  bypass_reason?: string | null
  risk_gate_detail?: Record<string, any> | null
  signal_quality_tier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'ELITE' | string | null
  signal_quality_score?: number | null
  signal_quality_quota_exempt?: boolean
  signal_origin_mode?: string | null
  signal_payload_version?: string | null
  signal_transition_count?: number
  created_at: string
}

export const autonomyApi = {
  getStatus: () =>
    api.get<AutonomyStatus>('/v1/autonomy/status'),

  setLevel: (level: AutonomyLevel) =>
    api.put('/v1/autonomy/level', { level }),

  pause: () =>
    api.post('/v1/autonomy/pause'),

  resume: () =>
    api.post('/v1/autonomy/resume'),

  getAuditLog: (params?: { limit?: number; offset?: number }) =>
    api.get<{ logs: AuditLogEntry[]; total: number }>('/v1/autonomy/audit-log', { params }),

  revokeOrder: (execId: string) =>
    api.post(`/v1/autonomy/revoke/${execId}`),

  getSignalPipeline: (limit = 30) =>
    api.get<{ signals: SignalPipelineItem[] }>('/v1/autonomy/signal-pipeline', { params: { limit } }),

  triggerRebalance: () =>
    api.post<{ success: boolean; result: any }>('/v1/autonomy/trigger-rebalance'),

  triggerCapacityGuard: () =>
    api.post<TriggerCapacityGuardResponse>('/v1/autonomy/trigger-capacity-guard'),

  triggerDecisionCycle: () =>
    api.post<{ success: boolean; decisions: number; executed: number; details: any[] }>('/v1/autonomy/trigger-decision-cycle'),

  triggerFullCycle: () =>
    api.post<TriggerFullCycleResponse>('/v1/autonomy/trigger-full-cycle'),

  getMarketUniverseStatus: () =>
    api.get<MarketUniverseStatusResponse>('/v1/market-universe/status'),

  // V11.0.1 Capital Intelligence
  getMetaState: () =>
    api.get<MetaStateSnapshot>('/v1/autonomy/meta-state'),

  getFrictionState: () =>
    api.get<FrictionStateResponse>('/v1/autonomy/friction-state'),

  getFalseHoldAlerts: () =>
    api.get<FalseHoldAlertsResponse>('/v1/autonomy/false-hold-alerts'),

  getImprovementCandidates: (params?: { status?: string; limit?: number }) =>
    api.get<{ items: ImprovementCandidate[]; count: number; feature_enabled: boolean }>('/v1/autonomy/improvement-candidates', { params }),
}
