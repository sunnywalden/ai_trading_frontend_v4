import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  paperTradingApi,
  type PaperAccountStatus,
  type PaperTradeRequest,
  type PaperTradeResult,
  type GraduationStatus,
} from '@/api/paperTradingService'

export const usePaperTradingStore = defineStore('paperTrading', () => {
  const account = ref<PaperAccountStatus | null>(null)
  const lastTrade = ref<PaperTradeResult | null>(null)
  const graduation = ref<GraduationStatus | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalPnlPct = computed(() => account.value?.total_pnl_pct ?? 0)
  const isGraduationReady = computed(() => graduation.value?.eligible ?? false)

  async function fetchStatus() {
    try {
      loading.value = true
      error.value = null
      const res = await paperTradingApi.getStatus()
      account.value = res.data
    } catch (e: any) {
      error.value = e.message || 'Failed to load paper account'
    } finally {
      loading.value = false
    }
  }

  async function executeTrade(req: PaperTradeRequest) {
    try {
      loading.value = true
      error.value = null
      const res = await paperTradingApi.trade(req)
      lastTrade.value = res.data
      // 刷新账户状态
      await fetchStatus()
      return res.data
    } catch (e: any) {
      error.value = e.message || 'Paper trade failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function checkGraduation() {
    try {
      loading.value = true
      const res = await paperTradingApi.checkGraduation()
      graduation.value = res.data
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function resetAccount() {
    await paperTradingApi.reset()
    account.value = null
    graduation.value = null
    await fetchStatus()
  }

  return {
    account, lastTrade, graduation, loading, error,
    totalPnlPct, isGraduationReady,
    fetchStatus, executeTrade, checkGraduation, resetAccount,
  }
})
