// warRoomService.ts — V10.3.3 战情室 API 客户端

import { api } from './client'
import type { FactorExposureSnapshot } from './observabilityService'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PnLTicker {
  total_pnl: number
  total_unrealized_pnl: number
  total_realized_pnl: number
  pnl_change_1h: number
  top_contributor: string | null
  top_detractor: string | null
  vs_spy_alpha: number | null
  positions_count: number
  updated_at: string
}

export interface IntelligenceFeedItem {
  id: string
  category: 'DECISION' | 'RISK' | 'EVENT' | 'SIGNAL'
  urgency_score: number
  title: string
  content: string
  summary?: string    // alias for content (used in some templates)
  symbol: string | null
  action_required: boolean
  source: string
  created_at: string
}

export interface PositionExposure {
  symbol: string
  market_value: number
  unrealized_pnl: number
  direction?: string
  quantity?: number
  unrealized_pnl_pct?: number | null
}

export interface PortfolioExposure {
  positions: PositionExposure[]
  factor_exposure: Record<string, unknown> | null
  updated_at: string
  latest_snapshot?: FactorExposureSnapshot | null
}

export interface WarRoomSnapshot {
  pnl_ticker: PnLTicker
  intelligence_feed: IntelligenceFeedItem[]
  portfolio_exposure: PortfolioExposure
  updated_at: string
}

export type AlertGrade = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface SmartAlert {
  id: number
  alert_id?: number    // alias for id
  user_id: string
  alert_type: string
  title: string
  content: string
  symbol: string | null
  value: number | null
  grade: AlertGrade
  recommended_action_text: string
  action_suggestion?: string    // alias for recommended_action_text
  metadata: Record<string, unknown>
  dismissed: boolean
  acknowledged: boolean
  is_dismissed?: boolean       // alias for dismissed
  is_acknowledged?: boolean    // alias for acknowledged
  merged_count: number
  created_at: string
  last_seen: string
}

export interface AlertStats {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  action_required: number
  unread_count?: number
  by_grade?: Record<string, number>
}

// ─── War Room APIs ────────────────────────────────────────────────────────────

export async function getWarRoomSnapshot(): Promise<WarRoomSnapshot> {
  const { data } = await api.get('/v1/war-room/snapshot')
  return data
}

export async function getPnLTicker(): Promise<PnLTicker> {
  const { data } = await api.get('/v1/war-room/pnl-ticker')
  return data
}

export async function getIntelligenceFeed(
  limit = 20,
  category?: string
): Promise<IntelligenceFeedItem[]> {
  const params: Record<string, unknown> = { limit }
  if (category) params.category = category
  const { data } = await api.get('/v1/war-room/intelligence-feed', { params })
  return data
}

export async function getPortfolioExposure(): Promise<PortfolioExposure> {
  const { data } = await api.get('/v1/war-room/exposure')
  return data
}

// ─── Smart Alert APIs ─────────────────────────────────────────────────────────

export async function getAlerts(
  grade?: AlertGrade,
  includeDismissed = false,
  limit = 50
): Promise<SmartAlert[]> {
  const params: Record<string, unknown> = { include_dismissed: includeDismissed, limit }
  if (grade) params.grade = grade
  const { data } = await api.get('/v1/war-room/alerts', { params })
  return data
}

export async function getAlertStats(): Promise<AlertStats> {
  const { data } = await api.get('/v1/war-room/alerts/stats')
  return data
}

export async function acknowledgeAlert(alertId: number | string): Promise<SmartAlert> {
  const { data } = await api.patch(`/v1/war-room/alerts/${alertId}`, {
    action: 'acknowledge',
  })
  return data.alert
}

export async function dismissAlert(alertId: number | string): Promise<SmartAlert> {
  const { data } = await api.patch(`/v1/war-room/alerts/${alertId}`, {
    action: 'dismiss',
  })
  return data.alert
}
