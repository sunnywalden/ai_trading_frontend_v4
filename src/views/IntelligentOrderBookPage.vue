<template>
  <div class="iob-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="page-title">
        <span class="title-icon">📋</span>
        智能订单簿
        <span class="version-badge">V10.3</span>
      </div>
      <div class="header-actions">
        <span class="last-updated">更新: {{ lastUpdated }}</span>
        <button class="refresh-btn" :class="{ spinning: loading }" @click="refresh" title="F5刷新">↻</button>
      </div>
    </div>

    <div v-if="hasFocusContext" class="focus-banner">
      <div>
        <strong>来自审计链路的聚焦视图</strong>
        <p>
          <span v-if="focusSymbol">Symbol: {{ focusSymbol }}</span>
          <span v-if="focusAction"> · Action: {{ focusAction }}</span>
          <span v-if="focusIntentId"> · Intent: {{ focusIntentId }}</span>
          <span v-if="focusOrderId"> · Order: {{ focusOrderId }}</span>
        </p>
        <div v-if="focusSourceLabel || focusUpstreamSourceLabel || focusMatchLabel" class="focus-meta">
          <span v-if="focusSourceLabel" class="focus-chip">{{ focusSourceLabel }}</span>
          <span v-if="focusUpstreamSourceLabel" class="focus-chip">{{ focusUpstreamSourceLabel }}</span>
          <span v-if="focusMatchLabel" class="focus-chip accent">{{ focusMatchLabel }}</span>
        </div>
        <p v-if="focusAuditNote" class="focus-note">{{ focusAuditNote }}</p>
      </div>
      <div class="focus-actions">
        <button class="focus-btn" @click="openExecutionPolicy">返回执行策略</button>
        <button class="focus-btn ghost" @click="clearFocus">清除聚焦</button>
      </div>
    </div>

    <!-- 汇总栏 -->
    <div v-if="ob.summary" class="summary-bar">
      <div class="sum-block">
        <span class="sum-label">活跃单</span>
        <span class="sum-val green">{{ ob.summary.total_active }}</span>
      </div>
      <div class="sum-sep"></div>
      <div class="sum-block">
        <span class="sum-label">监控中</span>
        <span class="sum-val blue">{{ ob.summary.total_monitoring }}</span>
      </div>
      <div class="sum-sep"></div>
      <div class="sum-block">
        <span class="sum-label">今日完成</span>
        <span class="sum-val">{{ ob.summary.total_completed_today }}</span>
      </div>
      <div class="sum-sep"></div>
      <div class="sum-block">
        <span class="sum-label">买入 / 卖出</span>
        <span class="sum-val">{{ ob.summary.buy_count }} / {{ ob.summary.sell_count }}</span>
      </div>
      <div class="sum-sep"></div>
      <div class="sum-block">
        <span class="sum-label">未平仓PnL</span>
        <span class="sum-val" :class="(ob.summary.total_unrealized_pnl ?? 0) >= 0 ? 'green' : 'red'">
          {{ fmtPnl(ob.summary.total_unrealized_pnl) }}
        </span>
      </div>
      <div class="sum-sep"></div>
      <div class="sum-block">
        <span class="sum-label">平均置信</span>
        <span class="sum-val">{{ ob.summary.avg_confidence != null ? ob.summary.avg_confidence.toFixed(1) + '%' : '—' }}</span>
      </div>
    </div>

    <!-- 订单表格 -->
    <div class="table-section">
      <OrderBookTable
        :active-rows="ob.activeGroup?.items ?? []"
        :monitoring-rows="ob.monitoringGroup?.items ?? []"
        :completed-rows="ob.completedGroup?.items ?? []"
        :loading="loading"
        @filterChange="onFilterChange"
        @searchChange="onSearchChange"
        @detail="openDetail"
        @policy="openPolicyFromRow"
        @stopLoss="openStopLoss"
      />
    </div>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="ob.detailOpen" class="modal-overlay" @click.self="ob.closeDetail()">
          <div class="detail-modal-box">
            <div class="detail-modal-head">
              <div>
                <div class="modal-title">订单详情 — {{ ob.selectedOrder?.symbol || '加载中' }}</div>
                <p v-if="ob.selectedOrder" class="detail-subtitle">
                  Plan #{{ ob.selectedOrder.plan_id }} · {{ ob.selectedOrder.plan_status }}
                </p>
              </div>
              <button class="close-btn" @click="ob.closeDetail()">关闭</button>
            </div>

            <div v-if="ob.detailLoading" class="detail-placeholder">正在加载订单详情...</div>
            <div v-else-if="!ob.selectedOrder" class="detail-placeholder">暂无详情</div>
            <div v-else class="detail-stack">
              <section v-if="detailAuditVisible" class="detail-audit-card">
                <strong>审计链路</strong>
                <p>
                  <span v-if="detailIntentId">Intent: {{ detailIntentId }}</span>
                  <span v-if="detailOrderId"> · Order: {{ detailOrderId }}</span>
                </p>
                <div class="focus-meta">
                  <span v-if="detailSourceLabel" class="focus-chip">{{ detailSourceLabel }}</span>
                  <span v-if="detailUpstreamSourceLabel" class="focus-chip">{{ detailUpstreamSourceLabel }}</span>
                  <span v-if="detailMatchLabel" class="focus-chip accent">{{ detailMatchLabel }}</span>
                </div>
                <p v-if="detailAuditNote" class="focus-note">{{ detailAuditNote }}</p>
              </section>

              <section class="detail-grid">
                <div class="detail-item"><span>方向</span><strong>{{ ob.selectedOrder.direction || '—' }}</strong></div>
                <div class="detail-item"><span>阶段</span><strong>{{ ob.selectedOrder.pipeline_stage_name || '—' }}</strong></div>
                <div class="detail-item"><span>来源</span><strong>{{ ob.selectedOrder.source || '—' }}</strong></div>
                <div class="detail-item"><span>自主动作</span><strong>{{ ob.selectedOrder.autonomy_action || '—' }}</strong></div>
                <div class="detail-item"><span>目标价</span><strong>{{ fmtPx(ob.selectedOrder.entry_price_target) }}</strong></div>
                <div class="detail-item"><span>成交均价</span><strong>{{ fmtPx(ob.selectedOrder.fill_avg_price) }}</strong></div>
                <div class="detail-item"><span>止损价</span><strong>{{ fmtPx(ob.selectedOrder.stop_loss) }}</strong></div>
                <div class="detail-item"><span>止盈价</span><strong>{{ fmtPx(ob.selectedOrder.take_profit) }}</strong></div>
              </section>

              <section class="detail-summary-card">
                <h4>AI 摘要</h4>
                <p>{{ ob.selectedOrder.ai_summary || '暂无摘要' }}</p>
              </section>

              <div class="detail-actions">
                <button class="focus-btn" @click="openPolicyFromDetail">查看执行策略</button>
                <button class="focus-btn" @click="openMicroscopeFromDetail">查看执行显微镜</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 止损修改弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="stopLossOpen" class="modal-overlay" @click.self="stopLossOpen = false">
          <div class="modal-box">
            <div class="modal-title">✏️ 修改止损价 — {{ stopLossRow?.symbol }}</div>
            <div class="modal-field">
              <label for="stop-loss-input">新止损价</label>
              <input id="stop-loss-input" v-model.number="newStopLoss" type="number" class="modal-input" step="0.01" />
            </div>
            <div class="modal-actions">
              <button class="cancel-btn" @click="stopLossOpen = false">取消</button>
              <button class="confirm-btn" @click="confirmStopLoss" :disabled="saving">
                {{ saving ? '保存中...' : '确认' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { OrderBookRow } from '@/api/orderBookService'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import OrderBookTable from '@/components/OrderBookTable.vue'
import { useOrderBookStore } from '@/stores/orderBook'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const ob = useOrderBookStore()
const route = useRoute()
const router = useRouter()

const loading      = ref(false)
const lastUpdated  = ref('—')
const stopLossOpen = ref(false)
const stopLossRow  = ref<OrderBookRow | null>(null)
const newStopLoss  = ref<number>(0)
const saving       = ref(false)

const SOURCE_LABELS: Record<string, string> = {
  'order-book-row': '来源: 订单簿行级回溯',
  'order-book': '来源: 智能订单簿',
  'execution-policy': '来源: 执行策略控制台',
  'execution-microscope': '来源: 执行显微镜',
}

const focusSymbol = computed(() => {
  const value = route.query.symbol
  return typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : ''
})
const focusAction = computed(() => {
  const value = route.query.action
  return typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : ''
})
const focusIntentId = computed(() => {
  const value = Number(route.query.intentId)
  return Number.isFinite(value) && value > 0 ? value : null
})
const focusOrderId = computed(() => {
  const value = route.query.orderId
  return typeof value === 'string' && value.trim() ? value.trim() : ''
})
const focusSource = computed(() => {
  const value = route.query.source
  return typeof value === 'string' && value.trim() ? value.trim() : ''
})
const focusUpstreamSource = computed(() => {
  const value = route.query.upstreamSource
  return typeof value === 'string' && value.trim() ? value.trim() : ''
})
const focusMatchMode = computed(() => {
  const value = route.query.matchMode
  return typeof value === 'string' && value.trim() ? value.trim() : ''
})
const hasFocusContext = computed(() => Boolean(
  focusSymbol.value
    || focusAction.value
    || focusIntentId.value
    || focusOrderId.value
    || focusMatchMode.value,
))
const focusSourceLabel = computed(() => SOURCE_LABELS[focusSource.value] || '')
const focusUpstreamSourceLabel = computed(
  () => SOURCE_LABELS[focusUpstreamSource.value] || '',
)
const focusMatchLabel = computed(() => {
  if (focusMatchMode.value === 'order_id') return '命中方式: Broker Order 精确定位'
  if (focusMatchMode.value === 'fallback_filters') return '命中方式: 后端回退筛选'
  if (focusMatchMode.value === 'not_found') return '命中方式: Broker Order 未命中'
  if (focusIntentId.value) return '命中方式: Intent 精确定位'
  return ''
})
const focusAuditNote = computed(() => {
  if (focusMatchMode.value === 'order_id' && focusOrderId.value) {
    return `当前订单簿保留了 Broker Order ${focusOrderId.value} 的精确审计链路。`
  }
  if (focusMatchMode.value === 'fallback_filters' && focusOrderId.value) {
    return `当前订单簿保留了 Broker Order ${focusOrderId.value} 的回退筛选上下文。`
  }
  if (focusIntentId.value) {
    return '当前订单簿保留了执行意图上下文，可继续向策略页或显微镜追溯。'
  }
  return ''
})

const detailIntentId = computed(
  () => ob.selectedOrder?.execution_intent_db_id || focusIntentId.value,
)
const detailOrderId = computed(
  () => ob.selectedOrder?.broker_order_id || focusOrderId.value,
)
const detailSourceLabel = computed(() => focusSourceLabel.value)
const detailUpstreamSourceLabel = computed(() => focusUpstreamSourceLabel.value)
const detailMatchLabel = computed(() => focusMatchLabel.value)
const detailAuditNote = computed(() => {
  if (ob.selectedOrder?.execution_intent_db_id) {
    return '该订单已解析出精确 execution intent，可直接跳转执行策略和执行显微镜。'
  }
  return focusAuditNote.value
})
const detailAuditVisible = computed(() => Boolean(
  detailIntentId.value
    || detailOrderId.value
    || detailSourceLabel.value
    || detailUpstreamSourceLabel.value
    || detailMatchLabel.value,
))

let autoRefreshTimer: number | undefined

function syncRouteFilters() {
  ob.searchKeyword = focusSymbol.value
  ob.filters = {
    ...ob.filters,
    direction:
      focusAction.value === 'BUY' || focusAction.value === 'SELL'
        ? focusAction.value
        : undefined,
  }
}

async function refresh() {
  loading.value = true
  try {
    syncRouteFilters()
    await Promise.all([ob.fetchOrders(), ob.fetchSummary()])
    lastUpdated.value = new Date().toLocaleTimeString('zh-CN')
  } finally {
    loading.value = false
  }
}

function onFilterChange(newFilters: any) {
  ob.filters = newFilters
  ob.fetchOrders()
}

function onSearchChange(keyword: string) {
  ob.searchKeyword = keyword
  ob.fetchOrders()
}

function openDetail(row: OrderBookRow) {
  ob.openDetail(row.plan_id)
}

function openExecutionPolicy() {
  router.push({
    path: '/execution-policy',
    query: {
      symbol: focusSymbol.value || undefined,
      action: focusAction.value || undefined,
      intentId: focusIntentId.value ? String(focusIntentId.value) : undefined,
      orderId: focusOrderId.value || undefined,
      matchMode: focusMatchMode.value || undefined,
      upstreamSource: focusUpstreamSource.value || undefined,
      source: 'order-book',
    },
  })
}

function openPolicyFromRow(row: OrderBookRow) {
  router.push({
    path: '/execution-policy',
    query: {
      intentId: row.execution_intent_db_id
        ? String(row.execution_intent_db_id)
        : undefined,
      symbol: row.symbol || undefined,
      action: row.direction || undefined,
      orderId: row.broker_order_id || undefined,
      source: 'order-book-row',
    },
  })
}

function clearFocus() {
  ob.closeDetail()
  router.replace({ path: '/order-book' })
}

function openPolicyFromDetail() {
  const row = ob.selectedOrder
  if (!row) return
  router.push({
    path: '/execution-policy',
    query: {
      intentId: row.execution_intent_db_id ? String(row.execution_intent_db_id) : undefined,
      symbol: row.symbol || focusSymbol.value || undefined,
      action: row.direction || focusAction.value || undefined,
      orderId: row.broker_order_id || focusOrderId.value || undefined,
      matchMode: focusMatchMode.value || undefined,
      upstreamSource: focusUpstreamSource.value || focusSource.value || undefined,
      source: 'order-book',
    },
  })
}

function openMicroscopeFromDetail() {
  const row = ob.selectedOrder
  if (!row) return
  router.push({
    path: '/observability/execution',
    query: {
      symbol: row.symbol || focusSymbol.value || undefined,
      intentId: row.execution_intent_db_id ? String(row.execution_intent_db_id) : undefined,
      orderId: row.broker_order_id || focusOrderId.value || undefined,
      matchMode: focusMatchMode.value || undefined,
      upstreamSource: focusUpstreamSource.value || focusSource.value || undefined,
      source: 'order-book',
    },
  })
}

function openStopLoss(row: OrderBookRow) {
  stopLossRow.value = row
  newStopLoss.value = row.stop_loss ?? 0
  stopLossOpen.value = true
}

async function confirmStopLoss() {
  if (!stopLossRow.value) return
  saving.value = true
  try {
    await ob.modifyStopLoss(stopLossRow.value.plan_id, { new_stop_loss: newStopLoss.value })
    stopLossOpen.value = false
  } finally {
    saving.value = false
  }
}

function fmtCurrency(v: number | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

function fmtPnl(v: number | undefined): string {
  if (v == null) return '—'
  return (v >= 0 ? '+' : '') + v.toFixed(1)
}

function fmtPx(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toFixed(2)
}

// 键盘快捷键
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
    e.preventDefault()
    refresh()
  }
}

onMounted(() => {
  refresh()
  autoRefreshTimer = globalThis.setInterval(refresh, 60_000)
  globalThis.addEventListener('keydown', onKeydown)
})

watch(
  () => [
    route.query.symbol,
    route.query.action,
    route.query.intentId,
    route.query.orderId,
    route.query.matchMode,
    route.query.source,
    route.query.upstreamSource,
  ],
  refresh,
)

onUnmounted(() => {
  clearInterval(autoRefreshTimer)
  globalThis.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.iob-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 16px;
  gap: 10px;
  box-sizing: border-box;
  overflow: hidden;
}

/* ---- 页头 ---- */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #e2e8f0;
}
.title-icon { font-size: 18px; }
.version-badge {
  font-size: 10px;
  background: rgba(67,56,202,0.58);
  color: #e0e7ff;
  padding: 1px 6px;
  border-radius: 10px;
  border: 1px solid rgba(99,102,241,0.35);
}

.header-actions { display: flex; align-items: center; gap: 8px; }
.last-updated { font-size: 11px; color: #64748b; }

.focus-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(38, 50, 81, 0.72);
  border: 1px solid rgba(96, 165, 250, 0.22);
  border-radius: 8px;
}

.focus-banner p {
  margin: 4px 0 0;
  color: #9fb3cf;
  font-size: 12px;
}

.focus-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }

.focus-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(125, 211, 252, 0.35);
  background: rgba(20, 44, 84, 0.86);
  color: #f8fbff;
  font-size: 11px;
  font-weight: 600;
}

.focus-chip.accent {
  border-color: rgba(250, 204, 21, 0.38);
  background: rgba(104, 74, 11, 0.88);
  color: #fff7df;
}

.focus-note {
  margin: 10px 0 0 !important;
  color: #d7e5f7 !important;
  font-size: 12px;
}

.focus-actions { display: flex; gap: 8px; }

.focus-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(96,165,250,0.5);
  background: rgba(30,64,175,0.82);
  color: #e0f2fe;
  cursor: pointer;
  font-weight: 500;
}

.focus-btn.ghost {
  background: transparent;
  border-color: rgba(148,163,184,0.22);
  color: #cbd5e1;
}

.refresh-btn {
  font-size: 16px;
  color: #6366f1;
  background: transparent;
  border: 1px solid rgba(99,102,241,0.3);
  border-radius: 6px;
  cursor: pointer;
  padding: 3px 8px;
}
.refresh-btn.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ---- 汇总栏 ---- */
.summary-bar {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  flex-shrink: 0;
  gap: 12px;
}

.sum-block { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.sum-label { font-size: 10px; color: #64748b; }
.sum-val   { font-size: 15px; font-weight: 700; color: #e2e8f0; }
.sum-val.green { color: #10b981; }
.sum-val.blue  { color: #60a5fa; }
.sum-val.amber { color: #f59e0b; }
.sum-val.red   { color: #ef4444; }

.sum-sep { width: 1px; height: 28px; background: rgba(255,255,255,0.07); }

/* ---- 表格 ---- */
.table-section { flex: 1; overflow: hidden; }

/* ---- 止损弹框 ---- */
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  width: 340px;
  background: #111827;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-modal-box {
  width: min(760px, calc(100vw - 32px));
  max-height: calc(100vh - 40px);
  overflow: auto;
  background: #111827;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-subtitle {
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 12px;
}

.close-btn {
  padding: 7px 14px;
  font-size: 12px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid rgba(148,163,184,0.22);
  color: #cbd5e1;
  cursor: pointer;
}

.detail-placeholder {
  min-height: 160px;
  display: grid;
  place-items: center;
  color: #94a3b8;
  border: 1px dashed rgba(148,163,184,0.18);
  border-radius: 10px;
}

.detail-stack { display: grid; gap: 14px; }

.detail-audit-card,
.detail-summary-card {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 14px;
  background: rgba(255,255,255,0.03);
}

.detail-audit-card p,
.detail-summary-card p {
  margin: 6px 0 0;
  color: #dbe4f1;
  font-size: 13px;
  line-height: 1.6;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
}

.detail-item span {
  font-size: 11px;
  color: #94a3b8;
}

.detail-item strong {
  font-size: 14px;
  color: #f8fafc;
}

.detail-summary-card h4 {
  margin: 0;
  color: #f8fafc;
  font-size: 13px;
}

.detail-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.modal-title {
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modal-field label { font-size: 11px; color: #94a3b8; }
.modal-input {
  background: #020617;
  border: 1px solid rgba(148,163,184,0.22);
  border-radius: 6px;
  color: #f8fafc;
  font-size: 13px;
  padding: 8px 10px;
  outline: none;
}
.modal-input:focus { border-color: rgba(99,102,241,0.5); }

.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }

.cancel-btn {
  padding: 7px 16px;
  font-size: 12px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  color: #94a3b8;
  cursor: pointer;
}
.cancel-btn:hover { background: rgba(255,255,255,0.07); }

.confirm-btn {
  padding: 7px 16px;
  font-size: 12px;
  border-radius: 6px;
  background: rgba(67,56,202,0.72);
  border: 1px solid rgba(99,102,241,0.5);
  color: #eef2ff;
  cursor: pointer;
  font-weight: 600;
}
.confirm-btn:hover:not(:disabled) { background: rgba(99,102,241,0.4); }
.confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
