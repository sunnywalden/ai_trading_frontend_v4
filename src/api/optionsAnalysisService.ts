/** V10: 期权分析 API（只读工具）*/
import { api } from './client'

export interface IVSurfaceData {
  symbol: string
  expirations: string[]
  strikes: number[]
  surface: Array<{
    expiration: string
    strike: number
    call_iv: number | null
    put_iv: number | null
  }>
  generated_at: string
}

export interface IVRankData {
  symbol: string
  current_iv: number
  iv_rank: number          // 0–100 百分位
  iv_percentile: number
  lookback_days: number
  generated_at: string
}

export interface UnusualActivity {
  symbol: string
  expiration: string
  strike: number
  option_type: 'call' | 'put'
  volume: number
  open_interest: number
  volume_oi_ratio: number
  iv: number
  detected_at: string
}

export interface OptionsSummary {
  symbol: string
  iv_rank: number
  atm_iv: number
  put_call_ratio: number
  unusual_count: number
  top_unusual: UnusualActivity[]
  recommendation: string
  generated_at: string
}

export const optionsAnalysisApi = {
  getSummary: (symbol: string) =>
    api.get<OptionsSummary>(`/v1/options-analysis/summary/${symbol}`),

  getIVSurface: (symbol: string) =>
    api.get<IVSurfaceData>(`/v1/options-analysis/iv-surface/${symbol}`),

  getIVRank: (symbol: string, lookbackDays = 252) =>
    api.get<IVRankData>(`/v1/options-analysis/iv-rank/${symbol}`, {
      params: { lookback_days: lookbackDays },
    }),

  getUnusualActivity: (symbol: string) =>
    api.get<{ symbol: string; unusual: UnusualActivity[] }>(
      `/v1/options-analysis/unusual-activity/${symbol}`
    ),
}
