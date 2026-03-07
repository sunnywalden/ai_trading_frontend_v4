<template>
  <div class="tlc-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="page-title">
        <span class="title-icon">🔄</span>
        交易生命周期中心
        <span class="version-badge">V10.4.4</span>
      </div>
      <div class="header-actions">
        <span class="last-updated">更新: {{ lastUpdated }}</span>
        <button class="refresh-btn" :class="{ spinning: loading }" @click="refresh">↻</button>
      </div>
    </div>

    <!-- Kanban 区域 -->
    <div class="kanban-section">
      <div class="section-label">
        Pipeline 阶段看板
        <span class="total-badge">{{ lifecycle.pipeline?.total_active ?? 0 }} 活跃</span>
      </div>
      <PipelineKanbanBoard
        :pipeline="lifecycle.pipeline"
        :loading="loading"
        @cardClick="openProvenance"
      />
    </div>

    <!-- 下半区：双FSM + 预留扩展 -->
    <div class="bottom-section">
      <!-- DualFSMPanel -->
      <div class="fsm-section">
        <div class="section-label">状态机监控</div>
        <DualFSMPanel
          :plan-fsm="lifecycle.planFsm"
          :position-fsm="lifecycle.positionFsm"
          :fsm-events="lifecycle.fsmEvents"
          :loading="loading"
          @filterChange="onFsmFilterChange"
          @pageChange="onFsmPageChange"
        />
      </div>

      <!-- V10.4.4 Position Summary Panel -->
      <div class="reserve-section">
        <div class="section-label">仓位总览 <span class="total-badge">V10.4.4</span></div>
        <div class="pos-summary-grid">
          <div class="pos-stat-card green">
            <div class="pos-stat-val">{{ lifecycle.activePositionCount }}</div>
            <div class="pos-stat-label">活跃仓位</div>
          </div>
          <div class="pos-stat-card red">
            <div class="pos-stat-val">{{ lifecycle.exceptionPositionCount }}</div>
            <div class="pos-stat-label">异常仓位</div>
          </div>
          <div class="pos-stat-card yellow">
            <div class="pos-stat-val">{{ lifecycle.stuckSliceCount }}</div>
            <div class="pos-stat-label">卡单切片</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 决策溯源抽屉 -->
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
import { useLifecycleStore } from '@/stores/lifecycle'
import { useQuantLoopStore } from '@/stores/quantLoop'
import { onMounted, onUnmounted, ref } from 'vue'

const lifecycle = useLifecycleStore()
const quantLoop = useQuantLoopStore()

const loading      = ref(false)
const lastUpdated  = ref('—')
const fsmPage      = ref(1)
const fsmType      = ref<'PLAN' | 'POSITION' | 'ALL'>('ALL')

let autoRefreshTimer: number | undefined

async function refresh() {
  loading.value = true
  try {
    await lifecycle.fetchAll()
    await lifecycle.fetchFsmEvents()
    // V10.4.4: position summary panel
    const accountId = quantLoop.systemStatus?.account_id
    if (accountId) {
      await lifecycle.fetchPositions(accountId)
    }
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

/* ---- Kanban ---- */
.kanban-section {
  flex-shrink: 0;
  height: 240px;
}

/* ---- 下半 ---- */
.bottom-section {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
  flex: 1;
  overflow: hidden;
}

.fsm-section, .reserve-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
.pos-summary-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.pos-stat-card {
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
</style>
