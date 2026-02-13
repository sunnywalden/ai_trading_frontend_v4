/**
 * V2 Dashboard Store (Pinia)
 * 管理全新Dashboard数据
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  fetchDashboardV2Full, 
  fetchDashboardV2Quick,
  type DashboardV2Response,
  type DashboardQuickUpdate 
} from '@/api/client'

export const useDashboardV2Store = defineStore('dashboardV2', () => {
  // 完整数据
  const fullData = ref<DashboardV2Response | null>(null)
  
  // 快速更新数据
  const quickData = ref<DashboardQuickUpdate | null>(null)
  
  // 加载状态
  const loading = ref(false)
  const quickLoading = ref(false)
  const error = ref<string | null>(null)
  
  // 最后更新时间
  const lastFullUpdate = ref<Date | null>(null)
  const lastQuickUpdate = ref<Date | null>(null)
  
  // 自动刷新定时器
  let fullRefreshTimer: ReturnType<typeof setInterval> | null = null
  let quickRefreshTimer: ReturnType<typeof setInterval> | null = null
  
  // Computed - 核心指标（优先使用quickData，回退到fullData）
  const totalEquity = computed(() => {
    return quickData.value?.total_equity ?? fullData.value?.account.total_equity ?? 0
  })
  
  const dailyPnl = computed(() => {
    return quickData.value?.daily_pnl ?? fullData.value?.pnl.daily_pnl ?? 0
  })
  
  const dailyReturnPct = computed(() => {
    return quickData.value?.daily_return_pct ?? fullData.value?.pnl.daily_return_pct ?? 0
  })
  
  const riskLevel = computed(() => {
    return quickData.value?.risk_level ?? fullData.value?.risk.risk_level ?? 'LOW'
  })
  
  const pendingSignalsCount = computed(() => {
    return quickData.value?.pending_signals_count ?? fullData.value?.pending_signals.length ?? 0
  })
  
  const todosCount = computed(() => {
    return quickData.value?.todos_count ?? fullData.value?.todos.length ?? 0
  })
  
  const systemAlertsCount = computed(() => {
    return quickData.value?.system_alerts_count ?? fullData.value?.system_alerts ?? 0
  })
  
  // Actions
  async function loadFull(showLoading = true) {
    if (showLoading) loading.value = true
    error.value = null
    
    try {
      const data = await fetchDashboardV2Full()
      fullData.value = data
      lastFullUpdate.value = new Date()
    } catch (e: any) {
      console.error('加载Dashboard失败:', e)
      error.value = e?.message || '加载失败'
    } finally {
      if (showLoading) loading.value = false
    }
  }
  
  async function loadQuick() {
    quickLoading.value = true
    
    try {
      const data = await fetchDashboardV2Quick()
      quickData.value = data
      lastQuickUpdate.value = new Date()
    } catch (e: any) {
      console.error('快速更新失败:', e)
      // 快速更新失败不设置error，避免影响UI
    } finally {
      quickLoading.value = false
    }
  }
  
  function startAutoRefresh() {
    stopAutoRefresh()
    
    // 完整数据每60秒刷新一次
    fullRefreshTimer = setInterval(() => {
      loadFull(false)
    }, 60 * 1000)
    
    // 快速更新每15秒刷新一次
    quickRefreshTimer = setInterval(() => {
      loadQuick()
    }, 15 * 1000)
    
    console.log('Dashboard自动刷新已启动 (完整:60s, 快速:15s)')
  }
  
  function stopAutoRefresh() {
    if (fullRefreshTimer) {
      clearInterval(fullRefreshTimer)
      fullRefreshTimer = null
    }
    if (quickRefreshTimer) {
      clearInterval(quickRefreshTimer)
      quickRefreshTimer = null
    }
    console.log('Dashboard自动刷新已停止')
  }
  
  return {
    // State
    fullData,
    quickData,
    loading,
    quickLoading,
    error,
    lastFullUpdate,
    lastQuickUpdate,
    
    // Computed
    totalEquity,
    dailyPnl,
    dailyReturnPct,
    riskLevel,
    pendingSignalsCount,
    todosCount,
    systemAlertsCount,
    
    // Actions
    loadFull,
    loadQuick,
    startAutoRefresh,
    stopAutoRefresh,
  }
})
