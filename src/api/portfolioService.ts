/** V10: 组合优化 API */
import { api } from './client'

export type OptimizeMethod = 'MARKOWITZ' | 'RISK_PARITY' | 'KELLY'

export interface OptimizeRequest {
  symbols: string[]
  method?: OptimizeMethod
  lookback_days?: number
  risk_free_rate?: number
  target_return?: number
}

export interface FrontierPoint {
  return: number
  volatility: number
  sharpe: number
  weights: Record<string, number>
}

export interface OptimizeResult {
  method: OptimizeMethod
  weights: Record<string, number>
  metrics: {
    expected_return: number
    volatility: number
    sharpe: number
  }
  frontier?: FrontierPoint[]
  created_at: string
}

export interface SnapshotHistoryItem {
  id: number
  method: OptimizeMethod
  weights: Record<string, number>
  metrics: { expected_return: number; volatility: number; sharpe: number }
  created_at: string
}

export interface PortfolioConstructionSnapshot {
  latest_snapshot: {
    id: number
    method: OptimizeMethod
    current_weights: Record<string, number>
    target_weights: Record<string, number>
    frontier?: FrontierPoint[]
    metrics: { expected_return: number; volatility: number; sharpe: number }
    created_at: string
  } | null
  construction: {
    turnover: number
    gross_exposure: number
    concentration_hhi: number
    effective_names: number
    top_weights: Array<{ symbol: string; weight: number }>
    largest_rebalances: Array<{ symbol: string; current: number; target: number; drift: number; abs_drift: number }>
    risk_budget: Array<{ symbol: string; budget: number }>
  }
  history: Array<{
    id: number
    method: OptimizeMethod
    metrics: { expected_return: number; volatility: number; sharpe: number }
    target_weights: Record<string, number>
    created_at: string
  }>
  execution_quality: {
    sample_size: number
    avg_total_is_bps: number
    avg_fill_rate: number
    avg_time_to_fill_ms: number
    avg_quality_score: number
    worst_symbols: Array<{ symbol: string; avg_total_is_bps: number; sample_size: number }>
  }
}

export const portfolioApi = {
  optimize: (req: OptimizeRequest) =>
    api.post<OptimizeResult>('/v1/portfolio/optimize', req),

  getLatest: () =>
    api.get<OptimizeResult>('/v1/portfolio/latest'),

  getHistory: (limit = 10) =>
    api.get<SnapshotHistoryItem[]>('/v1/portfolio/history', { params: { limit } }),

  getConstruction: () =>
    api.get<PortfolioConstructionSnapshot>('/v1/portfolio/construction'),
}
