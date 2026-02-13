<template>
  <div class="dashboard-v2">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>
        <span class="icon">📊</span>
        交易控制台
      </h1>
      <div class="header-actions">
        <button @click="handleRefresh" class="btn-refresh" :disabled="store.loading">
          <span class="icon">🔄</span>
          {{ store.loading ? '刷新中...' : '刷新' }}
        </button>
        <span class="last-update" v-if="store.lastFullUpdate">
          最后更新: {{ formatTime(store.lastFullUpdate) }}
        </span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="store.loading && !store.fullData" class="loading-container">
      <div class="spinner"></div>
      <p>加载Dashboard数据中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="store.error && !store.fullData" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>加载失败</h3>
      <p>{{ store.error }}</p>
      <button @click="handleRefresh" class="btn-retry">重试</button>
    </div>

    <!-- 主内容 -->
    <div v-else-if="store.fullData" class="dashboard-content">
      <!-- Section 1: 核心KPI -->
      <section class="section-kpi">
        <KPICard
          label="总权益"
          :value="formatCurrency(store.totalEquity)"
          icon="💰"
        />
        <KPICard
          label="今日盈亏"
          :value="formatPnL(store.dailyPnl)"
          :sub-value="`${store.dailyReturnPct >= 0 ? '+' : ''}${store.dailyReturnPct.toFixed(2)}%`"
          :trend="store.dailyPnl >= 0 ? 'up' : 'down'"
          icon="📈"
          @click="scrollToAttribution"
          class="clickable-kpi"
        />
        <KPICard
          label="本周收益"
          :value="`${store.fullData.pnl.weekly_return_pct >= 0 ? '+' : ''}${store.fullData.pnl.weekly_return_pct.toFixed(2)}%`"
          icon="📅"
        />
        <KPICard
          label="本月收益"
          :value="`${store.fullData.pnl.mtd_return_pct >= 0 ? '+' : ''}${store.fullData.pnl.mtd_return_pct.toFixed(2)}%`"
          icon="📆"
        />
        <KPICard
          label="风险等级"
          :value="riskLevelLabel(store.riskLevel)"
          :class="['risk-badge', `risk-${store.riskLevel.toLowerCase()}`]"
          icon="⚠️"
        />
      </section>

      <!-- Section 2: 主要图表区 -->
      <div class="section-charts-dual">
        <!-- 左侧: 性能趋势 -->
        <div class="card chart-container">
          <h3><span class="icon">📊</span> 权益曲线 (30天)</h3>
          <PerformanceTrendChart :data="store.fullData.performance_trend" />
        </div>
        <!-- 右侧: 盈亏归因 -->
        <div class="card attribution-container" id="pnl-attribution">
          <h3><span class="icon">🔍</span> 盈亏归因</h3>
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
          <h3><span class="icon">🎯</span> Greeks 敞口</h3>
          <GreeksGauges :greeks="store.fullData.risk.greeks" />
        </div>
        <div class="risk-card">
          <h3><span class="icon">📉</span> 风险指标</h3>
          <RiskMetricsPanel :metrics="store.fullData.risk" />
        </div>
      </div>

      <!-- Section 4: 交易信号 -->
      <div class="section-signals">
        <div class="card">
          <div class="card-header">
            <h3><span class="icon">🔔</span> 信号管道</h3>
            <span class="badge" v-if="store.pendingSignalsCount > 0">
              {{ store.pendingSignalsCount }} 待执行
            </span>
          </div>
          <SignalPipelineFlow :pipeline="store.fullData.signal_pipeline" />
          
          <div v-if="store.fullData.pending_signals.length > 0" class="signals-list">
            <h4>待执行信号</h4>
            <SignalCard
              v-for="signal in store.fullData.pending_signals.slice(0, 5)"
              :key="signal.signal_id"
              :signal="signal"
              @click="handleViewSignal(signal)"
            />
            <router-link to="/quant-loop" class="link-more" v-if="store.fullData.pending_signals.length > 5">
              查看全部 {{ store.fullData.pending_signals.length }} 个信号 →
            </router-link>
          </div>
          <div v-else class="empty-state">
            <p>暂无待执行信号</p>
          </div>
        </div>
      </div>

      <!-- Section 5: 双列布局 -->
      <div class="section-dual">
        <!-- 左: AI洞察 -->
        <div class="card">
          <div class="card-header">
            <h3><span class="icon">🤖</span> AI 洞察</h3>
            <span class="badge" v-if="store.fullData.insights_unread > 0">
              {{ store.fullData.insights_unread }} 条新洞察
            </span>
          </div>
          <div v-if="store.fullData.ai_insights.length > 0" class="insights-list">
            <AIInsightCard
              v-for="(insight, idx) in store.fullData.ai_insights.slice(0, 3)"
              :key="idx"
              :insight="insight"
            />
          </div>
          <div v-else class="empty-state">
            <p>暂无AI洞察</p>
          </div>
        </div>

        <!-- 右: 待办事项 -->
        <div class="card">
          <div class="card-header">
            <h3><span class="icon">✅</span> 待办事项</h3>
            <span class="badge badge-danger" v-if="store.fullData.todos_high_priority > 0">
              {{ store.fullData.todos_high_priority }} 高优先级
            </span>
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
            <p>✨ 太棒了！暂无待办事项</p>
          </div>
        </div>
      </div>

      <!-- Section 6: 持仓与计划 -->
      <div class="section-dual">
        <!-- 左: Top持仓 -->
        <div class="card">
          <h3><span class="icon">📦</span> Top 持仓</h3>
          <div v-if="store.fullData.positions_summary.length > 0" class="positions-list">
            <PositionCard
              v-for="position in store.fullData.positions_summary.slice(0, 5)"
              :key="position.symbol"
              :position="position"
            />
          </div>
          <div v-else class="empty-state">
            <p>暂无持仓</p>
          </div>
        </div>

        <!-- 右: 活跃计划 -->
        <div class="card">
          <div class="card-header">
            <h3><span class="icon">📋</span> 活跃计划</h3>
            <span class="badge">{{ store.fullData.execution_stats.active_plans }} 个</span>
          </div>
          <div v-if="store.fullData.active_plans.length > 0" class="plans-list">
            <PlanCard
              v-for="plan in store.fullData.active_plans.slice(0, 5)"
              :key="plan.plan_id"
              :plan="plan"
            />
          </div>
          <div v-else class="empty-state">
            <p>暂无活跃计划</p>
          </div>
        </div>
      </div>

      <!-- Section 7: 市场热点 -->
      <div class="section-hotspots" v-if="store.fullData.market_hotspots.length > 0">
        <div class="card">
          <h3><span class="icon">🔥</span> 市场热点</h3>
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
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
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
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function riskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    'LOW': '低风险',
    'MEDIUM': '中风险',
    'HIGH': '高风险',
    'EXTREME': '极高风险',
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
