<template>
  <div class="dashboard-page">
    <h1 class="page-title">Dashboard</h1>

    <div v-if="loading" class="loading-spinner">加载中...</div>
    <div v-else-if="error" class="error-banner">{{ error }}</div>

    <template v-if="summary">
      <!-- 核心指标卡片 -->
      <div class="kpi-row">
        <div class="kpi-card">
          <span class="kpi-label">总权益</span>
          <span class="kpi-value">${{ fmt(summary.total_equity) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">当日盈亏</span>
          <span class="kpi-value" :class="pnlClass(summary.daily_pnl)">
            {{ summary.daily_pnl >= 0 ? '+' : '' }}${{ fmt(summary.daily_pnl) }}
            <small>({{ summary.daily_return_pct.toFixed(2) }}%)</small>
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">MTD</span>
          <span class="kpi-value" :class="pnlClass(summary.mtd_return_pct)">{{ summary.mtd_return_pct.toFixed(2) }}%</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">YTD</span>
          <span class="kpi-value" :class="pnlClass(summary.ytd_return_pct)">{{ summary.ytd_return_pct.toFixed(2) }}%</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">风险等级</span>
          <span class="kpi-value risk-badge" :class="'risk-' + summary.risk_level.toLowerCase()">{{ summary.risk_level }}</span>
        </div>
      </div>

      <!-- 中间区域 -->
      <div class="mid-row">
        <!-- Greeks 水位 -->
        <div class="card greeks-card">
          <h3>Greeks 敞口</h3>
          <GreeksBar label="Delta" :value="summary.exposure.delta_pct" />
          <GreeksBar label="Gamma" :value="summary.exposure.gamma_pct" />
          <GreeksBar label="Vega" :value="summary.exposure.vega_pct" />
          <GreeksBar label="Theta" :value="summary.exposure.theta_pct" />
        </div>

        <!-- 计划执行率 -->
        <div class="card plan-card">
          <h3>计划执行</h3>
          <div class="plan-stat">
            <span>活跃计划：{{ summary.active_plans_count }}</span>
            <span>执行率：{{ summary.plan_execution_rate.toFixed(1) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: Math.min(summary.plan_execution_rate, 100) + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 信号 & 待办 -->
      <div class="bottom-row">
        <div class="card signals-card">
          <h3>最近信号</h3>
          <div v-if="!(summary.recent_signals && summary.recent_signals.length > 0)" class="empty">暂无信号</div>
          <div v-for="sig in (summary.recent_signals || [])" :key="sig.timestamp" class="signal-item">
            <span class="signal-symbol">{{ sig.symbol }}</span>
            <span class="signal-msg">{{ sig.message }}</span>
            <span class="signal-time">{{ formatTime(sig.timestamp) }}</span>
          </div>
        </div>
        <div class="card actions-card">
          <h3>待办事项</h3>
          <div v-if="!(summary.pending_actions && summary.pending_actions.length > 0)" class="empty">无待办</div>
          <div v-for="act in (summary.pending_actions || [])" :key="act.action_type" class="action-item">
            <router-link :to="act.link">{{ act.message }}</router-link>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import GreeksBar from '@/components/GreeksBar.vue'

const store = useDashboardStore()
const { summary, loading, error } = storeToRefs(store)

onMounted(() => store.refresh())

function fmt(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function pnlClass(v: number) { return v >= 0 ? 'pnl-positive' : 'pnl-negative' }
function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.dashboard-page { padding: 0; }
.page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; }
.loading-spinner { text-align: center; padding: 2rem; color: var(--text-secondary, #888); }
.error-banner { background: #fee; color: #c00; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; }

.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 16px; }
.kpi-card {
  background: var(--bg-card, #fff); border-radius: 12px; padding: 16px;
  display: flex; flex-direction: column; gap: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}
.kpi-label { font-size: 0.8rem; color: var(--text-secondary, #888); }
.kpi-value { font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.pnl-positive { color: #10b981; }
.pnl-negative { color: #ef4444; }
.risk-badge { padding: 2px 8px; border-radius: 6px; font-size: 0.85rem; }
.risk-low { background: #d1fae5; color: #065f46; }
.risk-medium { background: #fef3c7; color: #92400e; }
.risk-high { background: #fee2e2; color: #991b1b; }
.risk-extreme { background: #fca5a5; color: #7f1d1d; }

.mid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card {
  background: var(--bg-card, #fff); border-radius: 12px; padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}
.card h3 { font-size: 1rem; margin-bottom: 12px; }
.plan-stat { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
.progress-bar { height: 8px; background: var(--bg-secondary, #e5e7eb); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: #6366f1; border-radius: 4px; transition: width .3s; }
.signal-item { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border, #eee); font-size: 0.85rem; }
.signal-symbol { font-weight: 600; min-width: 60px; }
.signal-msg { flex: 1; }
.signal-time { color: var(--text-secondary, #888); white-space: nowrap; }
.action-item a { color: #6366f1; text-decoration: none; font-size: 0.9rem; }
.empty { color: var(--text-secondary, #888); font-size: 0.85rem; }
</style>
