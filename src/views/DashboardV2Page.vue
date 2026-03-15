<template>
  <WorkbenchShell
    class="dashboard-workbench"
    icon="🧭"
    title="Command Center"
    subtitle="集中查看资本效率、交易状态与系统控制面，让关键问题在一屏内闭环。"
    :last-updated="dashboardWorkbenchLastUpdated"
    :data-quality="dashboardWorkbenchDataQuality"
    :degraded="dashboardWorkbenchDegraded"
    :stale="dashboardWorkbenchStale"
    :loading="store.loading && !store.fullData"
    loading-text="INITIALIZING CONTROL TOWER..."
    :error="store.error && !store.fullData ? store.error : ''"
  >
    <template #title-badge>
      <span class="level-badge" :class="`level-${(autonomy.currentLevel || 'advisory').toLowerCase()}`">
        {{ autonomy.currentLevel || '—' }}
      </span>
    </template>

    <template #actions>
      <button @click="handleRefresh" class="btn-refresh-sm" :disabled="store.loading">
        <svg :class="{ spinning: store.loading }" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
      </button>
      <router-link to="/autonomy" class="banner-link">{{ $t('nav.autonomy') }} →</router-link>
      <router-link to="/system-monitor" class="banner-link">系统监控 →</router-link>
    </template>

    <div class="dashboard-v2">
    <div class="ai-engine-banner" :class="autonomyBannerClass">
      <div class="banner-left">
        <span class="ai-brain-icon">⬡</span>
        <span class="banner-label">AI ENGINE</span>
        <span class="level-badge" :class="`level-${autonomy.currentLevel?.toLowerCase()}`">
          {{ autonomy.currentLevel || '—' }}
        </span>
        <span class="status-pill" :class="{ paused: autonomy.isPaused, active: !autonomy.isPaused }">
          <span class="status-dot-anim"></span>
          {{ autonomy.isPaused ? $t('autonomy.status_paused') : $t('autonomy.status_running') }}
        </span>
        <span class="cb-alert" v-if="autonomy.circuitBreakerActive">
          ⚡ {{ $t('autonomy.circuit_breaker_active') }}
        </span>
        <span
          v-if="throttle && throttle.downgrade_needed"
          class="throttle-alert"
          :class="`throttle-${(throttle.recommended_level || 'advisory').toLowerCase()}`"
        >
          🛡️ THROTTLE → {{ throttle.recommended_level }}
        </span>
      </div>
      <div class="banner-right">
        <span class="trade-count" v-if="autonomy.status">
          <span class="tc-label">{{ $t('autonomy.daily_trades') }}</span>
          <span class="tc-value">{{ autonomy.status.daily_trades_today ?? 0 }}</span>
          <span class="tc-sep">/</span>
          <span class="tc-max">{{ autonomy.status.max_daily_trades ?? '∞' }}</span>
        </span>
        <span class="last-update" v-if="store.lastFullUpdate">
          {{ formatTime(store.lastFullUpdate) }}
        </span>
      </div>
    </div>

    <ExplainabilityStrip
      v-if="store.fullData && dashboardWorkbench"
      :result-value="dashboardExplainValue"
      :explanation="dashboardExplainText"
      source-type="live"
      :data-quality="dashboardWorkbenchDataQuality"
      :last-updated="dashboardWorkbenchLastUpdated"
      :suggested-action="dashboardSuggestedAction"
    />

    <div v-if="store.fullData" class="dashboard-content">
      <section class="section-links">
        <router-link v-for="item in coreLinks" :key="item.to" :to="item.to" class="link-card">
          <div class="link-icon">{{ item.icon }}</div>
          <div class="link-content">
            <div class="link-title">{{ item.title }}</div>
            <div class="link-desc">{{ item.desc }}</div>
          </div>
        </router-link>
      </section>

      <section class="section-block">
        <div class="section-head">
          <div>
            <div class="section-eyebrow">TRADING HUB</div>
            <h2>交易中枢</h2>
            <p>只保留资金、风险、执行、持仓与计划等交易核心视角。</p>
          </div>
          <div class="section-actions">
            <router-link to="/positions" class="section-link">持仓监控</router-link>
            <router-link to="/trade-lifecycle" class="section-link">生命周期</router-link>
          </div>
        </div>

        <section class="section-kpi">
          <div class="kpi-card kpi-primary">
            <div class="kpi-label">总资产</div>
            <div class="kpi-value kpi-equity">{{ formatCurrency(store.totalEquity) }}</div>
            <div class="kpi-sub">
              <span :class="store.dailyPnl >= 0 ? 'pos' : 'neg'">{{ formatPnL(store.dailyPnl) }}</span>
              <span class="kpi-pct" :class="store.dailyReturnPct >= 0 ? 'pos' : 'neg'">
                {{ store.dailyReturnPct >= 0 ? '+' : '' }}{{ store.dailyReturnPct.toFixed(2) }}%
              </span>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">今日盈亏</div>
            <div class="kpi-value" :class="store.dailyPnl >= 0 ? 'pos' : 'neg'">{{ formatPnL(store.dailyPnl) }}</div>
            <div class="kpi-sub kpi-dimmed">周度 {{ store.fullData.pnl.weekly_return_pct >= 0 ? '+' : '' }}{{ store.fullData.pnl.weekly_return_pct.toFixed(2) }}%</div>
          </div>
          <div class="kpi-card kpi-risk" :class="`risk-bg-${(store.riskLevel || 'MEDIUM').toLowerCase()}`">
            <div class="kpi-label">风险等级</div>
            <div class="kpi-value risk-level-value" :class="`risk-${(store.riskLevel || 'MEDIUM').toLowerCase()}`">
              {{ riskLevelLabel(store.riskLevel) }}
            </div>
            <div class="kpi-sub kpi-dimmed">Max DD {{ store.fullData.risk.max_drawdown.toFixed(1) }}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">活跃持仓</div>
            <div class="kpi-value">{{ store.fullData.positions_count }}</div>
            <div class="kpi-sub kpi-dimmed">Top5 集中度 {{ store.fullData.concentration_top5.toFixed(1) }}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">执行计划</div>
            <div class="kpi-value">{{ store.fullData.execution_stats.active_plans }}</div>
            <div class="kpi-sub kpi-dimmed">执行率 {{ store.fullData.execution_stats.execution_rate.toFixed(1) }}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">今日成交</div>
            <div class="kpi-value">{{ store.fullData.execution_stats.executed_today }}</div>
            <div class="kpi-sub kpi-dimmed">平均滑点 {{ store.fullData.execution_stats.avg_slippage.toFixed(2) }} bps</div>
          </div>
        </section>

        <div class="section-main-grid">
          <div class="card chart-card">
            <div class="card-header">
              <h3><span class="icon">📈</span> 权益曲线</h3>
            </div>
            <PerformanceTrendChart :data="store.fullData.performance_trend" />
          </div>

          <div class="card pipeline-card">
            <div class="card-header">
              <h3><span class="icon">🧭</span> 信号执行漏斗</h3>
              <router-link to="/autonomy" class="card-link">自主中枢 →</router-link>
            </div>
            <SignalPipelineFlow :pipeline="store.fullData.signal_pipeline" />

            <div class="mini-stats">
              <div class="mini-stat">
                <span class="mini-label">待执行通知</span>
                <strong>{{ store.fullData.signal_notifications }}</strong>
              </div>
              <div class="mini-stat">
                <span class="mini-label">未读洞察</span>
                <strong>{{ store.fullData.insights_unread }}</strong>
              </div>
              <div class="mini-stat">
                <span class="mini-label">系统告警</span>
                <strong :class="store.fullData.system_alerts > 0 ? 'neg' : 'pos'">{{ store.fullData.system_alerts }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="section-risk-grid">
          <div class="card">
            <div class="card-header">
              <h3><span class="icon">📦</span> 核心持仓</h3>
              <router-link to="/positions" class="card-link">全部持仓 →</router-link>
            </div>
            <div v-if="store.fullData.positions_summary.length > 0" class="positions-list">
              <PositionCard
                v-for="position in store.fullData.positions_summary.slice(0, 5)"
                :key="position.symbol"
                :position="position"
              />
            </div>
            <div v-else class="empty-state">暂无持仓</div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3><span class="icon">🎯</span> 风险暴露</h3>
            </div>
            <GreeksGauges :greeks="store.fullData.risk.greeks" />
            <div class="metrics-divider"></div>
            <RiskMetricsPanel :metrics="store.fullData.risk" />
          </div>
        </div>

        <div class="section-support-grid">
          <div class="card">
            <div class="card-header">
              <h3><span class="icon">📋</span> 活跃计划</h3>
              <router-link to="/autonomy" class="card-link">执行视图 →</router-link>
            </div>
            <div v-if="store.fullData.active_plans.length > 0" class="plans-list">
              <PlanCard
                v-for="plan in store.fullData.active_plans.slice(0, 4)"
                :key="plan.plan_id"
                :plan="plan"
              />
            </div>
            <div v-else class="empty-state">暂无活跃计划</div>
          </div>

          <div class="card embedded-widget-card">
            <div class="card-header">
              <h3><span class="icon">📉</span> VaR 风险监控</h3>
            </div>
            <VaRRiskMonitor :account-id="store.fullData.account_id" />
          </div>
        </div>
      </section>

      <section class="section-block">
        <div class="section-head">
          <div>
            <div class="section-eyebrow">SYSTEM OPS</div>
            <h2>系统监控分区</h2>
            <p>拆分为系统监控、AI 安全、任务管理三个清晰二级页面，同时保留首页快照。</p>
          </div>
          <div class="section-actions">
            <router-link to="/system-monitor" class="section-link">系统监控</router-link>
            <router-link to="/live-safety" class="section-link">AI 安全</router-link>
            <router-link to="/task-management" class="section-link">任务管理</router-link>
          </div>
        </div>

        <section class="section-summary-grid">
          <div class="summary-card">
            <div class="summary-label">AI 洞察</div>
            <div class="summary-value">{{ store.fullData.insights_unread }}</div>
            <div class="summary-sub">{{ topInsights.length }} 条核心建议已进入首页快照</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">系统告警</div>
            <div class="summary-value" :class="store.fullData.system_alerts > 0 ? 'neg' : 'pos'">{{ store.fullData.system_alerts }}</div>
            <div class="summary-sub">{{ degradedApiCount }} 个 API/服务处于降级或异常</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Live Safety</div>
            <div class="summary-value">{{ throttle?.recommended_level || 'FULL' }}</div>
            <div class="summary-sub">{{ throttle?.downgrade_needed ? '当前建议降级' : '当前无需降级' }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">任务管理</div>
            <div class="summary-value">独立页</div>
            <div class="summary-sub">调度器、动态配置与运营任务已从首页拆出</div>
          </div>
        </section>

        <div class="section-ai-grid">
          <div class="card insights-card">
            <div class="card-header">
              <h3><span class="icon">💡</span> 核心 AI 洞察</h3>
              <router-link to="/system-monitor" class="card-link">系统监控 →</router-link>
            </div>
            <div v-if="topInsights.length" class="insights-list">
              <AIInsightCard v-for="insight in topInsights" :key="`${insight.title}-${insight.created_at}`" :insight="insight" />
            </div>
            <div v-else class="empty-state">暂无新的 AI 洞察</div>
          </div>

          <div class="card system-card">
            <div class="card-header">
              <h3><span class="icon">🖥️</span> 系统快照</h3>
              <router-link to="/system-monitor" class="card-link">完整面板 →</router-link>
            </div>
            <div class="api-health-list">
              <div v-for="apiItem in store.fullData.api_health" :key="apiItem.provider" class="api-health-row">
                <div>
                  <div class="api-name">{{ apiItem.provider }}</div>
                  <div class="api-sub">延迟 {{ Math.round(apiItem.avg_latency_ms) }}ms · 成功率 {{ apiItem.success_rate.toFixed(1) }}%</div>
                </div>
                <span class="status-chip" :class="apiStatusClass(apiItem.status)">{{ apiStatusLabel(apiItem.status) }}</span>
              </div>
            </div>

            <div class="ops-panel">
              <router-link to="/task-management" class="ops-panel-link">
                <strong>任务管理</strong>
                <span>查看调度器总览、动态任务配置与运营自动化。</span>
              </router-link>
              <router-link to="/live-safety" class="ops-panel-link">
                <strong>AI 安全</strong>
                <span>查看节流建议、模型退化与数据陈旧矩阵。</span>
              </router-link>
            </div>
          </div>
        </div>

        <div class="section-widget-grid">
          <div class="card embedded-widget-card">
            <div class="card-header">
              <h3><span class="icon">📡</span> 信号预算</h3>
            </div>
            <SignalBudgetWidget :since-days="7" />
          </div>
        </div>
      </section>
    </div>
    </div>
  </WorkbenchShell>
</template>

<script setup lang="ts">
import {
    fetchDashboardWorkbenchSummary,
    type APIHealth,
    type DashboardWorkbenchSummaryResponse,
} from '@/api/client'
import { liveSafetyApi, type ThrottleStatus } from '@/api/liveSafetyService'
import AIInsightCard from '@/components/dashboard/AIInsightCard.vue'
import GreeksGauges from '@/components/dashboard/GreeksGauges.vue'
import PerformanceTrendChart from '@/components/dashboard/PerformanceTrendChart.vue'
import PlanCard from '@/components/dashboard/PlanCard.vue'
import PositionCard from '@/components/dashboard/PositionCard.vue'
import RiskMetricsPanel from '@/components/dashboard/RiskMetricsPanel.vue'
import SignalPipelineFlow from '@/components/dashboard/SignalPipelineFlow.vue'
import SignalBudgetWidget from '@/components/SignalBudgetWidget.vue'
import VaRRiskMonitor from '@/components/VaRRiskMonitor.vue'
import ExplainabilityStrip from '@/components/workbench/ExplainabilityStrip.vue'
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import { useAutonomyStore } from '@/stores/autonomy'
import { useDashboardV2Store } from '@/stores/dashboardV2'
import { formatClientTime } from '@/utils/datetime'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const store = useDashboardV2Store()
const autonomy = useAutonomyStore()
const { t, locale } = useI18n()

const throttle = ref<ThrottleStatus | null>(null)
const dashboardWorkbench = ref<DashboardWorkbenchSummaryResponse | null>(null)

const coreLinks = [
  { to: '/autonomy', title: '自主中枢', desc: '信号、决策与执行控制平面', icon: '🤖' },
  { to: '/positions', title: '持仓监控', desc: '仓位、集中度与风险暴露', icon: '📊' },
  { to: '/trade-lifecycle', title: '生命周期', desc: 'Plan / Position FSM 与异常跳转', icon: '🧬' },
  { to: '/system-monitor', title: '系统监控', desc: '服务健康、数据流、生命周期与 API 观测', icon: '🖥️' },
  { to: '/task-management', title: '任务管理', desc: '调度器总览与动态任务配置', icon: '⚙️' },
  { to: '/live-safety', title: 'AI 安全', desc: '节流建议、模型退化与数据陈旧', icon: '🛡️' },
] as const

const topInsights = computed(() => store.fullData?.ai_insights.slice(0, 3) ?? [])
const degradedApiCount = computed(() => {
  return (store.fullData?.api_health ?? []).filter(item => !isHealthyApi(item)).length
})

const autonomyBannerClass = computed(() => {
  if (autonomy.circuitBreakerActive) return 'banner-critical'
  if (throttle.value?.recommended_level === 'FREEZE' || throttle.value?.recommended_level === 'ADVISORY') return 'banner-critical'
  if (autonomy.isPaused) return 'banner-paused'
  const lvl = autonomy.currentLevel
  if (lvl === 'FULL') return 'banner-full'
  if (lvl === 'SEMI') return 'banner-semi'
  return 'banner-advisory'
})

async function fetchThrottle() {
  try {
    const res = await liveSafetyApi.getThrottle(autonomy.currentLevel || 'FULL')
    throttle.value = res.data
  } catch {
    throttle.value = null
  }
}

async function fetchDashboardWorkbench() {
  try {
    dashboardWorkbench.value = await fetchDashboardWorkbenchSummary()
  } catch {
    dashboardWorkbench.value = null
  }
}

const dashboardWorkbenchLastUpdated = computed(() => {
  const raw = dashboardWorkbench.value?.capital_velocity.computed_at
    || store.fullData?.last_refresh_at
    || store.lastFullUpdate
  if (!raw) return '—'
  const date = raw instanceof Date ? raw : new Date(raw)
  return Number.isNaN(date.getTime())
    ? String(raw)
    : date.toLocaleString('zh-CN', { hour12: false })
})

const dashboardWorkbenchDataQuality = computed(() => {
  if (!dashboardWorkbench.value) return 'unknown'
  if (throttle.value?.downgrade_needed || degradedApiCount.value > 0) return 'medium'
  return 'high'
})

const dashboardWorkbenchDegraded = computed(() => degradedApiCount.value > 0)

const dashboardWorkbenchStale = computed(() => {
  const raw = dashboardWorkbench.value?.capital_velocity.computed_at
    || store.fullData?.last_refresh_at
  if (!raw) return false
  const timestamp = new Date(raw).getTime()
  return Number.isFinite(timestamp) && Date.now() - timestamp > 2 * 60 * 1000
})

const dashboardExplainValue = computed(() => {
  const velocity = dashboardWorkbench.value?.capital_velocity
  if (!velocity) return riskLevelLabel(store.riskLevel)
  return `CVS ${velocity.score.toFixed(1)} · ${velocity.efficiency_grade}`
})

const dashboardExplainText = computed(() => {
  const velocity = dashboardWorkbench.value?.capital_velocity
  const summary = dashboardWorkbench.value?.summary
  if (!velocity || !summary) {
    return '资本效率、风险等级与活跃计划将汇总到统一工作台摘要。'
  }
  if (velocity.is_idle_alert) {
    return `闲置资本 ${(velocity.idle_cash_ratio * 100).toFixed(1)}%，当前活跃计划 ${summary.active_plans_count} 个，建议优先检查资本分配与研究漏斗。`
  }
  return `资本速度 ${velocity.efficiency_grade} 档，风险等级 ${summary.risk_level}，当前活跃计划 ${summary.active_plans_count} 个。`
})

const dashboardSuggestedAction = computed(() => {
  const velocity = dashboardWorkbench.value?.capital_velocity
  if (degradedApiCount.value > 0) return '打开系统监控，先处理异常 API / 服务。'
  if (throttle.value?.downgrade_needed) return '打开 AI 安全面板，评估自主度节流原因。'
  if (velocity?.is_idle_alert) return '打开 Portfolio / Alpha Lab，检查资本分配和研究候选。'
  return '继续观察交易中枢与自主中枢，关注执行计划与信号漏斗。'
})

onMounted(async () => {
  await Promise.all([
    store.loadFull(),
    autonomy.fetchStatus(),
    fetchThrottle(),
    fetchDashboardWorkbench(),
  ])
  store.startAutoRefresh()
})

onUnmounted(() => {
  store.stopAutoRefresh()
})

async function handleRefresh() {
  await Promise.all([
    store.loadFull(),
    autonomy.fetchStatus(),
    fetchThrottle(),
    fetchDashboardWorkbench(),
  ])
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatPnL(value: number): string {
  const formatted = formatCurrency(Math.abs(value))
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

function formatTime(date: Date): string {
  return formatClientTime(date, { locale: locale.value, withSeconds: true })
}

function riskLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    LOW: t('dashboard.risk_labels.low'),
    MEDIUM: t('dashboard.risk_labels.medium'),
    HIGH: t('dashboard.risk_labels.high'),
    EXTREME: t('dashboard.risk_labels.extreme'),
  }
  return labels[level] || level
}

function isHealthyApi(apiItem: APIHealth): boolean {
  return ['healthy', 'ok', 'normal'].includes(String(apiItem.status || '').toLowerCase())
}

function apiStatusClass(status: string): string {
  return isHealthyApi({
    provider: '',
    status,
    success_rate: 0,
    avg_latency_ms: 0,
    rate_limit_remaining: 0,
  }) ? 'status-healthy' : 'status-warn'
}

function apiStatusLabel(status: string): string {
  const normalized = String(status || '').toLowerCase()
  if (['healthy', 'ok', 'normal'].includes(normalized)) return '正常'
  if (['critical', 'down', 'error'].includes(normalized)) return '异常'
  if (['warn', 'warning', 'degraded'].includes(normalized)) return '降级'
  return status || '未知'
}
</script>

<style scoped>
.dashboard-v2 {
  --d-bg: rgba(15, 23, 42, 0.85);
  --d-border: rgba(56, 189, 248, 0.12);
  --d-border-hover: rgba(56, 189, 248, 0.28);
  --d-accent: #38bdf8;
  --d-profit: #10b981;
  --d-loss: #ef4444;
  --d-text-dim: #64748b;
  --d-text-bright: #f1f5f9;
  --d-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ai-engine-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: rgba(15, 23, 42, 0.96);
  gap: 12px;
  flex-wrap: wrap;
  border-radius: var(--d-radius);
  border: 1px solid var(--d-border);
  position: relative;
  overflow: hidden;
}

.ai-engine-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(56,189,248,0.04) 0%, transparent 60%);
  pointer-events: none;
}

.banner-full { border-color: rgba(16, 185, 129, 0.30); }
.banner-full::before { background: linear-gradient(135deg, rgba(16,185,129,0.06) 0%, transparent 60%); }
.banner-semi { border-color: rgba(56, 189, 248, 0.30); }
.banner-advisory { border-color: rgba(100, 116, 139, 0.30); }
.banner-paused { border-color: rgba(245, 158, 11, 0.30); }
.banner-paused::before { background: linear-gradient(135deg, rgba(245,158,11,0.06) 0%, transparent 60%); }
.banner-critical { border-color: rgba(239, 68, 68, 0.45); animation: pulse-border 1.5s infinite; }

@keyframes pulse-border {
  0%, 100% { border-color: rgba(239,68,68,0.45); }
  50% { border-color: rgba(239,68,68,0.9); }
}

.banner-left,
.banner-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ai-brain-icon {
  font-size: 1.1rem;
  color: var(--d-accent);
}

.banner-label,
.kpi-label,
.section-eyebrow,
.card-header h3,
.summary-label {
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.banner-label,
.last-update,
.tc-label,
.kpi-label,
.summary-label,
.section-head p,
.link-desc,
.api-sub,
.summary-sub,
.empty-state {
  color: var(--d-text-dim);
}

.level-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.level-full { background: rgba(16,185,129,0.18); color: #10b981; border: 1px solid rgba(16,185,129,0.35); }
.level-semi { background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.35); }
.level-advisory { background: rgba(100,116,139,0.2); color: #94a3b8; border: 1px solid rgba(100,116,139,0.35); }

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 20px;
}

.status-pill.active { background: rgba(16,185,129,0.12); color: #10b981; }
.status-pill.paused { background: rgba(245,158,11,0.12); color: #f59e0b; }

.status-dot-anim {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-pill.active .status-dot-anim { animation: blink-dot 2s ease-in-out infinite; }

@keyframes blink-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

.cb-alert {
  font-size: 0.72rem;
  font-weight: 700;
  color: #ef4444;
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.35);
  padding: 2px 8px;
  border-radius: 4px;
}

.throttle-alert {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(239,68,68,0.6);
  background: rgba(239,68,68,0.12);
  color: #fca5a5;
}

.throttle-freeze { border-color: rgba(239,68,68,0.7); background: rgba(239,68,68,0.18); color: #f87171; }
.throttle-advisory { border-color: rgba(245,158,11,0.7); background: rgba(245,158,11,0.12); color: #fcd34d; }

.trade-count {
  display: flex;
  align-items: center;
  gap: 3px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.78rem;
}

.tc-value { color: var(--d-accent); font-weight: 700; }
.tc-sep,
.tc-max { color: var(--d-text-dim); }

.btn-refresh-sm,
.section-link,
.banner-link,
.card-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-refresh-sm {
  background: rgba(56,189,248,0.08);
  border: 1px solid rgba(56,189,248,0.2);
  color: var(--d-text-dim);
  padding: 4px 8px;
  cursor: pointer;
}

.btn-refresh-sm:hover:not(:disabled) {
  border-color: var(--d-accent);
  color: var(--d-accent);
}

.btn-refresh-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.banner-link,
.section-link,
.card-link {
  color: var(--d-accent);
  border: 1px solid rgba(56,189,248,0.22);
  padding: 6px 10px;
  font-size: 0.78rem;
}

.banner-link:hover,
.section-link:hover,
.card-link:hover {
  background: rgba(56,189,248,0.1);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  text-align: center;
}

.terminal-spinner {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(56,189,248,0.15);
  border-top-color: var(--d-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.loading-text {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  margin-top: 14px;
  color: var(--d-text-dim);
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-icon {
  font-size: 2.5rem;
  color: var(--d-loss);
  margin-bottom: 14px;
}

.btn-retry {
  margin-top: 16px;
  padding: 9px 22px;
  background: rgba(56,189,248,0.12);
  color: var(--d-accent);
  border: 1px solid rgba(56,189,248,0.3);
  border-radius: 8px;
  cursor: pointer;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-links,
.section-summary-grid,
.section-kpi,
.section-main-grid,
.section-risk-grid,
.section-support-grid,
.section-ai-grid,
.section-widget-grid {
  display: grid;
  gap: 16px;
}

.section-links {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.link-card,
.card,
.summary-card,
.kpi-card,
.section-block {
  background: var(--d-bg);
  border: 1px solid var(--d-border);
  border-radius: 14px;
}

.link-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.link-card:hover,
.card:hover,
.kpi-card:hover,
.summary-card:hover {
  border-color: var(--d-border-hover);
  transform: translateY(-1px);
}

.link-icon {
  font-size: 1.5rem;
}

.link-title,
.section-head h2,
.kpi-value,
.summary-value,
.api-name {
  color: var(--d-text-bright);
}

.link-title {
  font-size: 0.95rem;
  font-weight: 600;
}

.link-desc {
  font-size: 0.78rem;
  line-height: 1.5;
}

.section-block {
  padding: 20px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.section-eyebrow {
  color: var(--d-accent);
  font-size: 0.68rem;
  margin-bottom: 6px;
}

.section-head h2 {
  margin: 0 0 6px;
  font-size: 1.4rem;
}

.section-head p {
  margin: 0;
  font-size: 0.88rem;
}

.section-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.section-kpi {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-bottom: 18px;
}

.kpi-card,
.summary-card,
.card {
  padding: 16px 18px;
}

.kpi-primary {
  grid-column: span 2;
}

.kpi-label,
.summary-label {
  font-size: 0.68rem;
  color: var(--d-text-dim);
}

.kpi-value,
.summary-value {
  margin-top: 8px;
  font-size: 1.6rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.kpi-equity { color: var(--d-text-bright) !important; }

.kpi-sub,
.summary-sub {
  margin-top: 6px;
  font-size: 0.82rem;
}

.kpi-dimmed { color: var(--d-text-dim); }

.pos { color: var(--d-profit); }
.neg { color: var(--d-loss); }

.risk-low { color: #10b981; }
.risk-medium { color: #f59e0b; }
.risk-high { color: #ef4444; }
.risk-extreme { color: #dc2626; }
.risk-bg-low { border-color: rgba(16,185,129,0.28); }
.risk-bg-medium { border-color: rgba(245,158,11,0.28); }
.risk-bg-high { border-color: rgba(239,68,68,0.28); }
.risk-bg-extreme { border-color: rgba(220,38,38,0.45); }

.section-main-grid {
  grid-template-columns: 1.5fr 1fr;
  margin-bottom: 18px;
}

.section-risk-grid,
.section-ai-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  margin-bottom: 18px;
}

.section-support-grid,
.section-widget-grid {
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.card-header h3 {
  margin: 0;
  font-size: 0.8rem;
  color: var(--d-text-dim);
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 16px;
}

.mini-stat {
  padding: 12px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.55);
  border: 1px solid rgba(56, 189, 248, 0.08);
}

.mini-label {
  display: block;
  color: var(--d-text-dim);
  font-size: 0.74rem;
  margin-bottom: 6px;
}

.mini-stat strong {
  color: var(--d-text-bright);
  font-size: 1.1rem;
}

.positions-list,
.insights-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plans-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.metrics-divider {
  height: 1px;
  margin: 16px 0;
  background: rgba(56, 189, 248, 0.12);
}

.api-health-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.api-health-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(56, 189, 248, 0.08);
}

.api-health-row:last-child {
  border-bottom: none;
}

.api-name {
  font-size: 0.92rem;
  font-weight: 600;
}

.api-sub {
  margin-top: 4px;
  font-size: 0.78rem;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-healthy {
  background: rgba(16,185,129,0.15);
  color: #6ee7b7;
}

.status-warn {
  background: rgba(245,158,11,0.15);
  color: #fcd34d;
}

.ops-panel {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.ops-panel-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.16);
  background: rgba(30, 41, 59, 0.55);
  text-decoration: none;
}

.ops-panel-link strong {
  color: var(--d-text-bright);
}

.ops-panel-link span {
  color: var(--d-text-dim);
  font-size: 0.8rem;
  line-height: 1.5;
}

.embedded-widget-card :deep(.var-risk-monitor),
.embedded-widget-card :deep(.signal-budget-widget) {
  background: transparent;
}

.empty-state {
  padding: 24px 0;
  text-align: center;
}

.spinning {
  animation: spin 1s linear infinite;
}

@media (max-width: 1200px) {
  .section-main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .kpi-primary {
    grid-column: span 1;
  }

  .mini-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-v2 {
    gap: 16px;
  }

  .section-block {
    padding: 16px;
  }

  .section-links,
  .section-summary-grid,
  .section-kpi,
  .section-risk-grid,
  .section-support-grid,
  .section-ai-grid,
  .section-widget-grid {
    grid-template-columns: 1fr;
  }
}
</style>
