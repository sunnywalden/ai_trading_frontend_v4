/** V10: 模拟盘 API */
import { api } from './client'

export interface PaperPosition {
  symbol: string
  qty: number
  avg_cost: number
  market_value: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
}

export interface PaperAccountStatus {
  account_id: string
  equity: number
  cash: number
  initial_capital: number
  positions: PaperPosition[]
  trade_count: number
  total_pnl: number
  total_pnl_pct: number
  created_at: string
}

export interface PaperTradeRequest {
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  order_type?: 'MKT' | 'LMT'
  limit_price?: number
}

export interface PaperTradeResult {
  trade_id: string
  symbol: string
  side: string
  quantity: number
  filled_price: number
  commission: number
  slippage: number
  net_pnl: number
  account_equity: number
}

export interface GraduationStatus {
  eligible: boolean
  metrics: {
    sharpe: number
    max_drawdown: number
    win_rate: number
    trade_days: number
  }
  requirements: {
    min_sharpe: number
    max_drawdown_limit: number
    min_win_rate: number
    min_days: number
  }
  message: string
}

export const paperTradingApi = {
  getStatus: () =>
    api.get<PaperAccountStatus>('/v1/paper-trading/status'),

  trade: (req: PaperTradeRequest) =>
    api.post<PaperTradeResult>('/v1/paper-trading/trade', req),

  checkGraduation: () =>
    api.post<GraduationStatus>('/v1/paper-trading/check-graduation'),

  reset: () =>
    api.post('/v1/paper-trading/reset'),
}
