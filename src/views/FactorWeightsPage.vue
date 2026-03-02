<template>
  <div class="page-container">
    <section class="section-header">
      <div class="page-header-row">
        <div>
          <h2>⚖️ 自适应因子权重</h2>
          <p>Kalman Filter 在线学习 · IC 排名 · 动量调整</p>
        </div>
        <button class="refresh-button" :disabled="store.loadingWeights" @click="store.fetchFactorWeights()">
          {{ store.loadingWeights ? '计算中...' : '刷新' }}
        </button>
      </div>
    </section>

    <!-- 当前权重指标卡 -->
    <div class="metrics-row" v-if="store.factorWeights">
      <div class="metric-card" v-for="(w, dim) in store.factorWeights" :key="dim">
        <div class="mc-label">{{ dimLabel(dim) }}</div>
        <div class="mc-value" :style="{ color: weightColor(w) }">{{ (w * 100).toFixed(1) }}%</div>
        <div class="weight-bar">
          <div class="weight-fill" :style="{ width: (w * 100 / 0.4 * 100) + '%', background: weightColor(w) }" />
        </div>
        <div class="mc-sub">IC 排名 #{{ icRank(dim) }}</div>
      </div>
    </div>

    <div class="row-half" style="margin-bottom: 20px;">
      <!-- Kalman 权重演化 -->
      <div class="panel">
        <div class="panel-title">📈 六维权重 Kalman 演化（近 60 天）</div>
        <div ref="weightsChartEl" style="width:100%; height:340px;" />
      </div>

      <!-- IC 排名与动量 -->
      <div class="panel">
        <div class="panel-title">🏆 IC 排名 & 动量调整雷达</div>
        <div ref="momentumChartEl" style="width:100%; height:340px;" />
      </div>
    </div>

    <!-- 动量调整日志表 -->
    <div class="panel">
      <div class="panel-title">📋 权重调整历史（最近 20 条）</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>维度</th>
              <th>调整前</th>
              <th>调整后（Kalman）</th>
              <th>动量调整后</th>
              <th>Kalman 增益</th>
              <th>IC(5d)</th>
              <th>IC(20d)</th>
              <th>IC 排名</th>
              <th>原因</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loadingWeights">
              <td colspan="10" class="empty-cell">加载中...</td>
            </tr>
            <tr v-else-if="!store.weightsHistory.length">
              <td colspan="10" class="empty-cell">暂无调整历史</td>
            </tr>
            <tr v-else v-for="r in store.weightsHistory.slice(0, 20)" :key="r.id">
              <td class="time-cell">{{ r.record_date }}</td>
              <td class="sym">{{ dimLabel(r.dimension) }}</td>
              <td>{{ (r.weight_before * 100).toFixed(2) }}%</td>
              <td :class="r.weight_after > r.weight_before ? 'good' : 'danger'">
                {{ (r.weight_after * 100).toFixed(2) }}%
                <span class="delta">{{ r.weight_after > r.weight_before ? '↑' : '↓' }}{{ Math.abs((r.weight_after - r.weight_before) * 100).toFixed(2) }}%</span>
              </td>
              <td>{{ ((r.weight_momentum_adjusted ?? 0) * 100).toFixed(2) }}%</td>
              <td>{{ r.kalman_gain?.toFixed(4) }}</td>
              <td :class="(r.ic_5d ?? 0) > 0.05 ? 'good' : (r.ic_5d ?? 0) > 0 ? 'warn' : 'danger'">{{ ((r.ic_5d ?? 0) * 100).toFixed(2) }}%</td>
              <td :class="(r.ic_20d ?? 0) > 0.05 ? 'good' : (r.ic_20d ?? 0) > 0 ? 'warn' : 'danger'">{{ ((r.ic_20d ?? 0) * 100).toFixed(2) }}%</td>
              <td><span class="rank-badge">{{ r.ic_rank }}</span></td>
              <td class="reason-cell">{{ r.adjustment_reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAiHubStore } from '@/stores/aiHub'
import * as echarts from 'echarts'

const store = useAiHubStore()
const weightsChartEl = ref<HTMLElement | null>(null)
const momentumChartEl = ref<HTMLElement | null>(null)
let weightsChart: echarts.ECharts | null = null
let momentumChart: echarts.ECharts | null = null

const DIM_LABELS: Record<string, string> = {
  technical: '技术面', fundamental: '基本面', ml: 'ML', sentiment: '情绪', macro: '宏观', event: '事件'
}
function dimLabel(d: string) { return DIM_LABELS[d] || d }

function weightColor(w: number) {
  if (w >= 0.28) return '#00ff88'
  if (w >= 0.15) return '#ffd700'
  return '#ff6b6b'
}

const icRankMap = computed(() => {
  if (!store.factorMomentum) return {}
  const map: Record<string, number> = {}
  store.factorMomentum.dimension_rankings?.forEach((d, i) => { map[d] = i + 1 })
  return map
})

function icRank(dim: string) { return icRankMap.value[dim] ?? '-' }

const COLORS = ['#00ff88', '#ff6b35', '#ffd700', '#a8dadc', '#c77dff', '#4dffb8']
const DIMS = ['technical', 'fundamental', 'ml', 'sentiment', 'macro', 'event']

function renderWeights() {
  if (!weightsChartEl.value || !store.weightsHistory.length) return
  if (!weightsChart) weightsChart = echarts.init(weightsChartEl.value, 'dark')
  // group by dimension
  const dates = [...new Set(store.weightsHistory.map((r) => r.record_date))].sort()
  const series = DIMS.map((dim, i) => ({
    name: dimLabel(dim), type: 'line', smooth: true,
    data: dates.map((d) => {
      const r = store.weightsHistory.find((h) => h.record_date === d && h.dimension === dim)
      return r ? ((r.weight_momentum_adjusted ?? 0) * 100).toFixed(2) : null
    }),
    itemStyle: { color: COLORS[i] },
  }))
  weightsChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: (params: { seriesName: string; value: string }[]) => params.map((p) => `${p.seriesName}: ${p.value}%`).join('<br/>') },
    legend: { bottom: 0, textStyle: { color: '#ccc' } },
    xAxis: { type: 'category', data: dates, axisLabel: { color: '#999', rotate: 30, fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v.toFixed(0) + '%', color: '#999' } },
    series,
  })
}

function renderMomentum() {
  if (!momentumChartEl.value || !store.factorMomentum) return
  if (!momentumChart) momentumChart = echarts.init(momentumChartEl.value, 'dark')
  const m = store.factorMomentum
  momentumChart.setOption({
    backgroundColor: 'transparent',
    radar: {
      indicator: DIMS.map((d) => ({ name: dimLabel(d), max: 0.5 })),
      axisLine: { lineStyle: { color: 'rgba(0,255,136,0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(0,255,136,0.1)' } },
      name: { textStyle: { color: '#ccc' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: DIMS.map((d) => m.ic_5d_by_dimension?.[d] ?? 0),
        name: 'IC(5d)',
        itemStyle: { color: '#00ff88' }, areaStyle: { color: 'rgba(0,255,136,0.15)' },
      }, {
        value: DIMS.map((d) => (store.factorWeights?.[d] ?? 0)),
        name: '当前权重',
        itemStyle: { color: '#ffd700' }, areaStyle: { color: 'rgba(255,215,0,0.1)' },
      }],
    }],
    legend: { bottom: 0, textStyle: { color: '#ccc' } },
  })
}

watch(() => store.weightsHistory, renderWeights, { deep: true })
watch(() => store.factorMomentum, renderMomentum, { deep: true })
onMounted(async () => { await store.fetchFactorWeights(); renderWeights(); renderMomentum() })
</script>

<style scoped>
.page-container { padding: 20px; background: #1a1a2e; min-height: 100vh; color: #e0e0e0; }
.section-header { margin-bottom: 20px; }
.page-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.page-header-row h2 { margin: 0 0 4px; color: #00ff88; font-size: 1.4rem; }
.page-header-row p { margin: 0; color: #888; font-size: 0.85rem; }
.refresh-button { padding: 6px 16px; background: rgba(0,255,136,0.15); border: 1px solid #00ff88; color: #00ff88; border-radius: 4px; cursor: pointer; }
.refresh-button:disabled { opacity: 0.5; cursor: not-allowed; }
.metrics-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.metric-card { flex: 1; min-width: 120px; background: rgba(0,255,136,0.05); border: 1px solid rgba(0,255,136,0.15); border-radius: 8px; padding: 12px 14px; text-align: center; }
.mc-label { font-size: 0.72rem; color: #888; margin-bottom: 4px; }
.mc-value { font-size: 1.4rem; font-weight: 700; }
.weight-bar { width: 100%; height: 4px; background: #333; border-radius: 2px; margin: 6px 0 4px; overflow: hidden; }
.weight-fill { height: 4px; border-radius: 2px; transition: width 0.4s; max-width: 100%; }
.mc-sub { font-size: 0.7rem; color: #666; }
.good { color: #00ff88; } .warn { color: #ffd700; } .danger { color: #ff4444; }
.row-half { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.panel { background: #0d1117; border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.panel-title { font-size: 0.9rem; font-weight: 600; color: #00ff88; margin-bottom: 12px; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; white-space: nowrap; }
.data-table th { padding: 8px; background: rgba(0,255,136,0.08); color: #00ff88; text-align: left; }
.data-table td { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.sym { color: #00ff88; font-weight: 600; }
.time-cell { color: #888; }
.reason-cell { max-width: 200px; white-space: normal; color: #999; font-size: 0.76rem; }
.delta { font-size: 0.7rem; margin-left: 4px; opacity: 0.7; }
.rank-badge { display: inline-block; background: rgba(0,255,136,0.15); color: #00ff88; padding: 1px 6px; border-radius: 3px; font-size: 0.78rem; }
.empty-cell { text-align: center; color: #666; padding: 20px; }
</style>
