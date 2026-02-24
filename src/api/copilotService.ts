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
  summary: string
  market_outlook: string
  top_signals: Array<{ symbol: string; action: string; reason: string }>
  risk_alerts: string[]
}

export interface ConfirmAction {
  action_id: string
  description: string
  expires_at: string
}

export const copilotApi = {
  chat: (message: string, sessionId?: string) =>
    api.post<CopilotMessage>('/v1/copilot/chat', { message, session_id: sessionId }),

  getHistory: (params?: { limit?: number; session_id?: string }) =>
    api.get<{ messages: CopilotMessage[] }>('/v1/copilot/history', { params }),

  getMorningBrief: () =>
    api.get<MorningBrief>('/v1/copilot/morning-brief'),

  confirmAction: (actionId: string) =>
    api.post(`/v1/copilot/confirm/${actionId}`),
}
