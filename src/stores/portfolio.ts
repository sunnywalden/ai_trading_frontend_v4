import { defineStore } from 'pinia'
import { ref } from 'vue'
import { portfolioApi, type OptimizeRequest, type OptimizeResult } from '@/api/portfolioService'

export const usePortfolioStore = defineStore('portfolio', () => {
  const result = ref<OptimizeResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function optimize(req: OptimizeRequest) {
    try {
      loading.value = true
      error.value = null
      const res = await portfolioApi.optimize(req)
      result.value = res.data
    } catch (e: any) {
      error.value = e.message || 'Optimization failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchLatest() {
    try {
      loading.value = true
      const res = await portfolioApi.getLatest()
      result.value = res.data
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { result, loading, error, optimize, fetchLatest }
})
