export interface Strategy {
  id: string
  name: string
  style?: string
  description?: string
  is_builtin: boolean
  is_active: boolean
  tags?: string[]
  last_run_status?: string
  last_run_at?: string
  version?: number
  default_params?: Record<string, any>
  signal_sources?: Record<string, any>
  risk_profile?: Record<string, any>
}

export interface StrategyPerformance {
  total_signals: number
  win_rate: number
  avg_pnl_pct: number
  total_pnl: number
}

export interface StrategyRunRequest {
  symbols?: string[]
  use_custom_params?: boolean
  custom_params?: Record<string, any>
  account_id?: string
  direction?: string
  notify_channels?: string[]
  target_universe?: string
  min_score?: number
  max_results?: number
  priority?: number
}

export interface StrategyRunResponse {
  status: string
  run_id: string
  celery_task_id?: string
}

export interface StrategySignal {
  symbol: string
  action: string
  signal_strength?: number
  weight: number
  direction: string
  risk_flags?: string[]
  notes?: string
  signal_dimensions?: Record<string, number>
  created_at?: string
}
