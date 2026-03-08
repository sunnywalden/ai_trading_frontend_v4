import { api } from './client'

export interface ExecutionPolicySnapshot {
  urgency: string
  algo_type: string
  max_participation_rate: number
  slippage_budget_bps: number
  child_order_interval_seconds: number
  cancel_replace_policy: string
  limit_offset_bps: number
  closing_override_policy: boolean
  observed_fill_rate: number
  observed_total_is_bps: number
  observed_quality_score: number
}

export interface ExecutionPretradeCost {
  spread_cost_bps: number
  delay_cost_bps: number
  market_impact_bps: number
  opportunity_cost_bps: number
  timing_cost_bps: number
  total_expected_cost_bps: number
}

export interface ExecutionPolicyOverviewItem {
  intent_id: number
  intent_key: string
  order_id: string | null
  symbol: string
  action: string
  status: string
  qty: number
  created_at: string | null
  policy: ExecutionPolicySnapshot
  pretrade_cost: ExecutionPretradeCost
  grade: string | null
}

export interface ExecutionPolicyOverviewResponse {
  summary: {
    total: number
    forced: number
    high_urgency: number
    avg_slippage_budget_bps: number
    avg_realized_is_bps: number
  }
  policies: ExecutionPolicyOverviewItem[]
  lookup?: {
    requested_order_id: string
    match_mode: 'order_id' | 'fallback_filters' | 'not_found'
  } | null
}

export interface ExecutionPolicyTimelineItem {
  phase: string
  timestamp: string | null
  label: string
}

export interface ExecutionPolicyException {
  type: string
  severity: string
  message: string
}

export interface ExecutionPolicyDetailResponse {
  intent: {
    id: number
    intent_id: string
    idempotency_key: string
    symbol: string
    action: string
    status: string
    qty: number
    order_id: string | null
    reason: string | null
    created_at: string | null
    updated_at: string | null
  }
  policy: ExecutionPolicySnapshot
  pretrade_cost: ExecutionPretradeCost
  timeline: ExecutionPolicyTimelineItem[]
  exceptions: ExecutionPolicyException[]
  execution_result: {
    grade: string | null
    quality_score: number
    total_is_bps: number
    fill_rate: number
    time_to_fill_ms: number
    arrival_price: number
    fill_price: number
    mid_price_at_order: number
    vwap_reference: number
  } | null
}

export const executionPolicyApi = {
  getOverview: (
    limit = 20,
    filters?: { symbol?: string; action?: string; orderId?: string },
  ) =>
    api.get<ExecutionPolicyOverviewResponse>('/v1/execution-policy/overview', {
      params: { limit, ...filters },
    }),

  getDetail: (intentId: number) =>
    api.get<ExecutionPolicyDetailResponse>(
      `/v1/execution-policy/intents/${intentId}`,
    ),
}