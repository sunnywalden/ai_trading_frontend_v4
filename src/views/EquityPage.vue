<template>
  <div class="equity-page">
    <h1 class="page-title">资金曲线 & PnL归因</h1>

    <!-- 时间范围选择 -->
    <div class="toolbar">
      <div class="range-btns">
        <button v-for="d in dayOptions" :key="d" :class="{ active: days === d }" @click="setDays(d)">{{ d }}D</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <!-- 权益曲线图表 -->
    <div class="card chart-card">
      <h3>权益曲线</h3>
      <div ref="equityChartEl" class="chart-container"></div>
    </div>

    <!-- PnL 归因 -->
    <div class="attr-row">
      <div class="card attr-card">
        <div class="attr-header">
          <h3>PnL 归因</h3>
          <select v-model="groupBy" @change="loadAttr">
            <option value="symbol">按标的</option>
            <option value="strategy">按策略</option>
          </select>
        </div>
        <div class="attr-total">
          总盈亏: <span :class="totalPnl >= 0 ? 'pnl-pos' : 'pnl-neg'">${{ totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
        </div>
        <div v-for="item in (attributions || [])" :key="item.label" class="attr-item">
          <span class="attr-label">{{ item.label }}</span>
          <span class="attr-count">{{ item.trade_count }}笔</span>
          <span class="attr-pnl" :class="item.pnl >= 0 ? 'pnl-pos' : 'pnl-neg'">
            ${{ item.pnl.toFixed(2) }} ({{ item.pct.toFixed(1) }}%)
          </span>
        </div>
        <div v-if="!attributions || attributions.length === 0" class="empty">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useEquityStore } from '@/stores/equity'
import * as echarts from 'echarts'

const store = useEquityStore()
const { snapshots, attributions, totalPnl, loading } = storeToRefs(store)

const days = ref(30)
const groupBy = ref('symbol')
const equityChartEl = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
const dayOptions = [7, 30, 90, 180, 365]

async function setDays(d: number) {
  days.value = d
  await store.loadSnapshots(d)
}

async function loadAttr() {
  await store.loadAttribution(groupBy.value)
}

function renderChart() {
  if (!equityChartEl.value) return
  if (!chart) chart = echarts.init(equityChartEl.value)

  const rawSnapshots = snapshots.value || []
  const dates = rawSnapshots.map((s: any) => s.snapshot_date)
  const equity = rawSnapshots.map((s: any) => s.total_equity)
  const drawdown = rawSnapshots.map((s: any) => s.max_drawdown_pct != null ? (s.max_drawdown_pct * 100) : 0)

  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['权益', '回撤 %'] },
    xAxis: { type: 'category', data: dates },
    yAxis: [
      { type: 'value', name: '权益($)', position: 'left' },
      { type: 'value', name: '回撤(%)', position: 'right', max: 0, min: -50 },
    ],
    series: [
      { name: '权益', type: 'line', data: equity, smooth: true, itemStyle: { color: '#6366f1' } },
      { name: '回撤 %', type: 'bar', yAxisIndex: 1, data: drawdown.map((d: number) => -d), itemStyle: { color: 'rgba(239,68,68,0.3)' } },
    ],
    grid: { left: 60, right: 60, bottom: 30, top: 40 },
  })
}

watch(snapshots, () => nextTick(renderChart))

onMounted(async () => {
  await Promise.all([store.loadSnapshots(days.value), store.loadAttribution(groupBy.value)])
  nextTick(renderChart)
})
</script>

<style scoped>
.equity-page { padding: 0; }
.page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; }
.toolbar { margin-bottom: 16px; }
.range-btns { display: flex; gap: 8px; }
.range-btns button {
  padding: 4px 12px; border: 1px solid var(--border, #ddd); border-radius: 6px;
  background: var(--bg-card, #fff); cursor: pointer; font-size: 0.85rem;
}
.range-btns button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
.loading { text-align: center; padding: 2rem; color: var(--text-secondary, #888); }
.card { background: var(--bg-card, #fff); border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.08); margin-bottom: 16px; }
.card h3 { font-size: 1rem; margin-bottom: 12px; }
.chart-container { width: 100%; height: 320px; }
.attr-header { display: flex; justify-content: space-between; align-items: center; }
.attr-header select { padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); }
.attr-total { font-size: 1.1rem; font-weight: 700; margin: 8px 0; }
.attr-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border, #eee); font-size: 0.85rem; }
.attr-label { flex: 1; font-weight: 600; }
.attr-count { width: 60px; text-align: center; color: var(--text-secondary, #888); }
.attr-pnl { width: 120px; text-align: right; font-variant-numeric: tabular-nums; }
.pnl-pos { color: #10b981; }
.pnl-neg { color: #ef4444; }
.empty { color: var(--text-secondary, #888); font-size: 0.85rem; }
</style>
