/** V10.3: 交易生命周期 API Service */
import { api } from './client'

// ── Pipeline 类型 ─────────────────────────────────────────────────────────────
export interface PipelineTaskCard {
  plan_id: number
  symbol: string
  direction: 'BUY' | 'SELL' | null
  confidence: number | null
  source: string | null
  stage_entered_at: string | null
  seconds_in_stage: number | null
  delay_level: 'green' | 'yellow' | 'red' | 'stopped'
}

export interface PipelineStageColumn {
  stage: number
  stage_name: string
  p50_benchmark: number | null
  count: number
  avg_seconds: number | null
  tasks: PipelineTaskCard[]
}

export interface PipelineDistribution {
  columns: PipelineStageColumn[]
  total_active: number
  as_of: string
}

// ── Plan FSM 类型 ─────────────────────────────────────────────────────────────
export interface PlanFsmStateCount {
  state: string
  label: string
  count: number
  color: string
}

export interface PlanFsmSummary {
  states: PlanFsmStateCount[]
  total: number
  as_of: string
}

// ── Position FSM 类型 ─────────────────────────────────────────────────────────
export interface PositionFsmStateCount {
  state: string
  label: string
  count: number
  color: string
}

export interface EngineStats {
  scale_in_count: number
  scale_out_count: number
  trailing_stop_count: number
  total_triggers: number
}

export interface PositionFsmSummary {
  states: PositionFsmStateCount[]
  engine_stats: EngineStats
  total: number
  as_of: string
  source?: string | null
  mismatch_detected?: boolean
  mismatch_symbols?: string[]
}

export interface LifecycleCoherenceSummary {
  account_id?: string | null
  source: string
  active_positions: number
  broker_active_positions: number
  lifecycle_active_positions: number
  mismatch_detected: boolean
  mismatch_symbols: string[]
  stale_plans_closed: number
  stale_positions_closed: number
  hydrated_positions_created: number
  reconciled_plan_ids: number[]
  reconciled_position_ids: number[]
  hydrated_position_ids: number[]
  run_mode: string
  notes: string[]
  as_of: string
}

// ── FSM Events 类型 ──────────────────────────────────────────────────────────
export interface FsmTransitionEvent {
  id: number
  plan_id: number
  symbol: string | null
  fsm_type: 'PLAN' | 'POSITION'
  from_state: string | null
  to_state: string
  engine: string | null
  qty_delta: number | null
  trigger_reason: string | null
  occurred_at: string
}

export interface FsmEventPage {
  items: FsmTransitionEvent[]
  total: number
  page: number
  size: number
}

// ── Decision Provenance 类型 ──────────────────────────────────────────────────
export interface SixDimScore {
  dimension: string
  label: string
  raw_score: number
  regime_multiplier: number
  weighted_contribution: number
  contribution_pct: number
}

export interface RiskGateCheck {
  check_name: string
  label: string
  passed: boolean
  detail: string | null
}

export interface ExecProgress {
  algo_type: string | null
  total_slices: number
  filled_slices: number
  fill_pct: number
  avg_fill_price: number | null
}

export interface DecisionProvenance {
  plan_id: number
  symbol: string
  direction: string | null
  created_at: string
  six_dim_scores: SixDimScore[]
  risk_gate_checks: RiskGateCheck[]
  ai_reasoning: string | null
  exec_progress: ExecProgress | null
  position_fsm_state: string | null
  regime: string | null
  confidence: number | null
  autonomy_action: string | null
}

// ── Position Board (持仓看板 – groups by position status) ─────────────────
export interface PositionBoardCard {
  id: number
  symbol: string
  direction: 'LONG' | 'SHORT' | null
  total_qty: number
  avg_entry_price: number | null
  unrealized_pnl_pct: number | null
  hold_seconds: number | null
  latest_plan_id: number | null
}

export interface PositionBoardColumn {
  state: string
  label: string
  color: string
  count: number
  cards: PositionBoardCard[]
}

export interface PositionBoard {
  columns: PositionBoardColumn[]
  total_active: number
  as_of: string
  source?: string | null
  mismatch_detected?: boolean
  mismatch_symbols?: string[]
}

// ── Stage 名称映射 ─────────────────────────────────────────────────────────────
export const PIPELINE_STAGE_NAMES: Record<number, string> = {
  0: '体制分类', 1: '信号融合', 2: '策略匹配', 3: '计划生成',
  4: '风险门控', 5: '自主决策', 6: '人工审核', 7: '下单执行',
  8: '算法执行', 9: '持仓监控', 10: '仓位调整', 11: '离场触发',
  12: '订单结算', 13: '归因分析', 14: '洞察更新', 15: 'A/B实验', 16: '已完成',
}

export const DELAY_LEVEL_COLORS: Record<string, string> = {
  green:   '#10b981',
  yellow:  '#f59e0b',
  red:     '#ef4444',
  stopped: '#374151',
}

// ── API 方法 ──────────────────────────────────────────────────────────────────
export async function getPipelineDistribution(): Promise<PipelineDistribution> {
  const res = await api.get('/v1/lifecycle/pipeline')
  return res.data
}

export async function getPlanFsmSummary(): Promise<PlanFsmSummary> {
  const res = await api.get('/v1/lifecycle/plan-fsm')
  return res.data
}

export async function getPositionFsmSummary(): Promise<PositionFsmSummary> {
  const res = await api.get('/v1/lifecycle/position-fsm')
  return res.data
}

export async function getFsmEvents(params: {
  page?: number
  size?: number
  fsm_type?: 'PLAN' | 'POSITION'
}): Promise<FsmEventPage> {
  const res = await api.get('/v1/lifecycle/fsm-events', { params })
  return res.data
}

export async function getDecisionProvenance(planId: number): Promise<DecisionProvenance> {
  const res = await api.get(`/v1/lifecycle/provenance/${planId}`)
  return res.data
}

export async function getPositionBoard(): Promise<PositionBoard> {
  const res = await api.get('/v1/lifecycle/position-board')
  return res.data
}

export async function reconcileLifecycleCoherence(auto_heal = true): Promise<LifecycleCoherenceSummary> {
  const res = await api.post('/v1/lifecycle/coherence/reconcile', null, {
    params: { auto_heal },
  })
  return res.data
}
