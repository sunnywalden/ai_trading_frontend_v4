<template>
  <div class="page-container">
    <section class="section-header">
      <div class="page-header-row">
        <div>
          <h2>📡 信号智能观测台</h2>
          <p>六维 IC 分析 · Alpha 衰减 · 信号拥挤度监控</p>
        </div>
        <button class="refresh-button" :disabled="store.loadingSignal" @click="store.fetchSignalIntelligence()">
          {{ store.loadingSignal ? '分析中...' : '刷新' }}
        </button>
      </div>
    </section>

    <!-- 拥挤度警告 -->
    <div v-if="store.hasCrowdingAlert" class="alert-banner warn">
      ⚠️ 检测到 {{ store.crowdingAlerts.length }} 个信号维度存在拥挤风险，建议降低相应权重
    </div>

    <!-- 指标卡行 -->
    <div class="metrics-row" v-if="store.signalIntelligence">
      <div class="metric-card" v-for="dim in store.signalIntelligence.dimensions" :key="dim.dimension">
        <div class="mc-label">{{ dimLabel(dim.dimension) }}</div>
        <div class="mc-value" :class="icColor(dim.ic_5d)">{{ (dim.ic_5d * 100).toFixed(1) }}%</div>
        <div class="mc-sub">IC(5d)</div>
        <div class="crowding-bar">
          <div class="crowding-fill" :style="{ width: (dim.crowding_score * 100) + '%', background: crowdingColor(dim.crowding_score) }" />
        </div>
        <div class="mc-sub" :style="{ color: crowdingColor(dim.crowding_score) }">拥挤 {{ (dim.crowding_score * 100).toFixed(0) }}%</div>
      </div>
    </div>

    <div class="row-half" style="margin-bottom: 20px;">
      <!-- IC 柱状图 -->
      <div class="panel">
        <div class="panel-title">📊 六维 IC 对比（5d / 20d / 60d）</div>
        <div ref="icChartEl" style="width:100%; height:340px;" />
      </div>

      <!-- Alpha 衰减曲线 -->
      <div class="panel">
        <div class="panel-title">⏳ Alpha 衰减曲线</div>
        <div v-if="!selectedDim" class="empty-cell" style="padding: 40px; text-align:center;">
          点击左侧维度查看衰减
        </div>
        <div ref="decayChartEl" style="width:100%; height:340px;" />
      </div>
    </div>

    <!-- 相关性矩阵 -->
    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-title">🔗 信号相关性矩阵</div>
      <div ref="corrChartEl" style="width:100%; height:300px;" />
    </div>

    <!-- 拥挤度警告列表 -->
    <div class="panel" v-if="store.crowdingAlerts.length">
      <div class="panel-title">🚨 拥挤度超阈值列表（拥挤度 > 75%）</div>
      <table class="data-table">
        <thead>
          <tr><th>维度</th><th>拥挤度</th><th>IC(5d)</th><th>IC(20d)</th><th>半衰期</th><th>建议调整</th></tr>
        </thead>
        <tbody>
          <tr v-for="d in store.crowdingAlerts" :key="d.dimension">
            <td class="symbol-cell">{{ dimLabel(d.dimension) }}</td>
            <td class="danger">{{ (d.crowding_score * 100).toFixed(1) }}%</td>
            <td :class="icColor(d.ic_5d)">{{ (d.ic_5d * 100).toFixed(2) }}%</td>
            <td :class="icColor(d.ic_20d)">{{ (d.ic_20d * 100).toFixed(2) }}%</td>
            <td>{{ d.alpha_halflife_days?.toFixed(0) ?? '-' }} 天</td>
            <td class="warn">降低权重 {{ ((d.crowding_score - 0.75) * (0.15 / 0.25) * 100).toFixed(0) }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useObservabilityStore } from '@/stores/observability'
import * as echarts from 'echarts'

const store = useObservabilityStore()
const icChartEl = ref<HTMLElement | null>(null)
const decayChartEl = ref<HTMLElement | null>(null)
const corrChartEl = ref<HTMLElement | null>(null)
const selectedDim = ref<string | null>(null)
let icChart: echarts.ECharts | null = null
let decayChart: echarts.ECharts | null = null
let corrChart: echarts.ECharts | null = null

const DIM_LABELS: Record<string, string> = {
  technical: '技术面', fundamental: '基本面', ml: 'ML', sentiment: '情绪', macro: '宏观', event: '事件'
}
function dimLabel(d: string) { return DIM_LABELS[d] || d }
function icColor(v: number) { return v > 0.05 ? 'good' : v > 0 ? 'warn' : 'danger' }
function crowdingColor(v: number) { return v > 0.75 ? '#ff4444' : v > 0.5 ? '#ffd700' : '#00ff88' }

function renderIC() {
  if (!icChartEl.value || !store.signalIntelligence) return
  if (!icChart) icChart = echarts.init(icChartEl.value, 'dark')
  const dims = store.signalIntelligence.dimensions
  const labels = dims.map((d) => dimLabel(d.dimension))
  icChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['IC(5d)', 'IC(20d)', 'IC(60d)'], bottom: 0, textStyle: { color: '#ccc' } },
    xAxis: { type: 'category', data: labels, axisLabel: { color: '#999' } },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => (v * 100).toFixed(1) + '%', color: '#999' } },
    series: [
      { name: 'IC(5d)', type: 'bar', data: dims.map((d) => d.ic_5d), itemStyle: { color: '#00ff88' } },
      { name: 'IC(20d)', type: 'bar', data: dims.map((d) => d.ic_20d), itemStyle: { color: '#4dffb8' } },
      { name: 'IC(60d)', type: 'bar', data: dims.map((d) => d.ic_60d), itemStyle: { color: '#99ffd4' } },
    ],
  })
  icChart.on('click', (p) => {
    const dim = store.signalIntelligence!.dimensions[p.dataIndex as number]
    selectedDim.value = dim.dimension
    renderDecay((dim as any).alpha_decay_curve ?? [])
  })
}

function renderDecay(curve: Array<{ lag: number; ic: number }> = []) {
  if (!decayChartEl.value) return
  if (!decayChart) decayChart = echarts.init(decayChartEl.value, 'dark')
  decayChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: curve.map((c) => `${c.lag}d`), name: '滞后天数', axisLabel: { color: '#999' } },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => (v * 100).toFixed(1) + '%', color: '#999' } },
    series: [{ type: 'line', smooth: true, data: curve.map((c) => c.ic), itemStyle: { color: '#00ff88' }, areaStyle: { color: 'rgba(0,255,136,0.1)' } }],
  })
}

function renderCorr() {
  if (!corrChartEl.value || !store.correlationMatrix) return
  if (!corrChart) corrChart = echarts.init(corrChartEl.value, 'dark')
  const mat = store.correlationMatrix
  const labels = (mat.dimensions ?? mat.symbols).map(dimLabel)
  const data: [number, number, number][] = []
  mat.matrix.forEach((row, i) => row.forEach((v, j) => data.push([j, i, +v.toFixed(3)])))
  corrChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { formatter: (p: { value: [number, number, number] }) => `${labels[p.value[1]]} × ${labels[p.value[0]]}: ${p.value[2]}` },
    xAxis: { type: 'category', data: labels, axisLabel: { color: '#999', rotate: 30 } },
    yAxis: { type: 'category', data: labels, axisLabel: { color: '#999' } },
    visualMap: { min: -1, max: 1, calculable: true, inRange: { color: ['#ff4444', '#222', '#00ff88'] }, textStyle: { color: '#ccc' } },
    series: [{ type: 'heatmap', data, label: { show: true, fontSize: 10, color: '#555' } }],
  })
}

watch(() => store.signalIntelligence, () => { renderIC(); renderCorr() }, { deep: true })
watch(() => store.correlationMatrix, renderCorr, { deep: true })

onMounted(async () => {
  await store.fetchSignalIntelligence()
  renderIC()
  renderCorr()
})
</script>

<style scoped>
.page-container { padding: 20px; background: #1a1a2e; min-height: 100vh; color: #e0e0e0; }
.section-header { margin-bottom: 20px; }
.page-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.page-header-row h2 { margin: 0 0 4px; color: #00ff88; font-size: 1.4rem; }
.page-header-row p { margin: 0; color: #888; font-size: 0.85rem; }
.refresh-button { padding: 6px 16px; background: rgba(0,255,136,0.15); border: 1px solid #00ff88; color: #00ff88; border-radius: 4px; cursor: pointer; }
.refresh-button:disabled { opacity: 0.5; cursor: not-allowed; }
.alert-banner { padding: 10px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 0.85rem; }
.alert-banner.warn { background: rgba(255,215,0,0.1); border: 1px solid #ffd700; color: #ffd700; }
.metrics-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.metric-card { flex: 1; min-width: 120px; background: rgba(0,255,136,0.05); border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 12px 14px; text-align: center; }
.mc-label { font-size: 0.72rem; color: #888; margin-bottom: 4px; }
.mc-value { font-size: 1.5rem; font-weight: 700; }
.mc-sub { font-size: 0.7rem; color: #666; margin-top: 2px; }
.crowding-bar { width: 100%; height: 4px; background: #333; border-radius: 2px; margin: 6px 0 4px; }
.crowding-fill { height: 4px; border-radius: 2px; transition: width 0.4s; }
.good { color: #00ff88; } .warn { color: #ffd700; } .danger { color: #ff4444; }
.row-half { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.panel { background: #0d1117; border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 16px; }
.panel-title { font-size: 0.9rem; font-weight: 600; color: #00ff88; margin-bottom: 12px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.data-table th { padding: 8px; background: rgba(0,255,136,0.08); color: #00ff88; text-align: left; }
.data-table td { padding: 7px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.symbol-cell { color: #00ff88; font-weight: 600; }
.empty-cell { color: #666; }
</style>
