// stores/observability.ts — V10.3.3 可观测性 Pinia Store

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getExecutionQuality,
  getExecutionQualityTrend,
  getFillHeatmap,
  getSignalIntelligence,
  getSignalCorrelation,
  getCrowdingAlerts,
  getRiskCluster,
  getFactorExposureHistory,
  getCorrelationAlerts,
} from '@/api/observabilityService'
import type {
  ExecutionQualityRecord,
  ExecutionTrendPoint,
  FillHeatmapCell,
  SignalIntelligenceResponse,
  CorrelationMatrix,
  FactorExposureSnapshot,
  RiskCluster,
  DimensionIntelligence,
} from '@/api/observabilityService'

export const useObservabilityStore = defineStore('observability', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const executionQuality = ref<ExecutionQualityRecord[]>([])
  const executionTrend = ref<ExecutionTrendPoint[]>([])
  const fillHeatmap = ref<FillHeatmapCell[]>([])
  const signalIntelligence = ref<SignalIntelligenceResponse | null>(null)
  const correlationMatrix = ref<CorrelationMatrix | null>(null)
  const crowdingAlerts = ref<DimensionIntelligence[]>([])
  const riskCluster = ref<RiskCluster | null>(null)
  const factorHistory = ref<FactorExposureSnapshot[]>([])
  const correlationAlertHistory = ref<FactorExposureSnapshot[]>([])

  const loadingExecution = ref(false)
  const loadingSignal = ref(false)
  const loadingRisk = ref(false)
  const error = ref<string | null>(null)

  // ─── Computed ─────────────────────────────────────────────────────────────
  const avgIsGrade = computed(() => {
    if (!executionQuality.value.length) return 'N/A'
    const grades = executionQuality.value.map((r) => r.grade || 'F')
    const gradePoints: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 }
    const avg =
      grades.reduce((sum, g) => sum + (gradePoints[g] || 1), 0) / grades.length
    if (avg >= 4.5) return 'A'
    if (avg >= 3.5) return 'B'
    if (avg >= 2.5) return 'C'
    if (avg >= 1.5) return 'D'
    return 'F'
  })

  const latestFactorSnap = computed(
    () => riskCluster.value?.latest_snapshot ?? null
  )

  const hasCrowdingAlert = computed(() => crowdingAlerts.value.length > 0)

  const hasCorrelationSpike = computed(
    () => riskCluster.value?.latest_snapshot?.correlation_spike ?? false
  )

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function fetchExecutionMicroscope(days = 30) {
    loadingExecution.value = true
    error.value = null
    try {
      const [quality, trend, heatmap] = await Promise.all([
        getExecutionQuality(50),
        getExecutionQualityTrend(days),
        getFillHeatmap(days),
      ])
      executionQuality.value = quality
      executionTrend.value = trend
      fillHeatmap.value = heatmap
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load execution data'
    } finally {
      loadingExecution.value = false
    }
  }

  async function fetchSignalIntelligence(symbols: string[] = []) {
    loadingSignal.value = true
    error.value = null
    try {
      const [intel, corr, crowding] = await Promise.all([
        getSignalIntelligence(),
        getSignalCorrelation(symbols),
        getCrowdingAlerts(),
      ])
      signalIntelligence.value = intel
      correlationMatrix.value = corr
      crowdingAlerts.value = crowding
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load signal intelligence'
    } finally {
      loadingSignal.value = false
    }
  }

  async function fetchRiskCluster(hours = 24) {
    loadingRisk.value = true
    error.value = null
    try {
      const [cluster, history, alerts] = await Promise.all([
        getRiskCluster(),
        getFactorExposureHistory(hours),
        getCorrelationAlerts(20),
      ])
      riskCluster.value = cluster
      factorHistory.value = history
      correlationAlertHistory.value = alerts
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load risk data'
    } finally {
      loadingRisk.value = false
    }
  }

  async function fetchAll() {
    await Promise.all([
      fetchExecutionMicroscope(),
      fetchSignalIntelligence(),
      fetchRiskCluster(),
    ])
  }

  return {
    // state
    executionQuality,
    executionTrend,
    fillHeatmap,
    signalIntelligence,
    correlationMatrix,
    crowdingAlerts,
    riskCluster,
    factorHistory,
    correlationAlertHistory,
    loadingExecution,
    loadingSignal,
    loadingRisk,
    error,
    // computed
    avgIsGrade,
    latestFactorSnap,
    hasCrowdingAlert,
    hasCorrelationSpike,
    // actions
    fetchExecutionMicroscope,
    fetchSignalIntelligence,
    fetchRiskCluster,
    fetchAll,
  }
})
