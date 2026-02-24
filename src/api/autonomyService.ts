/** V10: AI 自主引擎 API */
import { api } from './client'

export type AutonomyLevel = 'FULL' | 'SEMI' | 'ADVISORY'

export interface AutonomyStatus {
  level: AutonomyLevel
  paused: boolean
  circuit_breaker_triggered: boolean
  daily_trades_today: number
  max_daily_trades: number
  revoke_window_minutes: number
}

export interface AuditLogEntry {
  id: number
  decision_type: string
  symbol?: string
  direction?: string
  quantity?: number
  risk_gate_passed: boolean
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
}
