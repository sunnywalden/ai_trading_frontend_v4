<template>
  <WorkbenchShell
    class="page-container"
    icon="⚖️"
    title="Portfolio Construction Console"
    subtitle="把优化输出、风险预算、调仓漂移和执行质量放在一张桌面上，而不是只看一次求解结果。"
    :last-updated="portfolioWorkbenchLastUpdated"
    :data-quality="portfolioWorkbenchDataQuality"
    :degraded="Boolean(portfolioStore.error)"
    :stale="portfolioWorkbenchStale"
    :loading="portfolioShellLoading"
    loading-text="正在加载组合构建工作台..."
  >
    <template #title-badge>
      <span class="method-badge">{{ portfolioActiveMethod }}</span>
    </template>

    <template #actions>
      <button class="primary-button secondary-button" @click="handleRefreshPortfolio">
        刷新构建数据
      </button>
    </template>

    <template #summary-cards>
      <article v-for="item in portfolioSummaryItems" :key="item.label" class="card summary-card">
        <div class="metric-label">{{ item.label }}</div>
        <div class="summary-card__value" :class="item.tone">{{ item.value }}</div>
        <div class="summary-card__sub">{{ item.sub }}</div>
      </article>
    </template>

    <ExplainabilityStrip
      :result-value="portfolioExplainValue"
      :explanation="portfolioExplainText"
      source-type="live"
      :data-quality="portfolioWorkbenchDataQuality"
      :last-updated="portfolioWorkbenchLastUpdated"
      :suggested-action="portfolioSuggestedAction"
      :actionable="true"
      @action="handlePortfolioSuggestedAction"
    />

    <div class="portfolio-workbench">

    <div v-if="construction" class="construction-layout">
      <div class="card overview-card">
        <div class="overview-head">
          <div>
            <h3 style="margin: 0 0 8px;">构建摘要</h3>
            <p class="overview-copy">最新快照方法 {{ construction.latest_snapshot?.method || 'N/A' }}，从当前仓位迁移到目标仓位的结构成本已拆开展示。</p>
          </div>
          <button class="primary-button secondary-button" @click="handleRefreshPortfolio">刷新构建数据</button>
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
        <CapacityArbitrationPanel
          v-if="accountId"
          :account-id="accountId"
        />

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
          <label for="symbols-input">标的列表 (逗号分隔)</label>
          <input id="symbols-input" v-model="symbolsInput" placeholder="AAPL,MSFT,GOOGL,AMZN,NVDA" />
        </div>
        <div class="form-field">
          <label for="method-select">优化方法</label>
          <select id="method-select" v-model="form.method">
            <option value="MARKOWITZ">Markowitz 最大 Sharpe</option>
            <option value="RISK_PARITY">风险平价</option>
            <option value="KELLY">Kelly 准则 (半 Kelly)</option>
          </select>
        </div>
        <div class="form-field">
          <label for="lookback-input">历史数据天数</label>
          <input id="lookback-input" type="number" v-model.number="form.lookback_days" min="60" max="756" />
        </div>
        <div class="form-field">
          <label for="rf-input">无风险利率 (%)</label>
          <input id="rf-input" type="number" v-model.number="rfPct" min="0" step="0.1" />
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
  </WorkbenchShell>
</template>

<script setup lang="ts">
import { portfolioApi, type PortfolioConstructionSnapshot, type SnapshotHistoryItem } from '@/api/portfolioService'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import ExplainabilityStrip from '@/components/workbench/ExplainabilityStrip.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuantLoopStore } from '@/stores/quantLoop'
import { formatClientDateTime } from '@/utils/datetime'
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const CapacityArbitrationPanel = defineAsyncComponent(
  () => import('@/components/CapacityArbitrationPanel.vue'),
)

const router = useRouter()
const portfolioStore = usePortfolioStore()
const quantLoopStore = useQuantLoopStore()
const { result } = storeToRefs(portfolioStore)
const symbolsInput = ref('AAPL,MSFT,GOOGL,AMZN')
const form = ref({ method: 'MARKOWITZ' as const, lookback_days: 252 })
const rfPct = ref(4)
const chartDom = ref<HTMLElement>()

// V10.1: 批量优化历史
const history = ref<SnapshotHistoryItem[]>([])
const historyLoading = ref(false)
const construction = ref<PortfolioConstructionSnapshot | null>(null)
const constructionLoading = ref(false)
const portfolioRefreshAt = ref<string | null>(null)
const accountId = computed(() => quantLoopStore.systemStatus?.account_id || '')

function formatWorkbenchTime(raw?: string | null) {
  if (!raw) return '—'
  const date = new Date(raw)
  return Number.isNaN(date.getTime())
    ? raw
    : date.toLocaleString('zh-CN', { hour12: false })
}

const portfolioShellLoading = computed(() => {
  return (constructionLoading.value || portfolioStore.loading)
    && !construction.value
    && !result.value
})

const portfolioActiveMethod = computed(() => {
  return construction.value?.latest_snapshot?.method || result.value?.method || '未优化'
})

const portfolioWorkbenchLastUpdated = computed(() => {
  return formatWorkbenchTime(
    construction.value?.latest_snapshot?.created_at
      || result.value?.created_at
      || portfolioRefreshAt.value,
  )
})

const portfolioWorkbenchDataQuality = computed(() => {
  if (construction.value?.execution_quality.sample_size) return 'high'
  if (construction.value || result.value) return 'medium'
  return 'unknown'
})

const portfolioWorkbenchStale = computed(() => {
  const raw = construction.value?.latest_snapshot?.created_at
    || result.value?.created_at
    || portfolioRefreshAt.value
  if (!raw) return false
  const timestamp = new Date(raw).getTime()
  return Number.isFinite(timestamp) && Date.now() - timestamp > 6 * 60 * 60 * 1000
})

const portfolioSummaryItems = computed(() => {
  if (!construction.value) {
    return [
      { label: '工作台状态', value: '待初始化', sub: '先执行一次优化或刷新构建快照', tone: '' },
    ]
  }

  return [
    {
      label: '预估换手',
      value: pct(construction.value.construction.turnover),
      sub: '当前仓位迁移到目标权重的结构成本',
      tone: construction.value.construction.turnover > 0.3 ? 'text-warning' : 'text-primary',
    },
    {
      label: '集中度 HHI',
      value: construction.value.construction.concentration_hhi.toFixed(3),
      sub: '越高越集中，越低越分散',
      tone: construction.value.construction.concentration_hhi > 0.18 ? 'text-warning' : '',
    },
    {
      label: '执行质量',
      value: construction.value.execution_quality.avg_quality_score.toFixed(1),
      sub: `样本 ${construction.value.execution_quality.sample_size} 笔`,
      tone: 'text-success',
    },
    {
      label: '有效持仓数',
      value: construction.value.construction.effective_names.toFixed(2),
      sub: `当前账户 ${accountId.value || 'N/A'}`,
      tone: '',
    },
  ]
})

const portfolioExplainValue = computed(() => {
  const sharpe = construction.value?.latest_snapshot?.metrics.sharpe ?? result.value?.metrics.sharpe
  if (sharpe == null) {
    return '等待构建结果'
  }
  return `Sharpe ${sharpe.toFixed(2)}`
})

const portfolioExplainText = computed(() => {
  if (!construction.value) {
    return '组合构建工作台会把目标权重、风险预算与执行摩擦汇总成一条可解释的配置链。'
  }

  const build = construction.value.construction
  const execution = construction.value.execution_quality
  return `当前换手 ${pct(build.turnover)}、集中度 ${build.concentration_hhi.toFixed(3)}、平均 IS ${execution.avg_total_is_bps.toFixed(1)}bps。重点是判断“该不该调仓”以及“值得为这次调仓付出多少执行成本”。`
})

const portfolioSuggestedAction = computed(() => {
  if (!construction.value) return '先运行一次优化，生成目标权重与风险预算。'
  if (construction.value.execution_quality.avg_total_is_bps > 20) {
    return '打开执行策略控制台，检查高摩擦标的与 child-order 策略。'
  }
  if (construction.value.construction.concentration_hhi > 0.18) {
    return '打开 Alpha Lab 或 Opportunities，检查权重是否过度集中。'
  }
  return '打开智能订单簿，确认本轮再平衡是否值得进入执行阶段。'
})

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function signedPct(value: number) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${(value * 100).toFixed(1)}%`
}

async function loadConstruction() {
  constructionLoading.value = true
  try {
    const res = await portfolioApi.getConstruction()
    construction.value = res.data
  } catch (e) {
    console.warn('[Portfolio] construction load failed', e)
  } finally {
    constructionLoading.value = false
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

async function handleRefreshPortfolio() {
  await Promise.all([
    quantLoopStore.fetchSystemStatus(),
    portfolioStore.fetchLatest(),
    loadHistory(),
    loadConstruction(),
  ])
  portfolioRefreshAt.value = new Date().toISOString()
}

function handlePortfolioSuggestedAction() {
  if (!construction.value) {
    handleOptimize()
    return
  }
  if (construction.value.execution_quality.avg_total_is_bps > 20) {
    router.push('/execution-policy')
    return
  }
  if (construction.value.construction.concentration_hhi > 0.18) {
    router.push('/alpha-lab')
    return
  }
  router.push('/order-book')
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
  handleRefreshPortfolio()
})
</script>

<style scoped>
.portfolio-workbench { display: flex; flex-direction: column; gap: 24px; }
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
.primary-button { background: #2563eb; color: #ffffff; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.secondary-button { background: linear-gradient(135deg, #45aaf2, #2bcbba); }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.error-message { color: #f44336; font-size: 13px; margin-top: 8px; }
.history-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.history-table th, .history-table td { padding: 8px 12px; border-bottom: 1px solid var(--border-color, #2d2d4e); text-align: left; }
.history-table th { color: #888; font-weight: 500; }
.method-badge { background: rgba(37, 99, 235, 0.28); color: #f8fbff; border-radius: 4px; padding: 2px 8px; font-size: 11px; }
.weights-cell { display: flex; gap: 4px; flex-wrap: wrap; }
.weight-chip { background: rgba(255,255,255,0.06); border-radius: 4px; padding: 2px 6px; font-size: 11px; }
.danger-chip { background: rgba(153, 51, 51, 0.78); color: #fff3f3; }
.metrics-row.compact { margin-bottom: 0; }
.summary-card__value { font-size: 20px; font-weight: 700; margin: 6px 0 4px; }
.summary-card__sub { font-size: 12px; color: #94a3b8; line-height: 1.5; }

@media (max-width: 1024px) {
  .construction-panels, .result-layout { grid-template-columns: 1fr; }
  .overview-head { flex-direction: column; }
}
</style>
