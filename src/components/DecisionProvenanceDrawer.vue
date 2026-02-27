<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer-overlay" @click.self="$emit('close')">
        <div class="drawer-panel">
          <!-- 抽屉头 -->
          <div class="drawer-header">
            <div class="drawer-title">
              <span class="icon">🔍</span>
              决策溯源
              <span v-if="provenance" class="title-symbol">{{ provenance.symbol }}</span>
            </div>
            <button class="close-btn" @click="$emit('close')">✕</button>
          </div>

          <!-- 加载中 -->
          <div v-if="loading" class="drawer-loading">
            <div class="skeleton" v-for="i in 3" :key="i"></div>
          </div>

          <div v-else-if="provenance" class="drawer-body">
            <!-- Card 1: 六维信号 -->
            <div class="prov-card">
              <div class="card-title">📊 六维信号评分</div>
              <table class="signal-table">
                <thead>
                  <tr>
                    <th>维度</th>
                    <th>原始分</th>
                    <th>权重</th>
                    <th>贡献</th>
                    <th>占比</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="dim in provenance.six_dim_scores" :key="dim.dimension">
                    <td class="dim-name">{{ dim.label }}</td>
                    <td>
                      <div class="score-bar-wrap">
                        <div class="score-bar"
                          :style="{ width: `${Math.min(100, dim.raw_score)}%`,
                                    background: dimColor(dim.raw_score) }">
                        </div>
                        <span class="score-val">{{ dim.raw_score.toFixed(1) }}</span>
                      </div>
                    </td>
                    <td>{{ dim.regime_multiplier.toFixed(2) }}</td>
                    <td class="contrib">{{ dim.weighted_contribution.toFixed(2) }}</td>
                    <td class="pct" :style="{ color: dimColor(dim.contribution_pct) }">
                      {{ dim.contribution_pct.toFixed(1) }}%
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="card-footer-row">
                <span>总置信度</span>
                <span class="total-conf">{{ provenance.confidence?.toFixed(1) ?? '—' }}</span>
              </div>
            </div>

            <!-- Card 2: 风险门控 -->
            <div class="prov-card">
              <div class="card-title">🛡️ 风险门控</div>
              <div class="gate-list">
                <div
                  v-for="g in provenance.risk_gate_checks"
                  :key="g.check_name"
                  class="gate-row"
                  :class="g.passed ? 'gate-pass' : 'gate-fail'"
                >
                  <span class="gate-icon">{{ g.passed ? '✅' : '❌' }}</span>
                  <span class="gate-name">{{ g.label }}</span>
                  <span v-if="g.detail" class="gate-detail">{{ g.detail }}</span>
                </div>
              </div>
            </div>

            <!-- Card 3: AI 推理文本 -->
            <div class="prov-card">
              <div class="card-title">
                🤖 AI 推理
                <button class="toggle-btn" @click="reasoningExpanded = !reasoningExpanded">
                  {{ reasoningExpanded ? '收起' : '展开' }}
                </button>
              </div>
              <div class="reasoning-text" :class="{ expanded: reasoningExpanded }">
                {{ provenance.ai_reasoning ?? '暂无推理文本' }}
              </div>
            </div>

            <!-- Card 4: 执行进度 -->
            <div class="prov-card">
              <div class="card-title">⚡ 执行进度</div>
              <div v-if="provenance.exec_progress" class="exec-prog">
                <div class="exec-meta">
                  <span>已成交: {{ provenance.exec_progress.filled_slices }}</span>
                  <span>目标: {{ provenance.exec_progress.total_slices }}</span>
                  <span>算法: {{ provenance.exec_progress.algo_type ?? '—' }}</span>
                </div>
                <div class="prog-track">
                  <div
                    class="prog-fill"
                    :style="{ width: execPct + '%' }"
                  ></div>
                </div>
                <div class="prog-pct">{{ execPct.toFixed(1) }}%</div>
              </div>
              <div v-else class="empty-text">暂无执行进度</div>
            </div>

            <!-- Card 5: 当前 FSM 状态 -->
            <div class="prov-card">
              <div class="card-title">🔄 持仓 FSM 状态</div>
              <div class="fsm-current">
                <span
                  class="fsm-badge"
                  :class="`fsm-${(provenance.position_fsm_state ?? 'IDLE').toLowerCase()}`"
                >{{ provenance.position_fsm_state ?? 'IDLE' }}</span>
                <span class="fsm-hint">{{ fsmHint(provenance.position_fsm_state) }}</span>
              </div>
            </div>
          </div>

          <!-- 无数据 -->
          <div v-else class="drawer-empty">
            <div class="empty-icon">📭</div>
            <div class="empty-text">无溯源数据</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DecisionProvenance } from '@/api/lifecycleService'

interface Props {
  open: boolean
  provenance: DecisionProvenance | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })
defineEmits<{ (e: 'close'): void }>()

const reasoningExpanded = ref(false)

const execPct = computed(() => {
  const ep = props.provenance?.exec_progress
  if (!ep || ep.total_slices <= 0) return 0
  return Math.min(100, (ep.filled_slices / ep.total_slices) * 100)
})

function dimColor(score: number): string {
  if (score >= 70) return '#10b981'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

const FSM_HINTS: Record<string, string> = {
  IDLE: '暂无活跃持仓',
  ENTRY_PENDING: '等待进场信号',
  HOLDING: '持仓中，监控中',
  PARTIAL_EXIT: '部分退出执行中',
  EXIT_PENDING: '等待退场',
  CLOSED: '持仓已平',
  ABANDONED: '已放弃',
}

function fsmHint(state: string | null | undefined): string {
  return FSM_HINTS[state ?? 'IDLE'] ?? ''
}
</script>

<style scoped>
/* ---- 动画 ---- */
.drawer-enter-active, .drawer-leave-active { transition: all 0.2s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer-panel, .drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}

/* ---- 遮罩 ---- */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

/* ---- 面板 ---- */
.drawer-panel {
  width: 440px;
  height: 100%;
  background: #1e2030;
  border-left: 1px solid rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  flex: 1;
}

.icon { font-size: 16px; }

.title-symbol {
  font-size: 13px;
  color: #a78bfa;
  font-weight: 700;
  background: rgba(167,139,250,0.1);
  padding: 1px 6px;
  border-radius: 4px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}
.close-btn:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }

/* ---- Body ---- */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.15) transparent;
}

/* ---- 卡片 ---- */
.prov-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  padding: 10px 12px;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ---- 六维表 ---- */
.signal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.signal-table th {
  text-align: left;
  color: #64748b;
  padding: 3px 4px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.signal-table td {
  padding: 4px 4px;
  color: #e2e8f0;
  vertical-align: middle;
}

.dim-name { color: #a5b4fc; font-weight: 600; }
.contrib  { color: #10b981; }
.pct      { font-weight: 700; }

.score-bar-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-bar {
  height: 4px;
  border-radius: 2px;
  min-width: 4px;
  max-width: 60px;
  flex-shrink: 0;
}

.score-val { font-size: 10px; color: #94a3b8; }

.card-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 12px;
  color: #94a3b8;
}

.total-conf {
  font-size: 18px;
  font-weight: 700;
  color: #a78bfa;
}

/* ---- 风险门控 ---- */
.gate-list { display: flex; flex-direction: column; gap: 4px; }

.gate-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 4px 6px;
  border-radius: 4px;
}

.gate-pass { background: rgba(16, 185, 129, 0.07); }
.gate-fail { background: rgba(239, 68, 68, 0.07); }
.gate-icon { font-size: 12px; }
.gate-name { font-weight: 600; color: #e2e8f0; min-width: 90px; }
.gate-threshold { color: #64748b; font-size: 10px; }
.gate-actual    { color: #94a3b8; font-size: 10px; }
.gate-detail    { color: #94a3b8; font-size: 10px; margin-left: auto; }

/* ---- 推理文本 ---- */
.toggle-btn {
  margin-left: auto;
  font-size: 10px;
  color: #6366f1;
  background: transparent;
  border: 1px solid rgba(99,102,241,0.3);
  border-radius: 3px;
  padding: 1px 6px;
  cursor: pointer;
}

.reasoning-text {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
  max-height: 60px;
  overflow: hidden;
  transition: max-height 0.3s ease;
  white-space: pre-wrap;
}

.reasoning-text.expanded { max-height: 300px; }

/* ---- 执行进度 ---- */
.exec-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #94a3b8;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.exec-status {
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 10px;
}
.status-active   { background: rgba(99,102,241,0.15); color: #a5b4fc; }
.status-filled   { background: rgba(16,185,129,0.15); color: #6ee7b7; }
.status-cancelled{ background: rgba(239,68,68,0.15); color: #fca5a5; }
.status-pending  { background: rgba(245,158,11,0.15); color: #fde68a; }

.prog-track {
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.prog-fill {
  height: 100%;
  background: linear-gradient(to right, #6366f1, #8b5cf6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.prog-pct {
  font-size: 10px;
  color: #a78bfa;
  text-align: right;
  margin-top: 3px;
}

/* ---- FSM 当前状态 ---- */
.fsm-current { display: flex; align-items: center; gap: 10px; padding: 4px 0; }

.fsm-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: #e2e8f0;
  text-transform: uppercase;
}
.fsm-holding     { border-color: #10b981; color: #10b981; background: rgba(16,185,129,0.1); }
.fsm-entry_pending { border-color: #f59e0b; color: #f59e0b; background: rgba(245,158,11,0.1); }
.fsm-exit_pending  { border-color: #f59e0b; color: #f59e0b; background: rgba(245,158,11,0.1); }
.fsm-closed      { border-color: #6b7280; color: #6b7280; background: rgba(107,114,128,0.1); }
.fsm-abandoned   { border-color: #374151; color: #4b5563; }

.fsm-hint { font-size: 11px; color: #64748b; }

/* ---- 空态 & 加载 ---- */
.drawer-loading {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton {
  height: 60px;
  border-radius: 8px;
  background: linear-gradient(90deg,
    rgba(255,255,255,0.05) 25%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.drawer-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #4b5563;
}
.empty-icon { font-size: 32px; }
.empty-text { font-size: 13px; }
</style>
