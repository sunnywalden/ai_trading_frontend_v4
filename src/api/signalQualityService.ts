// signalQualityService.ts — V10.4.2 信号精英化漏斗 API 客户端

import { api } from './client'
import type { RegimeType } from './regimeService'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface QualityConfig {
  signal_confidence_threshold: number   // 置信度门槛 (0-100)
  signal_resonance_min_dims:   number   // 最小同向维度数 (1-6)
  max_concurrent_positions:    number   // 最大并发仓位
  max_daily_signals:           number   // 最大日信号配额
  max_position_correlation:    number   // 最大相关性阈值 (0-1)
  min_adv_threshold:           number   // 最小日均成交额 (USD)
  min_market_cap:              number   // 最小市值 (USD)
  ghost_trade_max_days:        number   // 幽灵交易最大跟踪天数
  min_calibrated_floor:        number   // 置信度校准底线
  min_expected_sharpe:         number   // 最小期望夏普
}

export interface QualityConfigPatch {
  signal_confidence_threshold?: number
  signal_resonance_min_dims?:   number
  max_concurrent_positions?:    number
  max_daily_signals?:           number
  max_position_correlation?:    number
}

export interface AuditLogRecord {
  id:                      number
  signal_id:               number | null
  symbol:                  string
  funnel_result:           'PASSED' | 'REJECTED'
  decision_stage?:         string | null
  reason_category?:        string | null
  result_source?:          string | null
  rejected_at_layer:       number | null
  rejection_reason:        string | null
  rejection_detail:        string | null
  conviction_score:        number | null
  composite_score:         number | null
  aligned_count:           number | null
  aligned_dims:            string[]
  opposing_dims:           string[]
  anti_resonance_triggered: boolean
  signal_direction:        string | null
  regime:                  string | null
  concurrent_positions:    number | null
  daily_signals_used:      number | null
  created_at:              string
}

export interface AuditLogListResponse {
  data:   AuditLogRecord[]
  offset: number
  limit:  number
  count:  number
}

export interface LayerDailyTrend {
  date:       string
  passed:     number
  total:      number
  elite_rate: number
}

export interface CapacityGuardAction {
  signal_id: string
  symbol: string
  status: 'GENERATED' | 'VALIDATED' | 'QUEUED' | 'EXECUTING' | 'EXECUTED' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'SKIPPED' | 'REJECTED'
  quantity: number | null
  priority: number
  recommendation: string | null
  risk_level: string | null
  target_position: number | null
  overflow: number | null
  target_max: number | null
  rank: number | null
  created_at: string | null
  executed_at: string | null
  notes: string | null
}

export interface CapacityGuardSummary {
  recent_generated_count: number
  open_signal_count: number
  last_action_at: string | null
  recent_actions: CapacityGuardAction[]
}

export interface FunnelStats {
  total_evaluated:     number
  total_passed:        number
  total_rejected?:     number
  elite_rate_pct:      number
  fallback_mode?:      boolean
  layer_stats: {
    layer_0_rejected: number
    layer_1_rejected: number
    layer_2_rejected: number
    layer_3_rejected: number
    layer_4_rejected: number
  }
  rejection_breakdown: Record<string, number>
  daily_trend:         LayerDailyTrend[]
  current_positions_count?:     number   // 当前 HELD 持仓数
  max_concurrent_positions_cfg?: number  // 基础配置的最大并发仓位
  effective_max_concurrent_positions?: number // 当前体制下生效的最大并发仓位
  current_regime?: RegimeType | null
  regime_confidence?: number | null
  capacity_guard?: CapacityGuardSummary | null
}

export interface GhostTrade {
  id:                            number
  signal_id:                     number | null
  symbol:                        string
  direction:                     'LONG' | 'SHORT'
  rejection_reason:              string | null
  rejected_at_layer:             number | null
  conviction_score_at_rejection: number | null
  entry_price:                   number | null
  stop_loss:                     number | null
  take_profit:                   number | null
  last_price:                    number | null
  ghost_pnl_pct:                 number | null
  ghost_pnl_abs:                 number | null
  ghost_result:                  'WIN' | 'LOSS' | 'OPEN' | 'EXPIRED'
  tracking_day:                  number
  max_tracking_days:             number
  price_history:                 Array<{ date: string; close: number; pnl_pct: number }>
  tracking_start:                string | null
  tracking_end:                  string | null
  created_at:                    string
}

export interface GhostTradeListResponse {
  data:   GhostTrade[]
  offset: number
  limit:  number
  count:  number
}

export interface LayerBreakdown {
  total:        number
  wins:         number
  win_rate_pct: number
}

export interface GhostAnalysis {
  since_days:          number
  ghost_total:         number
  ghost_wins:          number
  ghost_win_rate_pct:  number
  ghost_avg_pnl_pct:   number
  real_win_rate_pct:   number | null
  win_rate_gap_pct:    number
  layer_breakdown:     Record<string, LayerBreakdown>
  reason_breakdown:    Record<string, LayerBreakdown>
  conclusion:          string
  recommendation:      'LOOSEN_THRESHOLD' | 'MAINTAIN' | 'TIGHTEN_THRESHOLD'
}

// ─── Service ───────────────────────────────────────────────────────────────

export const signalQualityService = {
  // ── 漏斗参数 ──────────────────────────────────────────────────────────────

  async getConfig(): Promise<QualityConfig> {
    const res = await api.get('/v1/signals/quality-config')
    return res.data
  },

  async patchConfig(updates: QualityConfigPatch): Promise<{
    updated: boolean
    applied: Partial<QualityConfigPatch>
    current: Partial<QualityConfig>
  }> {
    const res = await api.patch('/v1/signals/quality-config', updates)
    return res.data
  },

  async resetConfig(): Promise<{ reset: boolean; message: string }> {
    const res = await api.delete('/v1/signals/quality-config/overrides')
    return res.data
  },

  // ── 审计日志 ──────────────────────────────────────────────────────────────

  async getAuditLog(params?: {
    limit?:        number
    offset?:       number
    funnel_result?: 'PASSED' | 'REJECTED' | null
    symbol?:       string | null
    since_days?:   number
  }): Promise<AuditLogListResponse> {
    const res = await api.get('/v1/signals/audit-log', { params })
    return res.data
  },

  // ── 漏斗统计 ──────────────────────────────────────────────────────────────

  async getFunnelStats(since_days = 7): Promise<FunnelStats> {
    const res = await api.get('/v1/signals/funnel-stats', {
      params: { since_days },
    })
    return res.data
  },

  // ── 幽灵交易 ──────────────────────────────────────────────────────────────

  async getGhostTrades(params?: {
    limit?:        number
    offset?:       number
    ghost_result?: 'WIN' | 'LOSS' | 'OPEN' | 'EXPIRED' | null
    symbol?:       string | null
    since_days?:   number
  }): Promise<GhostTradeListResponse> {
    const res = await api.get('/v1/signals/ghost-trades', { params })
    return res.data
  },

  async getGhostAnalysis(since_days = 30): Promise<GhostAnalysis> {
    const res = await api.get('/v1/signals/ghost-trades/analysis', {
      params: { since_days },
    })
    return res.data
  },
}
