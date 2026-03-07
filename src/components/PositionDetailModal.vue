<template>
  <Teleport to="body">
    <div v-if="open" class="pdm-overlay" @click.self="close">
      <div class="pdm-drawer">
        <!-- Header -->
        <div class="pdm-header">
          <div class="pdm-title">
            <span class="pdm-symbol">{{ position?.symbol }}</span>
            <span class="pdm-status" :class="`status-${statusLower}`">{{ position?.status }}</span>
            <span v-if="position?.direction" class="pdm-dir">{{ position.direction }}</span>
          </div>
          <button class="pdm-close" @click="close">✕</button>
        </div>

        <div v-if="loading" class="pdm-loading">加载中…</div>

        <template v-else-if="position">
          <!-- Metrics strip -->
          <div class="pdm-metrics">
            <div class="pdm-metric">
              <div class="pdm-metric-label">持仓数量</div>
              <div class="pdm-metric-val">{{ position.open_qty }}</div>
            </div>
            <div class="pdm-metric">
              <div class="pdm-metric-label">均入价</div>
              <div class="pdm-metric-val">{{ fmtPrice(position.avg_entry_price) }}</div>
            </div>
            <div class="pdm-metric">
              <div class="pdm-metric-label">未实现 %</div>
              <div class="pdm-metric-val" :class="pnlColor(position.unrealized_pnl_pct)">
                {{ fmtPct(position.unrealized_pnl_pct) }}
              </div>
            </div>
            <div class="pdm-metric">
              <div class="pdm-metric-label">已实现 PnL</div>
              <div class="pdm-metric-val" :class="pnlColor(position.realized_pnl)">
                {{ fmtPrice(position.realized_pnl) }}
              </div>
            </div>
            <div class="pdm-metric">
              <div class="pdm-metric-label">止损</div>
              <div class="pdm-metric-val">{{ fmtPrice(position.stop_loss_price) }}</div>
            </div>
            <div class="pdm-metric">
              <div class="pdm-metric-label">止盈</div>
              <div class="pdm-metric-val">{{ fmtPrice(position.take_profit_price) }}</div>
            </div>
          </div>

          <!-- Slices table -->
          <div class="pdm-section-title">执行切片</div>
          <div class="pdm-slices" v-if="position.slices?.length">
            <table class="pdm-table">
              <thead>
                <tr>
                  <th>动作</th>
                  <th>状态</th>
                  <th>请求量</th>
                  <th>成交量</th>
                  <th>均价</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="slc in position.slices" :key="slc.id" :class="`slice-${slc.status.toLowerCase()}`">
                  <td>{{ slc.action }}</td>
                  <td>{{ slc.status }}</td>
                  <td>{{ slc.requested_qty }}</td>
                  <td>{{ slc.filled_qty ?? '—' }}</td>
                  <td>{{ fmtPrice(slc.avg_fill_price) }}</td>
                  <td>{{ fmtTime(slc.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="pdm-empty">暂无切片</div>

          <!-- Timeline -->
          <div class="pdm-section-title">生命周期事件</div>
          <div class="pdm-timeline" v-if="timeline.length">
            <div v-for="ev in timeline" :key="ev.id" class="pdm-event">
              <div class="pdm-event-kind">{{ ev.kind }}</div>
              <div class="pdm-event-summary">{{ ev.summary }}</div>
              <div class="pdm-event-meta">
                <span v-if="ev.from_status">{{ ev.from_status }} → {{ ev.to_status }}</span>
                <span>{{ fmtTime(ev.occurred_at) }}</span>
                <span v-if="ev.actor" class="pdm-actor">{{ ev.actor }}</span>
              </div>
            </div>
          </div>
          <div v-else class="pdm-empty">暂无事件</div>

          <!-- Manual close -->
          <div class="pdm-footer" v-if="isActivePosition(position)">
            <div class="pdm-close-form">
              <input v-model="closeNote" class="pdm-input" placeholder="平仓备注（可选）" />
              <button class="pdm-close-btn" :disabled="closing" @click="doManualClose">
                {{ closing ? '提交中…' : '人工平仓' }}
              </button>
            </div>
            <div v-if="closeError" class="pdm-error">{{ closeError }}</div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useLifecycleStore } from '@/stores/lifecycle'
import { isActivePosition } from '@/types/position'
import { computed, ref } from 'vue'

const lifecycle = useLifecycleStore()

const open     = computed(() => lifecycle.positionDetailOpen)
const position = computed(() => lifecycle.selectedPosition)
const timeline = computed(() => lifecycle.positionTimeline)
const loading  = computed(() => lifecycle.posLoading)

const statusLower = computed(() => (position.value?.status ?? '').toLowerCase())

const closeNote  = ref('')
const closing    = ref(false)
const closeError = ref('')

function close() {
  lifecycle.closePositionDetail()
}

function fmtPrice(v: number | null | undefined): string {
  if (v == null) return '—'
  return '$' + v.toFixed(2)
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%'
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-CN', { hour12: false })
}

function pnlColor(v: number | null | undefined): string {
  if (v == null) return ''
  return v >= 0 ? 'pos' : 'neg'
}

async function doManualClose() {
  if (!position.value) return
  closing.value = true
  closeError.value = ''
  try {
    await lifecycle.manualClosePosition(position.value.id, 'operator', closeNote.value || undefined)
    // Refresh detail
    await lifecycle.openPositionDetail(position.value.id)
  } catch (e: any) {
    closeError.value = e?.message ?? '平仓失败'
  } finally {
    closing.value = false
  }
}
</script>

<style scoped>
.pdm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}

.pdm-drawer {
  width: min(600px, 100vw);
  height: 100vh;
  background: #0f172a;
  border-left: 1px solid rgba(99, 102, 241, 0.3);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* Header */
.pdm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
}

.pdm-title { display: flex; align-items: center; gap: 10px; }
.pdm-symbol { font-size: 18px; font-weight: 700; color: #e2e8f0; }
.pdm-status {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 9px;
  background: rgba(255,255,255,0.07);
}
.status-active     { color: #34d399; }
.status-exception  { color: #f87171; }
.status-closing    { color: #fb923c; }
.status-closed     { color: #6b7280; }
.status-liquidated { color: #ef4444; }
.status-pending    { color: #94a3b8; }

.pdm-dir {
  font-size: 11px;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 4px;
  padding: 1px 7px;
}

.pdm-close {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}
.pdm-close:hover { color: #e2e8f0; }

/* Loading */
.pdm-loading {
  padding: 40px;
  text-align: center;
  color: #64748b;
}

/* Metrics strip */
.pdm-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

.pdm-metric {
  padding: 12px 16px;
  background: #0f172a;
}

.pdm-metric-label {
  font-size: 10px;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pdm-metric-val {
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
}

.pdm-metric-val.pos { color: #34d399; }
.pdm-metric-val.neg { color: #f87171; }

/* Section title */
.pdm-section-title {
  padding: 12px 20px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Slices table */
.pdm-slices { padding: 0 20px 12px; }
.pdm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.pdm-table th {
  text-align: left;
  padding: 4px 8px;
  color: #64748b;
  font-weight: 500;
}
.pdm-table td {
  padding: 5px 8px;
  color: #9ca3af;
  border-top: 1px solid rgba(255,255,255,0.04);
}
.slice-filled td  { color: #86efac; }
.slice-stuck td   { color: #fca5a5; }
.slice-failed td  { color: #f87171; }

/* Timeline */
.pdm-timeline { padding: 0 20px 12px; display: flex; flex-direction: column; gap: 6px; }

.pdm-event {
  padding: 8px 12px;
  background: rgba(255,255,255,0.02);
  border-radius: 6px;
  border-left: 2px solid rgba(99,102,241,0.4);
}

.pdm-event-kind {
  font-size: 11px;
  font-weight: 600;
  color: #a5b4fc;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.pdm-event-summary { font-size: 12px; color: #cbd5e1; margin-bottom: 3px; }

.pdm-event-meta {
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: #64748b;
}

.pdm-actor { color: #7dd3fc; }

.pdm-empty { padding: 10px 20px; font-size: 12px; color: #374151; }

/* Footer */
.pdm-footer {
  margin-top: auto;
  padding: 16px 20px;
  border-top: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
}

.pdm-close-form { display: flex; gap: 8px; }

.pdm-input {
  flex: 1;
  padding: 6px 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
}

.pdm-close-btn {
  padding: 6px 14px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 6px;
  color: #fca5a5;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}
.pdm-close-btn:hover:not(:disabled) { background: rgba(239, 68, 68, 0.25); }
.pdm-close-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.pdm-error { margin-top: 6px; font-size: 12px; color: #f87171; }
</style>
