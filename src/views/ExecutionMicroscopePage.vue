<template>
  <div class="page-container">
    <section class="section-header">
      <div class="page-header-row">
        <div>
          <h2>🔬 执行显微镜</h2>
          <p>IS 四分解 · 执行成本全透视 · Fill 热力图</p>
        </div>
        <div class="header-actions">
          <select v-model="days" class="filter-select" @change="store.fetchExecutionMicroscope(days)">
            <option :value="7">近 7 天</option>
            <option :value="30">近 30 天</option>
            <option :value="90">近 90 天</option>
          </select>
          <button class="refresh-button" :disabled="store.loadingExecution" @click="store.fetchExecutionMicroscope(days)">
            {{ store.loadingExecution ? '加载中...' : '刷新' }}
          </button>
        </div>
      </div>
    </section>

    <!-- 汇总指标行 -->
    <div class="metrics-row">
      <div class="metric-card">
        <div class="mc-label">平均执行等级</div>
        <div class="mc-value grade" :class="`grade-${store.avgIsGrade}`">{{ store.avgIsGrade }}</div>
      </div>
      <div class="metric-card" v-for="dim in dimensionKeys" :key="dim">
        <div class="mc-label">{{ dimLabel(dim) }}</div>
        <div class="mc-value" :class="avgValue(dim) > 20 ? 'danger' : avgValue(dim) > 8 ? 'warn' : 'good'">
          {{ avgValue(dim).toFixed(1) }} bps
        </div>
      </div>
    </div>

    <!-- IS 分解表 + 趋势图 -->
    <div class="row-half" style="margin-bottom: 20px;">
      <!-- IS 分解明细表 -->
      <div class="panel">
        <div class="panel-title">📊 执行记录 IS 四分解</div>
        <div class="table-wrap" style="max-height: 380px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>标的</th>
                <th>时间</th>
                <th>延迟</th>
                <th>市场冲击</th>
                <th>机会成本</th>
                <th>择时</th>
                <th>总 IS</th>
                <th>成交率</th>
                <th>等级</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.loadingExecution">
                <td colspan="9" class="loading-cell">加载中...</td>
              </tr>
              <tr v-else-if="!store.executionQuality.length">
                <td colspan="9" class="empty-cell">暂无数据</td>
              </tr>
              <tr v-else v-for="r in store.executionQuality" :key="r.id">
                <td class="symbol-cell">{{ r.symbol }}</td>
                <td class="time-cell">{{ formatTime(r.created_at) }}</td>
                <td :class="bpsCss(r.delay_cost_bps)">{{ r.delay_cost_bps?.toFixed(1) }}</td>
                <td :class="bpsCss(r.market_impact_bps)">{{ r.market_impact_bps?.toFixed(1) }}</td>
                <td :class="bpsCss(r.opportunity_cost_bps)">{{ r.opportunity_cost_bps?.toFixed(1) }}</td>
                <td :class="bpsCss(r.timing_cost_bps)">{{ r.timing_cost_bps?.toFixed(1) }}</td>
                <td :class="bpsCss(r.total_is_bps, true)"><strong>{{ r.total_is_bps?.toFixed(1) }}</strong></td>
                <td>{{ r.fill_rate != null ? (r.fill_rate * 100).toFixed(1) + '%' : '-' }}</td>
                <td><span class="grade-badge" :class="`grade-${r.grade}`">{{ r.grade }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 每日 IS 趋势折线图 -->
      <div class="panel">
        <div class="panel-title">📈 每日平均 IS 趋势</div>
        <div ref="trendChartEl" style="width:100%; height:350px;" />
      </div>
    </div>

    <!-- Fill 热力图 -->
    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-title">🌡️ Fill Rate 热力图（时间 × 标的）</div>
      <div ref="heatmapEl" style="width:100%; height:300px;" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useObservabilityStore } from '@/stores/observability'
import * as echarts from 'echarts'

const store = useObservabilityStore()
const days = ref(30)

const trendChartEl = ref<HTMLElement | null>(null)
const heatmapEl = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null
let heatmapChart: echarts.ECharts | null = null

const dimensionKeys = ['delay_cost_bps', 'market_impact_bps', 'opportunity_cost_bps', 'timing_cost_bps'] as const

function dimLabel(key: string) {
  const map: Record<string, string> = {
    delay_cost_bps: '延迟成本',
    market_impact_bps: '市场冲击',
    opportunity_cost_bps: '机会成本',
    timing_cost_bps: '择时成本',
  }
  return map[key] || key
}

function avgValue(key: string) {
  const arr = store.executionQuality
  if (!arr.length) return 0
  const vals = arr.map((r) => (r as unknown as Record<string, number>)[key] ?? 0)
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function bpsCss(v: number | null | undefined, isTot = false) {
  if (v == null) return ''
  const t = isTot ? [30, 60] : [8, 20]
  if (v > t[1]) return 'danger'
  if (v > t[0]) return 'warn'
  return 'good'
}

function formatTime(ts: string | null) {
  if (!ts) return '-'
  return new Date(ts).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function renderTrend() {
  if (!trendChartEl.value) return
  if (!trendChart) trendChart = echarts.init(trendChartEl.value, 'dark')
  const data = store.executionTrend
  trendChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['延迟', '市场冲击', '机会成本', '择时'], bottom: 0, textStyle: { color: '#ccc' } },
    xAxis: { type: 'category', data: data.map((d) => d.date), axisLabel: { color: '#999' } },
    yAxis: { type: 'value', name: 'bps', axisLabel: { color: '#999' } },
    series: [
      { name: '延迟', type: 'line', smooth: true, data: data.map((d) => d.avg_delay_bps?.toFixed(2) ?? 0), itemStyle: { color: '#00ff88' } },
      { name: '市场冲击', type: 'line', smooth: true, data: data.map((d) => d.avg_market_impact_bps?.toFixed(2) ?? 0), itemStyle: { color: '#ff6b35' } },
      { name: '机会成本', type: 'line', smooth: true, data: data.map((d) => d.avg_opportunity_bps?.toFixed(2) ?? 0), itemStyle: { color: '#f7c59f' } },
      { name: '择时', type: 'line', smooth: true, data: data.map((d) => d.avg_timing_bps?.toFixed(2) ?? 0), itemStyle: { color: '#a8dadc' } },
    ],
  })
}

function renderHeatmap() {
  if (!heatmapEl.value) return
  if (!heatmapChart) heatmapChart = echarts.init(heatmapEl.value, 'dark')
  const cells = store.fillHeatmap
  const symbols = [...new Set(cells.map((c) => c.symbol))]
  const hours = [...new Set(cells.map((c) => String(c.hour_of_day)))].sort()
  const data = cells.map((c) => [hours.indexOf(String(c.hour_of_day)), symbols.indexOf(c.symbol), +(c.avg_fill_rate * 100).toFixed(1)])
  heatmapChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { formatter: (p: { value: [number, number, number] }) => `${symbols[p.value[1]]} ${hours[p.value[0]]}时 Fill: ${p.value[2]}%` },
    xAxis: { type: 'category', data: hours, name: '小时' },
    yAxis: { type: 'category', data: symbols },
    visualMap: { min: 0, max: 100, calculable: true, inRange: { color: ['#1a1a2e', '#00ff88'] }, textStyle: { color: '#ccc' } },
    series: [{ type: 'heatmap', data, label: { show: false } }],
  })
}

watch(() => store.executionTrend, renderTrend, { deep: true })
watch(() => store.fillHeatmap, renderHeatmap, { deep: true })

onMounted(async () => {
  await store.fetchExecutionMicroscope(days.value)
  renderTrend()
  renderHeatmap()
})
</script>

<style scoped>
.page-container { padding: 20px; background: #1a1a2e; min-height: 100vh; color: #e0e0e0; }
.section-header { margin-bottom: 20px; }
.page-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.page-header-row h2 { margin: 0 0 4px; color: #00ff88; font-size: 1.4rem; }
.page-header-row p { margin: 0; color: #888; font-size: 0.85rem; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.refresh-button { padding: 6px 16px; background: rgba(0,255,136,0.15); border: 1px solid #00ff88; color: #00ff88; border-radius: 4px; cursor: pointer; }
.refresh-button:hover { background: rgba(0,255,136,0.25); }
.refresh-button:disabled { opacity: 0.5; cursor: not-allowed; }
.filter-select { background: #0d0d1a; border: 1px solid rgba(0,255,136,0.3); color: #ccc; padding: 6px 10px; border-radius: 4px; }
.metrics-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.metric-card { flex: 1; min-width: 120px; background: rgba(0,255,136,0.05); border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 14px 16px; text-align: center; }
.mc-label { font-size: 0.75rem; color: #888; margin-bottom: 6px; }
.mc-value { font-size: 1.4rem; font-weight: 700; }
.mc-value.grade { font-size: 2rem; }
.grade-A { color: #00ff88; }
.grade-B { color: #7fff7f; }
.grade-C { color: #ffd700; }
.grade-D { color: #ff6b35; }
.grade-F { color: #ff4444; }
.good { color: #00ff88; }
.warn { color: #ffd700; }
.danger { color: #ff4444; }
.row-half { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.panel { background: #0d1117; border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 16px; }
.panel-title { font-size: 0.9rem; font-weight: 600; color: #00ff88; margin-bottom: 12px; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.data-table th { padding: 8px 10px; background: rgba(0,255,136,0.08); color: #00ff88; text-align: left; white-space: nowrap; }
.data-table td { padding: 7px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.loading-cell, .empty-cell { text-align: center; color: #666; padding: 20px; }
.symbol-cell { color: #00ff88; font-weight: 600; }
.time-cell { color: #888; white-space: nowrap; }
.grade-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.8rem; }
.grade-badge.grade-A { background: rgba(0,255,136,0.2); color: #00ff88; }
.grade-badge.grade-B { background: rgba(127,255,127,0.2); color: #7fff7f; }
.grade-badge.grade-C { background: rgba(255,215,0,0.2); color: #ffd700; }
.grade-badge.grade-D { background: rgba(255,107,53,0.2); color: #ff6b35; }
.grade-badge.grade-F { background: rgba(255,68,68,0.2); color: #ff4444; }
</style>
