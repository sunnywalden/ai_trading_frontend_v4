import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import type { Strategy, StrategyPerformance, StrategyRunRequest, StrategyRunResponse, StrategySignal } from '@/types/strategy'

export const useStrategyStore = defineStore('strategy', () => {
  // State
  const strategies = ref<Strategy[]>([])
  const currentStrategy = ref<Strategy | null>(null)
  const loading = ref(false)
  const performances = ref<Record<string, StrategyPerformance>>({})

  // Computed
  const enabledStrategies = computed(() => 
    strategies.value.filter(s => s.is_active)
  )

  const strategiesByCategory = computed(() => {
    const grouped: Record<string, Strategy[]> = {}
    strategies.value.forEach(strategy => {
      const category = strategy.style || '其他'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(strategy)
    })
    return grouped
  })

  // Actions
  async function loadStrategies(params?: {
    is_builtin?: boolean
    is_active?: boolean
    style?: string
    limit?: number
  }) {
    loading.value = true
    try {
      const response = await api.get<{ status: string; strategies: Strategy[] }>(
        '/v1/strategies',
        { params }
      )
      strategies.value = response.data.strategies
      return strategies.value
    } catch (error) {
      console.error('Failed to load strategies:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function loadStrategy(strategyId: string) {
    loading.value = true
    try {
      const response = await api.get<{ status: string; strategy: Strategy }>(
        `/v1/strategies/${strategyId}`
      )
      currentStrategy.value = response.data.strategy
      return response.data.strategy
    } catch (error) {
      console.error('Failed to load strategy:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function loadPerformance(strategyId: string) {
    try {
      const response = await api.get<{
        status: string
        strategy_id: string
        performance: StrategyPerformance
      }>(`/v1/strategies/${strategyId}/performance`)
      
      const perf = response.data.performance
      performances.value[strategyId] = perf
      return perf
    } catch (error) {
      console.error('Failed to load performance:', error)
      throw error
    }
  }

  async function runStrategy(strategyId: string, request: StrategyRunRequest) {
    try {
      const response = await api.post<StrategyRunResponse>(
        `/v1/strategies/${strategyId}/run`,
        request
      )
      return response.data
    } catch (error) {
      console.error('Failed to run strategy:', error)
      throw error
    }
  }

  async function toggleStrategy(strategyId: string, isActive: boolean) {
    try {
      const response = await api.patch<{
        status: string
        strategy_id: string
        is_active: boolean
      }>(`/v1/strategies/${strategyId}/toggle`, null, {
        params: { is_active: isActive }
      })
      
      // Update local state
      const strategy = strategies.value.find(s => s.id === strategyId)
      if (strategy) {
        strategy.is_active = isActive
      }
      if (currentStrategy.value?.id === strategyId) {
        currentStrategy.value.is_active = isActive
      }
      
      return response.data
    } catch (error) {
      console.error('Failed to toggle strategy:', error)
      throw error
    }
  }

  async function updateParams(strategyId: string, params: Record<string, any>) {
    try {
      const response = await api.patch<{ status: string; strategy: Strategy }>(
        `/v1/strategies/${strategyId}/params`,
        { default_params: params }
      )
      
      // Update local state
      const strategy = strategies.value.find(s => s.id === strategyId)
      if (strategy) {
        strategy.default_params = params
      }
      if (currentStrategy.value?.id === strategyId) {
        currentStrategy.value.default_params = params
      }
      
      return response.data.strategy
    } catch (error) {
      console.error('Failed to update params:', error)
      throw error
    }
  }

  async function getSignals(strategyId: string, limit: number = 20) {
    try {
      const response = await api.get<{
        status: string
        strategy_id: string
        signals: StrategySignal[]
      }>(`/v1/strategies/${strategyId}/signals`, {
        params: { limit }
      })
      return response.data.signals
    } catch (error) {
      console.error('Failed to get signals:', error)
      throw error
    }
  }

  return {
    // State
    strategies,
    currentStrategy,
    loading,
    performances,
    
    // Computed
    enabledStrategies,
    strategiesByCategory,
    
    // Actions
    loadStrategies,
    loadStrategy,
    loadPerformance,
    runStrategy,
    toggleStrategy,
    updateParams,
    getSignals
  }
})
