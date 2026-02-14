<template>
  <div class="dashboard-v2">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>
        <span class="icon">📊</span>
        {{ $t('dashboard.title_v2') }}
      </h1>
      <div class="header-actions">
        <button @click="handleRefresh" class="btn-refresh" :disabled="store.loading">
          <svg :class="{ 'spinning': store.loading }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
          {{ store.loading ? $t('common.refreshing') : $t('common.refresh') }}
        </button>
        <span class="last-update" v-if="store.lastFullUpdate">
          {{ $t('dashboard.last_update') }}: {{ formatTime(store.lastFullUpdate) }}
        </span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="store.loading && !store.fullData" class="loading-container">
      <div class="spinner"></div>
      <p>{{ $t('dashboard.loading') }}</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="store.error && !store.fullData" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>{{ $t('common.error_load') }}</h3>
      <p>{{ store.error }}</p>
      <button @click="handleRefresh" class="btn-retry">{{ $t('common.retry') }}</button>
    </div>

    <!-- 主内容 -->
    <div v-else-if="store.fullData" class="dashboard-content">
      <!-- Section 1: 核心KPI -->
      <section class="section-kpi">
        <KPICard
          :label="$t('dashboard.total_equity')"
          :value="formatCurrency(store.totalEquity)"
          icon="💰"
          @refresh="handleModuleRefresh('kpi')"
          :loading="moduleLoading['kpi']"
        />
        <KPICard
          :label="$t('dashboard.daily_pnl')"
          :value="formatPnL(store.dailyPnl)"
          :sub-value="`${store.dailyReturnPct >= 0 ? '+' : ''}${store.dailyReturnPct.toFixed(2)}%`"
          :trend="store.dailyPnl >= 0 ? 'up' : 'down'"
          icon="📈"
          @click="scrollToAttribution"
          @refresh="handleModuleRefresh('kpi')"
          :loading="moduleLoading['kpi']"
          class="clickable-kpi"
        />
        <KPICard
          :label="$t('dashboard.weekly_return')"
          :value="`${store.fullData.pnl.weekly_return_pct >= 0 ? '+' : ''}${store.fullData.pnl.weekly_return_pct.toFixed(2)}%`"
          icon="📅"
          @refresh="handleModuleRefresh('kpi')"
          :loading="moduleLoading['kpi']"
        />
        <KPICard
          :label="$t('dashboard.monthly_return')"
          :value="`${store.fullData.pnl.mtd_return_pct >= 0 ? '+' : ''}${store.fullData.pnl.mtd_return_pct.toFixed(2)}%`"
          icon="📆"
          @refresh="handleModuleRefresh('kpi')"
          :loading="moduleLoading['kpi']"
        />
        <KPICard
          :label="$t('dashboard.risk_level')"
          :value="riskLevelLabel(store.riskLevel)"
          :class="['risk-badge', `risk-${store.riskLevel.toLowerCase()}`]"
          icon="⚠️"
          @refresh="handleModuleRefresh('kpi')"
          :loading="moduleLoading['kpi']"
        />
      </section>

      <!-- Section 2: 主要图表区 -->
      <div class="section-charts-dual">
        <!-- 左侧: 性能趋势 -->
        <div class="card chart-container">
          <div class="card-header">
            <h3><span class="icon">📊</span> {{ $t('dashboard.equity_curve') }}</h3>
            <button @click="handleModuleRefresh('trend')" class="btn-icon" :class="{ spinning: moduleLoading['trend'] }" :title="$t('common.refresh')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
          <PerformanceTrendChart :data="store.fullData.performance_trend" />
        </div>
        <!-- 右侧: 盈亏归因 -->
        <div class="card attribution-container" id="pnl-attribution">
          <div class="card-header">
            <h3><span class="icon">🔍</span> {{ $t('dashboard.pnl_attribution') }}</h3>
            <button @click="handleModuleRefresh('attribution')" class="btn-icon" :class="{ spinning: moduleLoading['attribution'] }" :title="$t('common.refresh')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
          <PnLAttributionPanel 
            :performers="store.fullData.top_performers"
            :losers="store.fullData.top_losers"
            :strategies="store.fullData.top_strategies"
          />
        </div>
      </div>

      <!-- Section 3: 风险与Greeks -->
      <div class="section-risk">
        <div class="risk-card">
          <div class="card-header">
            <h3><span class="icon">🎯</span> {{ $t('dashboard.greeks_exposure') }}</h3>
            <button @click="handleModuleRefresh('risk')" class="btn-icon" :class="{ spinning: moduleLoading['risk'] }" :title="$t('common.refresh')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
          <GreeksGauges :greeks="store.fullData.risk.greeks" />
        </div>
        <div class="risk-card">
          <div class="card-header">
            <h3><span class="icon">📉</span> {{ $t('dashboard.risk_metrics') }}</h3>
            <button @click="handleModuleRefresh('risk')" class="btn-icon" :class="{ spinning: moduleLoading['risk'] }" :title="$t('common.refresh')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
          <RiskMetricsPanel :metrics="store.fullData.risk" />
        </div>
      </div>

      <!-- Section 4: 交易信号 -->
      <div class="section-signals">
        <div class="card">
          <div class="card-header">
            <div class="title-with-badge">
              <h3><span class="icon">🔔</span> {{ $t('dashboard.signal_pipeline') }}</h3>
              <span class="badge" v-if="store.pendingSignalsCount > 0">
                {{ $t('dashboard.pending_execution', { n: store.pendingSignalsCount }) }}
              </span>
            </div>
            <button @click="handleModuleRefresh('signals')" class="btn-icon" :class="{ spinning: moduleLoading['signals'] }" :title="$t('common.refresh')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
          <SignalPipelineFlow :pipeline="store.fullData.signal_pipeline" />
          
          <div v-if="store.fullData.pending_signals.length > 0" class="signals-list">
            <h4>{{ $t('dashboard.pending_signals') }}</h4>
            <SignalCard
              v-for="signal in store.fullData.pending_signals.slice(0, 5)"
              :key="signal.signal_id"
              :signal="signal"
              @click="handleViewSignal(signal)"
            />
            <router-link to="/quant-loop" class="link-more" v-if="store.fullData.pending_signals.length > 5">
              {{ $t('dashboard.view_all_signals', { n: store.fullData.pending_signals.length }) }}
            </router-link>
          </div>
          <div v-else class="empty-state">
            <p>{{ $t('dashboard.no_pending_signals') }}</p>
          </div>
        </div>
      </div>

      <!-- Section 5: 双列布局 -->
      <div class="section-dual">
        <!-- 左: AI洞察 -->
        <div class="card">
          <div class="card-header">
            <div class="title-with-badge">
              <h3><span class="icon">🤖</span> {{ $t('dashboard.ai_insights') }}</h3>
              <span class="badge" v-if="store.fullData.insights_unread > 0">
                {{ $t('dashboard.new_insights', { n: store.fullData.insights_unread }) }}
              </span>
            </div>
            <button @click="handleModuleRefresh('insights')" class="btn-icon" :class="{ spinning: moduleLoading['insights'] }" :title="$t('common.refresh')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
          <div v-if="store.fullData.ai_insights.length > 0" class="insights-list">
            <AIInsightCard
              v-for="(insight, idx) in store.fullData.ai_insights.slice(0, 3)"
              :key="idx"
              :insight="insight"
            />
          </div>
          <div v-else class="empty-state">
            <p>{{ $t('dashboard.no_insights') }}</p>
          </div>
        </div>

        <!-- 右: 待办事项 -->
        <div class="card">
          <div class="card-header">
            <div class="title-with-badge">
              <h3><span class="icon">✅</span> {{ $t('dashboard.todo_list') }}</h3>
              <span class="badge badge-danger" v-if="store.fullData.todos_high_priority > 0">
                {{ $t('dashboard.high_priority', { n: store.fullData.todos_high_priority }) }}
              </span>
            </div>
            <button @click="handleModuleRefresh('todos')" class="btn-icon" :class="{ spinning: moduleLoading['todos'] }" :title="$t('common.refresh')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
          <div v-if="store.fullData.todos.length > 0" class="todos-list">
            <TodoCard
              v-for="(todo, idx) in store.fullData.todos"
              :key="idx"
              :todo="todo"
              @click="handleTodoClick(todo)"
            />
          </div>
          <div v-else class="empty-state">
            <p>{{ $t('dashboard.no_todos') }}</p>
          </div>
        </div>
      </div>

      <!-- Section 6: 持仓与计划 -->
      <div class="section-dual">
        <!-- 左: Top持仓 -->
        <div class="card">
          <div class="card-header">
            <h3><span class="icon">📦</span> {{ $t('dashboard.top_positions') }}</h3>
            <button @click="handleModuleRefresh('positions')" class="btn-icon" :class="{ spinning: moduleLoading['positions'] }" :title="$t('common.refresh')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
          <div v-if="store.fullData.positions_summary.length > 0" class="positions-list">
            <PositionCard
              v-for="position in store.fullData.positions_summary.slice(0, 5)"
              :key="position.symbol"
              :position="position"
            />
          </div>
          <div v-else class="empty-state">
            <p>{{ $t('dashboard.no_positions') }}</p>
          </div>
        </div>

        <!-- 右: 活跃计划 -->
        <div class="card">
          <div class="card-header">
            <div class="title-with-badge">
              <h3><span class="icon">📋</span> {{ $t('dashboard.active_plans') }}</h3>
              <span class="badge">{{ $t('dashboard.active_plans_count', { n: store.fullData.execution_stats.active_plans }) }}</span>
            </div>
            <button @click="handleModuleRefresh('plans')" class="btn-icon" :class="{ spinning: moduleLoading['plans'] }" :title="$t('common.refresh')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
          <div v-if="store.fullData.active_plans.length > 0" class="plans-list">
            <PlanCard
              v-for="plan in store.fullData.active_plans.slice(0, 5)"
              :key="plan.plan_id"
              :plan="plan"
            />
          </div>
          <div v-else class="empty-state">
            <p>{{ $t('dashboard.no_plans') }}</p>
          </div>
        </div>
      </div>

      <!-- Section 7: 市场热点 -->
      <div class="section-hotspots" v-if="store.fullData.market_hotspots.length > 0">
        <div class="card">
          <div class="card-header">
            <h3><span class="icon">🔥</span> {{ $t('dashboard.market_hotspots') }}</h3>
            <button @click="handleModuleRefresh('hotspots')" class="btn-icon" :class="{ spinning: moduleLoading['hotspots'] }" :title="$t('common.refresh')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            </button>
          </div>
          <div class="hotspots-grid">
            <HotspotCard
              v-for="(hotspot, idx) in store.fullData.market_hotspots"
              :key="idx"
              :hotspot="hotspot"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDashboardV2Store } from '@/stores/dashboardV2'
import KPICard from '@/components/dashboard/KPICard.vue'
import PerformanceTrendChart from '@/components/dashboard/PerformanceTrendChart.vue'
import GreeksGauges from '@/components/dashboard/GreeksGauges.vue'
import RiskMetricsPanel from '@/components/dashboard/RiskMetricsPanel.vue'
import PnLAttributionPanel from '@/components/dashboard/PnLAttributionPanel.vue'
import SignalPipelineFlow from '@/components/dashboard/SignalPipelineFlow.vue'
import SignalCard from '@/components/dashboard/SignalCard.vue'
import AIInsightCard from '@/components/dashboard/AIInsightCard.vue'
import TodoCard from '@/components/dashboard/TodoCard.vue'
import PositionCard from '@/components/dashboard/PositionCard.vue'
import PlanCard from '@/components/dashboard/PlanCard.vue'
import HotspotCard from '@/components/dashboard/HotspotCard.vue'

const store = useDashboardV2Store()
const router = useRouter()
const { t, locale } = useI18n()

const moduleLoading = reactive<Record<string, boolean>>({})

onMounted(async () => {
  await store.loadFull()
  store.startAutoRefresh()
})

onUnmounted(() => {
  store.stopAutoRefresh()
})

function handleRefresh() {
  store.loadFull()
}

async function handleModuleRefresh(module: string) {
  moduleLoading[module] = true
  try {
    await store.loadFull()
  } finally {
    moduleLoading[module] = false
  }
}

function scrollToAttribution() {
  const el = document.getElementById('pnl-attribution')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

function handleViewSignal(signal: any) {
  router.push('/quant-loop')
}

function handleTodoClick(todo: any) {
  router.push(todo.action_link)
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatPnL(value: number): string {
  const formatted = formatCurrency(Math.abs(value))
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function riskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    'LOW': t('dashboard.risk_labels.low'),
    'MEDIUM': t('dashboard.risk_labels.medium'),
    'HIGH': t('dashboard.risk_labels.high'),
    'EXTREME': t('dashboard.risk_labels.extreme'),
  }
  return labels[level] || level
}
</script>

<style scoped>
.dashboard-v2 {
  padding: 0;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 0;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.clickable-kpi {
  cursor: pointer;
}

.page-header .icon {
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.last-update {
  font-size: 0.85rem;
  color: var(--text-secondary, #888);
}

/* Loading & Error */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.btn-retry {
  margin-top: 16px;
  padding: 10px 24px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
}

/* Dashboard Content Layout */
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* KPI Section */
.section-kpi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

/* Charts Section */
.section-charts {
  display: grid;
  gap: 16px;
}

.chart-card {
  background: var(--bg-card, #fff);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.chart-card h3 {
  font-size: 1rem;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-charts-dual {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

@media (max-width: 1200px) {
  .section-charts-dual {
    grid-template-columns: 1fr;
  }
}


/* Risk Section */
.section-risk {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
}

.risk-card {
  background: var(--bg-card, #fff);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.risk-card h3 {
  font-size: 1rem;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Dual Column Sections */
.section-dual {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
}

/* Card Common Styles */
.card {
  background: var(--bg-card, #fff);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.card h3, .card h4 {
  font-size: 1rem;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
}

.badge {
  padding: 4px 12px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-danger {
  background: #fee2e2;
  color: #991b1b;
}

/* Risk Badge */
.risk-badge {
  font-weight: 700;
}

.risk-low { color: #10b981; }
.risk-medium { color: #f59e0b; }
.risk-high { color: #ef4444; }
.risk-extreme { color: #dc2626; background: #fee2e2; }

/* Empty State */
.empty-state {
  text-align: center;
  padding: 32px;
  color: var(--text-secondary, #888);
}

/* Link More */
.link-more {
  display: block;
  text-align: center;
  margin-top: 12px;
  color: #6366f1;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.link-more:hover {
  text-decoration: underline;
}

/* Lists */
.signals-list,
.insights-list,
.todos-list,
.positions-list,
.plans-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Hotspots Grid */
.hotspots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

/* Base Styles */
.title-with-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #94a3b8; /* Slate 400 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  vertical-align: middle;
}

.btn-icon:hover:not(:disabled) {
  background-color: #f1f5f9;
  color: #6366f1; /* Indigo 500 */
  transform: scale(1.1);
}

.btn-icon:active:not(:disabled) {
  transform: scale(0.95);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* Responsive */
@media (max-width: 768px) {
  .section-kpi {
    grid-template-columns: 1fr 1fr;
  }
  
  .section-dual,
  .section-risk {
    grid-template-columns: 1fr;
  }
}
</style>
