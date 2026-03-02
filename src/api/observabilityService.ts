// observabilityService.ts — V10.3.3 可观测性 2.0 API 客户端

import { api } from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExecutionQualityRecord {
  id: number
  symbol: string
  total_is_bps: number
  delay_cost_bps: number
  market_impact_bps: number
  opportunity_cost_bps: number
  timing_cost_bps: number
  fill_rate: number
  quality_score: number | null
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | null
  algo_type: string | null
  created_at: string
}

export interface ExecutionTrendPoint {
  date: string
  avg_is_bps: number
  count: number
  avg_delay_bps?: number
  avg_market_impact_bps?: number
  avg_opportunity_bps?: number
  avg_timing_bps?: number
}

export interface FillHeatmapCell {
  symbol: string
  algo_type: string | null
  avg_is_bps: number
  avg_fill_rate: number
  count: number
  hour_of_day?: number
}

export interface DimensionIntelligence {
  dimension: string
  ic_5d: number
  ic_20d: number
  ic_60d: number
  alpha_halflife_days: number
  ic_half_life_days?: number        // alias for alpha_halflife_days
  ic_stddev: number
  crowding_score: number
  is_crowded: boolean
  sample_count: number
  weight_reduce_triggered: boolean
  alpha_decay_curve?: Array<{ lag: number; ic: number }>
}

export interface SignalIntelligenceResponse {
  dimensions: DimensionIntelligence[]
  crowding_alerts: DimensionIntelligence[]
  crowding_alert_count: number
  updated_at: string
}

export interface CorrelationMatrix {
  symbols: string[]
  dimensions?: string[]   // alias for symbols (used by signal intelligence chart)
  matrix: number[][]
  updated_at: string
}

export interface FactorExposureSnapshot {
  id: number
  snapshot_at: string
  beta_market: number
  beta_hml: number
  beta_smb: number
  beta_mom: number
  beta_qmj: number
  es_97_5: number | null
  var_99: number | null
  volatility_annualized: number | null
  avg_pairwise_corr: number | null
  max_pairwise_corr: number | null
  correlation_spike: boolean
  top_corr_pair: string | null
  positions_count: number
  portfolio_beta: number | null
  created_at?: string    // alias for snapshot_at
}

export interface RiskCluster {
  latest_snapshot: FactorExposureSnapshot | null
  exposure_history_24h: FactorExposureSnapshot[]
  correlation_alerts: FactorExposureSnapshot[]
  updated_at: string
}

// ─── Execution Microscope ─────────────────────────────────────────────────────

export async function getExecutionQuality(limit = 50): Promise<ExecutionQualityRecord[]> {
  const { data } = await api.get('/v1/observability/execution-quality', { params: { limit } })
  return data
}

export async function getExecutionQualityTrend(days = 30): Promise<ExecutionTrendPoint[]> {
  const { data } = await api.get('/v1/observability/execution-quality/trend', { params: { days } })
  return data
}

export async function getFillHeatmap(days = 30): Promise<FillHeatmapCell[]> {
  const { data } = await api.get('/v1/observability/fill-heatmap', { params: { days } })
  return data
}

// ─── Signal Intelligence Observatory ─────────────────────────────────────────

export async function getSignalIntelligence(): Promise<SignalIntelligenceResponse> {
  const { data } = await api.get('/v1/observability/signal-intelligence')
  return data
}

export async function getSignalCorrelation(
  symbols: string[] = [],
  days = 20
): Promise<CorrelationMatrix> {
  const { data } = await api.get('/v1/observability/signal-correlation', {
    params: { symbols: symbols.join(','), days },
  })
  return data
}

export async function getCrowdingAlerts(): Promise<DimensionIntelligence[]> {
  const { data } = await api.get('/v1/observability/crowding-alerts')
  return data
}

// ─── Risk Observability Cluster ───────────────────────────────────────────────

export async function getRiskCluster(): Promise<RiskCluster> {
  const { data } = await api.get('/v1/observability/risk-cluster')
  return data
}

export async function getFactorExposureHistory(hours = 24): Promise<FactorExposureSnapshot[]> {
  const { data } = await api.get('/v1/observability/factor-exposure', { params: { hours } })
  return data
}

export async function getCorrelationAlerts(limit = 20): Promise<FactorExposureSnapshot[]> {
  const { data } = await api.get('/v1/observability/correlation-alerts', { params: { limit } })
  return data
}
