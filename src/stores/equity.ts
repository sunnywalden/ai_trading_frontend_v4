/**
 * V9: Equity Store (Pinia)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchEquitySnapshots, fetchPnlAttribution,
  type EquitySnapshot, type PnlAttributionItem
} from '@/api/client'

export const useEquityStore = defineStore('equity', () => {
  const snapshots = ref<EquitySnapshot[]>([])
  const attributions = ref<PnlAttributionItem[]>([])
  const totalPnl = ref(0)
  const loading = ref(false)

  async function loadSnapshots(days: number = 30) {
    loading.value = true
    try {
      const resp = await fetchEquitySnapshots(days)
      snapshots.value = resp?.snapshots || []
    } catch (e) {
      console.error('Failed to load snapshots:', e)
      snapshots.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadAttribution(groupBy: string = 'symbol') {
    try {
      const resp = await fetchPnlAttribution(groupBy)
      attributions.value = resp?.items || []
      totalPnl.value = resp?.total_pnl || 0
    } catch (e) {
      console.error('Failed to load attribution:', e)
      attributions.value = []
      totalPnl.value = 0
    }
  }

  return { snapshots, attributions, totalPnl, loading, loadSnapshots, loadAttribution }
})
