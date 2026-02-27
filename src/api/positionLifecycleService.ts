/** V10.2-M3: 仓位生命周期 API */
import { api } from './client'

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export type PositionState =
  | 'ENTERING'
  | 'HELD'
  | 'SCALING_IN'
  | 'SCALING_OUT'
  | 'EXITING_FULL'
  | 'STOP_LOSS_EXIT'
  | 'CLOSED'

export type ScaleDecision =
  | 'HOLD'
  | 'SCALE_IN_25'
  | 'SCALE_IN_20'
  | 'SCALE_IN_15'
  | 'SCALE_OUT_33'
  | 'SCALE_OUT_50'
  | 'SCALE_OUT_75'
  | 'EXIT_FULL'
  | 'STOP_LOSS'

export const DECISION_LABELS: Record<ScaleDecision, string> = {
  HOLD:         '持有',
  SCALE_IN_25:  '加仓 25%',
  SCALE_IN_20:  '加仓 20%',
  SCALE_IN_15:  '加仓 15%',
  SCALE_OUT_33: '减仓 33%',
  SCALE_OUT_50: '减仓 50%',
  SCALE_OUT_75: '减仓 75%',
  EXIT_FULL:    '全部平仓',
  STOP_LOSS:    '止损平仓',
}

export const DECISION_COLORS: Record<ScaleDecision, string> = {
  HOLD:         '#aaaaaa',
  SCALE_IN_25:  '#00ff88',
  SCALE_IN_20:  '#00dd77',
  SCALE_IN_15:  '#00bb66',
  SCALE_OUT_33: '#ff9900',
  SCALE_OUT_50: '#ff6600',
  SCALE_OUT_75: '#ff4400',
  EXIT_FULL:    '#ff4d4d',
  STOP_LOSS:    '#ff0055',
}

export interface LifecycleEvalInput {
  symbol: string
  regime: string
  entry_price: number
  current_price: number
  quantity: number
  max_allowed_quantity: number
  fused_confidence: number
  prev_confidence: number
  hold_days: number
  unrealized_pnl_pct: number
  trailing_high?: number | null
  scale_in_count?: number
  strategy_count?: number
  resistance_broken?: boolean
  thesis_intact?: boolean
}

export interface LifecycleStatusResponse {
  position_id: number
  symbol: string
  current_state: PositionState
  decision: ScaleDecision
  quantity_delta: number
  reason: string
  trailing_high: number | null
  fused_confidence: number | null
}

export interface ScaleInCandidate {
  position_id: number
  symbol: string
  decision: ScaleDecision
  quantity_delta: number
  reason: string
  confidence: number
}

export interface ScaleInCandidatesResponse {
  candidates: ScaleInCandidate[]
  count: number
}

// ── API 方法 ──────────────────────────────────────────────────────────────────

export const positionLifecycleApi = {
  /** 评估单个仓位的决策 */
  evaluateLifecycle: (positionId: number, ctx: LifecycleEvalInput) =>
    api.post<LifecycleStatusResponse>(`/v1/positions/${positionId}/lifecycle`, ctx),

  /** 人工加减仓 */
  manualScale: (positionId: number, direction: 'IN' | 'OUT', quantity: number, reason: string) =>
    api.post(`/v1/positions/${positionId}/manual-scale`, { direction, quantity, reason }),

  /** 批量获取加仓候选 */
  getScaleInCandidates: (contexts: LifecycleEvalInput[]) =>
    api.post<ScaleInCandidatesResponse>('/v1/positions/scale-in-candidates', contexts),
}
