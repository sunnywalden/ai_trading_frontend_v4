<template>
  <div class="dashboard-v2">

    <!-- ═══ AI 引擎状态横幅 ═══ -->
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
        <button @click="handleRefresh" class="btn-refresh-sm" :disabled="store.loading">
          <svg :class="{ spinning: store.loading }" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
        </button>
        <router-link to="/autonomy" class="banner-link">{{ $t('nav.autonomy') }} →</router-link>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="store.loading && !store.fullData" class="loading-container">
      <div class="terminal-spinner"></div>
      <p class="loading-text">INITIALIZING MARKET DATA...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="store.error && !store.fullData" class="error-container">
      <div class="error-icon">⚠</div>
      <h3>{{ $t('common.error_load') }}</h3>
      <p>{{ store.error }}</p>
      <button @click="handleRefresh" class="btn-retry">{{ $t('common.retry') }}</button>
    </div>

    <!-- 主内容 -->
    <div v-else-if="store.fullData" class="dashboard-content">

      <!-- ═══ V10.1 核心能力快捷入口 ═══ -->
      <section class="section-capabilities">
        <div class="capability-item" @click="$router.push('/options')">
          <div class="cap-icon">💎</div>
          <div class="cap-text">
            <span class="cap-title">期权分析中心</span>
            <span class="cap-desc">IV 曲面与异常大单监测</span>
          </div>
          <div class="cap-tag">V10.1</div>
        </div>
        <div class="capability-item" @click="$router.push('/paper')">
          <div class="cap-icon">🧪</div>
          <div class="cap-text">
            <span class="cap-title">Paper Trading</span>
            <span class="cap-desc">零风险实盘模拟训练</span>
          </div>
          <div class="cap-tag">LIVE</div>
        </div>
        <div class="capability-item" @click="$router.push('/etf-pool')">
          <div class="cap-icon">📊</div>
          <div class="cap-text">
            <span class="cap-title">ETF 标的池管理</span>
            <span class="cap-desc">多维度 ETF 机会筛选</span>
          </div>
          <div class="cap-tag">NEW</div>
        </div>
        <div class="capability-item" @click="$router.push('/backtest')">
          <div class="cap-icon">📈</div>
          <div class="cap-text">
            <span class="cap-title">回测验证中心</span>
            <span class="cap-desc">Walk-Forward 稳健性测试</span>
          </div>
          <div class="cap-tag">HOT</div>
        </div>
      </section>

      <!-- ═══ Section 1: KPI 核心指标带 ═══ -->
      <section class="section-kpi">
        <!-- 总资产 (最突出) -->
        <div class="kpi-card kpi-primary">
          <div class="kpi-label">{{ $t('dashboard.total_equity') }}</div>
          <div class="kpi-value kpi-equity">{{ formatCurrency(store.totalEquity) }}</div>
          <div class="kpi-sub">
            <span :class="store.dailyPnl >= 0 ? 'pos' : 'neg'">
              {{ formatPnL(store.dailyPnl) }}
            </span>
            <span class="kpi-pct" :class="store.dailyReturnPct >= 0 ? 'pos' : 'neg'">
              ({{ store.dailyReturnPct >= 0 ? '+' : '' }}{{ store.dailyReturnPct.toFixed(2) }}%)
            </span>
          </div>
        </div>

        <!-- 今日盈亏 -->
        <div class="kpi-card">
          <div class="kpi-label">{{ $t('dashboard.daily_pnl') }}</div>
          <div class="kpi-value" :class="store.dailyPnl >= 0 ? 'pos' : 'neg'">
            {{ formatPnL(store.dailyPnl) }}
          </div>
          <div class="kpi-sub">
            <span :class="store.dailyReturnPct >= 0 ? 'pos' : 'neg'">
              {{ store.dailyReturnPct >= 0 ? '+' : '' }}{{ store.dailyReturnPct.toFixed(2) }}%
            </span>
          </div>
        </div>

        <!-- 本周收益 -->
        <div class="kpi-card">
          <div class="kpi-label">{{ $t('dashboard.weekly_return') }}</div>
          <div class="kpi-value" :class="store.fullData.pnl.weekly_return_pct >= 0 ? 'pos' : 'neg'">
            {{ store.fullData.pnl.weekly_return_pct >= 0 ? '+' : '' }}{{ store.fullData.pnl.weekly_return_pct.toFixed(2) }}%
          </div>
          <div class="kpi-sub kpi-dimmed">{{ formatCurrency(store.fullData.pnl.weekly_pnl) }}</div>
        </div>

        <!-- 本月收益 -->
        <div class="kpi-card">
          <div class="kpi-label">{{ $t('dashboard.monthly_return') }}</div>
          <div class="kpi-value" :class="store.fullData.pnl.mtd_return_pct >= 0 ? 'pos' : 'neg'">
            {{ store.fullData.pnl.mtd_return_pct >= 0 ? '+' : '' }}{{ store.fullData.pnl.mtd_return_pct.toFixed(2) }}%
          </div>
          <div class="kpi-sub kpi-dimmed">{{ formatCurrency(store.fullData.pnl.mtd_pnl) }}</div>
        </div>

        <!-- 年初以来 -->
        <div class="kpi-card">
          <div class="kpi-label">YTD</div>
          <div class="kpi-value" :class="store.fullData.pnl.ytd_return_pct >= 0 ? 'pos' : 'neg'">
            {{ store.fullData.pnl.ytd_return_pct >= 0 ? '+' : '' }}{{ store.fullData.pnl.ytd_return_pct.toFixed(2) }}%
          </div>
          <div class="kpi-sub kpi-dimmed">{{ formatCurrency(store.fullData.pnl.ytd_pnl) }}</div>
        </div>

        <!-- 风险等级 -->
        <div class="kpi-card kpi-risk" :class="`risk-bg-${(store.riskLevel||'MEDIUM').toLowerCase()}`">
          <div class="kpi-label">{{ $t('dashboard.risk_level') }}</div>
          <div class="kpi-value risk-level-value" :class="`risk-${(store.riskLevel||'MEDIUM').toLowerCase()}`">
            {{ riskLevelLabel(store.riskLevel) }}
          </div>
          <div class="kpi-sub">
            <span class="kpi-dimmed">Max DD {{ store.fullData.risk.max_drawdown.toFixed(1) }}%</span>
          </div>
        </div>

        <!-- V10.2-M1: 市场体制感知 -->
        <div
          class="kpi-card kpi-regime"
          style="cursor:pointer"
          :style="{ borderColor: regimeCardColor + '55' }"
          @click="$router.push('/regime')"
        >
          <div class="kpi-label">🧠 市场体制</div>
          <div
            class="kpi-value"
            style="font-size:18px; letter-spacing:0.04em"
            :style="{ color: regimeCardColor }"
          >
            {{ regimeCardLabel }}
          </div>
          <div class="kpi-sub">
            <span class="kpi-dimmed">置信度 {{ regimeCardConf }}</span>
            <span style="margin-left:8px" :style="{ color: varMultColor }">VaR ×{{ regimeVarMult }}</span>
          </div>
        </div>
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

      <!-- Section 3: 持仓与风险 -->
      <div class="section-risk">
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

      <!-- Section: VaR/CVaR 风险监控 (V10.1) -->
      <div class="section-var" v-if="store.fullData">
        <VaRRiskMonitor :account-id="store.fullData.account_id" />
      </div>

    <!-- Section 4: 交易计划 -->
    <div class="section-plans">
      <!-- 活跃计划 -->
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

      <!-- Section 5: 市场热点 -->
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
import { onMounted, onUnmounted, reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDashboardV2Store } from '@/stores/dashboardV2'
import { useAutonomyStore } from '@/stores/autonomy'
import { regimeApi, REGIME_LABELS, REGIME_COLORS, type RegimeInfo, type RegimeType } from '@/api/regimeService'
import PerformanceTrendChart from '@/components/dashboard/PerformanceTrendChart.vue'
import GreeksGauges from '@/components/dashboard/GreeksGauges.vue'
import RiskMetricsPanel from '@/components/dashboard/RiskMetricsPanel.vue'
import PnLAttributionPanel from '@/components/dashboard/PnLAttributionPanel.vue'
import PositionCard from '@/components/dashboard/PositionCard.vue'
import PlanCard from '@/components/dashboard/PlanCard.vue'
import HotspotCard from '@/components/dashboard/HotspotCard.vue'
import VaRRiskMonitor from '@/components/VaRRiskMonitor.vue'

const store = useDashboardV2Store()
const autonomy = useAutonomyStore()
const router = useRouter()
const { t, locale } = useI18n()

const moduleLoading = reactive<Record<string, boolean>>({})

// V10.2-M1: 体制 KPI 数据
const regimeInfo     = ref<RegimeInfo | null>(null)
const regimeVarMultN = ref<number>(1.0)

const regimeCardLabel = computed(() => {
  if (!regimeInfo.value) return '—'
  return REGIME_LABELS[regimeInfo.value.regime] ?? regimeInfo.value.regime
})
const regimeCardConf = computed(() => {
  if (!regimeInfo.value || typeof regimeInfo.value !== 'object') return '—'
  const conf = regimeInfo.value.confidence
  if (typeof conf !== 'number') return '—'
  return (conf * 100).toFixed(0) + '%'
})
const regimeCardColor = computed(() => {
  if (!regimeInfo.value) return '#555555'
  return REGIME_COLORS[regimeInfo.value.regime as RegimeType] ?? '#aaaaaa'
})
const regimeVarMult = computed(() => regimeVarMultN.value.toFixed(2))
const varMultColor = computed(() => {
  if (regimeVarMultN.value > 1.05) return '#00ff88'
  if (regimeVarMultN.value < 0.75) return '#ff4d4d'
  return '#aaaaaa'
})

async function fetchRegime() {
  try {
    const res = await regimeApi.getCurrent()
    if (res.data && 'regime' in res.data) {
      regimeInfo.value     = res.data.regime
      regimeVarMultN.value = res.data.var_multiplier ?? 1.0
    } else {
      regimeInfo.value     = res.data as any
      regimeVarMultN.value = 1.0
    }
  } catch { /* silent */ }
}

// AI Engine Banner 背景样式
const autonomyBannerClass = computed(() => {
  if (autonomy.circuitBreakerActive) return 'banner-critical'
  if (autonomy.isPaused) return 'banner-paused'
  const lvl = autonomy.currentLevel
  if (lvl === 'FULL') return 'banner-full'
  if (lvl === 'SEMI') return 'banner-semi'
  return 'banner-advisory'
})

onMounted(async () => {
  await Promise.all([
    store.loadFull(),
    autonomy.fetchStatus(),
    fetchRegime(),          // V10.2-M1
  ])
  store.startAutoRefresh()
})

onUnmounted(() => {
  store.stopAutoRefresh()
})

function handleRefresh() {
  store.loadFull()
  autonomy.fetchStatus()
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
/* ════════════════════════════════════════
   Design Tokens
   ════════════════════════════════════════ */
.dashboard-v2 {
  --d-bg: rgba(15, 23, 42, 0.85);
  --d-bg-bright: rgba(22, 33, 58, 0.92);
  --d-border: rgba(56, 189, 248, 0.12);
  --d-border-hover: rgba(56, 189, 248, 0.28);
  --d-accent: #38bdf8;
  --d-profit: #10b981;
  --d-loss: #ef4444;
  --d-warn: #f59e0b;
  --d-text: #e2e8f0;
  --d-text-dim: #64748b;
  --d-text-bright: #f1f5f9;
  --d-radius: 10px;
  padding: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ════════════════════════════════════════
   AI Engine Banner
   ════════════════════════════════════════ */
.ai-engine-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid var(--d-border);
  background: rgba(15, 23, 42, 0.96);
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
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

/* Banner variants */
.banner-full { border-color: rgba(16, 185, 129, 0.30); }
.banner-full::before { background: linear-gradient(135deg, rgba(16,185,129,0.06) 0%, transparent 60%); }
.banner-semi { border-color: rgba(56, 189, 248, 0.30); }
.banner-advisory { border-color: rgba(100, 116, 139, 0.30); }
.banner-paused { border-color: rgba(245, 158, 11, 0.30); }
.banner-paused::before { background: linear-gradient(135deg, rgba(245,158,11,0.06) 0%, transparent 60%); }
.banner-critical { border-color: rgba(239, 68, 68, 0.45); animation: pulse-border 1.5s infinite; }

@keyframes pulse-border {
  0%, 100% { border-color: rgba(239,68,68,0.45); }
  50%       { border-color: rgba(239,68,68,0.9); }
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ai-brain-icon {
  font-size: 1.1rem;
  color: var(--d-accent);
  line-height: 1;
}

.banner-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--d-text-dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.level-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
}
.level-full     { background: rgba(16,185,129,0.18); color: #10b981; border: 1px solid rgba(16,185,129,0.35); }
.level-semi     { background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.35); }
.level-advisory { background: rgba(100,116,139,0.2); color: #94a3b8; border: 1px solid rgba(100,116,139,0.35); }

.status-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 20px;
}
.status-pill.active  { background: rgba(16,185,129,0.12); color: #10b981; }
.status-pill.paused  { background: rgba(245,158,11,0.12); color: #f59e0b; }

.status-dot-anim {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.status-pill.active .status-dot-anim {
  animation: blink-dot 2s ease-in-out infinite;
}
@keyframes blink-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.25; }
}

.cb-alert {
  font-size: 0.72rem;
  font-weight: 700;
  color: #ef4444;
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.35);
  padding: 2px 8px;
  border-radius: 4px;
  animation: flash-text 1s steps(1) infinite;
}
@keyframes flash-text {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.banner-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.trade-count {
  display: flex;
  align-items: center;
  gap: 3px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.78rem;
}
.tc-label { color: var(--d-text-dim); }
.tc-value { color: var(--d-accent); font-weight: 700; }
.tc-sep   { color: var(--d-text-dim); }
.tc-max   { color: var(--d-text-dim); }

.last-update {
  font-size: 0.72rem;
  color: var(--d-text-dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.btn-refresh-sm {
  display: flex;
  align-items: center;
  background: rgba(56,189,248,0.08);
  border: 1px solid rgba(56,189,248,0.2);
  color: var(--d-text-dim);
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-refresh-sm:hover:not(:disabled) { border-color: var(--d-accent); color: var(--d-accent); }
.btn-refresh-sm:disabled { opacity: 0.5; cursor: not-allowed; }

.banner-link {
  font-size: 0.75rem;
  color: var(--d-accent);
  text-decoration: none;
  padding: 3px 8px;
  border: 1px solid rgba(56,189,248,0.22);
  border-radius: 5px;
  transition: all 0.2s;
}
.banner-link:hover { background: rgba(56,189,248,0.1); }

/* ════════════════════════════════════════
   Loading / Error
   ════════════════════════════════════════ */
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
  color: var(--d-text-dim);
  margin-top: 14px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

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
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-retry:hover { background: rgba(56,189,248,0.2); }

/* ════════════════════════════════════════
   Dashboard Content
   ════════════════════════════════════════ */
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ════════════════════════════════════════
   Capabilities Section (V10.1 Quick Access)
   ════════════════════════════════════════ */
.section-capabilities {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

@media (max-width: 1400px) {
  .section-capabilities { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .section-capabilities { grid-template-columns: 1fr; }
}

.capability-item {
  position: relative;
  background: var(--d-bg);
  border: 1px solid var(--d-border);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.capability-item:hover {
  transform: translateY(-2px);
  border-color: var(--d-accent);
  box-shadow: 0 4px 15px rgba(56, 189, 248, 0.15);
  background: rgba(56,189,248,0.03);
}

.cap-icon {
  font-size: 1.8rem;
}

.cap-text {
  display: flex;
  flex-direction: column;
}

.cap-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--d-text);
  margin-bottom: 2px;
  font-family: 'SF Pro Display', sans-serif;
}

.cap-desc {
  font-size: 0.72rem;
  color: var(--d-text-dim);
}

.cap-tag {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--d-accent);
  color: #000;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 2px 6px;
  border-bottom-left-radius: 5px;
  opacity: 0.9;
  letter-spacing: 0.05em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* ═══ KPI Section ═══ */
.section-kpi {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
  gap: 12px;
}

@media (max-width: 1280px) {
  .section-kpi { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .section-kpi { grid-template-columns: 1fr 1fr; }
}

.kpi-card {
  background: var(--d-bg);
  border: 1px solid var(--d-border);
  border-radius: var(--d-radius);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.2s;
  position: relative;
  overflow: hidden;
}
.kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--d-accent), transparent);
  opacity: 0.35;
}
.kpi-card:hover { border-color: var(--d-border-hover); }

.kpi-primary {
  border-color: rgba(56,189,248,0.22);
}
.kpi-primary::before { opacity: 0.7; }

.kpi-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--d-text-dim);
  text-transform: uppercase;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.kpi-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--d-text-bright);
  font-family: 'SF Mono', 'Fira Code', monospace;
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.kpi-primary .kpi-value { font-size: 1.65rem; }
.kpi-equity { color: var(--d-text-bright) !important; }

.kpi-sub {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  margin-top: 2px;
}
.kpi-pct { font-size: 0.75rem; }
.kpi-dimmed { color: var(--d-text-dim); font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.78rem; }

/* Profit / Loss colors */
.pos { color: var(--d-profit); }
.neg { color: var(--d-loss); }

/* Risk KPI */
.risk-level-value { font-size: 1.1rem; }
.risk-low     { color: #10b981; }
.risk-medium  { color: #f59e0b; }
.risk-high    { color: #ef4444; }
.risk-extreme { color: #dc2626; }
.risk-bg-low     { border-color: rgba(16,185,129,0.28); }
.risk-bg-medium  { border-color: rgba(245,158,11,0.28); }
.risk-bg-high    { border-color: rgba(239,68,68,0.28); }
.risk-bg-extreme { border-color: rgba(220,38,38,0.45); }

/* ════════════════════════════════════════
   Shared Card Styles
   ════════════════════════════════════════ */
.card {
  background: var(--d-bg);
  border: 1px solid var(--d-border);
  border-radius: var(--d-radius);
  padding: 18px 20px;
  transition: border-color 0.2s;
}
.card:hover { border-color: var(--d-border-hover); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.card-header h3 {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--d-text-dim);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.card-header h4 {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--d-text-dim);
  margin: 0 0 12px;
  text-transform: uppercase;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  padding: 2px 8px;
  background: rgba(56,189,248,0.12);
  color: var(--d-accent);
  border: 1px solid rgba(56,189,248,0.25);
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.badge-danger {
  background: rgba(239,68,68,0.12);
  color: var(--d-loss);
  border-color: rgba(239,68,68,0.25);
}

/* ════════════════════════════════════════
   Charts Row
   ════════════════════════════════════════ */
.section-charts-dual {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}
@media (max-width: 1200px) {
  .section-charts-dual { grid-template-columns: 1fr; }
}

.chart-container,
.attribution-container {
  min-height: 240px;
}

/* ════════════════════════════════════════
   Risk Section
   ════════════════════════════════════════ */
.section-risk {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 16px;
}

.risk-card {
  background: var(--d-bg);
  border: 1px solid var(--d-border);
  border-radius: var(--d-radius);
  padding: 18px 20px;
}

.risk-card .card-header h3 {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--d-text-dim);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* ════════════════════════════════════════
   VaR Section
   ════════════════════════════════════════ */
.section-var {
  margin-top: 0;
}

/* ════════════════════════════════════════
   Signal Section
   ════════════════════════════════════════ */
.signals-list,
.insights-list,
.todos-list,
.positions-list,
.plans-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ════════════════════════════════════════
   Dual Column Section
   ════════════════════════════════════════ */
.section-dual,
.section-plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 16px;
}

/* ════════════════════════════════════════
   Hotspots
   ════════════════════════════════════════ */
.hotspots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

/* ════════════════════════════════════════
   Utility
   ════════════════════════════════════════ */
.empty-state {
  text-align: center;
  padding: 28px;
  color: var(--d-text-dim);
  font-size: 0.85rem;
}

.link-more {
  display: block;
  text-align: center;
  margin-top: 10px;
  color: var(--d-accent);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 500;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.link-more:hover { text-decoration: underline; }

.btn-icon {
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  color: var(--d-text-dim);
  display: inline-flex;
  align-items: center;
  border-radius: 5px;
  transition: all 0.18s;
}
.btn-icon:hover:not(:disabled) {
  color: var(--d-accent);
  background: rgba(56,189,248,0.08);
}
.btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }

.spinning { animation: spin 1s linear infinite; }
.clickable-kpi { cursor: pointer; }
</style>
