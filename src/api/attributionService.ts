/** V10.2-M5: 交易归因 API */
import { api } from './client'

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export type AttributionCategory = 'WIN' | 'LOSS' | 'BREAKEVEN'

export const CATEGORY_LABELS: Record<AttributionCategory, string> = {
  WIN:       '盈利',
  LOSS:      '亏损',
  BREAKEVEN: '持平',
}

export const CATEGORY_COLORS: Record<AttributionCategory, string> = {
  WIN:       '#00ff88',
  LOSS:      '#ff4d4d',
  BREAKEVEN: '#aaaaaa',
}

export interface TradeAttributionItem {
  id: number
  symbol: string
  pnl_pct: number
  pnl_absolute: number
  hold_days: number
  category: AttributionCategory
  alpha_source: string | null
  alpha_contribution_pct: number | null
  alpha_detail: Record<string, number> | null
  execution_score: number | null
  slippage_pct: number | null
  timing_score: number | null
  execution_detail: Record<string, any> | null
  position_mgmt_score: number | null
  scale_in_count: number
  scale_out_reason: string | null
  position_detail: Record<string, any> | null
  regime_at_entry: string | null
  created_at: string | null
}

export interface TradeAttributionListResponse {
  items: TradeAttributionItem[]
  total: number
}

export interface AttributionSummaryItem {
  category: AttributionCategory
  count: number
  avg_pnl_pct: number
  avg_exec_score: number
  avg_pos_score: number
}

export interface AttributionSummaryResponse {
  period_days: number
  breakdown: AttributionSummaryItem[]
}

// ── API 方法 ──────────────────────────────────────────────────────────────────

export const attributionApi = {
  /** 分页查询归因记录 */
  listTrades: (params: {
    limit?: number
    offset?: number
    days?: number
    symbol?: string
    category?: AttributionCategory
  }) => api.get<TradeAttributionListResponse>('/v1/attribution/trades', { params }),

  /** 汇总统计 */
  getSummary: (days = 30) =>
    api.get<AttributionSummaryResponse>('/v1/attribution/summary', { params: { days } }),
}
