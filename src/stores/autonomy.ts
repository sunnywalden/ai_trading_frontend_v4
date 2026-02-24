import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { autonomyApi, type AutonomyLevel, type AutonomyStatus, type AuditLogEntry } from '@/api/autonomyService'

export const useAutonomyStore = defineStore('autonomy', () => {
  const status = ref<AutonomyStatus | null>(null)
  const auditLogs = ref<AuditLogEntry[]>([])
  const auditTotal = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isPaused = computed(() => status.value?.paused ?? false)
  const currentLevel = computed(() => status.value?.level ?? 'SEMI')
  const circuitBreakerActive = computed(() => status.value?.circuit_breaker_triggered ?? false)

  async function fetchStatus() {
    try {
      loading.value = true
      error.value = null
      const res = await autonomyApi.getStatus()
      status.value = res.data
    } catch (e: any) {
      error.value = e.message || 'Failed to load autonomy status'
    } finally {
      loading.value = false
    }
  }

  async function setLevel(level: AutonomyLevel) {
    try {
      await autonomyApi.setLevel(level)
      if (status.value) status.value.level = level
    } catch (e: any) {
      error.value = e.message || 'Failed to set level'
      throw e
    }
  }

  async function pause() {
    await autonomyApi.pause()
    if (status.value) status.value.paused = true
  }

  async function resume() {
    await autonomyApi.resume()
    if (status.value) status.value.paused = false
  }

  async function fetchAuditLog(params?: { limit?: number; offset?: number }) {
    try {
      loading.value = true
      const res = await autonomyApi.getAuditLog(params)
      auditLogs.value = res.data.logs
      auditTotal.value = res.data.total
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function revokeOrder(execId: string) {
    await autonomyApi.revokeOrder(execId)
    await fetchAuditLog()
  }

  return {
    status, auditLogs, auditTotal, loading, error,
    isPaused, currentLevel, circuitBreakerActive,
    fetchStatus, setLevel, pause, resume, fetchAuditLog, revokeOrder,
  }
})
