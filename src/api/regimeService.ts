/** V10.2-M1: 市场体制感知 API */
import { api } from './client'

// ── 枚举 & 类型 ──────────────────────────────────────────────────────────────

export type RegimeType =
  | 'BULL_TREND'   // 强势牛市趋势
  | 'BEAR_TREND'   // 熊市下行趋势
  | 'HIGH_VOL'     // 高波动率环境
  | 'MEAN_REVERT'  // 均值回复环境
  | 'RANGE_BOUND'  // 区间震荡低波动
  | 'CRISIS'       // 危机体制

/** 体制中文名称映射 */
export const REGIME_LABELS: Record<RegimeType, string> = {
  BULL_TREND:  '牛市趋势',
  BEAR_TREND:  '熊市下行',
  HIGH_VOL:    '高波动',
  MEAN_REVERT: '均值回复',
  RANGE_BOUND: '区间震荡',
  CRISIS:      '危机体制',
}

/** 体制颜色映射（Bloomberg 暗色风格） */
export const REGIME_COLORS: Record<RegimeType, string> = {
  BULL_TREND:  '#00ff88',
  BEAR_TREND:  '#ff4d4d',
  HIGH_VOL:    '#ff9900',
  MEAN_REVERT: '#00ccff',
  RANGE_BOUND: '#aaaaaa',
  CRISIS:      '#ff0055',
}

// ── 接口类型定义 ──────────────────────────────────────────────────────────────

export interface RegimeScores {
  trend: number | null      // 趋势强度 [0,100]
  vol: number | null        // 波动率 [0,100]
  breadth: number | null    // 市场广度 [0,100]
  macro: number | null      // 宏观环境 [0,100]
  momentum: number | null   // 价格动量 [0,100]
}

export interface RegimeInfo {
  id: number
  regime: RegimeType
  prev_regime: RegimeType | null
  confidence: number
  classification_date: string    // ISO 8601
  valid_from: string             // ISO 8601
  valid_until: string | null     // ISO 8601 or null（当前有效）
  scores: RegimeScores
  reasoning: string | null
  is_override: boolean
  override_by: string | null
}

export interface RegimeCurrentResponse {
  regime: RegimeInfo | null
  var_multiplier: number    // 当前 VaR 倍数（例如 0.8 / 1.2）
  from_cache: boolean
}

export interface RegimeHistoryResponse {
  regimes: RegimeInfo[]
  total: number
  page: number
  size: number
  pages: number
}

export interface RegimeStrategyWeight {
  style: string          // e.g. 'trend_following', 'mean_reversion'
  weight: number         // 当前体制下的权重倍数 [0.0, 2.0]
  baseline: number       // 基准权重倍数（通常为 1.0）
}

export interface RegimeStrategyWeightsResponse {
  regime: RegimeType | null
  weights: RegimeStrategyWeight[]
  updated_at: string | null
}

export interface RegimeOverrideRequest {
  regime: RegimeType
  reason: string
}

export interface RegimeOverrideResponse {
  success: boolean
  message: string
  regime: RegimeInfo
}

// ── API 函数 ──────────────────────────────────────────────────────────────────

export const regimeApi = {
  /**
   * 获取当前市场体制（优先读 Redis 缓存，无缓存则查 DB 最新记录）
   */
  getCurrent: () =>
    api.get<RegimeCurrentResponse>('/v1/regime/current'),

  /**
   * 获取体制历史（分页）
   * @param page  页码，从 1 开始
   * @param size  每页条数，默认 20
   */
  getHistory: (page = 1, size = 20) =>
    api.get<RegimeHistoryResponse>('/v1/regime/history', {
      params: { page, size },
    }),

  /**
   * 获取当前体制下各策略风格权重倍数
   */
  getStrategyWeights: () =>
    api.get<RegimeStrategyWeightsResponse>('/v1/regime/strategy-weights'),

  /**
   * 管理员手动覆写体制（触发 REGIME_CHANGED 事件及权重更新）
   */
  override: (payload: RegimeOverrideRequest) =>
    api.post<RegimeOverrideResponse>('/v1/regime/override', payload),
}
