/** V10.5.2: 席位竞争仲裁 API 服务 */
import { api } from './client'

// ─── 数据类型 ────────────────────────────────────────────

export interface CandidateSnapshot {
  type: 'POSITION' | 'SIGNAL'
  candidate_type?: 'POSITION' | 'SIGNAL'
  symbol: string
  raw_score: number
  admission_score: number
  hold_minutes: number | null
  recommendation: string | null
  protected?: boolean
  is_protected?: boolean
  protect_reason: string | null
  signal_id: string | number | null
  rank: number | null
  eliminate: boolean
  eliminated_reason: string | null
  seat_value: number
  marginal_alpha: number
  marginal_risk: number
  marginal_turnover: number
  liquidity_usage: number
  replace_or_hold_reason: string | null
}

export interface CapacityPreviewResponse {
  cycle_id: string
  overflow: number
  max_positions: number
  positions_count: number
  signals_count: number
  approved_signals: Array<{ signal_id: string | null; symbol: string; admission_score: number | null }>
  rejected_signals: Array<{ signal_id: string | null; symbol: string }>
  positions_to_close: string[]
  candidates_snapshot: CandidateSnapshot[]
  min_edge_protected: number
  cooldown_protected: number
  min_hold_protected: number
  max_replacements_cap: number
  replacement_triggered: boolean
  dry_run: boolean
}

export interface CapacityLogItem {
  id: number
  account_id: string
  cycle_id: string
  regime: string | null
  trigger_reason: string
  max_positions: number
  positions_count: number
  signals_count: number
  overflow_count: number
  min_edge_protected: number
  cooldown_protected: number
  min_hold_protected: number
  max_replacements_cap: number
  dry_run: boolean
  replacement_triggered: boolean
  created_at: string
  eliminated_positions_count: number
  eliminated_signals_count: number
  approved_signals_count: number
}

export interface CapacityLogDetailResponse extends CapacityLogItem {
  candidates_snapshot: CandidateSnapshot[]
  eliminated_positions: string[]
  eliminated_signals: Array<{ signal_id: string | null; symbol: string }>
  approved_signals_detail: Array<{ signal_id: string | null; symbol: string }>
}

export interface CapacityLogListResponse {
  total: number
  page: number
  size: number
  items: CapacityLogItem[]
}

export interface CapacityStatsResponse {
  window_days: number
  total_arbitrations: number
  total_replacements: number
  replacement_rate: number
  total_signals_rejected: number
  total_positions_closed: number
  min_edge_protection_rate: number
  cooldown_protection_rate: number
  avg_overflow: number
  dry_run_pct: number
  seat_utilization_trend: Array<{ date: string; utilization: number }>
}

export interface CapacityConfigResponse {
  capacity_replacement_enabled: boolean
  capacity_replacement_dry_run: boolean
  capacity_replacement_max_per_cycle: number
  capacity_replacement_min_edge: number
  capacity_min_hold_minutes: number
  capacity_replacement_cooldown_minutes: number
  max_concurrent_positions: number
}

// ─── API 函数 ────────────────────────────────────────────

export const capacityArbiterApi = {
  getConfig(): Promise<CapacityConfigResponse> {
    return api.get('/v1/capacity/config').then(r => r.data)
  },

  patchConfig(updates: Partial<CapacityConfigResponse>): Promise<Record<string, unknown>> {
    return api.patch('/v1/capacity/config', updates).then(r => r.data)
  },

  preview(accountId: string, regime?: string): Promise<CapacityPreviewResponse> {
    return api.post('/v1/capacity/preview', { account_id: accountId, regime }).then(r => r.data)
  },

  getLogs(params: {
    account_id?: string
    only_replacement?: boolean
    include_dry_run?: boolean
    page?: number
    size?: number
  } = {}): Promise<CapacityLogListResponse> {
    return api.get('/v1/capacity/logs', { params }).then(r => r.data)
  },

  getLogDetail(logId: number): Promise<CapacityLogDetailResponse> {
    return api.get(`/v1/capacity/logs/${logId}`).then(r => r.data)
  },

  getStats(params: { account_id?: string; window_days?: number } = {}): Promise<CapacityStatsResponse> {
    return api.get('/v1/capacity/stats', { params }).then(r => r.data)
  },
}
