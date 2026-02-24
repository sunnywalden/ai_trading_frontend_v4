import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stressTestApi, type StressScenario, type StressTestRequest, type StressTestResult } from '@/api/stressTestService'

export const useStressTestStore = defineStore('stressTest', () => {
  const scenarios = ref<StressScenario[]>([])
  const result = ref<StressTestResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const worstLoss = computed(() => result.value?.worst_case_loss_pct ?? 0)
  const breachCount = computed(() => result.value?.results.filter(r => r.breach_limit).length ?? 0)

  async function fetchScenarios() {
    try {
      loading.value = true
      const res = await stressTestApi.getScenarios()
      scenarios.value = res.data.scenarios
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function runTest(req: StressTestRequest) {
    try {
      loading.value = true
      error.value = null
      const res = await stressTestApi.run(req)
      result.value = res.data
    } catch (e: any) {
      error.value = e.message || 'Stress test failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { scenarios, result, loading, error, worstLoss, breachCount, fetchScenarios, runTest }
})
