<template>
  <div class="page-container">
    <section class="section-header">
      <h2>组合优化</h2>
      <p>基于 Markowitz 均值方差、风险平价和 Kelly 准则优化持仓权重</p>
    </section>

    <!-- 配置表单 -->
    <div class="card" style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px;">优化配置</h3>
      <div class="form-grid">
        <div class="form-field">
          <label>标的列表 (逗号分隔)</label>
          <input v-model="symbolsInput" placeholder="AAPL,MSFT,GOOGL,AMZN,NVDA" />
        </div>
        <div class="form-field">
          <label>优化方法</label>
          <select v-model="form.method">
            <option value="MARKOWITZ">Markowitz 最大 Sharpe</option>
            <option value="RISK_PARITY">风险平价</option>
            <option value="KELLY">Kelly 准则 (半 Kelly)</option>
          </select>
        </div>
        <div class="form-field">
          <label>历史数据天数</label>
          <input type="number" v-model.number="form.lookback_days" min="60" max="756" />
        </div>
        <div class="form-field">
          <label>无风险利率 (%)</label>
          <input type="number" v-model.number="rfPct" min="0" step="0.1" />
        </div>
      </div>
      <button class="primary-button" @click="handleOptimize" :disabled="portfolioStore.loading">
        {{ portfolioStore.loading ? '计算中...' : '⚡ 开始优化' }}
      </button>
      <p v-if="portfolioStore.error" class="error-message">{{ portfolioStore.error }}</p>
    </div>

    <!-- 优化结果 -->
    <div v-if="result" class="result-layout">
      <!-- 左: 权重表格 -->
      <div class="card">
        <h3 style="margin: 0 0 16px;">推荐权重</h3>
        <div class="metrics-row">
          <div class="metric-item">
            <div class="metric-label">预期年化收益</div>
            <div class="metric-value text-success">{{ (result.metrics.expected_return * 100).toFixed(1) }}%</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">预期波动率</div>
            <div class="metric-value">{{ (result.metrics.volatility * 100).toFixed(1) }}%</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Sharpe 比率</div>
            <div class="metric-value text-primary">{{ result.metrics.sharpe.toFixed(2) }}</div>
          </div>
        </div>
        <div class="weight-bars">
          <div v-for="(w, sym) in result.weights" :key="sym" class="weight-row">
            <span class="weight-symbol">{{ sym }}</span>
            <div class="weight-bar-bg">
              <div class="weight-bar-fill" :style="{ width: (w * 100) + '%' }"></div>
            </div>
            <span class="weight-pct">{{ (w * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- 右: 有效前沿散点图 -->
      <div v-if="result.frontier?.length" class="card">
        <h3 style="margin: 0 0 16px;">有效前沿</h3>
        <div ref="chartDom" style="height: 320px;"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { storeToRefs } from 'pinia'

const portfolioStore = usePortfolioStore()
const { result } = storeToRefs(portfolioStore)
const symbolsInput = ref('AAPL,MSFT,GOOGL,AMZN')
const form = ref({ method: 'MARKOWITZ' as const, lookback_days: 252 })
const rfPct = ref(4.0)
const chartDom = ref<HTMLElement>()

async function handleOptimize() {
  const symbols = symbolsInput.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
  await portfolioStore.optimize({
    symbols,
    method: form.value.method,
    lookback_days: form.value.lookback_days,
    risk_free_rate: rfPct.value / 100,
  })
}

// 有效前沿图 (ECharts)
watch(result, async (r) => {
  if (!r?.frontier?.length || !chartDom.value) return
  await nextTick()
  try {
    const echarts = await import('echarts')
    const chart = echarts.init(chartDom.value)
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', formatter: (p: any) => `波动率: ${(p.data[0]*100).toFixed(1)}%<br/>收益: ${(p.data[1]*100).toFixed(1)}%<br/>Sharpe: ${p.data[2].toFixed(2)}` },
      xAxis: { type: 'value', name: '年化波动率', axisLabel: { formatter: (v: number) => (v*100).toFixed(0)+'%' } },
      yAxis: { type: 'value', name: '年化收益', axisLabel: { formatter: (v: number) => (v*100).toFixed(0)+'%' } },
      series: [{
        type: 'scatter',
        data: r.frontier.map(f => [f.volatility, f.return, f.sharpe]),
        itemStyle: { color: (p: any) => {
          const sharpe = p.data[2]
          const maxS = Math.max(...r.frontier!.map(f => f.sharpe))
          const minS = Math.min(...r.frontier!.map(f => f.sharpe))
          const t = (sharpe - minS) / (maxS - minS + 0.001)
          return `hsl(${200 + t * 60}, 80%, 55%)`
        }},
      }],
    })
  } catch {}
})

onMounted(() => portfolioStore.fetchLatest())
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 12px; color: #888; }
.form-field input, .form-field select {
  background: rgba(255,255,255,0.05); border: 1px solid var(--border-color, #2d2d4e);
  border-radius: 6px; color: inherit; padding: 8px; font-size: 13px;
}
.result-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.card { background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 20px; }
.metrics-row { display: flex; gap: 20px; margin-bottom: 20px; }
.metric-item { flex: 1; background: rgba(255,255,255,0.03); border-radius: 6px; padding: 10px; }
.metric-label { font-size: 11px; color: #888; margin-bottom: 4px; }
.metric-value { font-size: 18px; font-weight: 600; }
.text-success { color: #4caf50; }
.text-primary { color: #4a90e2; }
.weight-bars { display: flex; flex-direction: column; gap: 10px; }
.weight-row { display: flex; align-items: center; gap: 10px; }
.weight-symbol { width: 60px; font-size: 13px; font-weight: 600; }
.weight-bar-bg { flex: 1; height: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; }
.weight-bar-fill { height: 100%; background: linear-gradient(90deg, #4a90e2, #7ec8e3); border-radius: 6px; transition: width 0.5s; }
.weight-pct { width: 50px; text-align: right; font-size: 13px; }
.primary-button { background: #4a90e2; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.error-message { color: #f44336; font-size: 13px; margin-top: 8px; }
</style>
