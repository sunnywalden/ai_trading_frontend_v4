/**
 * V10.4.4 – Position-centric domain types.
 *
 * Mirror of backend:
 *   app/models/position.py        → Position / PositionStatus / ClosingReason / ExecutionPath
 *   app/models/execution_slice.py → ExecutionSlice / SliceAction / SliceStatus
 *   app/models/position_lifecycle_event.py → PositionLifecycleEvent / EventKind
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export type PositionStatus =
  | 'PENDING'
  | 'OPENING'
  | 'ACTIVE'
  | 'SCALING_IN'
  | 'SCALING_OUT'
  | 'CLOSING'
  | 'PARTIALLY_CLOSED'
  | 'EXCEPTION'
  | 'CLOSED'
  | 'LIQUIDATED'

export type ClosingReason =
  | 'VOLITIONAL'
  | 'STOP_LOSS'
  | 'TAKE_PROFIT'
  | 'MAX_HOLDING_DAYS'
  | 'RISK_FORCED'
  | 'CIRCUIT_BREAKER'
  | 'PORTFOLIO_REBALANCE'
  | 'MANUAL_OVERRIDE'
  | 'REGIME_CHANGE'
  | 'THESIS_INVALIDATED'
  | 'EXEMPTION_CLOSE'

export type ExecutionPath =
  | 'AUTONOMOUS'
  | 'SEMI_AUTO'
  | 'ADVISORY'
  | 'MANUAL'

export type SliceAction =
  | 'OPEN'
  | 'ADD'
  | 'REDUCE'
  | 'CLOSE'
  | 'PARTIAL'

export type SliceStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'FAILED'
  | 'CANCELLED'
  | 'STUCK'
  | 'SKIPPED'

export type EventKind =
  | 'STATE_TRANSITION'
  | 'SLICE_CREATED'
  | 'SLICE_SUBMITTED'
  | 'SLICE_FILLED'
  | 'SLICE_PARTIALLY_FILLED'
  | 'SLICE_STUCK'
  | 'SLICE_FAILED'
  | 'SLICE_CANCELLED'
  | 'RISK_GATE_PASS'
  | 'RISK_GATE_BLOCK'
  | 'EXEMPTION_GRANTED'
  | 'EXEMPTION_REVOKED'
  | 'CIRCUIT_BREAKER'
  | 'MANUAL_CLOSE'
  | 'MANUAL_OVERRIDE'
  | 'GOVERNANCE_REVIEW'
  | 'PNL_SNAPSHOT'
  | 'STOP_ADJUSTED'
  | 'EXCEPTION_RAISED'
  | 'EXCEPTION_CLEARED'
  | 'BROKER_SYNC'
  | 'REGIME_CHANGE'

// ─────────────────────────────────────────────────────────────────────────────
// Entity interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface Position {
  id: number
  account_id: string
  symbol: string
  thesis_key: string
  status: PositionStatus
  direction: string
  total_qty: number
  filled_qty: number
  open_qty: number
  closed_qty: number
  avg_entry_price: number | null
  realized_pnl: number | null
  unrealized_pnl_pct: number | null
  stop_loss_price: number | null
  take_profit_price: number | null
  max_holding_days: number | null
  execution_path: ExecutionPath | null
  closing_reason: ClosingReason | null
  closing_source: string | null
  exemption_active: boolean
  exemption_detail: string | null
  governance_flag: boolean
  initial_signal_id: number | null
  initial_signal_uid: string | null
  latest_plan_id: number | null
  opened_at: string | null
  closed_at: string | null
  last_action_at: string | null
  created_at: string | null
  /** Only present when fetched via GET /pos/:id */
  slices?: ExecutionSlice[]
}

export interface ExecutionSlice {
  id: number
  position_id: number
  account_id: string
  symbol: string
  action: SliceAction
  status: SliceStatus
  requested_qty: number
  submitted_qty: number | null
  filled_qty: number | null
  avg_fill_price: number | null
  execution_path: ExecutionPath | null
  closing_reason: ClosingReason | null
  exemption_applied: boolean
  signal_id: string | null
  intent_id: string | null
  order_ids: string[] | null
  stuck_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface PositionLifecycleEvent {
  id: number
  position_id: number
  slice_id: number | null
  kind: EventKind
  summary: string | null
  detail: string | null
  from_status: string | null
  to_status: string | null
  actor: string | null
  signal_id: string | null
  intent_id: string | null
  metadata: Record<string, unknown> | null
  occurred_at: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// API response types
// ─────────────────────────────────────────────────────────────────────────────

export interface PositionDetail extends Position {
  slices: ExecutionSlice[]
}

export interface PortfolioSummary {
  active_positions: number
  exception_positions: number
  stuck_slices: number
}

export interface ManualCloseRequest {
  actor?: string
  note?: string
}

export interface ManualCloseResponse {
  position_id: number
  slice_id: number
  status: string
}

// ─────────────────────────────────────────────────────────────────────────────
// UI helper utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a Tailwind-compatible colour tag for a given PositionStatus */
export function positionStatusColor(status: PositionStatus): string {
  const MAP: Record<PositionStatus, string> = {
    PENDING: 'text-gray-400',
    OPENING: 'text-blue-400',
    ACTIVE: 'text-green-400',
    SCALING_IN: 'text-cyan-400',
    SCALING_OUT: 'text-yellow-400',
    CLOSING: 'text-orange-400',
    PARTIALLY_CLOSED: 'text-orange-300',
    EXCEPTION: 'text-red-500',
    CLOSED: 'text-gray-300',
    LIQUIDATED: 'text-red-700',
  }
  return MAP[status] ?? 'text-gray-400'
}

export function sliceStatusColor(status: SliceStatus): string {
  const MAP: Record<SliceStatus, string> = {
    PENDING: 'text-gray-400',
    SUBMITTED: 'text-blue-400',
    PARTIALLY_FILLED: 'text-yellow-400',
    FILLED: 'text-green-400',
    FAILED: 'text-red-400',
    CANCELLED: 'text-gray-500',
    STUCK: 'text-red-600',
    SKIPPED: 'text-gray-500',
  }
  return MAP[status] ?? 'text-gray-400'
}

export function isActivePosition(pos: Position): boolean {
  return !['CLOSED', 'LIQUIDATED'].includes(pos.status)
}
