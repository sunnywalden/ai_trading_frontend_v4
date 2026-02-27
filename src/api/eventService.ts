/** V10.2-M2: 事件日历 API */
import { api } from './client'

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export type EventType =
  | 'EARNINGS'
  | 'DIVIDEND'
  | 'FOMC'
  | 'MACRO_DATA'
  | 'INDEX_REBALANCE'
  | 'SPLIT'
  | 'OTHER'

export type EventRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  EARNINGS:        '财报发布',
  DIVIDEND:        '股息/除权',
  FOMC:            '美联储议息',
  MACRO_DATA:      '宏观数据',
  INDEX_REBALANCE: '指数调整',
  SPLIT:           '股票拆分',
  OTHER:           '其他事件',
}

export const EVENT_RISK_COLORS: Record<EventRiskLevel, string> = {
  LOW:     '#00ff88',
  MEDIUM:  '#ff9900',
  HIGH:    '#ff4d4d',
  EXTREME: '#ff0055',
}

export interface EventCalendarItem {
  id: number
  symbol: string
  event_type: EventType
  event_date: string   // ISO 8601
  title: string
  description: string | null
  eps_estimate: number | null
  eps_actual: number | null
  risk_level: EventRiskLevel
  requires_fence: boolean
  fence_applied: boolean
  fence_overridden: boolean
  source: string
}

export interface EventCalendarListResponse {
  items: EventCalendarItem[]
  total: number
  days: number
}

export interface FenceStatus {
  symbol: string
  active: boolean
  reason: string
  event_id: number | null
  event_date: string | null
  max_size_pct: number
  overridden: boolean
  override_reason: string | null
}

export interface ActiveFencesResponse {
  fences: FenceStatus[]
}

// ── API 方法 ──────────────────────────────────────────────────────────────────

export const eventApi = {
  /** 获取未来 N 天事件日历 */
  getCalendar: (days = 7, symbol?: string) => {
    const params: Record<string, unknown> = { days }
    if (symbol) params.symbol = symbol
    return api.get<EventCalendarListResponse>('/v1/events/calendar', { params })
  },

  /** 获取所有活跃财报围栏 */
  getActiveFences: () =>
    api.get<ActiveFencesResponse>('/v1/events/earnings-fence'),

  /** 查询特定股票的围栏状态 */
  getFenceStatus: (symbol: string) =>
    api.get<FenceStatus>(`/v1/events/earnings-fence/${symbol}`),

  /** 人工覆盖围栏 */
  overrideFence: (eventId: number, reason: string) =>
    api.post('/v1/events/override-fence', { event_id: eventId, reason }),

  /** 录入财报实际结果 */
  recordEarningsResult: (data: {
    symbol: string
    eps_actual: number
    revenue_actual?: number
    notes?: string
  }) => api.post('/v1/events/earnings-result', data),
}
