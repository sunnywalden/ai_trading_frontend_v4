// aiHubService.ts — V10.3.3 AI 中枢 2.0 API 客户端

import { api } from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

// Multi-Agent
export interface AgentMessage {
  sequence: number
  agent_id: string
  role: string
  agent_role?: string   // alias for role (used in template)
  message_type: string
  content: string
  confidence: number | null
  structured_output: Record<string, unknown> | null
  created_at: string
}

export interface AgentRunSummary {
  run_id: string
  symbol: string
  status?: string
  decision?: 'BUY' | 'SELL' | 'HOLD'
  final_recommendation?: string   // alias for decision (returned by some endpoints)
  confidence?: number
  message_count?: number
  latency_ms?: number | null
  created_at: string
}

export interface AgentRunDetail {
  run_id: string
  messages: AgentMessage[]
}

export interface AgentRunResult {
  run_id: string
  symbol: string
  status: string
  // Primary fields (backend OrchestratorResult)
  final_decision?: 'BUY' | 'SELL' | 'HOLD'
  final_confidence?: number
  orchestrator_summary?: string
  challenge_points: string[]
  messages: AgentMessage[]
  latency_ms?: number
  // Alias fields (UI convenience)
  final_recommendation?: string   // alias for final_decision
  confidence?: number             // alias for final_confidence
  final_reasoning?: string        // alias for orchestrator_summary
}

export interface ChallengeResult {
  run_id: string
  challenge_points: string[]
  overall_risk_level: 'HIGH' | 'MEDIUM' | 'LOW'
  veto_recommendation: boolean
  full_content: string
}

// Calibration
export interface CalibrationBucket {
  bucket: string           // e.g. "0.0-0.1"
  bucket_start: number     // e.g. 0.0
  bucket_end: number       // e.g. 0.1
  count: number
  predicted_rate: number
  actual_rate: number
  gap: number
}

export interface CalibrationSnapshot {
  id: number
  snapshot_date: string
  brier_score: number | null
  ece: number | null
  overconfidence_bias: number | null
  calibration_buckets: CalibrationBucket[] | null
  total_samples: number | null
  valid_bucket_count: number | null
  needs_adjustment: boolean
  adjustment_factor: number | null
  created_at: string
}

// Factor Weights
export interface FactorWeightRecord {
  id?: number
  user_id?: number
  record_date: string
  dimension: string
  weight_before: number
  weight_after: number
  weight_momentum_adjusted: number | null
  kalman_gain: number | null
  posterior_variance?: number | null
  ic_5d: number | null
  ic_20d: number | null
  ic_60d: number | null
  ic_rank: number | null
  adjustment_reason: string | null
  global_weights_snapshot?: Record<string, number> | null
  created_at?: string
}

// Post-Mortem
export interface PostMortemReport {
  id: number
  trade_id: string
  symbol: string
  direction: string | null
  entry_price: number | null
  exit_price: number | null
  realized_pnl: number | null
  hold_days: number | null
  factual_summary: string | null
  counterfactual_buy: string | null
  counterfactual_hold: string | null
  counterfactual_sell: string | null
  key_lessons: string | null
  improvement_suggestions: string | null
  pattern_tags: string[] | null
  error_category: string | null
  cognitive_bias: string | null
  model_used: string | null
  reasoning_tokens: number | null
  status: 'pending' | 'running' | 'completed' | 'failed'
  insight_id: number | null
  created_at: string
}

export interface PostMortemPatterns {
  error_categories: [string, number][]
  cognitive_biases: [string, number][]
  pattern_tags: [string, number][]
  lookback_days: number
}

// ─── Multi-Agent APIs ─────────────────────────────────────────────────────────

export async function listAgentRuns(limit = 20): Promise<AgentRunSummary[]> {
  const { data } = await api.get('/api/v1/ai-hub/agent-runs', { params: { limit } })
  return data
}

export async function triggerAgentRun(
  symbol: string,
  context: Record<string, unknown> = {},
  sizeUsd = 10000
): Promise<AgentRunResult> {
  const { data } = await api.post('/api/v1/ai-hub/agent-runs', {
    symbol,
    context,
    size_usd: sizeUsd,
  })
  return data
}

export async function getAgentRun(runId: string): Promise<AgentRunDetail> {
  const { data } = await api.get(`/api/v1/ai-hub/agent-runs/${runId}`)
  return data
}

export async function getAgentChallenge(runId: string): Promise<ChallengeResult> {
  const { data } = await api.get(`/api/v1/ai-hub/agent-runs/${runId}/challenge`)
  return data
}

// ─── Calibration APIs ─────────────────────────────────────────────────────────

export async function getCalibration(): Promise<CalibrationSnapshot | { message: string }> {
  const { data } = await api.get('/api/v1/ai-hub/calibration')
  return data
}

export async function getCalibrationHistory(days = 30): Promise<CalibrationSnapshot[]> {
  const { data } = await api.get('/api/v1/ai-hub/calibration/history', { params: { days } })
  return data
}

export async function runCalibration(): Promise<{ message: string; snapshot_date: string; ece: number }> {
  const { data } = await api.post('/api/v1/ai-hub/calibration/run')
  return data
}

// ─── Factor Weights APIs ──────────────────────────────────────────────────────

export async function getFactorWeights(): Promise<Record<string, number>> {
  const { data } = await api.get('/api/v1/ai-hub/factor-weights')
  return data
}

export async function getFactorWeightsHistory(
  days = 30,
  dimension?: string
): Promise<FactorWeightRecord[]> {
  const params: Record<string, unknown> = { days }
  if (dimension) params.dimension = dimension
  const { data } = await api.get('/api/v1/ai-hub/factor-weights/history', { params })
  return data
}

export async function getFactorMomentum(): Promise<FactorWeightRecord[]> {
  const { data } = await api.get('/api/v1/ai-hub/factor-momentum')
  return data
}

// ─── Post-Mortem APIs ─────────────────────────────────────────────────────────

export async function getPostMortems(limit = 20): Promise<PostMortemReport[]> {
  const { data } = await api.get('/api/v1/ai-hub/post-mortems', { params: { limit } })
  return data
}

export async function getPostMortemPatterns(days = 90): Promise<PostMortemPatterns> {
  const { data } = await api.get('/api/v1/ai-hub/post-mortems/patterns', { params: { days } })
  return data
}

export async function getPostMortemByTrade(tradeId: string): Promise<PostMortemReport> {
  const { data } = await api.get(`/api/v1/ai-hub/post-mortems/${tradeId}`)
  return data
}

export async function createPostMortem(payload: {
  trade_id: string
  symbol: string
  direction: 'long' | 'short'
  entry_price: number
  exit_price: number
  realized_pnl: number
  hold_days: number
  trade_context?: string
}): Promise<PostMortemReport> {
  const { data } = await api.post('/api/v1/ai-hub/post-mortems', payload)
  return data
}

// ─── Convenience aliases used by Pinia stores ─────────────────────────────────

/** Alias: getLatestCalibration → getCalibration */
export const getLatestCalibration = getCalibration

/** Alias: listPostMortems → getPostMortems */
export const listPostMortems = getPostMortems

/** Alias: getPostMortem → getPostMortemByTrade */
export const getPostMortem = getPostMortemByTrade

/** Alias: getAgentRunSummary → getAgentRun (returns AgentRunDetail cast as AgentRunResult) */
export async function getAgentRunSummary(runId: string): Promise<AgentRunResult> {
  return getAgentRun(runId) as unknown as AgentRunResult
}

/** Alias: getWeightsHistory → getFactorWeightsHistory */
export const getWeightsHistory = getFactorWeightsHistory

/**
 * Trigger post-mortem generation for a closed trade.
 * Convenience wrapper over createPostMortem for positional-args callers.
 */
export async function triggerPostMortem(
  tradeId: string,
  symbol: string,
  direction: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  realizedPnl: number,
  holdDays: number,
  tradeContext?: string,
): Promise<PostMortemReport> {
  return createPostMortem({
    trade_id: tradeId,
    symbol,
    direction,
    entry_price: entryPrice,
    exit_price: exitPrice,
    realized_pnl: realizedPnl,
    hold_days: holdDays,
    trade_context: tradeContext,
  })
}

// ─── Factor Momentum type + wrapper ──────────────────────────────────────────

export interface FactorMomentum {
  dimension_rankings: string[]
  ic_5d_by_dimension: Record<string, number>
  raw: FactorWeightRecord[]
}

/** getCurrentWeights: return structured FactorWeightRecord-like object from weights endpoint */
export async function getCurrentWeights(): Promise<FactorWeightRecord> {
  const weights = await getFactorWeights()
  return {
    id: 0,
    user_id: 0,
    record_date: new Date().toISOString().slice(0, 10),
    dimension: 'all',
    weight_before: 0,
    weight_after: 0,
    weight_momentum_adjusted: 0,
    kalman_gain: null,
    posterior_variance: null,
    ic_5d: 0,
    ic_20d: 0,
    ic_60d: 0,
    ic_rank: 0,
    adjustment_reason: '',
    global_weights_snapshot: null,
    created_at: new Date().toISOString(),
    weights,
  } as FactorWeightRecord & { weights: Record<string, number> }
}

/** getFactorMomentumTyped: wrap the raw list into a typed FactorMomentum object */
export async function getFactorMomentumTyped(): Promise<FactorMomentum> {
  const raw = await getFactorMomentum()
  // Sort by ic_5d descending to build ranking
  const sorted = [...raw].sort((a, b) => (b.ic_5d ?? 0) - (a.ic_5d ?? 0))
  const dimension_rankings = sorted.map((r) => r.dimension ?? '')
  const ic_5d_by_dimension: Record<string, number> = {}
  raw.forEach((r) => { if (r.dimension) ic_5d_by_dimension[r.dimension] = r.ic_5d ?? 0 })
  return { dimension_rankings, ic_5d_by_dimension, raw }
}
