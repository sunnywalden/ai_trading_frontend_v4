/** V10.3: 全局态势感知 Pinia Store（WebSocket + REST备用） */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logger } from '@/utils/logger'
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
  let _fetchPromise: Promise<void> | null = null
  let _reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let _manualDisconnect = false
  let _wsFallbackLogged = false

  // ── Computed ──────────────────────────────────────────────────────────────
  const regime   = computed(() => snapshot.value?.regime)
  const varBlock = computed(() => snapshot.value?.var)
  const pendingConfirmCount = computed(() => snapshot.value?.pending_confirms.count ?? 0)
  const autonomyLevel = computed(() => snapshot.value?.autonomy.level ?? 'ADVISORY')
  const hasPendingAlerts = computed(() => pendingConfirmCount.value > 0)

  // ── Actions ───────────────────────────────────────────────────────────────
  async function fetchSnapshot() {
    if (_fetchPromise) return _fetchPromise

    _fetchPromise = (async () => {
      loading.value = true
      try {
        snapshot.value = await getSituationalAwarenessSnapshot()
        error.value = null
      } catch (e: any) {
        error.value = e.message
      } finally {
        loading.value = false
        _fetchPromise = null
      }
    })()

    return _fetchPromise
  }

  function connectWS(token: string) {
    if (_ws) return  // already connected
    _manualDisconnect = false
    if (_reconnectTimer) {
      clearTimeout(_reconnectTimer)
      _reconnectTimer = null
    }

    try {
      _ws = connectSaWebSocket(
        token,
        (data) => {
          snapshot.value = data
          connected.value = true
          error.value = null
          _wsFallbackLogged = false
          stopPolling()
        },
        () => {
          connected.value = false
          if (!_wsFallbackLogged) {
            logger.debug('[SA] WebSocket unavailable, falling back to polling')
            _wsFallbackLogged = true
          }
          startPolling(15000)
        },
      )

      _ws.onopen  = () => {
        connected.value = true
        _wsFallbackLogged = false
        stopPolling()
      }
      _ws.onclose = () => {
        connected.value = false
        _ws = null
        if (_manualDisconnect) return
        startPolling(15000)
        if (!_wsFallbackLogged) {
          logger.debug('[SA] WebSocket closed, polling mode enabled')
          _wsFallbackLogged = true
        }
        // 5 秒后重连
        _reconnectTimer = setTimeout(() => {
          _reconnectTimer = null
          connectWS(token)
        }, 5000)
      }
    } catch (e) {
      startPolling(15000)
    }
  }

  function startPolling(intervalMs = 15000) {
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
    _manualDisconnect = true
    stopPolling()
    if (_reconnectTimer) {
      clearTimeout(_reconnectTimer)
      _reconnectTimer = null
    }
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
