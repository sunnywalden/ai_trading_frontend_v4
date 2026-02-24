/** V10: 算法执行 API */
import { api } from './client'

export type AlgoType = 'TWAP' | 'VWAP' | 'MKT'
export type AlgoTaskStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'

export interface AlgoSubmitRequest {
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  algo?: AlgoType
  duration_minutes?: number
  slices?: number
  source?: string
}

export interface AlgoTask {
  task_id: string
  symbol: string
  side: string
  quantity: number
  algo: AlgoType
  slices: number
  duration_minutes: number
  interval_secs: number
  source: string
  status: AlgoTaskStatus
  created_at: string
  slices_log: Array<{
    slice: number
    qty?: number
    price?: number
    filled_at?: string
    error?: string
  }>
}

export const executionAlgoApi = {
  submit: (req: AlgoSubmitRequest) =>
    api.post<{ task_id: string; status: string }>('/v1/execution-algo/submit', req),

  listTasks: (params?: { status?: AlgoTaskStatus; limit?: number }) =>
    api.get<{ tasks: AlgoTask[] }>('/v1/execution-algo/tasks', { params }),

  getTask: (taskId: string) =>
    api.get<AlgoTask>(`/v1/execution-algo/tasks/${taskId}`),

  cancelTask: (taskId: string) =>
    api.delete<{ task_id: string; status: string }>(`/v1/execution-algo/tasks/${taskId}`),
}
