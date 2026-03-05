/** V10: AI 助手 Copilot API */
import { api } from './client'

export interface CopilotMessage {
  id?: number
  role: 'user' | 'assistant' | 'system'
  content: string
  model_used?: string
  action_intent?: Record<string, any>
  created_at?: string
}

export interface MorningBrief {
  date: string
  market_regime?: string
  summary: string
  market_outlook: string
  portfolio_snapshot?: {
    positions_count: number
    unrealized_pnl_pct?: number | null
    top_contributor?: string | null
    beta_exposure?: number | null
    mom_exposure?: number | null
  }
  key_themes?: string[]
  top_signals: Array<{ symbol: string; action: string; reason: string; confidence?: number }>
  risk_alerts: string[]
}

export interface ConfirmAction {
  action_id: string
  description: string
  expires_at: string
}

export interface DeepResearchReport {
  symbol: string
  rating?: string
  price_target?: number
  body: string
  sources?: string[]
  generated_at?: string
}

/** V10.4 M1 — Copilot 系统上下文快照 */
export interface CopilotContext {
  account_id: string
  snapshot_at: string
  active_positions: number | null
  today_signals: number | null
  unread_alerts: number | null
  market_regime: string | null
  macro_risk_score: number | null
  llm_status: Record<string, { broken: boolean; recovery_in_seconds: number }>
}

export const copilotApi = {
  chat: (message: string, sessionId?: string) =>
    api.post<CopilotMessage>('/v1/copilot/chat', { message, session_id: sessionId }),

  getHistory: (params?: { limit?: number; session_id?: string }) =>
    api.get<{ messages: CopilotMessage[] }>('/v1/copilot/history', { params }),

  getMorningBrief: (refresh: boolean = false) =>
    api.get<MorningBrief>('/v1/copilot/morning-brief', { params: { refresh } }),

  confirmAction: (actionId: string) =>
    api.post(`/v1/copilot/confirm/${actionId}`),

  deepResearch: (symbol: string, query?: string) =>
    api.post<{ report: DeepResearchReport }>('/v1/copilot/deep-research', { symbol, query }),

  /** V10.4 M3 — 获取系统上下文（CopilotFloatingWidget 跨页面感知） */
  getContext: () =>
    api.get<CopilotContext>('/v1/copilot/context'),
}

/** Alias for convenience */
export const copilotService = copilotApi
