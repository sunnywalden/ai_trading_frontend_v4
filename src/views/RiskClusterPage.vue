<template>
  <div class="page-container">
    <section class="section-header">
      <div class="page-header-row">
        <div>
          <h2>⚡ 风险拓扑聚类</h2>
          <p>五因子敞口雷达 · ES@97.5% · 相关性热力图</p>
        </div>
        <button class="refresh-button" :disabled="store.loadingRisk" @click="refreshRiskCluster">
          {{ store.loadingRisk ? '计算中...' : '刷新' }}
        </button>
      </div>
    </section>

    <!-- 相关性飙升警告 -->
    <div v-if="store.hasCorrelationSpike" class="alert-banner danger">
      🔴 相关性飙升警告：组合内平均两两相关度已突破警戒线，建议立即审视持仓分散性
    </div>

    <!-- 关键风险指标 -->
    <div class="metrics-row" v-if="store.latestFactorSnap">
      <div class="metric-card">
        <div class="mc-label">ES @97.5%</div>
        <div class="mc-value danger">{{ store.latestFactorSnap.es_97_5?.toFixed(2) }}%</div>
      </div>
      <div class="metric-card">
        <div class="mc-label">VaR @99%</div>
        <div class="mc-value warn">{{ store.latestFactorSnap.var_99?.toFixed(2) }}%</div>
      </div>
      <div class="metric-card">
        <div class="mc-label">Beta 市场</div>
        <div class="mc-value" :class="Math.abs(store.latestFactorSnap.beta_market ?? 0) > 1.2 ? 'danger' : 'good'">
          {{ store.latestFactorSnap.beta_market?.toFixed(3) }}
        </div>
      </div>
      <div class="metric-card">
        <div class="mc-label">平均两两相关</div>
        <div class="mc-value" :class="(store.latestFactorSnap.avg_pairwise_corr ?? 0) > 0.65 ? 'danger' : 'warn'">
          {{ store.latestFactorSnap.avg_pairwise_corr?.toFixed(3) }}
        </div>
      </div>
      <div class="metric-card">
        <div class="mc-label">最大两两相关</div>
        <div class="mc-value danger">{{ store.latestFactorSnap.max_pairwise_corr?.toFixed(3) }}</div>
      </div>
      <div class="metric-card">
        <div class="mc-label">相关性状态</div>
        <div class="mc-value" :class="store.latestFactorSnap.correlation_spike ? 'danger' : 'good'">
          {{ store.latestFactorSnap.correlation_spike ? '⚠️ 飙升' : '✓ 正常' }}
        </div>
      </div>
    </div>

    <div class="row-3col" style="margin-bottom: 20px;">
      <!-- 因子雷达图 -->
      <div class="panel">
        <div class="panel-title">🕸️ 五因子敞口雷达</div>
        <div ref="radarEl" style="width:100%; height:320px;" />
      </div>
      <!-- ES 时间序列 -->
      <div class="panel">
        <div class="panel-title">📉 ES@97.5% 历史（近 24h）</div>
        <div ref="esChartEl" style="width:100%; height:320px;" />
      </div>
      <!-- 相关性矩阵 -->
      <div class="panel">
        <div class="panel-title">🌡️ 相关性警告历史</div>
        <div class="table-wrap" style="max-height:320px; overflow-y:auto;">
          <table class="data-table">
            <thead><tr><th>时间</th><th>最大相关</th><th>高相关对</th></tr></thead>
            <tbody>
              <tr v-if="!store.correlationAlertHistory.length">
                <td colspan="3" class="empty-cell">暂无相关性飙升记录</td>
              </tr>
              <tr v-else v-for="r in store.correlationAlertHistory" :key="r.id">
                <td>{{ fmtTs(r.snapshot_at) }}</td>
                <td class="danger">{{ r.max_pairwise_corr?.toFixed(3) }}</td>
                <td class="warn">{{ r.top_corr_pair }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 因子敞口时间序列 -->
    <div class="panel">
      <div class="panel-title">📊 五因子敞口趋势（点击图例切换）</div>
      <div ref="factorTrendEl" style="width:100%; height:280px;" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useObservabilityStore } from '@/stores/observability'
import * as echarts from 'echarts'
import { onMounted, ref, watch } from 'vue'

const store = useObservabilityStore()
const radarEl = ref<HTMLElement | null>(null)
const esChartEl = ref<HTMLElement | null>(null)
const factorTrendEl = ref<HTMLElement | null>(null)
let radarChart: echarts.ECharts | null = null
let esChart: echarts.ECharts | null = null
let factorChart: echarts.ECharts | null = null

const FACTOR_EXPOSURE_MIN = 0
const FACTOR_EXPOSURE_MAX = 2
const FACTOR_EXPOSURE_INTERVAL = 0.5

function fmtTs(ts: string | null) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function refreshRiskCluster() {
  try {
    await store.fetchRiskCluster()
    renderRadar()
    renderES()
    renderFactorTrend()
  } catch (error) {
    console.error('[RiskCluster] refreshRiskCluster', error)
  }
}

function renderRadar() {
  if (!radarEl.value || !store.latestFactorSnap) return
  if (!radarChart) radarChart = echarts.init(radarEl.value)
  const s = store.latestFactorSnap
  radarChart.setOption({
    backgroundColor: 'transparent',
    radar: {
      indicator: [
        { name: 'Beta', max: FACTOR_EXPOSURE_MAX, min: FACTOR_EXPOSURE_MIN, interval: FACTOR_EXPOSURE_INTERVAL, axisLabel: { show: false } },
        { name: 'HML', max: FACTOR_EXPOSURE_MAX, min: FACTOR_EXPOSURE_MIN, interval: FACTOR_EXPOSURE_INTERVAL, axisLabel: { show: false } },
        { name: 'SMB', max: FACTOR_EXPOSURE_MAX, min: FACTOR_EXPOSURE_MIN, interval: FACTOR_EXPOSURE_INTERVAL, axisLabel: { show: false } },
        { name: 'Momentum', max: FACTOR_EXPOSURE_MAX, min: FACTOR_EXPOSURE_MIN, interval: FACTOR_EXPOSURE_INTERVAL, axisLabel: { show: false } },
        { name: 'QMJ', max: FACTOR_EXPOSURE_MAX, min: FACTOR_EXPOSURE_MIN, interval: FACTOR_EXPOSURE_INTERVAL, axisLabel: { show: false } },
      ],
      splitNumber: Math.round((FACTOR_EXPOSURE_MAX - FACTOR_EXPOSURE_MIN) / FACTOR_EXPOSURE_INTERVAL),
      axisLine: { lineStyle: { color: 'rgba(0,255,136,0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(0,255,136,0.1)' } },
      axisName: { color: '#ccc' },
    },
    series: [{
      type: 'radar',
      data: [{ value: [Math.abs(s.beta_market ?? 0), Math.abs(s.beta_hml ?? 0), Math.abs(s.beta_smb ?? 0), Math.abs(s.beta_mom ?? 0), Math.abs(s.beta_qmj ?? 0)], name: '当前敎口',
        itemStyle: { color: '#00ff88' }, areaStyle: { color: 'rgba(0,255,136,0.15)' } }],
    }],
  })
}

function renderES() {
  if (!esChartEl.value) return
  if (!esChart) esChart = echarts.init(esChartEl.value)
  const hist = store.factorHistory
  esChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: hist.map((h) => fmtTs(h.snapshot_at)), axisLabel: { color: '#999', fontSize: 10, rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v.toFixed(2) + '%', color: '#999' } },
    series: [{ type: 'line', smooth: true, data: hist.map((h) => h.es_97_5),
      itemStyle: { color: '#ff4444' }, areaStyle: { color: 'rgba(255,68,68,0.1)' }, markLine: {
        data: [{ type: 'average', name: '均值', lineStyle: { color: '#ffd700', type: 'dashed' } }] } }],
  })
}

function renderFactorTrend() {
  if (!factorTrendEl.value) return
  if (!factorChart) factorChart = echarts.init(factorTrendEl.value)
  const hist = store.factorHistory
  const dates = hist.map((h) => fmtTs(h.snapshot_at))
  const mk = (name: string, key: keyof typeof hist[0], color: string) => ({
    name, type: 'line', smooth: true,
    data: hist.map((h) => (h[key] as number | null)?.toFixed(3) ?? null),
    itemStyle: { color },
  })
  factorChart.setOption({
    backgroundColor: 'transparent', tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { color: '#ccc' } },
    xAxis: { type: 'category', data: dates, axisLabel: { color: '#999', fontSize: 9, rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { color: '#999' } },
    series: [
      mk('Beta', 'beta_market', '#00ff88'), mk('HML', 'beta_hml', '#ff6b35'),
      mk('SMB', 'beta_smb', '#f7c59f'), mk('MOM', 'beta_mom', '#a8dadc'), mk('QMJ', 'beta_qmj', '#c77dff'),
    ],
  })
}

watch(() => store.latestFactorSnap, renderRadar, { deep: true })
watch(() => store.factorHistory, () => { renderES(); renderFactorTrend() }, { deep: true })

onMounted(async () => {
  await refreshRiskCluster()
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
.alert-banner.danger { background: rgba(255,68,68,0.1); border: 1px solid #ff4444; color: #ff4444; }
.metrics-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.metric-card { flex: 1; min-width: 120px; background: rgba(0,255,136,0.05); border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 12px 14px; text-align: center; }
.mc-label { font-size: 0.72rem; color: #888; margin-bottom: 4px; }
.mc-value { font-size: 1.3rem; font-weight: 700; }
.good { color: #00ff88; } .warn { color: #ffd700; } .danger { color: #ff4444; }
.row-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.panel { background: #0d1117; border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.panel-title { font-size: 0.9rem; font-weight: 600; color: #00ff88; margin-bottom: 12px; }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.data-table th { padding: 8px; background: rgba(0,255,136,0.08); color: #00ff88; text-align: left; }
.data-table td { padding: 7px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.empty-cell { text-align: center; color: #666; padding: 20px; }
</style>
