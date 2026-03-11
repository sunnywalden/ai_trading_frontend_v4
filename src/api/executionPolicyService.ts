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

export interface ExecutionControlState {
  enabled: boolean
  mode: 'OBSERVE_ONLY' | 'HARD_CONTROL'
}

export interface ExecutionPolicyRollout {
  stage: string
  flags: Record<string, boolean>
  policy_source: string
}

export interface ExecutionPersistentProfile {
  id: number
  account_id: string
  symbol: string
  side: string
  urgency_bucket: string
  algo_type: string
  sample_size: number
  avg_total_is_bps: number
  avg_fill_rate: number
  avg_quality_score: number
  feedback_bias: string
  recommended_algo?: string | null
  limit_offset_bps: number
  participation_rate_multiplier: number
  pressure_high: boolean
  last_feedback_at?: string | null
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
    persistent_profile_matches?: number
    persistent_profile_coverage?: number
  }
  policies: ExecutionPolicyOverviewItem[]
  persistent_profiles?: ExecutionPersistentProfile[]
  lookup?: {
    requested_order_id: string
    match_mode: 'order_id' | 'fallback_filters' | 'not_found'
  } | null
  control_state: ExecutionControlState
  rollout?: ExecutionPolicyRollout
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
  control_state: ExecutionControlState
  policy_source?: string
  feedback_profile?: {
    sample_size: number
    avg_total_is_bps: number
    avg_fill_rate: number
    avg_quality_score: number
    feedback_bias: string
    recommended_algo?: string | null
    limit_offset_bps: number
    participation_rate_multiplier: number
    pressure_high: boolean
    source?: string
  }
  persistent_profile?: ExecutionPersistentProfile | null
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
  rollout?: ExecutionPolicyRollout
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