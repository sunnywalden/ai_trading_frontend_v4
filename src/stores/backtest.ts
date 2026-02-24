import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { backtestApi, type BacktestRunRequest, type BacktestTask } from '@/api/backtestService'

export const useBacktestStore = defineStore('backtest', () => {
  const tasks = ref<BacktestTask[]>([])
  const currentReport = ref<BacktestTask | null>(null)
  const loading = ref(false)
  const running = ref(false)
  const error = ref<string | null>(null)

  const doneTasks = computed(() => tasks.value.filter(t => t.status === 'DONE'))
  const runningTasks = computed(() => tasks.value.filter(t => t.status === 'RUNNING' || t.status === 'PENDING'))

  async function runBacktest(req: BacktestRunRequest) {
    try {
      running.value = true
      error.value = null
      const res = await backtestApi.run(req)
      // 插入到列表顶部（乐观更新）
      tasks.value.unshift({
        id: res.data.task_id,
        strategy_type: req.strategy_type,
        symbols: req.symbols,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      })
      return res.data.task_id
    } catch (e: any) {
      error.value = e.message || 'Backtest submit failed'
      throw e
    } finally {
      running.value = false
    }
  }

  async function fetchTasks() {
    try {
      loading.value = true
      const res = await backtestApi.getTasks({ limit: 20 })
      tasks.value = res.data.tasks
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchReport(taskId: string) {
    try {
      loading.value = true
      const res = await backtestApi.getReport(taskId)
      currentReport.value = res.data
      // 更新列表中的对应条目
      const idx = tasks.value.findIndex(t => t.id === taskId)
      if (idx !== -1) tasks.value[idx] = res.data
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return {
    tasks, currentReport, loading, running, error,
    doneTasks, runningTasks,
    runBacktest, fetchTasks, fetchReport,
  }
})
