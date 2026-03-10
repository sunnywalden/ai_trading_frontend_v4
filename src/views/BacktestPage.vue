<template>
  <div class="page-container">
    <section class="section-header">
      <h2>回测引擎</h2>
      <p>对策略进行历史回测，支持 Walk-Forward 验证与 Live 晋级评估</p>
    </section>

    <!-- 提交表单 -->
    <div class="card" style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px;">新建回测</h3>
      <div class="form-grid">
        <div class="form-field">
          <label>策略类型</label>
          <select v-model="form.strategy_type">
            <option value="BOLLINGER">布林带均值回归</option>
            <option value="GOLDEN_CROSS">均线金叉</option>
            <option value="MOMENTUM">动量策略</option>
          </select>
        </div>
        <div class="form-field">
          <label>标的 (逗号分隔)</label>
          <input v-model="symbolsInput" placeholder="AAPL,MSFT,GOOGL" />
        </div>
        <div class="form-field">
          <label>开始日期</label>
          <input type="date" v-model="form.start_date" />
        </div>
        <div class="form-field">
          <label>结束日期</label>
          <input type="date" v-model="form.end_date" />
        </div>
        <div class="form-field">
          <label>初始资金 ($)</label>
          <input type="number" v-model.number="form.initial_capital" />
        </div>
        <div class="form-field" style="align-self: end;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" v-model="form.walk_forward" />
            启用 Walk-Forward
          </label>
        </div>
      </div>
      <button class="primary-button" @click="handleRun" :disabled="backtestStore.running">
        {{ backtestStore.running ? '提交中...' : '🚀 开始回测' }}
      </button>
    </div>

    <!-- 任务列表 -->
    <div class="card" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0;">回测任务</h3>
        <button class="refresh-button" @click="backtestStore.fetchTasks()">刷新</button>
      </div>
      <div v-if="backtestStore.loading" class="loading-message">加载中...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>策略</th>
            <th>标的</th>
            <th>状态</th>
            <th>Sharpe</th>
            <th>最大回撤</th>
            <th>胜率</th>
            <th>晋级</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in backtestStore.tasks" :key="task.id">
            <td>{{ task.strategy_type }}</td>
            <td>{{ formatSymbols(task.symbols) }}</td>
            <td><span :class="`status-badge status-${(task.status || 'PENDING').toLowerCase()}`">{{ task.status }}</span></td>
            <td>{{ formatMetric('sharpe', task.result?.sharpe) }}</td>
            <td>{{ formatMetric('max_drawdown', task.result?.max_drawdown) }}</td>
            <td>{{ formatMetric('win_rate', task.result?.win_rate) }}</td>
            <td>
              <span v-if="task.result?.graduation_eligible" class="badge-success">✓ 可晋级</span>
              <span v-else-if="task.status === 'DONE'" class="badge-warning">未达标</span>
            </td>
            <td>{{ formatDate(task.created_at) }}</td>
            <td>
              <button
                v-if="task.status === 'DONE'"
                class="small-button primary"
                @click="backtestStore.fetchReport(task.id); selectedTaskId = task.id"
              >查看报告</button>
              <button v-else-if="task.status === 'PENDING' || task.status === 'RUNNING'" class="small-button" @click="backtestStore.fetchReport(task.id)">刷新</button>
            </td>
          </tr>
          <tr v-if="backtestStore.tasks.length === 0">
            <td colspan="9" style="text-align: center; color: #666;">暂无回测任务</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 回测报告详情 -->
    <div v-if="currentReport?.result" class="card">
      <h3 style="margin: 0 0 16px;">回测报告 — {{ currentReport.strategy_type }}</h3>
      <div class="metrics-grid">
        <div class="metric-item" v-for="(label, key) in metricLabels" :key="key">
          <div class="metric-label">{{ label }}</div>
          <div class="metric-value">{{ formatMetric(key, (currentReport!.result as any)[key]) }}</div>
        </div>
      </div>
      <div v-if="currentReport.result.windows_results?.length" style="margin-top: 20px;">
        <h4>Walk-Forward 窗口结果</h4>
        <table class="data-table">
          <thead><tr><th>窗口</th><th>Sharpe</th><th>最大回撤</th><th>胜率</th><th>超额收益(α)</th></tr></thead>
          <tbody>
            <tr v-for="(wf, idx) in currentReport.result.windows_results" :key="idx">
              <td>#{{ idx + 1 }}</td>
              <td>{{ formatMetric('sharpe', wf.sharpe) }}</td>
              <td>{{ formatMetric('max_drawdown', wf.max_drawdown) }}</td>
              <td>{{ formatMetric('win_rate', wf.win_rate) }}</td>
              <td>{{ formatMetric('alpha', wf.alpha) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBacktestStore } from '@/stores/backtest'
import { storeToRefs } from 'pinia'
import { formatClientDateTime } from '@/utils/datetime'

const backtestStore = useBacktestStore()
const { currentReport } = storeToRefs(backtestStore)
const selectedTaskId = ref<string | null>(null)

const form = ref({
  strategy_type: 'BOLLINGER',
  start_date: '2022-01-01',
  end_date: new Date().toISOString().split('T')[0],
  initial_capital: 100000,
  walk_forward: false,
})
const symbolsInput = ref('AAPL,MSFT,GOOGL')

const metricLabels: Record<string, string> = {
  sharpe: 'Sharpe 比率', sortino: 'Sortino 比率', max_drawdown: '最大回撤',
  win_rate: '胜率', alpha: '超额收益(α)', total_return: '总收益率',
}

function formatMetric(key: string, val: any): string {
  if (val === undefined || val === null) return '—'
  const n = Number(val)
  if (isNaN(n)) return '—'
  if (key === 'sharpe' || key === 'sortino') return n.toFixed(2)
  return (n * 100).toFixed(2) + '%'
}

function formatSymbols(symbols: any): string {
  if (Array.isArray(symbols)) return symbols.join(', ')
  if (typeof symbols === 'string') {
    try {
      const parsed = JSON.parse(symbols)
      if (Array.isArray(parsed)) return parsed.join(', ')
    } catch {
      return symbols
    }
  }
  return '—'
}

async function handleRun() {
  const symbols = symbolsInput.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
  await backtestStore.runBacktest({ ...form.value, symbols })
}

function formatDate(s: string) {
  return formatClientDateTime(s)
}

onMounted(() => backtestStore.fetchTasks())
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 12px; color: #888; }
.form-field input, .form-field select {
  background: rgba(255,255,255,0.05); border: 1px solid var(--border-color, #2d2d4e);
  border-radius: 6px; color: inherit; padding: 8px; font-size: 13px;
}
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; }
.metric-item { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px; }
.metric-label { font-size: 11px; color: #888; margin-bottom: 4px; }
.metric-value { font-size: 20px; font-weight: 600; }
.card { background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 20px; }
.primary-button { background: #4a90e2; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.refresh-button { background: transparent; border: 1px solid #4a6fa5; color: #4a90e2; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 8px 12px; border-bottom: 1px solid var(--border-color, #2d2d4e); text-align: left; }
.data-table th { color: #888; }
.status-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; }
.status-pending { background: rgba(255,152,0,0.1); color: #ff9800; }
.status-running { background: rgba(33,150,243,0.1); color: #2196f3; }
.status-done { background: rgba(76,175,80,0.1); color: #4caf50; }
.status-failed { background: rgba(244,67,54,0.1); color: #f44336; }
.badge-success { background: rgba(76,175,80,0.15); color: #4caf50; font-size: 12px; padding: 2px 8px; border-radius: 4px; }
.badge-warning { background: rgba(255,152,0,0.15); color: #ff9800; font-size: 12px; padding: 2px 8px; border-radius: 4px; }
.small-button { font-size: 11px; padding: 3px 10px; border-radius: 4px; border: 1px solid; cursor: pointer; background: transparent; }
.small-button.primary { border-color: #4a90e2; color: #4a90e2; }
.loading-message { color: #888; text-align: center; padding: 20px; }
</style>
