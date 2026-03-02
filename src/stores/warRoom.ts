// stores/warRoom.ts — V10.3.3 War Room Pinia Store

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getWarRoomSnapshot,
  getPnLTicker,
  getIntelligenceFeed,
  getPortfolioExposure,
  getAlerts,
  getAlertStats,
  acknowledgeAlert,
  dismissAlert,
} from '@/api/warRoomService'
import type {
  WarRoomSnapshot,
  PnLTicker,
  IntelligenceFeedItem,
  PortfolioExposure,
  SmartAlert,
  AlertStats,
} from '@/api/warRoomService'

export const useWarRoomStore = defineStore('warRoom', () => {
  // ─── State ─────────────────────────────────────────────────────────────────
  const snapshot = ref<WarRoomSnapshot | null>(null)
  const pnlTicker = ref<PnLTicker | null>(null)
  const feed = ref<IntelligenceFeedItem[]>([])
  const exposure = ref<PortfolioExposure | null>(null)
  const alerts = ref<SmartAlert[]>([])
  const alertStats = ref<AlertStats | null>(null)

  const loadingSnapshot = ref(false)
  const loadingFeed = ref(false)
  const loadingAlerts = ref(false)
  const error = ref<string | null>(null)

  // Auto-refresh timers
  let pnlTimer: ReturnType<typeof setInterval> | null = null
  let feedTimer: ReturnType<typeof setInterval> | null = null

  // ─── Computed ──────────────────────────────────────────────────────────────
  const criticalAlerts = computed(() =>
    alerts.value.filter((a) => a.grade === 'CRITICAL' && !a.dismissed)
  )

  const unreadAlertsCount = computed(
    () => alerts.value.filter((a) => !a.acknowledged && !a.dismissed).length
  )

  const totalUnrealizedPnL = computed(() =>
    snapshot.value?.pnl_ticker?.total_unrealized_pnl ?? 0
  )

  const latestFeedItems = computed(() => feed.value.slice(0, 10))

  // ─── Actions ───────────────────────────────────────────────────────────────
  async function fetchSnapshot() {
    loadingSnapshot.value = true
    error.value = null
    try {
      snapshot.value = await getWarRoomSnapshot()
      if (snapshot.value.pnl_ticker) pnlTicker.value = snapshot.value.pnl_ticker
      if (snapshot.value.intelligence_feed) feed.value = snapshot.value.intelligence_feed
      if (snapshot.value.portfolio_exposure) exposure.value = snapshot.value.portfolio_exposure
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load War Room snapshot'
    } finally {
      loadingSnapshot.value = false
    }
  }

  async function refreshPnLTicker() {
    try {
      pnlTicker.value = await getPnLTicker()
    } catch {
      // silent refresh failure
    }
  }

  async function refreshFeed(category?: string) {
    loadingFeed.value = true
    try {
      feed.value = await getIntelligenceFeed(50, category)
    } finally {
      loadingFeed.value = false
    }
  }

  async function refreshExposure() {
    try {
      exposure.value = await getPortfolioExposure()
    } catch {
      // silent
    }
  }

  async function fetchAlerts(gradeFilter?: string, includeAcknowledged = false) {
    loadingAlerts.value = true
    try {
      const [list, stats] = await Promise.all([
        getAlerts(gradeFilter as import('@/api/warRoomService').AlertGrade | undefined, includeAcknowledged, 50),
        getAlertStats(),
      ])
      alerts.value = list
      alertStats.value = stats
    } finally {
      loadingAlerts.value = false
    }
  }

  async function ackAlert(alertId: string) {
    await acknowledgeAlert(alertId)
    const idx = alerts.value.findIndex((a) => String(a.id) === alertId)
    if (idx !== -1) alerts.value[idx].acknowledged = true
  }

  async function dsmAlert(alertId: string) {
    await dismissAlert(alertId)
    const idx = alerts.value.findIndex((a) => String(a.id) === alertId)
    if (idx !== -1) alerts.value[idx].dismissed = true
  }

  // ─── Auto-Refresh Control ──────────────────────────────────────────────────
  function startAutoRefresh() {
    stopAutoRefresh()
    // PnL ticker every 5 seconds
    pnlTimer = setInterval(refreshPnLTicker, 5_000)
    // Intelligence feed every 30 seconds
    feedTimer = setInterval(() => refreshFeed(), 30_000)
  }

  function stopAutoRefresh() {
    if (pnlTimer) { clearInterval(pnlTimer); pnlTimer = null }
    if (feedTimer) { clearInterval(feedTimer); feedTimer = null }
  }

  async function initWarRoom() {
    await fetchSnapshot()
    await fetchAlerts()
    startAutoRefresh()
  }

  function cleanup() {
    stopAutoRefresh()
  }

  return {
    // state
    snapshot,
    pnlTicker,
    feed,
    exposure,
    alerts,
    alertStats,
    loadingSnapshot,
    loadingFeed,
    loadingAlerts,
    error,
    // computed
    criticalAlerts,
    unreadAlertsCount,
    totalUnrealizedPnL,
    latestFeedItems,
    // actions
    fetchSnapshot,
    refreshPnLTicker,
    refreshFeed,
    refreshExposure,
    fetchAlerts,
    ackAlert,
    dsmAlert,
    startAutoRefresh,
    stopAutoRefresh,
    initWarRoom,
    cleanup,
  }
})
