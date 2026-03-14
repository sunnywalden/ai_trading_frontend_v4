/** V10: 压力测试 API */
import { api } from './client'

export interface StressScenario {
  id: string
  name: string
  description: string
  shocks: Record<string, number>
}

export interface StressTestRequest {
  scenario_ids: string[]
  symbols?: string[]
  use_current_positions?: boolean
}

export interface ScenarioResult {
  scenario_id: string
  scenario_name: string
  portfolio_loss_pct: number
  cvar_99: number
  symbol_pnl: Record<string, number>
  breach_limit: boolean
}

export interface StressTestResult {
  results: ScenarioResult[]
  worst_case_loss_pct: number
  total_cvar_99: number
  heatmap_data: Array<{ symbol: string; scenario: string; pnl_pct: number }>
  run_at: string
}

export const stressTestApi = {
  // V11.1.1: migrated from /v1/stress-test/ to /v1/backtest/stress-test/
  run: (req: StressTestRequest) =>
    api.post<StressTestResult>('/v1/backtest/stress-test/run', req),

  getScenarios: () =>
    api.get<{ scenarios: StressScenario[] }>('/v1/backtest/stress-test/scenarios'),
}
