// 量化交易闭环 API Service  
import axios, { AxiosInstance } from 'axios'
import { globalConfig } from '@/config/global'
import { getAuthToken } from './client'

export interface SystemStatus {
  account_id: string
  system_status: 'ACTIVE' | 'PAUSED' | 'ERROR'
  signal_pipeline: Record<string, number>
  last_cycle: string
  next_cycle: string
}

export interface TradingSignal {
  signal_id: string
  symbol: string
  signal_type: 'ENTRY' | 'EXIT' | 'ADD' | 'REDUCE' | 'HEDGE'
  direction: 'LONG' | 'SHORT'
  signal_strength: number
  confidence: number
  status: string
  generated_at: string
  expired_at: string
  suggested_quantity: number
  expected_return: number
  risk_score: number
  strategy_id?: string
  strategy_run_id?: string
  factor_scores?: Record<string, number>
  extra_metadata?: {
    current_position?: {
      qty: number
      avg_cost: number
      market_value: number
      unrealized_pnl: number
    }
    filter_reason?: string
    [key: string]: any
  }
}

export interface CycleConfig {
  execute_trades: boolean
  optimize: boolean
}

export interface ExecuteSignalsRequest {
  signal_ids: string[]
  dry_run?: boolean
}

export interface CycleResult {
  cycle_id: string
  timestamp: string
  account_id: string
  phases: {
    signal_generation?: {
      status: string
      total_signals_generated: number
      signals_by_strategy: Record<string, number>
      strategy_runs_processed: number
    }
    signal_validation?: {
      status: string
      total_signals_checked: number
      validated_signals: number
      rejected_signals: number
      validation_rate: number
    }
    performance_evaluation?: {
      status: string
      daily_metrics: any
      improvement_opportunities: any[]
      poor_performers_count: number
    }
    adaptive_optimization?: {
      status: string
      optimizations_count: number
      optimization_details: any[]
    }
  }
}

export interface DashboardOverview {
  system_status: SystemStatus
  pending_signals_count: number
  recent_executed_count: number
  top_pending_signals: TradingSignal[]
  daily_performance: DailyPerformance
  daily_performance_history?: any[]
  optimization_opportunities: OptimizationOpportunities
  signal_pipeline: Record<string, number>
  last_update: string
}

export interface DailyPerformance {
  date: string
  account_id: string
  signals_executed: number
  total_equity: number
  daily_pnl: number
  daily_return: number
  cumulative_return: number
  signal_analysis: Record<string, any>
  best_signal: TradingSignal | null
  worst_signal: TradingSignal | null
}

export interface OptimizationOpportunities {
  period_days: number
  total_poor_performers: number
  patterns: {
    overconfident_signals: any[]
    high_risk_failures: any[]
    execution_issues: any[]
    timing_issues: any[]
  }
  recommendations: Array<{
    category: string
    title: string
    description: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    impact?: string
  }>
}

class QuantLoopService {
  private static instance: QuantLoopService
  private client: AxiosInstance

  private constructor() {
    // 创建专用的量化闭环API客户端
    const backendUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL ?? '')
    this.client = axios.create({
      baseURL: backendUrl + '/api/v1',
      timeout: 30000
    })

    // 请求拦截器 - 添加认证token
    this.client.interceptors.request.use(config => {
      const token = getAuthToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // 响应拦截器 - 处理401自动跳转  
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  public static getInstance(): QuantLoopService {
    if (!QuantLoopService.instance) {
      QuantLoopService.instance = new QuantLoopService()
    }
    return QuantLoopService.instance
  }

  // 获取系统状态
  async getStatus(): Promise<SystemStatus> {
    const response = await this.client.get('/quant-loop/status')
    return response.data.data
  }
  
  // 获取仪表盘概览
  async getDashboardOverview(accountId?: string): Promise<DashboardOverview> {
    const response = await this.client.get('/quant-loop/dashboard/overview', {
      params: { account_id: accountId }
    })
    return response.data.data
  }
  
  // 获取待执行信号
  async getPendingSignals(limit: number = 20, filterByPosition: boolean = false, accountId?: string): Promise<TradingSignal[]> {
    const response = await this.client.get('/quant-loop/signals/pending', {
      params: { 
        limit,
        filter_by_position: filterByPosition,
        account_id: accountId
      }
    })
    return response.data.data
  }
  // 获取最近信号
  async getRecentSignals(limit: number = 20): Promise<TradingSignal[]> {
    const response = await this.client.get('/quant-loop/signals/recent', {
      params: { limit }
    })
    return response.data.data
  }
  
  // 运行交易周期
  async runCycle(config: CycleConfig): Promise<CycleResult> {
    const response = await this.client.post('/quant-loop/run-cycle', config)
    return response.data.data
  }
  
  // 执行信号
  async executeSignals(request: ExecuteSignalsRequest) {
    // 默认使用dry_run模式
    const payload = {
      signal_ids: request.signal_ids,
      dry_run: request.dry_run !== undefined ? request.dry_run : true
    }
    const response = await this.client.post('/quant-loop/execute-signals', payload)
    return response.data.data
  }
  
  // 获取每日性能
  async getDailyPerformance(days: number = 7): Promise<DailyPerformance> {
    const response = await this.client.get('/quant-loop/performance/daily', {
      params: { days }
    })
    return response.data.data
  }
  
  // 获取优化建议
  async getOptimizationOpportunities(days: number = 30): Promise<OptimizationOpportunities> {
    const response = await this.client.get('/quant-loop/optimization/opportunities', {
      params: { days }
    })
    return response.data.data
  }
  
  // 运行优化
  async runOptimization() {
    const response = await this.client.post('/quant-loop/optimization/run')
    return response.data.data
  }
  
  // 获取性能图表数据
  async getPerformanceChart(days: number = 30) {
    const response = await this.client.get('/quant-loop/dashboard/performance-chart', {
      params: { days }
    })
    return response.data.data
  }
  
  // 获取信号详情
  async getSignalDetails(signalId: string) {
    const response = await this.client.get(`/quant-loop/signals/${signalId}`)
    return response.data.data
  }

  // 获取信号AI摘要
  async getSignalSummary(signalId: string) {
    const response = await this.client.get(`/quant-loop/signals/${signalId}/summary`)
    return response.data
  }
  
  // 拒绝信号
  async rejectSignals(signalIds: string[], reason?: string) {
    const response = await this.client.post('/quant-loop/reject-signals', {
      signal_ids: signalIds,
      reason
    })
    return response.data.data
  }
}

export default QuantLoopService
