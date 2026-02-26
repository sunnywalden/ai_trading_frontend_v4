<template>
  <div class="graduation-card" :class="statusClass">
    <!-- 状态角标 -->
    <div class="status-badge">{{ statusLabel }}</div>

    <!-- 头部信息 -->
    <div class="card-header">
      <div class="strategy-info">
        <span class="strategy-icon">🤖</span>
        <div>
          <p class="strategy-name">{{ strategyName }}</p>
          <p class="account-id">{{ accountId }}</p>
        </div>
      </div>
      <div class="run-duration">
        <span class="run-days">{{ runDays }}</span>
        <span class="run-days-label">天</span>
      </div>
    </div>

    <!-- 进度指标 -->
    <div class="metrics-grid">
      <div
        v-for="m in criteriaItems"
        :key="m.key"
        class="metric-item"
        :class="m.met ? 'met' : 'unmet'"
      >
        <div class="metric-header">
          <span class="metric-icon">{{ m.met ? '✅' : '⬜' }}</span>
          <span class="metric-label">{{ m.label }}</span>
        </div>
        <!-- 进度条 -->
        <div class="metric-progress-bar">
          <div
            class="metric-progress-fill"
            :style="{ width: `${m.progress}%` }"
          ></div>
        </div>
        <div class="metric-values">
          <span class="current-val">{{ m.currentStr }}</span>
          <span class="target-val">/ {{ m.targetStr }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="card-footer">
      <a :href="`/paper-trading?account=${accountId}`" class="btn-detail">查看详情</a>
      <button
        v-if="eligible"
        class="btn-graduate"
        @click="emit('graduate', accountId)"
        :disabled="graduating"
      >
        <span v-if="graduating">处理中…</span>
        <span v-else>🎓 申请毕业</span>
      </button>
      <span v-else-if="message" class="hint-msg">{{ message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface GraduationCriteria {
  min_win_rate?: number
  min_pnl_pct?: number
  min_run_days?: number
  max_drawdown?: number
}

interface GraduationMetrics {
  win_rate?: number
  cumulative_pnl_pct?: number
  run_days?: number
  max_drawdown?: number
}

interface Props {
  accountId: string
  strategyName: string
  eligible: boolean
  message?: string
  criteria?: GraduationCriteria
  metrics?: GraduationMetrics
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  criteria: () => ({}),
  metrics: () => ({}),
})

const emit = defineEmits<{
  (e: 'graduate', accountId: string): void
}>()

const graduating = ref(false)

// ── computed ──
const statusClass = computed(() => props.eligible ? 'eligible' : 'in-progress')
const statusLabel = computed(() => props.eligible ? '可毕业' : '进行中')

const runDays = computed(() =>
  props.metrics?.run_days ?? props.criteria?.min_run_days ?? 0
)

type CriteriaKey = 'win_rate' | 'pnl' | 'drawdown' | 'duration'

interface CriteriaItem {
  key: CriteriaKey
  label: string
  met: boolean
  progress: number
  currentStr: string
  targetStr: string
}

const criteriaItems = computed<CriteriaItem[]>(() => {
  const c = props.criteria ?? {}
  const m = props.metrics ?? {}
  const items: CriteriaItem[] = []

  if (c.min_win_rate !== undefined) {
    const cur = (m.win_rate ?? 0) * 100
    const tgt = c.min_win_rate * 100
    items.push({
      key: 'win_rate',
      label: '胜率',
      met: cur >= tgt,
      progress: Math.min((cur / tgt) * 100, 100),
      currentStr: `${cur.toFixed(1)}%`,
      targetStr: `${tgt.toFixed(1)}%`,
    })
  }

  if (c.min_pnl_pct !== undefined) {
    const cur = m.cumulative_pnl_pct ?? 0
    const tgt = c.min_pnl_pct
    items.push({
      key: 'pnl',
      label: '累计收益',
      met: cur >= tgt,
      progress: Math.min((cur / tgt) * 100, 100),
      currentStr: `${cur >= 0 ? '+' : ''}${cur.toFixed(1)}%`,
      targetStr: `${tgt.toFixed(1)}%`,
    })
  }

  if (c.max_drawdown !== undefined) {
    const cur = Math.abs(m.max_drawdown ?? 0)
    const tgt = c.max_drawdown
    items.push({
      key: 'drawdown',
      label: '最大回撤',
      met: cur <= tgt,
      progress: Math.min((tgt / Math.max(cur, 0.01)) * 100, 100),
      currentStr: `-${cur.toFixed(1)}%`,
      targetStr: `≤ ${tgt.toFixed(1)}%`,
    })
  }

  if (c.min_run_days !== undefined) {
    const cur = m.run_days ?? 0
    const tgt = c.min_run_days
    items.push({
      key: 'duration',
      label: '运行天数',
      met: cur >= tgt,
      progress: Math.min((cur / tgt) * 100, 100),
      currentStr: `${cur}天`,
      targetStr: `${tgt}天`,
    })
  }

  return items
})
</script>

<style scoped>
.graduation-card {
  background: #1a1f2e;
  border: 1px solid #2d3748;
  border-radius: 14px;
  padding: 18px;
  position: relative;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.graduation-card.eligible {
  border-color: #22c55e;
  box-shadow: 0 0 20px rgba(34,197,94,0.12);
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  background: rgba(99,102,241,0.15);
  color: #818cf8;
}
.eligible .status-badge { background: rgba(34,197,94,0.15); color: #22c55e; }

.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.strategy-info { display: flex; align-items: center; gap: 10px; }
.strategy-icon { font-size: 22px; }
.strategy-name { font-size: 14px; font-weight: 700; color: #e2e8f0; margin: 0 0 2px; }
.account-id { font-size: 11px; color: #4b5563; margin: 0; font-family: monospace; }
.run-duration { text-align: center; margin-right: 60px; }
.run-days { font-size: 28px; font-weight: 800; color: #f1f5f9; display: block; line-height: 1; }
.run-days-label { font-size: 11px; color: #6b7280; }

.metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.metric-item { background: #161b27; border-radius: 8px; padding: 10px; }
.metric-item.met { background: rgba(34,197,94,0.06); }
.metric-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.metric-icon { font-size: 12px; }
.metric-label { font-size: 12px; color: #9ca3af; font-weight: 500; }

.metric-progress-bar { height: 4px; background: #2d3748; border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
.metric-progress-fill { height: 100%; background: #6366f1; border-radius: 2px; transition: width 0.5s ease; }
.met .metric-progress-fill { background: #22c55e; }

.metric-values { display: flex; gap: 4px; align-items: baseline; }
.current-val { font-size: 13px; font-weight: 700; color: #f1f5f9; font-family: monospace; }
.target-val { font-size: 11px; color: #4b5563; }

.card-footer { display: flex; align-items: center; gap: 10px; }
.btn-detail {
  padding: 7px 14px; border-radius: 7px; border: 1px solid #374151;
  background: transparent; color: #9ca3af; font-size: 13px; text-decoration: none;
}
.btn-detail:hover { background: #2d3748; color: #f1f5f9; }
.btn-graduate {
  padding: 7px 18px; border-radius: 7px; border: none;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
}
.btn-graduate:disabled { opacity: 0.6; cursor: not-allowed; }
.hint-msg { font-size: 12px; color: #4b5563; flex: 1; }
</style>
