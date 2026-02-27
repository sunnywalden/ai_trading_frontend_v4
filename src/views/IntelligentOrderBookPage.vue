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
        @stopLoss="openStopLoss"
      />
    </div>

    <!-- 详情弹窗（止损修改） -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="stopLossOpen" class="modal-overlay" @click.self="stopLossOpen = false">
          <div class="modal-box">
            <div class="modal-title">✏️ 修改止损价 — {{ stopLossRow?.symbol }}</div>
            <div class="modal-field">
              <label>新止损价</label>
              <input v-model.number="newStopLoss" type="number" class="modal-input" step="0.01" />
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useOrderBookStore } from '@/stores/orderBook'
import type { OrderBookRow } from '@/api/orderBookService'
import OrderBookTable from '@/components/OrderBookTable.vue'

const ob = useOrderBookStore()

const loading      = ref(false)
const lastUpdated  = ref('—')
const stopLossOpen = ref(false)
const stopLossRow  = ref<OrderBookRow | null>(null)
const newStopLoss  = ref<number>(0)
const saving       = ref(false)

let autoRefreshTimer: number | undefined

async function refresh() {
  loading.value = true
  try {
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

// 键盘快捷键
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
    e.preventDefault()
    refresh()
  }
}

onMounted(() => {
  refresh()
  autoRefreshTimer = window.setInterval(refresh, 60_000)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  clearInterval(autoRefreshTimer)
  window.removeEventListener('keydown', onKeydown)
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
  background: rgba(99,102,241,0.2);
  color: #a5b4fc;
  padding: 1px 6px;
  border-radius: 10px;
  border: 1px solid rgba(99,102,241,0.35);
}

.header-actions { display: flex; align-items: center; gap: 8px; }
.last-updated { font-size: 11px; color: #64748b; }

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
  background: #1e2030;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-title {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modal-field label { font-size: 11px; color: #94a3b8; }
.modal-input {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  color: #e2e8f0;
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
  background: rgba(99,102,241,0.25);
  border: 1px solid rgba(99,102,241,0.5);
  color: #a5b4fc;
  cursor: pointer;
  font-weight: 600;
}
.confirm-btn:hover:not(:disabled) { background: rgba(99,102,241,0.4); }
.confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
