/** V10.3: 智能订单簿 Pinia Store */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  listOrders,
  getOrderBookSummary,
  getOrderDetail,
  updateStopLoss,
  type OrderBookResponse,
  type OrderBookSummary,
  type OrderBookRow,
  type OrderBookFilters,
  type StopLossUpdateRequest,
} from '@/api/orderBookService'

export const useOrderBookStore = defineStore('orderBook', () => {
  // ── State ─────────────────────────────────────────────────────────────────
  const response       = ref<OrderBookResponse | null>(null)
  const summary        = ref<OrderBookSummary | null>(null)
  const selectedOrder  = ref<OrderBookRow | null>(null)
  const detailOpen     = ref(false)

  const loading        = ref(false)
  const detailLoading  = ref(false)
  const error          = ref<string | null>(null)

  const filters        = ref<OrderBookFilters>({})
  const searchKeyword  = ref('')

  // ── Computed ──────────────────────────────────────────────────────────────
  const activeGroup = computed(() =>
    response.value?.groups.find(g => g.group_id === 'active')
  )
  const monitoringGroup = computed(() =>
    response.value?.groups.find(g => g.group_id === 'monitoring')
  )
  const completedGroup = computed(() =>
    response.value?.groups.find(g => g.group_id === 'completed')
  )
  const totalCount = computed(() => response.value?.total ?? 0)

  // ── Actions ───────────────────────────────────────────────────────────────
  async function fetchOrders() {
    loading.value = true
    error.value   = null
    try {
      const params: OrderBookFilters = {
        ...filters.value,
        search: searchKeyword.value || undefined,
      }
      response.value = await listOrders(params)
    } catch (e: any) {
      error.value = e.message || '加载订单失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchSummary() {
    try {
      summary.value = await getOrderBookSummary()
    } catch (e: any) {
      error.value = e.message
    }
  }

  async function openDetail(planId: number) {
    detailOpen.value    = true
    detailLoading.value = true
    selectedOrder.value = null
    try {
      selectedOrder.value = await getOrderDetail(planId)
    } catch (e: any) {
      error.value = e.message
    } finally {
      detailLoading.value = false
    }
  }

  function closeDetail() {
    detailOpen.value    = false
    selectedOrder.value = null
  }

  async function modifyStopLoss(planId: number, body: StopLossUpdateRequest) {
    try {
      const result = await updateStopLoss(planId, body)
      // 更新本地数据
      if (response.value) {
        for (const group of response.value.groups) {
          const item = group.items.find(i => i.plan_id === planId)
          if (item) {
            item.stop_loss = result.new_stop_loss
          }
        }
      }
      return result
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  function setFilter(key: keyof OrderBookFilters, value: any) {
    filters.value = { ...filters.value, [key]: value || undefined }
    fetchOrders()
  }

  function clearFilters() {
    filters.value      = {}
    searchKeyword.value = ''
    fetchOrders()
  }

  return {
    // state
    response, summary, selectedOrder, detailOpen,
    loading, detailLoading, error, filters, searchKeyword,
    // computed
    activeGroup, monitoringGroup, completedGroup, totalCount,
    // actions
    fetchOrders, fetchSummary, openDetail, closeDetail, modifyStopLoss,
    setFilter, clearFilters,
  }
})
