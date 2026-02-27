<template>
  <div class="tlc-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="page-title">
        <span class="title-icon">🔄</span>
        交易生命周期中心
        <span class="version-badge">V10.3</span>
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

      <!-- 预留右侧 -->
      <div class="reserve-section">
        <div class="section-label">扩展预留</div>
        <div class="reserve-placeholder">
          <div class="placeholder-icon">📈</div>
          <div class="placeholder-text">后续版本扩展</div>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useLifecycleStore } from '@/stores/lifecycle'
import PipelineKanbanBoard from '@/components/PipelineKanbanBoard.vue'
import DualFSMPanel        from '@/components/DualFSMPanel.vue'
import DecisionProvenanceDrawer from '@/components/DecisionProvenanceDrawer.vue'

const lifecycle = useLifecycleStore()

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

/* ---- 预留 ---- */
.reserve-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.02);
  border: 1px dashed rgba(255,255,255,0.08);
  border-radius: 8px;
  color: #374151;
  gap: 8px;
}
.placeholder-icon { font-size: 28px; opacity: 0.4; }
.placeholder-text { font-size: 12px; }
</style>
