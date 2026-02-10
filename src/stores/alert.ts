/**
 * V9: Alert Store (Pinia)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchAlerts, createAlert, updateAlert, deleteAlert, fetchAlertHistory,
  type AlertRule, type AlertHistoryEntry
} from '@/api/client'

export const useAlertStore = defineStore('alert', () => {
  const alerts = ref<AlertRule[]>([])
  const history = ref<AlertHistoryEntry[]>([])
  const loading = ref(false)

  async function load(status?: string) {
    loading.value = true
    try {
      const resp = await fetchAlerts(status)
      alerts.value = resp?.items || []
    } catch (e) {
      console.error('Failed to load alerts:', e)
      alerts.value = []
    } finally {
      loading.value = false
    }
  }

  async function add(payload: Partial<AlertRule>) {
    const alert = await createAlert(payload)
    alerts.value.unshift(alert)
    return alert
  }

  async function edit(id: number, payload: Partial<AlertRule>) {
    const updated = await updateAlert(id, payload)
    const idx = alerts.value.findIndex((a: AlertRule) => a.id === id)
    if (idx >= 0) alerts.value[idx] = updated
    return updated
  }

  async function remove(id: number) {
    await deleteAlert(id)
    alerts.value = alerts.value.filter((a: AlertRule) => a.id !== id)
  }

  async function loadHistory(limit: number = 20) {
    try {
      const resp = await fetchAlertHistory(limit)
      history.value = resp?.items || []
    } catch (e) {
      console.error('Failed to load alert history:', e)
      history.value = []
    }
  }

  return { alerts, history, loading, load, add, edit, remove, loadHistory }
})
