/** V10: 回测引擎 API */
import { api } from './client'

export type BacktestStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'

export interface BacktestRunRequest {
  strategy_type: string   // BOLLINGER / GOLDEN_CROSS / MOMENTUM
  symbols: string[]
  start_date: string      // YYYY-MM-DD
  end_date: string
  initial_capital?: number
  walk_forward?: boolean
  params?: Record<string, any>
}

export interface BacktestMetrics {
  sharpe: number
  sortino: number
  max_drawdown: number
  win_rate: number
  alpha: number
  total_return: number
}

export interface BacktestTask {
  id: string
  strategy_type: string
  symbols: string[]
  status: BacktestStatus
  created_at: string
  completed_at?: string
  result?: {
    metrics: BacktestMetrics
    walk_forward?: Array<{ window: number; metrics: BacktestMetrics }>
    graduation_eligible?: boolean
    equity_curve?: Array<{ date: string; equity: number }>
  }
  error?: string
}

export const backtestApi = {
  run: (req: BacktestRunRequest) =>
    api.post<{ task_id: string; status: string }>('/v1/backtest/run', req),

  getTasks: (params?: { limit?: number; status?: BacktestStatus }) =>
    api.get<{ tasks: BacktestTask[] }>('/v1/backtest/tasks', { params }),

  getReport: (taskId: string) =>
    api.get<BacktestTask>(`/v1/backtest/tasks/${taskId}/report`),
}
