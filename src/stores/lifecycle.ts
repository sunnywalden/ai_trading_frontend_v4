/** V10.3: 交易生命周期 Pinia Store */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getPipelineDistribution,
  getPlanFsmSummary,
  getPositionFsmSummary,
  getFsmEvents,
  getDecisionProvenance,
  type PipelineDistribution,
  type PlanFsmSummary,
  type PositionFsmSummary,
  type FsmEventPage,
  type DecisionProvenance,
  type FsmTransitionEvent,
} from '@/api/lifecycleService'

export const useLifecycleStore = defineStore('lifecycle', () => {
  // ── State ─────────────────────────────────────────────────────────────────
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

  // FSM events 分页参数
  const eventPage     = ref(1)
  const eventSize     = ref(20)
  const eventFsmType  = ref<'PLAN' | 'POSITION' | undefined>(undefined)

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalActiveTasks = computed(() => pipeline.value?.total_active ?? 0)
  const pendingConfirmCount = computed(() =>
    planFsm.value?.states.find(s => s.state === 'PENDING_CONFIRM')?.count ?? 0
  )

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

  return {
    // state
    pipeline, planFsm, positionFsm, fsmEvents, provenance,
    provenanceOpen, selectedPlanId, loading, provenanceLoading, error,
    eventPage, eventSize, eventFsmType,
    // computed
    totalActiveTasks, pendingConfirmCount,
    // actions
    fetchAll, fetchFsmEvents, openProvenance, closeProvenance, setEventFsmType, setEventPage,
  }
})
