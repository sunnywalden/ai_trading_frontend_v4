<template>
  <div class="page-container">
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2>AI 自主中枢</h2>
          <p>管理 AI 自动交易级别、查看决策审计日志</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button
            v-if="!autonomyStore.isPaused"
            class="danger-button"
            @click="handlePause"
          >⏸ 紧急暂停</button>
          <button
            v-else
            class="success-button"
            @click="handleResume"
          >▶ 恢复运行</button>
          <button class="refresh-button" @click="autonomyStore.fetchStatus()">刷新</button>
        </div>
      </div>
    </section>

    <!-- V10.2-M1: 体制感知横幅 Banner -->
    <div
      v-if="regimeInfo"
      class="regime-banner"
      :style="{ borderColor: regimeBannerColor + '66', backgroundImage: `linear-gradient(135deg, ${regimeBannerColor}0a 0%, transparent 60%)` }"
    >
      <span class="regime-banner-icon">🧠</span>
      <span class="regime-banner-label">当前市场体制：</span>
      <span class="regime-banner-name" :style="{ color: regimeBannerColor }">
        {{ regimeBannerLabel }}
      </span>
      <span class="regime-banner-conf">置信度 {{ regimeBannerConf }}</span>
      <span class="regime-banner-sep">|</span>
      <span class="regime-banner-var" :style="{ color: varMultColor }">
        VaR 倍数 ×{{ regimeVarMult }}
      </span>
      <span class="regime-banner-sep">|</span>
      <router-link to="/regime" class="regime-banner-link">查看详情 →</router-link>
    </div>

    <!-- 状态卡片 -->
    <div v-if="status" class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-label">自主级别</div>
        <div class="stat-value" :class="`level-${status.level.toLowerCase()}`">{{ status.level }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">运行状态</div>
        <div class="stat-value" :class="status.paused ? 'text-warning' : 'text-success'">
          {{ status.paused ? '已暂停' : '运行中' }}
        </div>
        <div v-if="!status.paused && cooldownActive" class="stat-sub text-warning">
          {{ cooldownSymbols.length }} 标的冷却限速中
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日 AI 交易次数</div>
        <div class="stat-value">{{ status.daily_trades_today_autonomous ?? status.daily_trades_today }} / {{ status.max_daily_trades }}</div>
        <div v-if="status.daily_trades_today_broker != null" class="stat-sub text-muted">
          券商已成交（{{ status.daily_trades_today_broker_tz ?? 'UTC' }} {{ status.daily_trades_today_broker_date ?? '' }}）: {{ status.daily_trades_today_broker }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">熔断器</div>
        <div class="stat-value" :class="status.circuit_breaker_triggered ? 'text-danger' : 'text-success'">
          {{ status.circuit_breaker_triggered ? '已触发' : '正常' }}
        </div>
      </div>      <!-- 冷却保护卡片 -->
      <div
        class="stat-card"
        :class="{ 'stat-card--warn': cooldownActive }"
        style="cursor: pointer; position: relative;"
        @click="showCooldownDetail = !showCooldownDetail"
      >
        <div class="stat-label">冷却保护</div>
        <div class="stat-value" :class="cooldownActive ? 'text-warning' : 'text-success'">
          {{ cooldownActive ? cooldownSymbols.length + ' 标的限速中' : '无限制' }}
        </div>
        <div v-if="cooldownActive" class="stat-sub text-muted">
          点击查看详情
        </div>
        <!-- 冷却详情展开牌 -->
        <div
          v-if="showCooldownDetail && cooldownActive"
          class="cooldown-detail"
          @click.stop
        >
          <div class="cooldown-detail-title">❄️ 冷却保护中（重复下单防护）</div>
          <table class="cooldown-table">
            <thead><tr><th>标的</th><th>方向</th><th>剩余冷却</th></tr></thead>
            <tbody>
              <tr v-for="cd in cooldownSymbols" :key="cd.symbol + cd.direction">
                <td>{{ cd.symbol }}</td>
                <td :style="{ color: cd.direction === 'BUY' ? '#00ff88' : '#ff4d4d' }">
                  {{ cd.direction }}
                </td>
                <td>{{ cd.remaining_minutes }}分钟</td>
              </tr>
            </tbody>
          </table>
          <div class="cooldown-detail-note">
            冷却时长: {{ status.cooldown_minutes ?? 120 }}分钟，到期后自动解除
          </div>
        </div>
      </div>    </div>

    <div v-if="autonomyStore.marketUniverseStatus" class="card" style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px;">📚 本地全量池健康</h3>
      <div class="full-cycle-summary__meta" style="margin-bottom: 10px;">
        <span>
          状态：
          <b :class="autonomyStore.marketUniverseStatus.degraded ? 'text-warning' : 'text-success'">
            {{ autonomyStore.marketUniverseStatus.degraded ? '降级风险' : '正常' }}
          </b>
        </span>
        <span>24h降级回退次数: {{ autonomyStore.marketUniverseStatus.recent_fallback_runs_24h }}</span>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom: 8px;">
        <span
          v-for="m in autonomyStore.marketUniverseStatus.markets"
          :key="m.market"
          class="full-cycle-summary__chip"
          :style="m.stale ? 'border-color: rgba(255, 152, 0, .45); color:#ffd18a;' : ''"
        >
          {{ m.market }}: {{ m.active_symbols }}
          <em>{{ m.stale ? 'STALE' : 'FRESH' }}</em>
        </span>
      </div>
      <div
        v-if="autonomyStore.marketUniverseStatus.degraded_reasons?.length"
        style="font-size: 12px; color: #ffb366;"
      >
        风险原因：{{ autonomyStore.marketUniverseStatus.degraded_reasons.join(' · ') }}
      </div>
    </div>

    <!-- 级别切换 -->
    <div class="card" style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px;">自主级别设置</h3>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <div
          v-for="lvl in ['FULL', 'SEMI', 'ADVISORY']"
          :key="lvl"
          class="level-option"
          :class="{ active: status?.level === lvl }"
          @click="handleSetLevel(lvl as any)"
        >
          <div class="level-title">{{ levelLabels[lvl] }}</div>
          <div class="level-desc">{{ levelDescs[lvl] }}</div>
        </div>
      </div>
    </div>

    <!-- 手动触发 -->
    <div class="card" style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px;">手动触发</h3>
      <p style="font-size: 13px; color: #888; margin: 0 0 16px;">用于调试：手动触发再平衡扫描（将持仓评分 REDUCE/SELL 转换为交易信号）或决策周期（处理待执行的信号）。</p>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button
          class="trigger-button"
          :disabled="autonomyStore.triggerLoading"
          @click="handleTriggerRebalance"
        >
          {{ autonomyStore.triggerLoading ? '执行中...' : '🔄 触发再平衡扫描' }}
        </button>
        <button
          class="trigger-button"
          :disabled="autonomyStore.triggerLoading"
          @click="handleTriggerDecisionCycle"
        >
          {{ autonomyStore.triggerLoading ? '执行中...' : '⚡ 触发决策周期' }}
        </button>
        <button
          class="trigger-button trigger-button--primary"
          :disabled="autonomyStore.triggerLoading"
          @click="handleTriggerFullCycle"
          title="生成信号 + 验证 + 执行，等同于每日完整交易闭环"
        >
          {{ autonomyStore.triggerLoading ? '执行中...' : '🚀 触发完整周期（含信号生成）' }}
        </button>
        <button class="refresh-button" @click="autonomyStore.fetchSignalPipeline()">刷新信号流</button>
      </div>
      <div v-if="autonomyStore.lastFullCycleSummary" class="full-cycle-summary">
        <div class="full-cycle-summary__title">🧭 最近一次完整周期的策略范围</div>
        <div class="full-cycle-summary__meta">
          <span>{{ autonomyStore.lastFullCycleSummary.strategy_scope_note || '策略范围说明未提供' }}</span>
          <span>参与策略运行: {{ autonomyStore.lastFullCycleSummary.strategy_runs_processed }}</span>
          <span>去重前信号: {{ autonomyStore.lastFullCycleSummary.signals_before_dedup }}</span>
        </div>
        <div class="full-cycle-summary__chips">
          <span
            v-for="run in autonomyStore.lastFullCycleSummary.strategy_runs_used"
            :key="run.run_id"
            class="full-cycle-summary__chip"
            :title="`run_id=${run.run_id}`"
          >
            {{ run.strategy_name }} · {{ run.signals_generated }}条
            <em v-if="run.target_universe">({{ run.target_universe }})</em>
          </span>
        </div>
        <div v-if="autonomyStore.lastFullCycleSummary.runtime_scan" class="full-cycle-summary__runtime">
          本轮时段扫描：
          <span :class="autonomyStore.lastFullCycleSummary.runtime_scan.triggered ? 'text-success' : 'text-warning'">
            {{ autonomyStore.lastFullCycleSummary.runtime_scan.triggered ? '已触发' : '未触发' }}
          </span>
          <template v-if="autonomyStore.lastFullCycleSummary.runtime_scan.triggered">
            · {{ autonomyStore.lastFullCycleSummary.runtime_scan.strategy_name }}
            · {{ autonomyStore.lastFullCycleSummary.runtime_scan.target_universe }}
          </template>
          <template v-else-if="autonomyStore.lastFullCycleSummary.runtime_scan.reason">
            · 原因：{{ autonomyStore.lastFullCycleSummary.runtime_scan.reason }}
          </template>
        </div>
      </div>
    </div>

    <!-- 信号流水线 -->
    <div class="card" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0;">信号流水线（最近 30 条）</h3>
        <div v-if="status?.signal_pipeline" style="display: flex; gap: 8px; font-size: 12px;">
          <span class="badge-info">待处理: {{ status.signal_pipeline['GENERATED'] ?? 0 }}</span>
          <span class="badge-info">已验证: {{ status.signal_pipeline['VALIDATED'] ?? 0 }}</span>
          <span class="badge-success">已执行: {{ status.signal_pipeline['EXECUTED'] ?? 0 }}</span>
          <span class="badge-danger">失败: {{ status.signal_pipeline['FAILED'] ?? 0 }}</span>
        </div>
      </div>
      <div v-if="autonomyStore.loading" class="loading-message">加载中...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>标的</th>
            <th>类型</th>
            <th>来源/策略</th>
            <th>方向</th>
            <th>数量</th>
            <th>置信度</th>
            <th>状态</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sig in autonomyStore.signalPipeline" :key="sig.signal_id">
            <td>{{ formatDate(sig.created_at) }}</td>
            <td>{{ sig.symbol }}</td>
            <td>
              <span :class="signalTypeClass(sig.type)">{{ sig.type }}</span>
            </td>
            <td style="min-width: 180px;">
              <div style="font-size: 12px;">
                <span :class="sourceBadgeClass(sig.source)">{{ sourceLabel(sig.source) }}</span>
              </div>
              <div style="font-size: 11px; color: #888;" :title="sig.strategy_run_id ?? ''">
                {{ sig.strategy_name ?? (sig.strategy_id ? `策略#${sig.strategy_id.slice(0, 8)}` : '未关联策略') }}
              </div>
              <div
                v-if="sig.resolved_market || sig.selection_mode || sig.fallback_reason"
                style="font-size: 10px; color: #6ea8ff; margin-top: 2px;"
                :title="formatUniverseMeta(sig)"
              >
                {{ formatUniverseMeta(sig) }}
              </div>
            </td>
            <td>{{ sig.direction ?? '—' }}</td>
            <td :title="sig.quantity_mode ?? ''">{{ formatSignalQuantity(sig) }}</td>
            <td>{{ (sig.strength * 100).toFixed(2) + '%' }}</td>
            <td>
              <span :class="signalStatusClass(sig.status)">{{ sig.status }}</span>
            </td>
            <td style="max-width: 200px; font-size: 11px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {{ sig.notes ?? '—' }}
            </td>
          </tr>
          <tr v-if="autonomyStore.signalPipeline.length === 0">
            <td colspan="9" style="text-align: center; color: #666;">暂无信号记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 审计日志 -->
    <div class="card">
      <h3 style="margin: 0 0 16px;">决策审计日志</h3>
      <div v-if="autonomyStore.loading" class="loading-message">加载中...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>决策类型</th>
            <th>标的</th>
            <th>方向</th>
            <th>数量</th>
            <th>Risk Gate</th>
            <th>备注/原因</th>
            <th>订单 ID</th>
            <th>撤销状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in autonomyStore.auditLogs" :key="log.id">
            <td>{{ formatDate(log.created_at) }}</td>
            <td>{{ log.decision_type }}</td>
            <td>{{ log.symbol ?? '—' }}</td>
            <td>{{ log.direction ?? '—' }}</td>
            <td :title="log.quantity_mode ?? ''">{{ formatAuditQuantity(log) }}</td>
            <td>
              <span :class="log.risk_gate_passed ? 'badge-success' : 'badge-danger'">
                {{ log.risk_gate_passed ? '通过' : '拦截' }}
              </span>
            </td>
            <td style="max-width:180px; font-size:11px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" :title="log.ai_reasoning ?? ''">
              {{ log.ai_reasoning ?? '—' }}
            </td>
            <td>{{ log.order_id ? log.order_id.substring(0, 12) + '…' : '—' }}</td>
            <td>{{ log.revoked_at ? '已撤销' : '—' }}</td>
            <td>
              <button
                v-if="log.order_id && !log.revoked_at"
                class="small-button danger"
                @click="handleRevoke(log.order_id!)"
              >撤销</button>
            </td>
          </tr>
          <tr v-if="autonomyStore.auditLogs.length === 0">
            <td colspan="10" style="text-align: center; color: #666;">暂无审计记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useAutonomyStore } from '@/stores/autonomy'
import type { AutonomyLevel, AuditLogEntry, CooldownSymbol, SignalPipelineItem } from '@/api/autonomyService'
import { storeToRefs } from 'pinia'
import { regimeApi, REGIME_LABELS, REGIME_COLORS, type RegimeInfo, type RegimeType } from '@/api/regimeService'
import { formatClientDateTime } from '@/utils/datetime'

const autonomyStore = useAutonomyStore()
const { status } = storeToRefs(autonomyStore)

// V10.2-M1: 体制感知
const regimeInfo     = ref<RegimeInfo | null>(null)
const regimeVarMultN = ref<number>(1.0)

// 冷却保护
const showCooldownDetail = ref(false)
const cooldownSymbols = computed<CooldownSymbol[]>(
  () => status.value?.cooldown_symbols ?? []
)
const cooldownActive = computed(() => cooldownSymbols.value.length > 0)

const regimeBannerLabel = computed(() => {
  if (!regimeInfo.value) return '—'
  return REGIME_LABELS[regimeInfo.value.regime] ?? regimeInfo.value.regime
})
const regimeBannerConf = computed(() => {
  if (!regimeInfo.value || typeof regimeInfo.value !== 'object') return '—'
  const conf = regimeInfo.value.confidence
  if (typeof conf !== 'number') return '—'
  return (conf * 100).toFixed(2) + '%'
})
const regimeBannerColor = computed(() => {
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

function signalTypeClass(type: string) {
  if (type === 'EXIT' || type === 'REDUCE' || type === 'SELL') return 'badge-warning'
  if (type === 'ENTRY' || type === 'ADD' || type === 'BUY') return 'badge-info'
  return 'badge-default'
}

function signalStatusClass(s: string) {
  if (s === 'EXECUTED') return 'badge-success'
  if (s === 'FAILED' || s === 'REJECTED') return 'badge-danger'
  if (s === 'VALIDATED') return 'badge-info'
  return 'badge-default'
}

function sourceLabel(source?: string | null) {
  const key = (source || '').toUpperCase()
  const labels: Record<string, string> = {
    STRATEGY: '策略信号',
    RESEARCH: '研究信号',
    AI_ADVICE: 'AI建议',
    MANUAL: '手动',
    RISK_MGMT: '风控',
    ARBITRAGE: '套利',
  }
  return labels[key] || (source ?? '未知来源')
}

function sourceBadgeClass(source?: string | null) {
  const key = (source || '').toUpperCase()
  if (key === 'STRATEGY') return 'badge-source badge-source-strategy'
  if (key === 'AI_ADVICE') return 'badge-source badge-source-ai'
  if (key === 'RISK_MGMT') return 'badge-source badge-source-risk'
  if (key === 'MANUAL') return 'badge-source badge-source-manual'
  if (key === 'RESEARCH') return 'badge-source badge-source-research'
  if (key === 'ARBITRAGE') return 'badge-source badge-source-arb'
  return 'badge-source badge-default'
}

function formatSignalQuantity(sig: SignalPipelineItem): string {
  const mode = (sig.quantity_mode || '').toUpperCase()
  const value = sig.quantity_value ?? sig.quantity
  if (value == null || Number.isNaN(Number(value))) return '—'

  if (mode === 'PCT_EQUITY') {
    const pct = Number(value) <= 1 ? Number(value) * 100 : Number(value)
    return `${pct.toFixed(2)}%`
  }

  if (mode === 'ABS_SHARES') {
    const n = Number(value)
    if (Math.abs(n - Math.round(n)) < 1e-6) return `${Math.round(n)}`
    return n.toFixed(4)
  }

  return `${Number(value)}`
}

function formatUniverseMeta(sig: SignalPipelineItem): string {
  const parts: string[] = []
  if (sig.resolved_market) parts.push(`市场:${sig.resolved_market}`)
  if (sig.selection_mode) parts.push(`模式:${sig.selection_mode}`)
  if (sig.fallback_reason) parts.push(`回退:${sig.fallback_reason}`)
  else if (sig.fallback_to_default_symbols) parts.push('回退:DEFAULT_SYMBOLS')
  return parts.join(' · ')
}

function formatAuditQuantity(log: AuditLogEntry): string {
  const mode = (log.quantity_mode || '').toUpperCase()
  const value = log.quantity_value ?? log.quantity
  if (value == null || Number.isNaN(Number(value))) return '—'

  if (mode === 'PCT_EQUITY') {
    const pct = Number(value) <= 1 ? Number(value) * 100 : Number(value)
    return `${pct.toFixed(2)}%`
  }

  if (mode === 'ABS_SHARES') {
    const n = Number(value)
    if (Math.abs(n - Math.round(n)) < 1e-6) return `${Math.round(n)}`
    return n.toFixed(4)
  }

  return `${Number(value)}`
}

const levelLabels: Record<string, string> = {
  FULL: '全自主 (FULL)',
  SEMI: '半自主 (SEMI)',
  ADVISORY: '顾问 (ADVISORY)',
}
const levelDescs: Record<string, string> = {
  FULL: 'AI 全权自动执行，无需人工确认',
  SEMI: 'AI 自动执行，30 分钟内可撤销',
  ADVISORY: 'AI 仅提供建议，需人工批准',
}

async function handleSetLevel(level: AutonomyLevel) {
  await autonomyStore.setLevel(level)
  await autonomyStore.fetchStatus()
}

async function handlePause() {
  await autonomyStore.pause()
}

async function handleResume() {
  await autonomyStore.resume()
}

async function handleTriggerRebalance() {
  await autonomyStore.triggerRebalance()
  await autonomyStore.fetchSignalPipeline()
  await autonomyStore.fetchStatus()
  await autonomyStore.fetchMarketUniverseStatus()
}

async function handleTriggerDecisionCycle() {
  await autonomyStore.triggerDecisionCycle()
  await autonomyStore.fetchSignalPipeline()
  await autonomyStore.fetchStatus()
  await autonomyStore.fetchMarketUniverseStatus()
}

async function handleTriggerFullCycle() {
  await autonomyStore.triggerFullCycle()
  await autonomyStore.fetchSignalPipeline()
  await autonomyStore.fetchStatus()
  await autonomyStore.fetchMarketUniverseStatus()
}

async function handleRevoke(execId: string) {
  await autonomyStore.revokeOrder(execId)
}

function formatDate(s: string) {
  return formatClientDateTime(s)
}

onMounted(async () => {
  await autonomyStore.fetchStatus()
  await autonomyStore.fetchAuditLog({ limit: 50 })
  await autonomyStore.fetchSignalPipeline()
  await autonomyStore.fetchMarketUniverseStatus()
  fetchRegime()  // V10.2-M1: 异步获取体制，不阻塞主查询
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}
.stat-card {
  background: var(--card-bg, #1a1a2e);
  border: 1px solid var(--border-color, #2d2d4e);
  border-radius: 8px;
  padding: 16px;
}
.stat-label { font-size: 12px; color: #888; margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 600; }
.text-success { color: #4caf50; }
.text-warning { color: #ff9800; }
.text-danger { color: #f44336; }
.card {
  background: var(--card-bg, #1a1a2e);
  border: 1px solid var(--border-color, #2d2d4e);
  border-radius: 8px;
  padding: 20px;
}
.level-option {
  flex: 1; min-width: 180px; padding: 14px 18px; border-radius: 8px;
  border: 2px solid var(--border-color, #2d2d4e);
  cursor: pointer; transition: all 0.2s;
}
.level-option:hover { border-color: #4a6fa5; }
.level-option.active { border-color: #4a90e2; background: rgba(74,144,226,0.1); }
.level-title { font-weight: 600; margin-bottom: 4px; }
.level-desc { font-size: 12px; color: #888; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 8px 12px; border-bottom: 1px solid var(--border-color, #2d2d4e); text-align: left; }
.data-table th { color: #888; font-weight: 500; }
.badge-success { background: rgba(76,175,80,0.15); color: #4caf50; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.badge-danger { background: rgba(244,67,54,0.15); color: #f44336; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.danger-button { background: #c62828; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.success-button { background: #2e7d32; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.refresh-button { background: transparent; border: 1px solid #4a6fa5; color: #4a90e2; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.small-button { font-size: 11px; padding: 2px 8px; border-radius: 4px; border: none; cursor: pointer; }
.small-button.danger { background: rgba(244,67,54,0.15); color: #f44336; }
.badge-info { background: rgba(74,144,226,0.15); color: #4a90e2; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.badge-warning { background: rgba(255,152,0,0.15); color: #ff9800; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.badge-default { background: rgba(150,150,150,0.15); color: #aaa; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.trigger-button {
  background: rgba(74,144,226,0.15); color: #4a90e2;
  border: 1px solid rgba(74,144,226,0.4); padding: 8px 18px; border-radius: 6px;
  cursor: pointer; font-size: 13px; transition: all 0.2s;
}
.trigger-button:hover:not(:disabled) { background: rgba(74,144,226,0.3); }
.trigger-button:disabled { opacity: 0.5; cursor: not-allowed; }
.trigger-button--primary {
  background: rgba(80,200,120,0.15); color: #50c878;
  border-color: rgba(80,200,120,0.5);
}
.trigger-button--primary:hover:not(:disabled) { background: rgba(80,200,120,0.3); }

.full-cycle-summary {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(74, 144, 226, 0.35);
  border-radius: 8px;
  background: rgba(74, 144, 226, 0.08);
}

.full-cycle-summary__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

.full-cycle-summary__meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #9fb0c7;
  margin-bottom: 8px;
}

.full-cycle-summary__chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.full-cycle-summary__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(80, 200, 120, 0.4);
  color: #aef5c8;
  background: rgba(80, 200, 120, 0.1);
  font-size: 11px;
}

.full-cycle-summary__chip em {
  color: #8fb8ff;
  font-style: normal;
}

.full-cycle-summary__runtime {
  margin-top: 8px;
  font-size: 12px;
  color: #9fb0c7;
}

.badge-source {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1.4;
}

.badge-source-strategy {
  color: #7fc3ff;
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.45);
}

.badge-source-ai {
  color: #c9a6ff;
  background: rgba(154, 120, 255, 0.18);
  border: 1px solid rgba(154, 120, 255, 0.4);
}

.badge-source-risk {
  color: #ffb366;
  background: rgba(255, 152, 0, 0.18);
  border: 1px solid rgba(255, 152, 0, 0.38);
}

.badge-source-manual {
  color: #a8d8ff;
  background: rgba(120, 180, 240, 0.16);
  border: 1px solid rgba(120, 180, 240, 0.36);
}

.badge-source-research {
  color: #8ff2ca;
  background: rgba(80, 200, 120, 0.14);
  border: 1px solid rgba(80, 200, 120, 0.35);
}

.badge-source-arb {
  color: #ffd36e;
  background: rgba(255, 211, 110, 0.14);
  border: 1px solid rgba(255, 211, 110, 0.35);
}

/* 状态卡片副文本 */
.stat-sub {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.85;
}
.text-muted { color: #888; }

/* 冷却保护卡片高亮边框 */
.stat-card--warn {
  border-color: rgba(255,165,0,0.45);
  background: linear-gradient(135deg, rgba(255,165,0,0.07) 0%, transparent 60%);
}

/* 冷却保护详情面板 */
.cooldown-detail {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 260px;
  background: #1a1e2e;
  border: 1px solid rgba(255,165,0,0.4);
  border-radius: 8px;
  padding: 10px 14px;
  z-index: 200;
  box-shadow: 0 6px 20px rgba(0,0,0,0.45);
}
.cooldown-detail-title {
  font-size: 12px;
  font-weight: 600;
  color: #ffaa33;
  margin-bottom: 8px;
}
.cooldown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.cooldown-table th {
  color: #888;
  font-weight: 500;
  text-align: left;
  padding: 2px 6px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.cooldown-table td {
  padding: 4px 6px;
  color: #ccc;
}
.cooldown-detail-note {
  font-size: 11px;
  color: #666;
  margin-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 6px;
}

/* V10.2-M1: 体制感知横幅 */
.regime-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 16px;
  margin-bottom: 18px;
  background: #0e0e28;
  border: 1px solid #1e1e4a;
  border-radius: 7px;
  font-size: 13px;
  transition: border-color 0.3s;
}
.regime-banner-icon { font-size: 16px; }
.regime-banner-label { color: #666688; }
.regime-banner-name { font-weight: 700; font-size: 15px; }
.regime-banner-conf { color: #555577; font-size: 12px; }
.regime-banner-sep { color: #2a2a4a; }
.regime-banner-var { font-weight: 600; font-size: 13px; }
.regime-banner-link {
  color: #00ccff;
  text-decoration: none;
  font-size: 12px;
  margin-left: auto;
  transition: color 0.2s;
}
.regime-banner-link:hover { color: #00ff88; }
</style>
