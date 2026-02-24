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

export const portfolioApi = {
  optimize: (req: OptimizeRequest) =>
    api.post<OptimizeResult>('/v1/portfolio/optimize', req),

  getLatest: () =>
    api.get<OptimizeResult>('/v1/portfolio/latest'),
}
