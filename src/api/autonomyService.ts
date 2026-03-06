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
  executed_at: string | null
  created_at: string
  funnel_result?: 'PASSED' | 'REJECTED' | null
  funnel_rejected_at_layer?: number | null
  funnel_rejection_reason?: string | null
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

  triggerDecisionCycle: () =>
    api.post<{ success: boolean; decisions: number; executed: number; details: any[] }>('/v1/autonomy/trigger-decision-cycle'),

  triggerFullCycle: () =>
    api.post<TriggerFullCycleResponse>('/v1/autonomy/trigger-full-cycle'),

  getMarketUniverseStatus: () =>
    api.get<MarketUniverseStatusResponse>('/v1/market-universe/status'),
}
