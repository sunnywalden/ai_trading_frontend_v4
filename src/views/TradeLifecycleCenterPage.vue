<template>
  <div class="tlc-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="page-title">
        <span class="title-icon">📊</span>
        持仓与交易生命周期
        <span class="version-badge">V10.4.4</span>
      </div>
      <div class="header-actions">
        <span class="last-updated">更新: {{ lastUpdated }}</span>
        <button class="refresh-btn" :class="{ spinning: loading }" @click="refresh">↻</button>
      </div>
    </div>

    <!-- 维度视图切换 -->
    <div class="dimension-tabs">
      <button 
        class="dim-tab" 
        :class="{ active: activeView === 'POSITION' }" 
        @click="activeView = 'POSITION'"
      >
        <span class="icon">🎯</span> 标的视角 (仓位状态)
      </button>
      <button 
        class="dim-tab" 
        :class="{ active: activeView === 'TRADE' }" 
        @click="activeView = 'TRADE'"
      >
        <span class="icon">⚡</span> 交易视角 (执行流水)
      </button>
    </div>

    <!-- =============== 视角 1: 标的视角 =============== -->
    <div v-if="activeView === 'POSITION'" class="view-content position-view">
      <!-- 标的/持仓看板 -->
      <div class="kanban-section">
        <div class="section-label">
          持仓生命周期看板 (按标的流转)
          <span class="total-badge">{{ lifecycle.activePositionCount }} 活跃持仓</span>
        </div>
        <PositionBoardKanban
          :board="lifecycle.positionBoard"
          :loading="loading"
          @cardClick="openProvenance"
        />
      </div>

      <!-- 下半区：仓位总览数据 -->
      <div class="reserve-section">
        <div class="section-label">仓位总览与活跃情况</div>
        <div class="pos-viewer-grid">
          <div class="pos-summary-grid">
            <div class="pos-stat-card green">
              <div class="pos-stat-val">{{ lifecycle.activePositionCount }}</div>
              <div class="pos-stat-label">总计活跃仓位</div>
            </div>
            <div class="pos-stat-card red">
              <div class="pos-stat-val">{{ lifecycle.exceptionPositionCount }}</div>
              <div class="pos-stat-label">异常拦截仓位</div>
            </div>
            <div class="pos-stat-card yellow">
              <div class="pos-stat-val">{{ lifecycle.stuckSliceCount }}</div>
              <div class="pos-stat-label">卡单切片异常</div>
            </div>
          </div>
          
          <!-- 当前持仓标的 chips -->
          <div class="held-symbols" v-if="lifecycle.activeBoardCards.length">
            <div class="held-label">当前持有列表:</div>
            <div class="held-chips">
              <span
                v-for="card in lifecycle.activeBoardCards"
                :key="card.id"
                class="held-chip"
              >
                {{ card.symbol }}
                <span class="held-time" v-if="card.hold_seconds != null">
                  {{ formatHoldTime(card.hold_seconds) }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- =============== 视角 2: 交易视角 =============== -->
    <div v-else-if="activeView === 'TRADE'" class="view-content trade-view">
      <!-- 交易计划流水线看板 -->
      <div class="kanban-section">
        <div class="section-label">
          交易 Pipeline 阶段看板 (按交易计划)
          <span class="total-badge">{{ lifecycle.pipeline?.total_active ?? 0 }} 活跃交易</span>
        </div>
        <PipelineKanbanBoard
          :pipeline="lifecycle.pipeline"
          :loading="loading"
          @cardClick="openProvenance"
        />
      </div>

      <!-- 下半区：双FSM监控 -->
      <div class="fsm-section">
        <div class="section-label">交易状态机流转监控</div>
        <DualFSMPanel
          :plan-fsm="lifecycle.planFsm"
          :position-fsm="lifecycle.positionFsm"
          :fsm-events="lifecycle.fsmEvents"
          :loading="loading"
          @filterChange="onFsmFilterChange"
          @pageChange="onFsmPageChange"
        />
      </div>
    </div>

    <!-- 决策溯源抽屉 (通用) -->
    <DecisionProvenanceDrawer
      :open="lifecycle.provenanceOpen"
      :provenance="lifecycle.provenance"
      :loading="lifecycle.provenanceLoading"
      @close="lifecycle.closeProvenance()"
    />
  </div>
</template>

<script setup lang="ts">
import DecisionProvenanceDrawer from '@/components/DecisionProvenanceDrawer.vue'
import DualFSMPanel from '@/components/DualFSMPanel.vue'
import PipelineKanbanBoard from '@/components/PipelineKanbanBoard.vue'
import PositionBoardKanban from '@/components/PositionBoardKanban.vue'
import { useLifecycleStore } from '@/stores/lifecycle'
import { useQuantLoopStore } from '@/stores/quantLoop'
import { onMounted, onUnmounted, ref } from 'vue'

const lifecycle = useLifecycleStore()
const quantLoop = useQuantLoopStore()

const loading      = ref(false)
const lastUpdated  = ref('—')
const activeView   = ref<'POSITION' | 'TRADE'>('POSITION')
const fsmPage      = ref(1)
const fsmType      = ref<'PLAN' | 'POSITION' | 'ALL'>('ALL')

let autoRefreshTimer: number | undefined

function formatHoldTime(secs: number | null | undefined): string {
  if (secs == null) return ''
  const s = Math.round(secs)
  if (s < 3600) return `${Math.floor(s / 60)}m`
  return `${Math.floor(s / 3600)}h`
}

async function refresh() {
  loading.value = true
  try {
    const accountId = quantLoop.systemStatus?.account_id
    await Promise.all([
      lifecycle.fetchAll(accountId),
      lifecycle.fetchFsmEvents(),
    ])
    lastUpdated.value = new Date().toLocaleTimeString('zh-CN')
  } finally {
    loading.value = false
  }
}

function openProvenance(planId: number) {
  lifecycle.openProvenance(planId)
}

function onFsmFilterChange(type: 'PLAN' | 'POSITION' | 'ALL') {
  fsmType.value = type
  lifecycle.setEventFsmType(type !== 'ALL' ? type : undefined)
}

function onFsmPageChange(page: number) {
  fsmPage.value = page
  lifecycle.setEventPage(page)
}

onMounted(() => {
  refresh()
  autoRefreshTimer = window.setInterval(refresh, 30_000)
})

onUnmounted(() => {
  clearInterval(autoRefreshTimer)
})
</script>

<style scoped>
.tlc-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 16px;
  gap: 12px;
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
  transition: transform 0.2s;
}
.refresh-btn:hover  { background: rgba(99,102,241,0.1); }
.refresh-btn.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ---- 视图切换 Tabs ---- */
.dimension-tabs {
  display: flex;
  gap: 12px;
  border-bottom: 2px solid rgba(255,255,255,0.05);
  padding-bottom: 8px;
  flex-shrink: 0;
}

.dim-tab {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dim-tab:hover {
  background: rgba(255,255,255,0.03);
  color: #cbd5e1;
}
.dim-tab.active {
  background: rgba(56,189,248,0.1);
  color: #38bdf8;
  font-weight: 600;
  border: 1px solid rgba(56,189,248,0.2);
}

/* ---- 内容区布局 ---- */
.view-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow: hidden;
}

/* ---- Kanban ---- */
.kanban-section {
  flex-shrink: 0;
  height: 240px;
}

/* ---- 下半区 ---- */
.fsm-section, .reserve-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow: hidden;
}

/* ---- section label ---- */
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.total-badge {
  font-size: 10px;
  background: rgba(16,185,129,0.15);
  color: #10b981;
  padding: 1px 6px;
  border-radius: 9px;
}

/* ---- V10.4.4 Position Summary ---- */
.pos-viewer-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}

.pos-summary-grid {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}

.pos-stat-card {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.07);
}

.pos-stat-val {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.pos-stat-label {
  font-size: 11px;
  color: #9ca3af;
}

.pos-stat-card.green .pos-stat-val { color: #34d399; }
.pos-stat-card.red   .pos-stat-val { color: #f87171; }
.pos-stat-card.yellow .pos-stat-val { color: #fbbf24; }

/* ---- 持仓标的列表 ---- */
.held-symbols {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.held-label {
  font-size: 10px;
  font-weight: 600;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.held-chips {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.held-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 6px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.held-chip:hover { background: rgba(16,185,129,0.15); }

/* symbol text */
.held-chip > :first-child {
  font-size: 12px;
  font-weight: 700;
  color: #34d399;
  letter-spacing: 0.03em;
}

.held-time {
  font-size: 10px;
  color: #6b7280;
}
</style>
