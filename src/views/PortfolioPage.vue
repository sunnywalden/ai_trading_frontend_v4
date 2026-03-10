<template>
  <div class="page-container">
    <section class="section-header">
      <h2>Portfolio Construction Console</h2>
      <p>把优化输出、风险预算、调仓漂移和执行质量放在一张桌面上，而不是只看一次求解结果。</p>
    </section>

    <div v-if="construction" class="construction-layout">
      <div class="card overview-card">
        <div class="overview-head">
          <div>
            <h3 style="margin: 0 0 8px;">构建摘要</h3>
            <p class="overview-copy">最新快照方法 {{ construction.latest_snapshot?.method || 'N/A' }}，从当前仓位迁移到目标仓位的结构成本已拆开展示。</p>
          </div>
          <button class="primary-button secondary-button" @click="loadConstruction">刷新构建数据</button>
        </div>
        <div class="metrics-row">
          <div class="metric-item">
            <div class="metric-label">预估换手</div>
            <div class="metric-value text-primary">{{ pct(construction.construction.turnover) }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">有效持仓数</div>
            <div class="metric-value">{{ construction.construction.effective_names.toFixed(2) }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">集中度 HHI</div>
            <div class="metric-value">{{ construction.construction.concentration_hhi.toFixed(3) }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">执行质量</div>
            <div class="metric-value text-success">{{ construction.execution_quality.avg_quality_score.toFixed(1) }}</div>
          </div>
        </div>
      </div>

      <div class="construction-panels">
        <div class="card">
          <h3 style="margin: 0 0 16px;">风险预算</h3>
          <div class="weight-bars">
            <div v-for="item in construction.construction.risk_budget" :key="item.symbol" class="weight-row">
              <span class="weight-symbol">{{ item.symbol }}</span>
              <div class="weight-bar-bg">
                <div class="weight-bar-fill gold" :style="{ width: `${item.budget * 100}%` }"></div>
              </div>
              <span class="weight-pct">{{ pct(item.budget) }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin: 0 0 16px;">最大调仓动作</h3>
          <table class="history-table">
            <thead>
              <tr>
                <th>标的</th>
                <th>当前</th>
                <th>目标</th>
                <th>漂移</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in construction.construction.largest_rebalances" :key="item.symbol">
                <td>{{ item.symbol }}</td>
                <td>{{ pct(item.current) }}</td>
                <td>{{ pct(item.target) }}</td>
                <td :class="item.drift < 0 ? 'text-danger' : 'text-success'">{{ signedPct(item.drift) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="construction-panels">
        <div class="card">
          <h3 style="margin: 0 0 16px;">头部目标权重</h3>
          <div class="weight-bars">
            <div v-for="item in construction.construction.top_weights" :key="item.symbol" class="weight-row">
              <span class="weight-symbol">{{ item.symbol }}</span>
              <div class="weight-bar-bg">
                <div class="weight-bar-fill" :style="{ width: `${item.weight * 100}%` }"></div>
              </div>
              <span class="weight-pct">{{ pct(item.weight) }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin: 0 0 16px;">执行摩擦</h3>
          <div class="metrics-row compact">
            <div class="metric-item">
              <div class="metric-label">平均 IS</div>
              <div class="metric-value">{{ construction.execution_quality.avg_total_is_bps.toFixed(1) }} bps</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">成交率</div>
              <div class="metric-value">{{ pct(construction.execution_quality.avg_fill_rate) }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">平均耗时</div>
              <div class="metric-value">{{ construction.execution_quality.avg_time_to_fill_ms.toFixed(0) }} ms</div>
            </div>
          </div>
          <div class="weights-cell" style="margin-top: 12px;">
            <span v-for="item in construction.execution_quality.worst_symbols" :key="item.symbol" class="weight-chip danger-chip">
              {{ item.symbol }} {{ item.avg_total_is_bps.toFixed(1) }}bps
            </span>
          </div>
        </div>
      </div>
    </div>

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
            <td>{{ formatClientDateTime(h.created_at) }}</td>
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
import { portfolioApi, type PortfolioConstructionSnapshot, type SnapshotHistoryItem } from '@/api/portfolioService'
import { formatClientDateTime } from '@/utils/datetime'
import { usePortfolioStore } from '@/stores/portfolio'
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, ref, watch } from 'vue'

const portfolioStore = usePortfolioStore()
const { result } = storeToRefs(portfolioStore)
const symbolsInput = ref('AAPL,MSFT,GOOGL,AMZN')
const form = ref({ method: 'MARKOWITZ' as const, lookback_days: 252 })
const rfPct = ref(4.0)
const chartDom = ref<HTMLElement>()

// V10.1: 批量优化历史
const history = ref<SnapshotHistoryItem[]>([])
const historyLoading = ref(false)
const construction = ref<PortfolioConstructionSnapshot | null>(null)

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function signedPct(value: number) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${(value * 100).toFixed(1)}%`
}

async function loadConstruction() {
  try {
    const res = await portfolioApi.getConstruction()
    construction.value = res.data
  } catch (e) {
    console.warn('[Portfolio] construction load failed', e)
  }
}

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
    const chart = echarts.getInstanceByDom(chartDom.value) || echarts.init(chartDom.value)
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
  loadConstruction()
})
</script>

<style scoped>
.construction-layout { display: grid; gap: 20px; margin-bottom: 24px; }
.construction-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.overview-card { background: linear-gradient(135deg, rgba(27, 44, 64, 0.95), rgba(29, 29, 59, 0.95)); }
.overview-head { display: flex; justify-content: space-between; gap: 16px; align-items: start; margin-bottom: 16px; }
.overview-copy { margin: 0; color: #9aa4bf; line-height: 1.6; max-width: 700px; }
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
.text-danger { color: #ff7675; }
.text-primary { color: #4a90e2; }
.weight-bars { display: flex; flex-direction: column; gap: 10px; }
.weight-row { display: flex; align-items: center; gap: 10px; }
.weight-symbol { width: 60px; font-size: 13px; font-weight: 600; }
.weight-bar-bg { flex: 1; height: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; }
.weight-bar-fill { height: 100%; background: linear-gradient(90deg, #4a90e2, #7ec8e3); border-radius: 6px; transition: width 0.5s; }
.weight-bar-fill.gold { background: linear-gradient(90deg, #f6b93b, #fa983a); }
.weight-pct { width: 50px; text-align: right; font-size: 13px; }
.primary-button { background: #4a90e2; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.secondary-button { background: linear-gradient(135deg, #45aaf2, #2bcbba); }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.error-message { color: #f44336; font-size: 13px; margin-top: 8px; }
.history-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.history-table th, .history-table td { padding: 8px 12px; border-bottom: 1px solid var(--border-color, #2d2d4e); text-align: left; }
.history-table th { color: #888; font-weight: 500; }
.method-badge { background: rgba(74,144,226,0.15); color: #4a90e2; border-radius: 4px; padding: 2px 8px; font-size: 11px; }
.weights-cell { display: flex; gap: 4px; flex-wrap: wrap; }
.weight-chip { background: rgba(255,255,255,0.06); border-radius: 4px; padding: 2px 6px; font-size: 11px; }
.danger-chip { background: rgba(255, 118, 117, 0.14); color: #ff9f9f; }
.metrics-row.compact { margin-bottom: 0; }

@media (max-width: 1024px) {
  .construction-panels, .result-layout { grid-template-columns: 1fr; }
  .overview-head { flex-direction: column; }
}
</style>
