import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import QuantLoopService, { SystemStatus, TradingSignal, DashboardOverview } from '@/api/quantLoopService'

export const useQuantLoopStore = defineStore('quantLoop', () => {
  // State
  const systemStatus = ref<SystemStatus | null>(null)
  const dashboardOverview = ref<DashboardOverview | null>(null)
  const pendingSignals = ref<TradingSignal[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdate = ref<Date | null>(null)

  // Computed
  const isActive = computed(() => systemStatus.value?.system_status === 'ACTIVE')
  const totalPendingSignals = computed(() => pendingSignals.value.length)

  // Actions
  async function fetchSystemStatus() {
    try {
      loading.value = true
      error.value = null
      systemStatus.value = await QuantLoopService.getInstance().getStatus()
      lastUpdate.value = new Date()
    } catch (e: any) {
      error.value = e.message || '获取系统状态失败'
      console.error('Failed to fetch system status:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchDashboardOverview() {
    try {
      loading.value = true
      error.value = null
      const accountId = systemStatus.value?.account_id
      dashboardOverview.value = await QuantLoopService.getInstance().getDashboardOverview(accountId)
      lastUpdate.value = new Date()
    } catch (e: any) {
      error.value = e.message || '获取仪表盘数据失败'
      console.error('Failed to fetch dashboard overview:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchPendingSignals(limit: number = 20, filterByPosition: boolean = false) {
    try {
      loading.value = true
      error.value = null
      // 使用当前状态中的 account_id，如果有的话
      const accountId = systemStatus.value?.account_id
      pendingSignals.value = await QuantLoopService.getInstance().getPendingSignals(limit, filterByPosition, accountId)
      lastUpdate.value = new Date()
    } catch (e: any) {
      error.value = e.message || '获取待执行信号失败'
      console.error('Failed to fetch pending signals:', e)
    } finally {
      loading.value = false
    }
  }

  async function runTradingCycle(config: { execute_trades: boolean; optimize: boolean }) {
    try {
      loading.value = true
      error.value = null
      const result = await QuantLoopService.getInstance().runCycle(config)
      // 运行完成后刷新数据
      await Promise.all([
        fetchSystemStatus(),
        fetchDashboardOverview(),
        fetchPendingSignals()
      ])
      return result
    } catch (e: any) {
      error.value = e.message || '运行交易周期失败'
      console.error('Failed to run trading cycle:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function executeSignals(signalIds: string[], dryRun: boolean = true) {
    try {
      loading.value = true
      error.value = null
      const result = await QuantLoopService.getInstance().executeSignals({ 
        signal_ids: signalIds,
        dry_run: dryRun
      })
      // 执行后刷新信号列表
      await fetchPendingSignals()
      return result
    } catch (e: any) {
      error.value = e.message || '执行信号失败'
      console.error('Failed to execute signals:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function getSignalSummary(signalId: string) {
    return await QuantLoopService.getInstance().getSignalSummary(signalId)
  }
  
  async function rejectSignals(signalIds: string[], reason?: string) {
    try {
      loading.value = true
      error.value = null
      const result = await QuantLoopService.getInstance().rejectSignals(signalIds, reason)
      // 拒绝后刷新待执行信号列表
      await fetchPendingSignals()
      return result
    } catch (e: any) {
      error.value = e.message || '拒绝信号失败'
      console.error('Failed to reject signals:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    systemStatus,
    dashboardOverview,
    pendingSignals,
    loading,
    error,
    lastUpdate,
    
    // Computed
    isActive,
    totalPendingSignals,
    
    // Actions
    fetchSystemStatus,
    fetchDashboardOverview,
    fetchPendingSignals,
    runTradingCycle,
    executeSignals,
    rejectSignals,
    getSignalSummary,
    clearError
  }
})
