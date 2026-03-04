<template>
  <div class="attribution-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('attribution.title') }}</h1>
      <p class="page-subtitle">{{ t('attribution.subtitle') }}</p>
    </div>

    <!-- 汇总卡片行 -->
    <div class="summary-row" v-if="computedSummary">
      <div class="summary-card">
        <div class="sc-value">{{ computedSummary.total_trades }}</div>
        <div class="sc-label">{{ t('attribution.total_trades') }}</div>
      </div>
      <div class="summary-card win">
        <div class="sc-value">{{ computedSummary.wins }}</div>
        <div class="sc-label">{{ t('attribution.wins') }}</div>
      </div>
      <div class="summary-card loss">
        <div class="sc-value">{{ computedSummary.losses }}</div>
        <div class="sc-label">{{ t('attribution.losses') }}</div>
      </div>
      <div class="summary-card">
        <div class="sc-value">{{ (computedSummary.win_rate * 100).toFixed(1) }}%</div>
        <div class="sc-label">{{ t('attribution.win_rate') }}</div>
      </div>
      <div class="summary-card" :class="computedSummary.avg_exec_score >= 0.5 ? 'win' : 'loss'">
        <div class="sc-value">{{ computedSummary.avg_exec_score.toFixed(3) }}</div>
        <div class="sc-label">{{ t('attribution.avg_execution') }}</div>
      </div>
      <div class="summary-card" :class="computedSummary.avg_pos_score >= 0.5 ? 'win' : 'loss'">
        <div class="sc-value">{{ computedSummary.avg_pos_score.toFixed(3) }}</div>
        <div class="sc-label">{{ t('attribution.avg_position') }}</div>
      </div>
    </div>

    <!-- 饼图 + 过滤 -->
    <div class="chart-filter-row">
      <div class="pie-card">
        <div ref="pieChartEl" style="width:100%; height:260px;" />
      </div>
      <div class="filter-panel">
        <div class="filter-group">
          <label class="filter-label">{{ t('common.days') }}</label>
          <select class="filter-select" v-model="filterDays" @change="loadData">
            <option :value="7">7</option>
            <option :value="30">30</option>
            <option :value="90">90</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">{{ t('common.symbol') }}</label>
          <input class="filter-input" v-model="filterSymbol" :placeholder="t('common.all')" @keyup.enter="loadData" />
        </div>
        <div class="filter-group">
          <label class="filter-label">{{ t('attribution.category') }}</label>
          <select class="filter-select" v-model="filterCategory" @change="loadData">
            <option value="">{{ t('common.all') }}</option>
            <option value="WIN">{{ t('attribution.cat_win') }}</option>
            <option value="LOSS">{{ t('attribution.cat_loss') }}</option>
            <option value="BREAKEVEN">{{ t('attribution.cat_breakeven') }}</option>
          </select>
        </div>
        <button class="btn-refresh" @click="loadData" :disabled="loading">
          {{ t('common.refresh') }}
        </button>
      </div>
    </div>

    <!-- 明细表格 -->
    <div class="table-card">
      <div class="table-header">
        <span class="table-title">{{ t('attribution.trade_detail') }}</span>
        <span class="table-count">{{ trades.length }} {{ t('common.records') }}</span>
      </div>
      <div class="table-wrap">
        <table class="attr-table">
          <thead>
            <tr>
              <th>{{ t('common.time') }}</th>
              <th>{{ t('common.symbol') }}</th>
              <th>{{ t('attribution.category') }}</th>
              <th>{{ t('attribution.pnl') }}</th>
              <th>{{ t('attribution.alpha_source') }}</th>
              <th>{{ t('attribution.alpha_score') }}</th>
              <th>{{ t('attribution.execution_score') }}</th>
              <th>{{ t('attribution.position_score') }}</th>
              <th>{{ t('attribution.composite') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t_ in trades"
              :key="t_.id"
              class="attr-row"
              @click="selectedTrade = t_"
              :class="{ selected: selectedTrade?.id === t_.id }"
            >
              <td class="td-time">{{ formatDate(t_.created_at) }}</td>
              <td class="td-symbol">{{ t_.symbol }}</td>
              <td>
                <span class="cat-badge" :class="`cat-${t_.category.toLowerCase()}`">
                  {{ t_.category }}
                </span>
              </td>
              <td :class="t_.pnl_pct >= 0 ? 'td-pos' : 'td-neg'">
                {{ (t_.pnl_pct * 100).toFixed(2) }}%
              </td>
              <td class="td-alpha">{{ t_.alpha_source }}</td>
              <td class="td-score">{{ (t_.alpha_contribution_pct ?? 0).toFixed(3) }}</td>
              <td class="td-score">{{ (t_.execution_score ?? 0).toFixed(3) }}</td>
              <td class="td-score">{{ (t_.position_mgmt_score ?? 0).toFixed(3) }}</td>
              <td class="td-score composite" :style="{ color: compositeColor(getScore(t_)) }">
                {{ getScore(t_).toFixed(3) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!loading && trades.length === 0" class="empty-state">
          {{ t('attribution.no_data') }}
        </div>
        <div v-if="loading" class="loading-state">{{ t('common.loading') }}...</div>
      </div>
    </div>

    <!-- 侧边详情面板 -->
    <div v-if="selectedTrade" class="detail-panel">
      <div class="detail-header">
        <span class="detail-symbol">{{ selectedTrade.symbol }}</span>
        <button class="btn-close" @click="selectedTrade = null">✕</button>
      </div>
      <div class="detail-section">
        <div class="dl">{{ t('attribution.alpha_detail') }}</div>
        <pre class="detail-json">{{ JSON.stringify(selectedTrade.alpha_detail, null, 2) }}</pre>
      </div>
      <div class="detail-section">
        <div class="dl">{{ t('attribution.execution_detail') }}</div>
        <pre class="detail-json">{{ JSON.stringify(selectedTrade.execution_detail, null, 2) }}</pre>
      </div>
      <div class="detail-section">
        <div class="dl">{{ t('attribution.position_detail') }}</div>
        <pre class="detail-json">{{ JSON.stringify(selectedTrade.position_detail, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { attributionApi, CATEGORY_LABELS, CATEGORY_COLORS, type TradeAttributionItem, type AttributionSummaryResponse } from '@/api/attributionService'
import { logger } from '@/utils/logger'

echarts.use([PieChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const { t } = useI18n()

const loading        = ref(false)
const trades         = ref<TradeAttributionItem[]>([])
const summaryRaw     = ref<AttributionSummaryResponse | null>(null)
const selectedTrade  = ref<TradeAttributionItem | null>(null)
const filterDays     = ref(30)
const filterSymbol   = ref('')
const filterCategory = ref('')
const pieChartEl     = ref<HTMLElement | null>(null)
let   pieChart: echarts.ECharts | null = null

const computedSummary = computed(() => {
  if (!summaryRaw.value) return null
  const items = summaryRaw.value.breakdown
  const total = items.reduce((acc, i) => acc + i.count, 0)
  const wins = items.find(i => i.category === 'WIN')?.count || 0
  const losses = items.find(i => i.category === 'LOSS')?.count || 0
  
  const sum_exec = items.reduce((acc, i) => acc + i.avg_exec_score * i.count, 0)
  const sum_pos = items.reduce((acc, i) => acc + i.avg_pos_score * i.count, 0)

  return {
    total_trades: total,
    wins,
    losses,
    win_rate: total > 0 ? wins / total : 0,
    avg_exec_score: total > 0 ? sum_exec / total : 0,
    avg_pos_score: total > 0 ? sum_pos / total : 0
  }
})

// ── 加载 ──────────────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const [tradesRes, summaryRes] = await Promise.all([
      attributionApi.listTrades({
        limit: 100,
        days: filterDays.value,
        symbol: filterSymbol.value || undefined,
        category: (filterCategory.value || undefined) as any
      }),
      attributionApi.getSummary(filterDays.value),
    ])
    trades.value  = tradesRes.data.items
    summaryRaw.value = summaryRes.data
    updatePieChart()
  } catch (e) {
    logger.warn('[Attribution] loadData failed', e)
  } finally {
    loading.value = false
  }
}

function updatePieChart() {
  if (!pieChart || !summaryRaw.value) return
  const breakdown = summaryRaw.value.breakdown
  const findCount = (cat: string) => breakdown.find(b => b.category === cat)?.count || 0
  
  pieChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#aaa' } },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['40%', '50%'],
      label: { formatter: '{d}%', color: '#ccc' },
      data: [
        { value: findCount('WIN'),       name: CATEGORY_LABELS.WIN,       itemStyle: { color: CATEGORY_COLORS.WIN } },
        { value: findCount('LOSS'),      name: CATEGORY_LABELS.LOSS,      itemStyle: { color: CATEGORY_COLORS.LOSS } },
        { value: findCount('BREAKEVEN'), name: CATEGORY_LABELS.BREAKEVEN, itemStyle: { color: CATEGORY_COLORS.BREAKEVEN } },
      ],
    }],
  })
}

function getScore(t_: TradeAttributionItem) {
  return ((t_.execution_score ?? 0) + (t_.alpha_contribution_pct ?? 0) + (t_.position_mgmt_score ?? 0)) / 3
}

function compositeColor(v: number) {
  if (v >= 0.7) return '#00ff88'
  if (v >= 0.45) return '#e0e0e0'
  return '#ff4d4d'
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await loadData()
  if (pieChartEl.value) {
    pieChart = echarts.init(pieChartEl.value, 'dark')
    updatePieChart()
  }
})
</script>

<style scoped>
.attribution-page { padding: 24px; max-width: 1600px; margin: 0 auto; color: #e0e0e0; }
.page-header { margin-bottom: 24px; }
.page-title  { font-size: 1.8rem; font-weight: 700; color: #fff; margin: 0 0 4px; }
.page-subtitle { color: #888; font-size: 0.9rem; }

.summary-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
.summary-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 14px 20px; min-width: 100px; text-align: center; }
.summary-card.win  { border-top: 2px solid #00ff88; }
.summary-card.loss { border-top: 2px solid #ff4d4d; }
.sc-value { font-size: 1.4rem; font-weight: 700; color: #fff; }
.sc-label { font-size: 0.75rem; color: #666; margin-top: 4px; }

.chart-filter-row { display: flex; gap: 16px; margin-bottom: 20px; }
.pie-card { flex: 1; min-width: 280px; background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; }
.filter-panel { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; min-width: 200px; }
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 0.8rem; color: #666; }
.filter-select, .filter-input { background: #16213e; color: #e0e0e0; border: 1px solid #333; border-radius: 6px; padding: 6px 10px; font-size: 0.85rem; }
.btn-refresh { background: #00ff88; color: #001; border: none; border-radius: 6px; padding: 7px 16px; font-weight: 600; cursor: pointer; margin-top: auto; }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

.table-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; overflow: hidden; }
.table-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #1e293b; }
.table-title { font-weight: 600; color: #fff; }
.table-count { font-size: 0.8rem; color: #666; }
.table-wrap { overflow-x: auto; }
.attr-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.attr-table th { background: #0d1526; color: #666; padding: 10px 14px; text-align: left; white-space: nowrap; }
.attr-table td { padding: 9px 14px; border-bottom: 1px solid #111827; white-space: nowrap; }
.attr-row { cursor: pointer; transition: background 0.15s; }
.attr-row:hover  { background: #111827; }
.attr-row.selected { background: rgba(0,255,136,0.05); }
.td-time   { color: #556; font-size: 0.8rem; }
.td-symbol { color: #00ff88; font-weight: 600; }
.td-pos    { color: #00ff88; }
.td-neg    { color: #ff4d4d; }
.td-alpha  { color: #60a5fa; font-size: 0.8rem; }
.td-score  { font-family: monospace; font-size: 0.8rem; }
.composite { font-weight: 700; }
.cat-badge { font-size: 0.72rem; padding: 2px 8px; border-radius: 10px; }
.cat-win   { background: rgba(0,255,136,0.12); color: #00ff88; }
.cat-loss  { background: rgba(255,77,77,0.12); color: #ff6666; }
.cat-breakeven { background: rgba(255,153,0,0.12); color: #ff9900; }

.detail-panel { margin-top: 20px; background: #0a0f1e; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.detail-symbol { font-size: 1.2rem; font-weight: 700; color: #00ff88; }
.btn-close { background: transparent; border: 1px solid #334155; color: #888; border-radius: 6px; padding: 2px 8px; cursor: pointer; }
.detail-section { margin-bottom: 16px; }
.dl { font-size: 0.8rem; color: #666; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
.detail-json { background: #111827; border: 1px solid #1e293b; border-radius: 6px; padding: 12px; font-size: 0.8rem; color: #93c5fd; overflow-x: auto; max-height: 220px; margin: 0; }
.empty-state, .loading-state { padding: 32px; text-align: center; color: #444; }
</style>
