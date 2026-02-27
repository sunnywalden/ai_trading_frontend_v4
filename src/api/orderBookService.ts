/** V10.3: 智能订单簿 API Service */
import { api } from './client'

// ── 风险标志 ──────────────────────────────────────────────────────────────────
export interface RiskBadgeInfo {
  type: string
  label: string
  icon: string
  severity: 'warning' | 'danger' | 'info'
}

// ── 单条订单行 ─────────────────────────────────────────────────────────────────
export interface OrderBookRow {
  plan_id: number
  account_id: string
  symbol: string
  market: string | null
  direction: 'BUY' | 'SELL' | null
  strategy_source: string | null

  pipeline_stage: number | null
  pipeline_stage_name: string | null

  entry_price_target: number | null
  entry_price_low: number | null
  entry_price_high: number | null
  fill_avg_price: number | null
  stop_loss: number | null
  take_profit: number | null

  target_position_pct: number | null
  current_position_pct: number | null
  unrealized_pnl: number | null
  unrealized_pnl_pct: number | null

  confidence: number | null
  six_dim_scores: Record<string, any> | null

  risk_badges: RiskBadgeInfo[]
  ai_summary: string | null

  plan_status: string
  autonomy_action: string | null
  source: string | null
  position_fsm_state: string | null

  created_at: string
  updated_at: string
  valid_until: string | null

  group: 'active' | 'monitoring' | 'completed'
}

// ── 分组 ──────────────────────────────────────────────────────────────────────
export interface OrderBookGroup {
  group_id: 'active' | 'monitoring' | 'completed'
  group_label: string
  count: number
  items: OrderBookRow[]
}

export interface OrderBookResponse {
  groups: OrderBookGroup[]
  total: number
  as_of: string
}

// ── 汇总 ──────────────────────────────────────────────────────────────────────
export interface OrderBookSummary {
  total_active: number
  total_monitoring: number
  total_completed_today: number
  total_unrealized_pnl: number
  avg_confidence: number | null
  buy_count: number
  sell_count: number
  as_of: string
}

// ── 止损修改 ──────────────────────────────────────────────────────────────────
export interface StopLossUpdateRequest {
  new_stop_loss: number
  reason?: string
}

export interface StopLossUpdateResponse {
  plan_id: number
  old_stop_loss: number
  new_stop_loss: number
  updated_at: string
}

// ── 过滤参数 ──────────────────────────────────────────────────────────────────
export interface OrderBookFilters {
  direction?: 'BUY' | 'SELL'
  account_id?: string
  market?: string
  source?: string
  plan_type?: string
  stage_min?: number
  stage_max?: number
  confidence_min?: number
  confidence_max?: number
  search?: string
}

// ── 方向与状态显示配置 ─────────────────────────────────────────────────────────
export const DIRECTION_LABELS: Record<string, string> = { BUY: '做多', SELL: '做空' }
export const DIRECTION_COLORS: Record<string, string> = { BUY: '#10b981', SELL: '#ef4444' }
export const SOURCE_LABELS: Record<string, string> = {
  AI_AUTONOMOUS: 'AI自主', AI_ADVISORY: 'AI建议', MANUAL: '手动',
}

// ── API 方法 ──────────────────────────────────────────────────────────────────
export async function listOrders(filters: OrderBookFilters = {}): Promise<OrderBookResponse> {
  const res = await api.get('/v1/order-book', { params: filters })
  return res.data
}

export async function getOrderBookSummary(): Promise<OrderBookSummary> {
  const res = await api.get('/v1/order-book/summary')
  return res.data
}

export async function getOrderDetail(planId: number): Promise<OrderBookRow> {
  const res = await api.get(`/v1/order-book/${planId}/detail`)
  return res.data
}

export async function updateStopLoss(
  planId: number,
  body: StopLossUpdateRequest,
): Promise<StopLossUpdateResponse> {
  const res = await api.patch(`/v1/order-book/${planId}/stop-loss`, body)
  return res.data
}

export async function getSituationalAwareness() {
  const res = await api.get('/v1/order-book/situational-awareness')
  return res.data
}
