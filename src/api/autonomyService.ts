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
  max_daily_trades: number
  revoke_window_minutes: number
  signal_pipeline?: Record<string, number>  // 各状态信号数量
  failed_trades_today?: number
  cooldown_symbols?: CooldownSymbol[]
  cooldown_minutes?: number
}

export interface SignalPipelineItem {
  signal_id: string
  symbol: string
  type: string
  status: string
  direction: string
  quantity: number | null
  strength: number
  priority: number
  notes: string | null
  order_id: string | null
  executed_at: string | null
  created_at: string
}

export interface AuditLogEntry {
  id: number
  decision_type: string
  symbol?: string
  direction?: string
  quantity?: number
  risk_gate_passed: boolean
  ai_reasoning?: string
  order_id?: string
  revoked_at?: string
  circuit_breaker_triggered: boolean
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
    api.post<{ success: boolean; signals_generated: number; signals_validated: number; executed: number; details: any }>('/v1/autonomy/trigger-full-cycle'),
}
