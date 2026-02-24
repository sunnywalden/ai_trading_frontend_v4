<template>
  <div class="page-container">
    <section class="section-header">
      <h2>期权分析</h2>
      <p>IV 曲面、隐波排名、异常大单检测（只读分析工具）</p>
    </section>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input v-model="symbol" placeholder="输入标的代码 (如 AAPL)" @keydown.enter="handleSearch" />
      <button class="primary-button" @click="handleSearch" :disabled="loading">
        {{ loading ? '加载中...' : '🔍 分析' }}
      </button>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>

    <!-- 概览卡片 -->
    <div v-if="summary" class="overview-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-label">IV Rank (52W)</div>
        <div class="stat-value" :class="ivRankColor(summary.iv_rank)">{{ summary.iv_rank.toFixed(0) }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">ATM IV</div>
        <div class="stat-value">{{ (summary.atm_iv * 100).toFixed(1) }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">P/C Ratio</div>
        <div class="stat-value" :class="summary.put_call_ratio > 1.2 ? 'text-warning' : ''">
          {{ summary.put_call_ratio.toFixed(2) }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">异常大单</div>
        <div class="stat-value" :class="summary.unusual_count > 0 ? 'text-warning' : ''">
          {{ summary.unusual_count }}
        </div>
      </div>
      <div class="stat-card span-2">
        <div class="stat-label">AI 建议</div>
        <div style="font-size: 13px; line-height: 1.6; margin-top: 4px;">{{ summary.recommendation }}</div>
      </div>
    </div>

    <!-- 异常大单 -->
    <div v-if="unusual && unusual.length" class="card" style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px;">⚡ 异常大单 (量/OI > 10x)</h3>
      <table class="data-table">
        <thead>
          <tr><th>到期日</th><th>行权价</th><th>类型</th><th>成交量</th><th>OI</th><th>量/OI 比</th><th>IV</th></tr>
        </thead>
        <tbody>
          <tr v-for="(u, i) in unusual" :key="i">
            <td>{{ u.expiration }}</td>
            <td>{{ u.strike }}</td>
            <td><span :class="u.option_type === 'call' ? 'badge-call' : 'badge-put'">{{ u.option_type.toUpperCase() }}</span></td>
            <td>{{ u.volume.toLocaleString() }}</td>
            <td>{{ u.open_interest.toLocaleString() }}</td>
            <td class="text-warning">{{ u.volume_oi_ratio.toFixed(1) }}x</td>
            <td>{{ (u.iv * 100).toFixed(1) }}%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- IV Surface (简化热图) -->
    <div v-if="ivSurface" class="card">
      <h3 style="margin: 0 0 16px;">IV 曲面</h3>
      <div ref="ivChartDom" style="height: 320px;"></div>
    </div>

    <div v-if="!summary && !loading" class="card empty-state">
      <p>输入标的代码后点击分析</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { optionsAnalysisApi, type OptionsSummary, type IVSurfaceData, type UnusualActivity } from '@/api/optionsAnalysisService'

const symbol = ref('AAPL')
const loading = ref(false)
const error = ref<string | null>(null)
const summary = ref<OptionsSummary | null>(null)
const unusual = ref<UnusualActivity[]>([])
const ivSurface = ref<IVSurfaceData | null>(null)
const ivChartDom = ref<HTMLElement>()

async function handleSearch() {
  const sym = symbol.value.trim().toUpperCase()
  if (!sym) return
  loading.value = true
  error.value = null
  try {
    const [sumRes, unusualRes, surfaceRes] = await Promise.allSettled([
      optionsAnalysisApi.getSummary(sym),
      optionsAnalysisApi.getUnusualActivity(sym),
      optionsAnalysisApi.getIVSurface(sym),
    ])
    if (sumRes.status === 'fulfilled') summary.value = sumRes.value.data
    if (unusualRes.status === 'fulfilled') unusual.value = unusualRes.value.data.unusual
    if (surfaceRes.status === 'fulfilled') {
      ivSurface.value = surfaceRes.value.data
      await nextTick()
      renderIVChart(ivSurface.value)
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load options data'
  } finally {
    loading.value = false
  }
}

async function renderIVChart(data: IVSurfaceData) {
  if (!ivChartDom.value || !data?.surface?.length) return
  try {
    const echarts = await import('echarts')
    const chart = echarts.init(ivChartDom.value)
    const xData = [...new Set(data.surface.map(d => d.strike))].sort((a, b) => a - b)
    const yData = [...new Set(data.surface.map(d => d.expiration))].sort()
    const heatData = data.surface.map(d => [
      xData.indexOf(d.strike),
      yData.indexOf(d.expiration),
      d.call_iv ? Math.round(d.call_iv * 1000) / 10 : null,
    ]).filter(d => d[2] !== null)
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { formatter: (p: any) => `行权价: ${xData[p.data[0]]}<br/>到期: ${yData[p.data[1]]}<br/>IV: ${p.data[2]}%` },
      xAxis: { type: 'category', data: xData, name: '行权价' },
      yAxis: { type: 'category', data: yData, name: '到期日' },
      visualMap: { min: 10, max: 80, calculable: true, orient: 'horizontal', left: 'center', bottom: 5, inRange: { color: ['#4a90e2', '#f5a623', '#c62828'] } },
      series: [{ type: 'heatmap', data: heatData, emphasis: { itemStyle: { shadowBlur: 10 } } }],
    })
  } catch {}
}

function ivRankColor(rank: number) {
  if (rank > 80) return 'text-danger'
  if (rank > 50) return 'text-warning'
  return 'text-success'
}
</script>

<style scoped>
.search-bar { display: flex; gap: 12px; margin-bottom: 24px; }
.search-bar input { flex: 1; max-width: 300px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color, #2d2d4e); border-radius: 6px; color: inherit; padding: 10px; font-size: 14px; }
.overview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
.stat-card { background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 16px; }
.stat-card.span-2 { grid-column: span 2; }
.stat-label { font-size: 12px; color: #888; margin-bottom: 6px; }
.stat-value { font-size: 24px; font-weight: 700; }
.card { background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 20px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 8px 12px; border-bottom: 1px solid var(--border-color, #2d2d4e); text-align: left; }
.data-table th { color: #888; }
.primary-button { background: #4a90e2; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.text-success { color: #4caf50; }
.text-warning { color: #ff9800; }
.text-danger { color: #f44336; }
.badge-call { background: rgba(76,175,80,0.15); color: #4caf50; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.badge-put { background: rgba(244,67,54,0.15); color: #f44336; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.empty-state { text-align: center; color: #666; }
.error-message { color: #f44336; font-size: 13px; margin-bottom: 12px; }
</style>
