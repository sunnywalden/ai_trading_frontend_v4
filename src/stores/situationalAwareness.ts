/** V10.3: 全局态势感知 Pinia Store（WebSocket + REST备用） */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getSituationalAwarenessSnapshot,
  connectSaWebSocket,
  type SituationalAwarenessSnapshot,
} from '@/api/situationalAwarenessService'

export const useSituationalAwarenessStore = defineStore('situationalAwareness', () => {
  // ── State ─────────────────────────────────────────────────────────────────
  const snapshot    = ref<SituationalAwarenessSnapshot | null>(null)
  const connected   = ref(false)
  const loading     = ref(false)
  const error       = ref<string | null>(null)

  let _ws: WebSocket | null = null
  let _pollTimer: ReturnType<typeof setInterval> | null = null

  // ── Computed ──────────────────────────────────────────────────────────────
  const regime   = computed(() => snapshot.value?.regime)
  const varBlock = computed(() => snapshot.value?.var)
  const pendingConfirmCount = computed(() => snapshot.value?.pending_confirms.count ?? 0)
  const autonomyLevel = computed(() => snapshot.value?.autonomy.level ?? 'ADVISORY')
  const hasPendingAlerts = computed(() => pendingConfirmCount.value > 0)

  // ── Actions ───────────────────────────────────────────────────────────────
  async function fetchSnapshot() {
    loading.value = true
    try {
      snapshot.value = await getSituationalAwarenessSnapshot()
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function connectWS(token: string) {
    if (_ws) return  // already connected

    try {
      _ws = connectSaWebSocket(
        token,
        (data) => {
          snapshot.value = data
          connected.value = true
        },
        (err) => {
          console.warn('[SA] WS error, falling back to polling')
          connected.value = false
          startPolling()
        },
      )

      _ws.onopen  = () => { connected.value = true }
      _ws.onclose = () => {
        connected.value = false
        _ws = null
        // 5 秒后重连
        setTimeout(() => connectWS(token), 5000)
      }
    } catch (e) {
      startPolling()
    }
  }

  function startPolling(intervalMs = 5000) {
    if (_pollTimer) return
    fetchSnapshot()
    _pollTimer = setInterval(fetchSnapshot, intervalMs)
  }

  function stopPolling() {
    if (_pollTimer) {
      clearInterval(_pollTimer)
      _pollTimer = null
    }
  }

  function disconnect() {
    stopPolling()
    if (_ws) {
      _ws.close()
      _ws = null
    }
    connected.value = false
  }

  return {
    // state
    snapshot, connected, loading, error,
    // computed
    regime, varBlock, pendingConfirmCount, autonomyLevel, hasPendingAlerts,
    // actions
    fetchSnapshot, connectWS, startPolling, stopPolling, disconnect,
  }
})
