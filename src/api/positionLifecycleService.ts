/**
 * V10.4.4 – Position-centric lifecycle API.
 *
 * Backward-compatible: V10.2-M3 evaluate/scale methods are preserved.
 * New: Full Position CRUD, slices, timeline via /api/v1/pos/ prefix.
 */
import type {
  ExecutionSlice,
  ManualCloseRequest,
  ManualCloseResponse,
  PortfolioSummary,
  Position,
  PositionDetail,
  PositionLifecycleEvent,
} from '@/types/position'
import { api } from './client'

// ── Dynamic Decision Engine states (V10.2-M3) ───────────────────────────────
// These mirror app/services/dynamic_position_service.py PositionState enum.
// They represent the ENGINE's decision recommendation, NOT the V10.4.4 lifecycle
// status stored in Position.status.  For the true lifecycle status use:
//   import type { PositionStatus } from '@/types/position'
// This API is only called by positionLifecycleApi.evaluateLifecycle (legacy).

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

// ── V10.2-M3 legacy API (backward compatible) ────────────────────────────────

export const positionLifecycleApi = {
  /** 评估单个仓位的决策 (V10.2-M3 legacy) */
  evaluateLifecycle: (positionId: number, ctx: LifecycleEvalInput) =>
    api.post<LifecycleStatusResponse>(`/v1/positions/${positionId}/lifecycle`, ctx),

  /** 人工加减仓 (V10.2-M3 legacy) */
  manualScale: (positionId: number, direction: 'IN' | 'OUT', quantity: number, reason: string) =>
    api.post(`/v1/positions/${positionId}/manual-scale`, { direction, quantity, reason }),

  /** 批量获取加仓候选 (V10.2-M3 legacy) */
  getScaleInCandidates: (contexts: LifecycleEvalInput[]) =>
    api.post<ScaleInCandidatesResponse>('/v1/positions/scale-in-candidates', contexts),
}

// ── V10.4.4 Position-centric API ─────────────────────────────────────────────

const POS = '/v1/pos'

export const positionsApi = {
  /** List active positions for an account */
  listActive: (accountId: string) =>
    api.get<Position[]>(`${POS}/`, { params: { account_id: accountId } }),

  /** List EXCEPTION positions */
  listExceptions: (accountId: string) =>
    api.get<Position[]>(`${POS}/exceptions`, { params: { account_id: accountId } }),

  /** List STUCK execution slices */
  listStuckSlices: (accountId: string) =>
    api.get<ExecutionSlice[]>(`${POS}/stuck-slices`, { params: { account_id: accountId } }),

  /** Closing-reason distribution */
  closingReasonStats: (accountId: string, days = 30) =>
    api.get<Record<string, number>>(`${POS}/stats/closing-reasons`, {
      params: { account_id: accountId, days },
    }),

  /** Summary counts for dashboard widgets */
  portfolioSummary: (accountId: string) =>
    api.get<PortfolioSummary>(`${POS}/portfolio-summary`, {
      params: { account_id: accountId },
    }),

  /** Position detail (includes slices array) */
  getDetail: (positionId: number) =>
    api.get<PositionDetail>(`${POS}/${positionId}`),

  /** Lifecycle event timeline */
  getTimeline: (positionId: number, limit = 100) =>
    api.get<PositionLifecycleEvent[]>(`${POS}/${positionId}/timeline`, {
      params: { limit },
    }),

  /** Execution slices for a position */
  getSlices: (positionId: number) =>
    api.get<ExecutionSlice[]>(`${POS}/${positionId}/slices`),

  /** Human-triggered close */
  manualClose: (positionId: number, body: ManualCloseRequest = {}) =>
    api.post<ManualCloseResponse>(`${POS}/${positionId}/manual-close`, body),
}

