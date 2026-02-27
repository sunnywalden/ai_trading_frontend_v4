<template>
  <div class="dual-fsm">
    <!-- 上半：双状态机气泡图 -->
    <div class="fsm-panels">
      <!-- Plan FSM -->
      <div class="fsm-panel">
        <div class="fsm-panel-title">
          <span class="dot dot-purple"></span>
          交易计划 FSM
          <span class="fsm-total">{{ planTotal }}</span>
        </div>
        <div class="state-bubbles">
          <div
            v-for="st in planStates"
            :key="st.state"
            class="bubble bubble-plan"
            :class="{ 'bubble-active': st.count > 0 }"
            :title="st.state"
          >
            <span class="bubble-count">{{ st.count }}</span>
            <span class="bubble-label">{{ fsm_plan_label(st.state) }}</span>
          </div>
        </div>
      </div>

      <!-- Position FSM -->
      <div class="fsm-panel">
        <div class="fsm-panel-title">
          <span class="dot dot-blue"></span>
          持仓 FSM
          <span class="fsm-total">{{ posTotal }}</span>
        </div>
        <div class="state-bubbles">
          <div
            v-for="st in posStates"
            :key="st.state"
            class="bubble bubble-pos"
            :class="{ 'bubble-active': st.count > 0 }"
            :title="st.state"
          >
            <span class="bubble-count">{{ st.count }}</span>
            <span class="bubble-label">{{ fsm_pos_label(st.state) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FSM 类型筛选 -->
    <div class="event-filter">
      <button
        v-for="f in fsmFilters"
        :key="f.value"
        class="filter-btn"
        :class="{ 'active': currentFsmType === f.value }"
        @click="setFilter(f.value)"
      >{{ f.label }}</button>
      <span class="spacer"></span>
      <span class="events-count">{{ fsmEvents?.total ?? 0 }} 条</span>
    </div>

    <!-- 底部事件日志 -->
    <div class="event-log" ref="logRef">
      <div
        v-for="ev in fsmEvents?.items ?? []"
        :key="ev.id"
        class="event-row"
        :class="ev.fsm_type === 'PLAN' ? 'ev-plan' : 'ev-pos'"
      >
        <span class="ev-time">{{ formatTime(ev.occurred_at) }}</span>
        <span class="ev-badge" :class="ev.fsm_type === 'PLAN' ? 'badge-purple' : 'badge-blue'">
          {{ ev.fsm_type }}
        </span>
        <span class="ev-symbol">{{ ev.symbol }}</span>
        <span class="ev-transition">
          <span class="from-state">{{ ev.from_state ?? '—' }}</span>
          <span class="arrow">→</span>
          <span class="to-state">{{ ev.to_state }}</span>
        </span>
        <span v-if="ev.trigger_reason" class="ev-reason">{{ ev.trigger_reason }}</span>
      </div>

      <!-- 空态 -->
      <div v-if="!(fsmEvents?.items?.length)" class="event-empty">
        暂无状态转换记录
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="(fsmEvents?.total ?? 0) > 20" class="event-pager">
      <button :disabled="page <= 1" @click="prevPage">‹</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="nextPage">›</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlanFsmSummary, PositionFsmSummary, FsmEventPage } from '@/api/lifecycleService'

interface Props {
  planFsm: PlanFsmSummary | null
  positionFsm: PositionFsmSummary | null
  fsmEvents: FsmEventPage | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const emit = defineEmits<{
  (e: 'filterChange', fsm_type: 'PLAN' | 'POSITION' | 'ALL'): void
  (e: 'pageChange', page: number): void
}>()

const page = ref(1)
const currentFsmType = ref<'PLAN' | 'POSITION' | 'ALL'>('ALL')

const fsmFilters = [
  { value: 'ALL'      as const, label: '全部' },
  { value: 'PLAN'     as const, label: 'Plan' },
  { value: 'POSITION' as const, label: 'Position' },
]

const planStates = computed(() => props.planFsm?.states ?? [])
const posStates  = computed(() => props.positionFsm?.states ?? [])
const planTotal  = computed(() => props.planFsm?.total ?? 0)
const posTotal   = computed(() => props.positionFsm?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil((props.fsmEvents?.total ?? 0) / 20)))

// Plan 状态短标签
const PLAN_LABELS: Record<string, string> = {
  DRAFT: '草稿', PENDING_CONFIRM: '待确认', ACTIVE: '活跃',
  MONITORING: '监控', PAUSED: '暂停', COMPLETED: '完成', CANCELLED: '取消',
}
// Position 状态短标签
const POS_LABELS: Record<string, string> = {
  IDLE: '空闲', ENTRY_PENDING: '进场中', HOLDING: '持有中',
  PARTIAL_EXIT: '部分退出', EXIT_PENDING: '退场中', CLOSED: '已平仓', ABANDONED: '放弃',
}

function fsm_plan_label(s: string) { return PLAN_LABELS[s] ?? s }
function fsm_pos_label(s: string)  { return POS_LABELS[s] ?? s }

function setFilter(v: 'PLAN' | 'POSITION' | 'ALL') {
  currentFsmType.value = v
  page.value = 1
  emit('filterChange', v)
}

function prevPage() {
  if (page.value > 1) { page.value--; emit('pageChange', page.value) }
}
function nextPage() {
  if (page.value < totalPages.value) { page.value++; emit('pageChange', page.value) }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<style scoped>
.dual-fsm {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
}

/* ---- FSM 面板 ---- */
.fsm-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: rgba(255,255,255,0.06);
  padding: 10px;
  gap: 10px;
}

.fsm-panel {
  background: rgba(255,255,255,0.03);
  border-radius: 6px;
  padding: 8px;
}

.fsm-panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 8px;
  font-weight: 600;
}

.dot {
  width: 6px; height: 6px;
  border-radius: 50%;
}
.dot-purple { background: #a78bfa; }
.dot-blue   { background: #60a5fa; }

.fsm-total {
  margin-left: auto;
  font-size: 12px;
  color: #e2e8f0;
  font-weight: 700;
}

.state-bubbles {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 6px;
  border-radius: 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  min-width: 44px;
  opacity: 0.45;
  transition: all 0.2s;
}

.bubble.bubble-active { opacity: 1; }

.bubble-plan.bubble-active {
  border-color: rgba(167, 139, 250, 0.45);
  background: rgba(167, 139, 250, 0.08);
}
.bubble-pos.bubble-active {
  border-color: rgba(96, 165, 250, 0.45);
  background: rgba(96, 165, 250, 0.08);
}

.bubble-count {
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  color: #e2e8f0;
}

.bubble-label {
  font-size: 9px;
  color: #94a3b8;
  margin-top: 2px;
  white-space: nowrap;
}

/* ---- 事件过滤 ---- */
.event-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.filter-btn {
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn:hover  { background: rgba(255,255,255,0.1); color: #e2e8f0; }
.filter-btn.active { background: rgba(99, 102, 241, 0.25); color: #a5b4fc; border-color: rgba(99,102,241,0.5); }

.spacer { flex: 1; }
.events-count { font-size: 11px; color: #64748b; }

/* ---- 事件日志 ---- */
.event-log {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.15) transparent;
}

.event-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 11px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  transition: background 0.1s;
}
.event-row:hover { background: rgba(255,255,255,0.04); }

.ev-time { color: #64748b; font-variant-numeric: tabular-nums; min-width: 60px; }
.ev-badge {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 700;
  white-space: nowrap;
}
.badge-purple { background: rgba(167,139,250,0.15); color: #a78bfa; }
.badge-blue   { background: rgba(96,165,250,0.15);  color: #60a5fa; }

.ev-symbol { min-width: 48px; color: #e2e8f0; font-weight: 600; }

.ev-transition {
  display: flex;
  align-items: center;
  gap: 4px;
}
.from-state { color: #94a3b8; }
.arrow      { color: #4b5563; }
.to-state   { color: #e2e8f0; font-weight: 600; }

.ev-reason {
  color: #64748b;
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.event-empty {
  text-align: center;
  color: #4b5563;
  padding: 20px 0;
  font-size: 12px;
}

/* ---- 分页 ---- */
.event-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 6px;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 11px;
  color: #94a3b8;
}

.event-pager button {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
  border-radius: 3px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 13px;
}
.event-pager button:disabled { opacity: 0.3; cursor: not-allowed; }
.event-pager button:not(:disabled):hover { background: rgba(255,255,255,0.08); }
</style>
