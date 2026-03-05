/** V10.3: 全局态势感知 API Service + WebSocket */
import { api } from './client'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RegimeBlock {
  regime_type: string | null
  regime_label: string | null
  confidence: number | null
  trend_direction: 'up' | 'down' | 'flat' | null
  color: string
}

export interface VarBlock {
  current_pct: number
  limit_pct: number
  usage_ratio: number
  level: 'green' | 'yellow' | 'red'
}

export interface ActiveFenceEntry {
  symbol: string
  fence_type: string
  expires_at: string | null
}

export interface ActiveFencesBlock {
  count: number
  entries: ActiveFenceEntry[]
}

export interface ActiveExecutionEntry {
  plan_id: number
  symbol: string
  algo_type: string
  fill_pct: number
}

export interface ActiveExecutionsBlock {
  count: number
  running_count?: number
  recent_executed_count?: number
  entries: ActiveExecutionEntry[]
}

export interface PendingConfirmsBlock {
  count: number
  symbols: string[]
  is_flashing: boolean
}

export interface AutonomyBlock {
  level: 'FULL' | 'SEMI' | 'ADVISORY'
  level_label: string
  is_running: boolean
  color: string
}

export interface SituationalAwarenessSnapshot {
  regime: RegimeBlock
  var: VarBlock
  active_fences: ActiveFencesBlock
  active_executions: ActiveExecutionsBlock
  pending_confirms: PendingConfirmsBlock
  autonomy: AutonomyBlock
  as_of: string
}

// ── REST 轮询（备用） ─────────────────────────────────────────────────────────
export async function getSituationalAwarenessSnapshot(): Promise<SituationalAwarenessSnapshot> {
  const res = await api.get('/v1/order-book/situational-awareness')
  return res.data
}

// ── WebSocket 连接 ────────────────────────────────────────────────────────────
export type SaMessageCallback = (snapshot: SituationalAwarenessSnapshot) => void

export function connectSaWebSocket(
  token: string,
  onMessage: SaMessageCallback,
  onError?: (err: Event) => void,
  interval = 3,
): WebSocket {
  const wsBaseRaw =
    (import.meta.env.VITE_WS_BASE_URL as string | undefined) ||
    (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
    (import.meta.env.DEV ? 'http://127.0.0.1:8088' : '')

  const wsBase = wsBaseRaw
    ? wsBaseRaw.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://').replace(/\/$/, '')
    : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`

  const url = `${wsBase}/api/v1/ws/situational-awareness?token=${encodeURIComponent(token)}&interval=${interval}`

  const ws = new WebSocket(url)

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data)
      if (msg.type === 'sa_update' && msg.data) {
        onMessage(msg.data as SituationalAwarenessSnapshot)
      }
    } catch (e) {
      console.warn('[SA WS] parse error', e)
    }
  }

  ws.onerror = (err) => {
    console.warn('[SA WS] error', err)
    onError?.(err)
  }

  return ws
}

// ── 颜色辅助 ──────────────────────────────────────────────────────────────────
export const VAR_LEVEL_COLORS: Record<string, string> = {
  green:  '#10b981',
  yellow: '#f59e0b',
  red:    '#ef4444',
}

export const AUTONOMY_LEVEL_LABELS: Record<string, string> = {
  FULL:     '全自主',
  SEMI:     '半自主',
  ADVISORY: '建议',
}
