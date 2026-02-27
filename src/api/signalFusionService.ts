/** V10.2-M4: 六维信号融合 API */
import { api } from './client'

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export type SignalRecommendation = 'BUY' | 'SELL' | 'HOLD'

export const DIM_LABELS: Record<string, string> = {
  technical:      '技术面',
  fundamental:    '基本面',
  macro:          '宏观',
  volume_anomaly: '量价异常',
  options:        '期权',
  sentiment:      '市场情绪',
}

export const DIM_COLORS: Record<string, string> = {
  technical:      '#00ccff',
  fundamental:    '#00ff88',
  macro:          '#ff9900',
  volume_anomaly: '#9966ff',
  options:        '#ff6699',
  sentiment:      '#ffcc00',
}

export interface DimensionScoreItem {
  name: string
  score: number
  weight: number
  direction: -1 | 0 | 1
  description: string
}

export interface FusedSignalRequest {
  symbol: string
  regime: string
  technical_score?: number
  fundamental_score?: number
  macro_score?: number
  volume_anomaly_score?: number
  options_score?: number
  short_interest_pct?: number
  retail_sentiment?: number
  news_sentiment?: number
  insider_net_bought?: number
}

export interface FusedSignalResponse {
  symbol: string
  fused_confidence: number
  base_score: number
  resonance_bonus: number
  conflict_penalty: number
  regime_multiplier: number
  regime: string
  aligned_count: number
  dominant_dimension: string
  recommendation: SignalRecommendation
  dimensions: DimensionScoreItem[]
}

export interface SentimentScoreResponse {
  symbol: string
  score: number
  direction: -1 | 0 | 1
  description: string
  components_used: number
}

// ── API 方法 ──────────────────────────────────────────────────────────────────

export const signalFusionApi = {
  /** 计算六维融合置信度 */
  computeFused: (payload: FusedSignalRequest) =>
    api.post<FusedSignalResponse>('/v1/signals/fuse', payload),

  /** 仅计算情绪评分 */
  computeSentiment: (
    symbol: string,
    params: {
      short_interest_pct?: number
      retail_sentiment?: number
      news_sentiment?: number
      insider_net_bought?: number
    }
  ) => api.post<SentimentScoreResponse>(`/v1/signals/sentiment/${symbol}`, null, { params }),
}
