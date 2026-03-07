/** V10.4.4: 交易生命周期 Pinia Store – position-centric + legacy FSM compat */
import {
    getDecisionProvenance,
    getFsmEvents,
    getPipelineDistribution,
    getPlanFsmSummary,
    getPositionFsmSummary,
    type DecisionProvenance,
    type FsmEventPage,
    type PipelineDistribution,
    type PlanFsmSummary,
    type PositionFsmSummary
} from '@/api/lifecycleService'
import { positionsApi } from '@/api/positionLifecycleService'
import type { ExecutionSlice, PortfolioSummary, Position, PositionDetail, PositionLifecycleEvent } from '@/types/position'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useLifecycleStore = defineStore('lifecycle', () => {
  // ── Legacy FSM state (V10.3 backward compat) ──────────────────────────────
  const pipeline        = ref<PipelineDistribution | null>(null)
  const planFsm         = ref<PlanFsmSummary | null>(null)
  const positionFsm     = ref<PositionFsmSummary | null>(null)
  const fsmEvents       = ref<FsmEventPage | null>(null)
  const provenance      = ref<DecisionProvenance | null>(null)
  const provenanceOpen  = ref(false)
  const selectedPlanId  = ref<number | null>(null)

  const loading         = ref(false)
  const provenanceLoading = ref(false)
  const error           = ref<string | null>(null)

  // FSM events pagination
  const eventPage     = ref(1)
  const eventSize     = ref(20)
  const eventFsmType  = ref<'PLAN' | 'POSITION' | undefined>(undefined)

  // ── V10.4.4 Position-centric state ────────────────────────────────────────
  const positions           = ref<Position[]>([])
  const exceptionPositions  = ref<Position[]>([])
  const stuckSlices         = ref<ExecutionSlice[]>([])
  const portfolioSummary    = ref<PortfolioSummary>({
    active_positions: 0,
    exception_positions: 0,
    stuck_slices: 0,
  })
  const selectedPosition    = ref<PositionDetail | null>(null)
  const positionTimeline    = ref<PositionLifecycleEvent[]>([])
  const positionDetailOpen  = ref(false)
  const posLoading          = ref(false)
  const posError            = ref<string | null>(null)

  // ── Computed (legacy) ─────────────────────────────────────────────────────
  const totalActiveTasks = computed(() => pipeline.value?.total_active ?? 0)
  const pendingConfirmCount = computed(() =>
    planFsm.value?.states.find(s => s.state === 'PENDING_CONFIRM')?.count ?? 0
  )

  // ── Computed (V10.4.4) ────────────────────────────────────────────────────
  const activePositionCount    = computed(() => portfolioSummary.value.active_positions)
  const exceptionPositionCount = computed(() => portfolioSummary.value.exception_positions)
  const stuckSliceCount        = computed(() => portfolioSummary.value.stuck_slices)

  // ── Actions ───────────────────────────────────────────────────────────────
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const [p, pf, posf] = await Promise.all([
        getPipelineDistribution(),
        getPlanFsmSummary(),
        getPositionFsmSummary(),
      ])
      pipeline.value    = p
      planFsm.value     = pf
      positionFsm.value = posf
    } catch (e: any) {
      error.value = e.message || '加载失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchFsmEvents() {
    try {
      fsmEvents.value = await getFsmEvents({
        page: eventPage.value,
        size: eventSize.value,
        fsm_type: eventFsmType.value,
      })
    } catch (e: any) {
      error.value = e.message
    }
  }

  async function openProvenance(planId: number) {
    selectedPlanId.value  = planId
    provenanceOpen.value  = true
    provenanceLoading.value = true
    provenance.value      = null
    try {
      provenance.value = await getDecisionProvenance(planId)
    } catch (e: any) {
      error.value = e.message
    } finally {
      provenanceLoading.value = false
    }
  }

  function closeProvenance() {
    provenanceOpen.value = false
    provenance.value     = null
    selectedPlanId.value = null
  }

  function setEventFsmType(type: 'PLAN' | 'POSITION' | undefined) {
    eventFsmType.value = type
    eventPage.value    = 1
    fetchFsmEvents()
  }

  function setEventPage(page: number) {
    eventPage.value = page
    fetchFsmEvents()
  }

  // ── V10.4.4 Position-centric actions ─────────────────────────────────────

  async function fetchPositions(accountId: string) {
    posLoading.value = true
    posError.value = null
    try {
      const [posResp, summaryResp] = await Promise.all([
        positionsApi.listActive(accountId),
        positionsApi.portfolioSummary(accountId),
      ])
      positions.value = posResp.data
      portfolioSummary.value = summaryResp.data
    } catch (e: any) {
      posError.value = e.message || '加载仓位失败'
    } finally {
      posLoading.value = false
    }
  }

  async function fetchExceptions(accountId: string) {
    try {
      const { data } = await positionsApi.listExceptions(accountId)
      exceptionPositions.value = data
    } catch (e: any) {
      posError.value = e.message
    }
  }

  async function fetchStuckSlices(accountId: string) {
    try {
      const { data } = await positionsApi.listStuckSlices(accountId)
      stuckSlices.value = data
    } catch (e: any) {
      posError.value = e.message
    }
  }

  async function openPositionDetail(positionId: number) {
    positionDetailOpen.value = true
    posLoading.value = true
    selectedPosition.value = null
    positionTimeline.value = []
    try {
      const [detailResp, timelineResp] = await Promise.all([
        positionsApi.getDetail(positionId),
        positionsApi.getTimeline(positionId),
      ])
      selectedPosition.value = detailResp.data
      positionTimeline.value = timelineResp.data
    } catch (e: any) {
      posError.value = e.message
    } finally {
      posLoading.value = false
    }
  }

  function closePositionDetail() {
    positionDetailOpen.value = false
    selectedPosition.value = null
    positionTimeline.value = []
  }

  async function manualClosePosition(positionId: number, actor?: string, note?: string) {
    await positionsApi.manualClose(positionId, { actor, note })
  }

  return {
    // legacy FSM state
    pipeline, planFsm, positionFsm, fsmEvents, provenance,
    provenanceOpen, selectedPlanId, loading, provenanceLoading, error,
    eventPage, eventSize, eventFsmType,
    // legacy computed
    totalActiveTasks, pendingConfirmCount,
    // legacy actions
    fetchAll, fetchFsmEvents, openProvenance, closeProvenance, setEventFsmType, setEventPage,
    // V10.4.4 position state
    positions, exceptionPositions, stuckSlices, portfolioSummary,
    selectedPosition, positionTimeline, positionDetailOpen,
    posLoading, posError,
    // V10.4.4 computed
    activePositionCount, exceptionPositionCount, stuckSliceCount,
    // V10.4.4 actions
    fetchPositions, fetchExceptions, fetchStuckSlices,
    openPositionDetail, closePositionDetail, manualClosePosition,
  }
})
