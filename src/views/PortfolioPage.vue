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

    <!-- V10.1: 批量优化历史记录 -->
    <div class="card" style="margin-top: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0;">📋 优化历史</h3>
        <button class="primary-button" style="padding: 6px 14px; font-size: 12px;" @click="loadHistory">刷新</button>
      </div>
      <div v-if="historyLoading" style="color: #888; font-size: 13px;">加载中...</div>
      <div v-else-if="!history.length" style="color: #666; font-size: 13px; text-align: center; padding: 20px;">暂无历史记录，执行一次优化后此处将显示结果。</div>
      <table v-else class="history-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>方法</th>
            <th>预期收益</th>
            <th>波动率</th>
            <th>Sharpe</th>
            <th>头部权重</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in history" :key="h.id">
            <td>{{ new Date(h.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</td>
            <td><span class="method-badge">{{ h.method }}</span></td>
            <td class="text-success">{{ (h.metrics.expected_return * 100).toFixed(1) }}%</td>
            <td>{{ (h.metrics.volatility * 100).toFixed(1) }}%</td>
            <td class="text-primary">{{ h.metrics.sharpe.toFixed(2) }}</td>
            <td class="weights-cell">
              <span v-for="(w, sym) in topWeights(h.weights)" :key="sym" class="weight-chip">
                {{ sym }} {{ (w * 100).toFixed(0) }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { portfolioApi, type SnapshotHistoryItem } from '@/api/portfolioService'
import { storeToRefs } from 'pinia'

const portfolioStore = usePortfolioStore()
const { result } = storeToRefs(portfolioStore)
const symbolsInput = ref('AAPL,MSFT,GOOGL,AMZN')
const form = ref({ method: 'MARKOWITZ' as const, lookback_days: 252 })
const rfPct = ref(4.0)
const chartDom = ref<HTMLElement>()

// V10.1: 批量优化历史
const history = ref<SnapshotHistoryItem[]>([])
const historyLoading = ref(false)

async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await portfolioApi.getHistory(10)
    history.value = res.data
  } catch (e) {
    console.warn('[Portfolio] history load failed', e)
  } finally {
    historyLoading.value = false
  }
}

function topWeights(weights: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(weights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
  )
}

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

onMounted(() => {
  portfolioStore.fetchLatest()
  loadHistory()
})
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
.history-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.history-table th, .history-table td { padding: 8px 12px; border-bottom: 1px solid var(--border-color, #2d2d4e); text-align: left; }
.history-table th { color: #888; font-weight: 500; }
.method-badge { background: rgba(74,144,226,0.15); color: #4a90e2; border-radius: 4px; padding: 2px 8px; font-size: 11px; }
.weights-cell { display: flex; gap: 4px; flex-wrap: wrap; }
.weight-chip { background: rgba(255,255,255,0.06); border-radius: 4px; padding: 2px 6px; font-size: 11px; }
</style>
