/**
 * V9: Dashboard Store (Pinia)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchDashboardSummary, type DashboardSummary } from '@/api/client'

export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref<DashboardSummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  const riskLevel = computed(() => summary.value?.risk_level ?? 'UNKNOWN')
  const dailyPnl = computed(() => summary.value?.daily_pnl ?? 0)
  const totalEquity = computed(() => summary.value?.total_equity ?? 0)

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const data = await fetchDashboardSummary()
      summary.value = data
      lastUpdated.value = new Date()
    } catch (e: any) {
      console.error('Failed to load dashboard:', e)
      error.value = e?.message || 'Failed to load dashboard'
    } finally {
      loading.value = false
    }
  }

  return { summary, loading, error, lastUpdated, riskLevel, dailyPnl, totalEquity, refresh }
})
