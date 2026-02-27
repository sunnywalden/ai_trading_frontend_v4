/** V10.2-M6: AI 洞察 + A/B 实验 API */
import { api } from './client'

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export type InsightType = 'PATTERN' | 'TRAP' | 'EXECUTION' | 'PARAM_SUGGESTION'
export type ExperimentStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ABORTED'

export const INSIGHT_TYPE_LABELS: Record<InsightType, string> = {
  PATTERN:          '盈利模式',
  TRAP:             '亏损陷阱',
  EXECUTION:        '执行改进',
  PARAM_SUGGESTION: '参数建议',
}

export const INSIGHT_TYPE_COLORS: Record<InsightType, string> = {
  PATTERN:          '#00ff88',
  TRAP:             '#ff4d4d',
  EXECUTION:        '#ff9900',
  PARAM_SUGGESTION: '#00ccff',
}

export const EXPERIMENT_STATUS_LABELS: Record<ExperimentStatus, string> = {
  RUNNING:   '运行中',
  COMPLETED: '已完成',
  FAILED:    '失败',
  ABORTED:   '已中止',
}

export interface AIInsightItem {
  id: number
  insight_type: InsightType
  regime: string | null
  symbol: string | null
  title: string
  summary: string
  actionable_rule: Record<string, unknown> | null
  confidence: number
  win_rate_impact: number | null
  validated: boolean
  active: boolean
  applied_count: number
  success_count: number
  created_at: string | null
}

export interface InsightListResponse {
  items: AIInsightItem[]
  total: number
  page: number
}

export interface ABExperimentItem {
  id: number
  insight_id: number | null
  experiment_name: string
  param_key: string
  status: ExperimentStatus
  start_date: string | null
  end_date: string | null
  control_win_rate: number | null
  treatment_win_rate: number | null
  control_trades: number | null
  treatment_trades: number | null
  p_value: number | null
  passed_significance: boolean
  auto_applied: boolean
}

export interface ExperimentsListResponse {
  items: ABExperimentItem[]
  total: number
}

export interface CreateExperimentPayload {
  insight_id?: number
  experiment_name: string
  param_key: string
  control_value: Record<string, unknown>
  treatment_value: Record<string, unknown>
  duration_days?: number
}

// ── API 方法 ──────────────────────────────────────────────────────────────────

export const insightApi = {
  /** 分页查询洞察列表 */
  listInsights: (params: {
    insight_type?: InsightType
    regime?: string
    active_only?: boolean
    page?: number
    page_size?: number
  }) => api.get<InsightListResponse>('/v1/insights/repository', { params }),

  /** 切换洞察激活状态 */
  toggleActive: (insightId: number, active: boolean) =>
    api.patch(`/v1/insights/repository/${insightId}`, { active }),

  /** 触发每周洞察生成 */
  triggerWeeklyGeneration: () =>
    api.post<InsightListResponse>('/v1/insights/generate_weekly'),

  /** 查询 A/B 实验列表 */
  listExperiments: (params?: { status?: ExperimentStatus; limit?: number }) =>
    api.get<ExperimentsListResponse>('/v1/insights/experiments', { params }),

  /** 创建 A/B 实验 */
  createExperiment: (payload: CreateExperimentPayload) =>
    api.post<ABExperimentItem>('/v1/insights/experiments', payload),
}
