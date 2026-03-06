<template>
  <div class="signal-watchtower">
    <!-- ── 顶栏 ──────────────────────────────────────────────────────── -->
    <div class="sw-topbar">
      <div class="sw-title">📡 信号哨所 · Signal Watchtower</div>
      <div class="sw-tabs">
        <button v-for="t in TABS" :key="t.key"
          class="sw-tab" :class="{ active: activeTab === t.key }"
          @click="activeTab = t.key">
          {{ t.label }}
        </button>
      </div>
      <div class="sw-actions">
        <select v-model="sinceDays" @change="reloadAll" class="period-select">
          <option :value="7">近 7 天</option>
          <option :value="14">近 14 天</option>
          <option :value="30">近 30 天</option>
          <option :value="90">近 90 天</option>
        </select>
        <button class="sm-btn" @click="triggerCapacityGuard" :disabled="capacityGuardRunning || loading" title="立即执行一轮容量守卫">
          {{ capacityGuardRunning ? '执行中…' : '触发容量守卫' }}
        </button>
        <button class="icon-btn" @click="reloadAll" :disabled="loading" title="刷新">
          <span :class="loading ? 'spin' : ''">⟳</span>
        </button>
      </div>
    </div>

    <!-- ── Tab 1: 漏斗概览 ─────────────────────────────────────────── -->
    <div v-if="activeTab === 'funnel'" class="tab-content">
      <div v-if="capacityGuardRunResult" class="capacity-guard-run-banner" :class="capacityGuardRunBannerClass">
        <div class="capacity-guard-run-title">🛡️ 容量守卫手动执行结果</div>
        <div class="capacity-guard-run-body">
          当前持仓 {{ capacityGuardRunResult.result.current_positions }} 个，
          上限 {{ capacityGuardRunResult.result.max_positions }} 个，
          超限 {{ capacityGuardRunResult.result.overflow }} 个，
          新生成退出信号 {{ capacityGuardRunResult.result.created_exit_signals }} 条。
          <template v-if="capacityGuardRunResult.regime">
            当前体制：{{ regimeLabelFromAny(capacityGuardRunResult.regime) }}。
          </template>
        </div>
      </div>

      <!-- L2 持仓满载诊断横幅 -->
      <div v-if="isL2Dominant" class="l2-capacity-alert">
        <span class="l2-alert-icon">⚠️</span>
        <div class="l2-alert-body">
          <strong>组合容量已满 — L2 正在拦截所有新信号</strong>
          <span class="l2-alert-detail">
            当前 HELD 持仓 <strong>{{ stats!.current_positions_count }}</strong> 个 &gt;
            {{ effectiveCapacityLabel }} <strong>{{ effectiveMaxCapacity }}</strong> 个；
            须平仓后方可放行新信号
          </span>
          <span v-if="capacityContextText" class="l2-alert-detail">
            {{ capacityContextText }}
          </span>
        </div>
      </div>

      <div class="stat-cards">
        <div class="stat-card">
          <div class="sc-value">{{ stats?.total_evaluated ?? '--' }}</div>
          <div class="sc-label">总评估</div>
        </div>
        <div class="stat-card sc-good">
          <div class="sc-value">{{ stats?.total_passed ?? '--' }}</div>
          <div class="sc-label">精英通过</div>
        </div>
        <div class="stat-card sc-warn">
          <div class="sc-value">{{ eliteRatePct }}%</div>
          <div class="sc-label">精英率 <span class="target-hint">(目标 5-15%)</span></div>
        </div>
        <div class="stat-card">
          <div class="sc-value">{{ effectiveMaxCapacityDisplay }}</div>
          <div class="sc-label">当前容量上限 <span class="target-hint">({{ currentRegimeLabel }})</span></div>
        </div>
      </div>

      <div class="two-col">
        <!-- 漏斗逐层图 -->
        <div class="chart-card">
          <div class="card-title">漏斗逐层过滤量</div>
          <div ref="funnelChartRef" class="chart-box h-240"></div>
        </div>
        <!-- 拒绝原因分布 -->
        <div class="chart-card">
          <div class="card-title">拒绝原因分布</div>
          <div ref="reasonChartRef" class="chart-box h-240"></div>
        </div>
      </div>

      <!-- 精英率趋势 -->
      <div class="chart-card mt-12">
        <div class="card-title">精英率历史趋势 <span class="target-hint">（目标范围 5-15%）</span></div>
        <div ref="trendChartRef" class="chart-box h-180"></div>
      </div>

      <div class="chart-card mt-12">
        <div class="card-title">容量守卫最近动作</div>
        <div class="capacity-guard-summary">
          <div class="capacity-guard-metric">
            <span class="cg-label">最近生成</span>
            <strong>{{ stats?.capacity_guard?.recent_generated_count ?? 0 }}</strong>
          </div>
          <div class="capacity-guard-metric">
            <span class="cg-label">待执行中</span>
            <strong>{{ stats?.capacity_guard?.open_signal_count ?? 0 }}</strong>
          </div>
          <div class="capacity-guard-metric capacity-guard-last-run">
            <span class="cg-label">最近动作时间</span>
            <strong>{{ fmtTs(stats?.capacity_guard?.last_action_at) }}</strong>
          </div>
        </div>

        <div v-if="stats?.capacity_guard?.recent_actions?.length" class="table-wrap mt-12">
          <table class="data-table capacity-guard-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>标的</th>
                <th>状态</th>
                <th>建议</th>
                <th>风险</th>
                <th>退出数量</th>
                <th>超限</th>
                <th>上限</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="action in stats.capacity_guard.recent_actions" :key="action.signal_id">
                <td>{{ fmtTs(action.created_at) }}</td>
                <td class="sym-cell">{{ action.symbol }}</td>
                <td><span :class="capacityGuardStatusClass(action.status)">{{ capacityGuardStatusLabel(action.status) }}</span></td>
                <td>{{ action.recommendation ?? '--' }}</td>
                <td>{{ action.risk_level ?? '--' }}</td>
                <td class="num-cell">{{ action.quantity != null ? action.quantity.toFixed(0) : '--' }}</td>
                <td class="center-cell">{{ action.overflow ?? '--' }}</td>
                <td class="center-cell">{{ action.target_max ?? '--' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-guard-state">
          近期开仓容量守卫尚未生成自动减仓信号。
        </div>
      </div>
    </div>

    <!-- ── Tab 2: 审计日志 ─────────────────────────────────────────── -->
    <div v-if="activeTab === 'audit'" class="tab-content">
      <div class="filter-bar">
        <select v-model="auditFilter.funnel_result" @change="loadAuditLog" class="small-select">
          <option value="">全部</option>
          <option value="PASSED">通过</option>
          <option value="REJECTED">拒绝</option>
        </select>
        <input v-model="auditFilter.symbol" placeholder="标的过滤" class="small-input"
          @keyup.enter="loadAuditLog" />
        <button class="sm-btn" @click="loadAuditLog">搜索</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>标的</th>
              <th>方向</th>
              <th>结果</th>
              <th>拒绝层</th>
              <th>拒绝原因</th>
              <th>置信分</th>
              <th>融合分</th>
              <th>体制</th>
              <th>反共振</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="auditLoading">
              <td colspan="10" class="center-cell">加载中…</td>
            </tr>
            <tr v-else-if="!auditRows.length">
              <td colspan="10" class="center-cell">暂无数据</td>
            </tr>
            <tr v-else v-for="row in auditRows" :key="row.id"
              :class="row.funnel_result === 'PASSED' ? 'row-pass' : 'row-reject'">
              <td>{{ fmtTs(row.created_at) }}</td>
              <td class="sym-cell">{{ row.symbol }}</td>
              <td><span :class="row.signal_direction === 'LONG' ? 'dir-long' : 'dir-short'">
                {{ row.signal_direction ?? '--' }}
              </span></td>
              <td>
                <span :class="row.funnel_result === 'PASSED' ? 'badge-pass' : 'badge-reject'">
                  {{ row.funnel_result === 'PASSED' ? '✓ 通过' : '✗ 拒绝' }}
                </span>
              </td>
              <td class="center-cell">{{ row.rejected_at_layer != null ? `L${row.rejected_at_layer}` : '--' }}</td>
              <td class="reason-cell" :title="row.rejection_detail ?? ''">
                {{ row.rejection_reason ?? '--' }}
              </td>
              <td class="num-cell">{{ row.conviction_score?.toFixed(1) ?? '--' }}</td>
              <td class="num-cell">{{ row.composite_score?.toFixed(1) ?? '--' }}</td>
              <td>{{ row.regime ?? '--' }}</td>
              <td class="center-cell">
                <span v-if="row.anti_resonance_triggered" class="anti-kill">🔴</span>
                <span v-else>–</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button class="sm-btn" @click="prevPage" :disabled="auditOffset === 0">‹ 上页</button>
        <span>第 {{ Math.floor(auditOffset / auditLimit) + 1 }} 页</span>
        <button class="sm-btn" @click="nextPage" :disabled="auditRows.length < auditLimit">下页 ›</button>
      </div>
    </div>

    <!-- ── Tab 3: 幽灵交易 ─────────────────────────────────────────── -->
    <div v-if="activeTab === 'ghost'" class="tab-content">
      <!-- 分析摘要 -->
      <div v-if="ghostAnalysis" class="analysis-banner" :class="`rec-${ghostAnalysis.recommendation.toLowerCase().replace('_', '-')}`">
        <div class="ab-conclusion">{{ ghostAnalysis.conclusion }}</div>
        <div class="ab-stats">
          幽灵胜率 <strong>{{ ghostAnalysis.ghost_win_rate_pct }}%</strong>
          <template v-if="ghostAnalysis.real_win_rate_pct">
            vs 实际 <strong>{{ ghostAnalysis.real_win_rate_pct }}%</strong>
          </template>
          ｜ 幽灵平均 PnL <strong>{{ ghostAnalysis.ghost_avg_pnl_pct?.toFixed(2) }}%</strong>
        </div>
      </div>

      <div class="filter-bar">
        <select v-model="ghostFilter.ghost_result" @change="loadGhostTrades" class="small-select">
          <option value="">全部</option>
          <option value="OPEN">跟踪中</option>
          <option value="WIN">胜</option>
          <option value="LOSS">败</option>
          <option value="EXPIRED">到期</option>
        </select>
        <input v-model="ghostFilter.symbol" placeholder="标的过滤" class="small-input"
          @keyup.enter="loadGhostTrades" />
        <button class="sm-btn" @click="loadGhostTrades">搜索</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>开始跟踪</th>
              <th>标的</th>
              <th>方向</th>
              <th>进入价</th>
              <th>最新价</th>
              <th>幽灵PnL%</th>
              <th>结果</th>
              <th>跟踪天</th>
              <th>被拒层</th>
              <th>被拒原因</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ghostLoading">
              <td colspan="10" class="center-cell">加载中…</td>
            </tr>
            <tr v-else-if="!ghostRows.length">
              <td colspan="10" class="center-cell">暂无幽灵交易</td>
            </tr>
            <tr v-else v-for="row in ghostRows" :key="row.id">
              <td>{{ fmtTs(row.tracking_start) }}</td>
              <td class="sym-cell">{{ row.symbol }}</td>
              <td><span :class="row.direction === 'LONG' ? 'dir-long' : 'dir-short'">
                {{ row.direction }}
              </span></td>
              <td class="num-cell">{{ row.entry_price?.toFixed(2) ?? '--' }}</td>
              <td class="num-cell">{{ row.last_price?.toFixed(2) ?? '--' }}</td>
              <td class="num-cell" :class="(row.ghost_pnl_pct ?? 0) >= 0 ? 'pnl-pos' : 'pnl-neg'">
                {{ row.ghost_pnl_pct != null ? `${row.ghost_pnl_pct >= 0 ? '+' : ''}${row.ghost_pnl_pct.toFixed(2)}%` : '--' }}
              </td>
              <td>
                <span :class="`ghost-result-${row.ghost_result.toLowerCase()}`">
                  {{ GHOST_RESULT_LABELS[row.ghost_result] }}
                </span>
              </td>
              <td class="center-cell">{{ row.tracking_day }}/{{ row.max_tracking_days }}</td>
              <td class="center-cell">{{ row.rejected_at_layer != null ? `L${row.rejected_at_layer}` : '--' }}</td>
              <td class="reason-cell">{{ row.rejection_reason ?? '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Tab 4: 参数调参 ─────────────────────────────────────────── -->
    <div v-if="activeTab === 'config'" class="tab-content">
      <div class="config-panel">
        <div class="config-warning">
          ⚠️ 以下参数热更新仅在服务重启前有效。生产环境请同步修改环境变量并重启服务。
        </div>

        <div class="config-grid" v-if="editConfig">
          <div class="config-row-item" v-for="field in CONFIG_FIELDS" :key="field.key">
            <label class="config-label">
              {{ field.label }}
              <span class="config-hint">{{ field.hint }}</span>
            </label>
            <input
              type="number"
              v-model.number="editConfig[field.key as keyof typeof editConfig]"
              :min="field.min"
              :max="field.max"
              :step="field.step"
              class="config-input"
            />
          </div>
        </div>

        <div class="config-actions">
          <button class="btn-reset" @click="resetConfig">恢复默认</button>
          <button class="btn-apply" @click="showConfirm = true">应用更改</button>
        </div>
      </div>

      <!-- 确认弹窗 -->
      <div v-if="showConfirm" class="confirm-overlay">
        <div class="confirm-dialog">
          <div class="cd-title">确认更新漏斗参数？</div>
          <div class="cd-body">此操作将立即生效，影响后续所有信号评估。</div>
          <div class="cd-actions">
            <button class="btn-cancel" @click="showConfirm = false">取消</button>
            <button class="btn-confirm" @click="applyConfig">确认</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { autonomyApi } from '@/api/autonomyService'
import { REGIME_LABELS } from '@/api/regimeService'
import { signalQualityService } from '@/api/signalQualityService'
import type { TriggerCapacityGuardResponse } from '@/api/autonomyService'
import type {
  FunnelStats, AuditLogRecord, GhostTrade,
  GhostAnalysis, QualityConfig, QualityConfigPatch,
} from '@/api/signalQualityService'
import type { RegimeType } from '@/api/regimeService'

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'funnel', label: '🔬 漏斗概览' },
  { key: 'audit',  label: '📋 审计日志' },
  { key: 'ghost',  label: '👻 幽灵交易' },
  { key: 'config', label: '⚙️ 参数调参' },
]
const activeTab = ref('funnel')

const GHOST_RESULT_LABELS: Record<string, string> = {
  WIN: '✅ 胜', LOSS: '❌ 败', OPEN: '⏳ 跟踪中', EXPIRED: '⌛ 到期',
}

type AuditResultFilter = '' | 'PASSED' | 'REJECTED'
type GhostResultFilter = '' | 'WIN' | 'LOSS' | 'OPEN' | 'EXPIRED'

// ── 全局状态 ──────────────────────────────────────────────────────────────────
const loading    = ref(false)
const sinceDays  = ref(7)
const stats      = ref<FunnelStats | null>(null)
const config     = ref<QualityConfig | null>(null)
const editConfig = ref<Partial<QualityConfig>>({})
const capacityGuardRunning = ref(false)
const capacityGuardRunResult = ref<TriggerCapacityGuardResponse | null>(null)

// ── 审计日志 ──────────────────────────────────────────────────────────────────
const auditRows    = ref<AuditLogRecord[]>([])
const auditLoading = ref(false)
const auditOffset  = ref(0)
const auditLimit   = 50
const auditFilter  = ref<{ funnel_result: AuditResultFilter; symbol: string }>({
  funnel_result: '',
  symbol: '',
})

// ── 幽灵交易 ──────────────────────────────────────────────────────────────────
const ghostRows    = ref<GhostTrade[]>([])
const ghostLoading = ref(false)
const ghostAnalysis = ref<GhostAnalysis | null>(null)
const ghostFilter  = ref<{ ghost_result: GhostResultFilter; symbol: string }>({
  ghost_result: '',
  symbol: '',
})

// ── 调参 ─────────────────────────────────────────────────────────────────────
const showConfirm = ref(false)
const CONFIG_FIELDS = [
  { key: 'signal_confidence_threshold', label: '置信度门槛',     hint: '(0-100, 推荐 90-95)',  min: 50, max: 100, step: 1 },
  { key: 'signal_resonance_min_dims',   label: '最小共振维度数', hint: '(1-6, 推荐 4)',        min: 1,  max: 6,   step: 1 },
  { key: 'max_concurrent_positions',    label: '最大并发仓位',   hint: '(1-20, 推荐 6)',       min: 1,  max: 20,  step: 1 },
  { key: 'max_daily_signals',           label: '最大日信号配额', hint: '(1-20, 推荐 5)',       min: 1,  max: 20,  step: 1 },
  { key: 'max_position_correlation',    label: '最大相关性上限', hint: '(0-1, 推荐 0.7)',      min: 0,  max: 1,   step: 0.05 },
]

// ── 图表 refs ─────────────────────────────────────────────────────────────────
const funnelChartRef = ref<HTMLElement | null>(null)
const reasonChartRef = ref<HTMLElement | null>(null)
const trendChartRef  = ref<HTMLElement | null>(null)
let funnelChart: echarts.ECharts | null = null
let reasonChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

// ── Computed ──────────────────────────────────────────────────────────────────
const eliteRatePct = computed(() =>
  stats.value?.elite_rate_pct?.toFixed(1) ?? '--'
)

const effectiveMaxCapacity = computed(() =>
  stats.value?.effective_max_concurrent_positions
  ?? stats.value?.max_concurrent_positions_cfg
  ?? Infinity
)

const effectiveMaxCapacityDisplay = computed(() =>
  Number.isFinite(effectiveMaxCapacity.value) ? String(effectiveMaxCapacity.value) : '--'
)

const currentRegimeLabel = computed(() => {
  const regime = stats.value?.current_regime as RegimeType | null | undefined
  if (!regime) return '基础配置'
  return REGIME_LABELS[regime] ?? regime
})

const capacityGuardRunBannerClass = computed(() => {
  const status = capacityGuardRunResult.value?.result.status
  if (status === 'capacity-reduced') return 'cg-run-success'
  if (status === 'within-limit' || status === 'pending-exits-sufficient') return 'cg-run-neutral'
  return 'cg-run-warning'
})

const effectiveCapacityLabel = computed(() => {
  if (!stats.value?.current_regime) return '配置上限'
  return `当前体制上限（${currentRegimeLabel.value}）`
})

const capacityContextText = computed(() => {
  if (!stats.value) return ''
  const base = stats.value.max_concurrent_positions_cfg
  const effective = stats.value.effective_max_concurrent_positions ?? base
  const confidence = stats.value.regime_confidence
  const confidenceText = confidence != null ? `，置信度 ${(confidence * 100).toFixed(1)}%` : ''

  if (stats.value.current_regime && base != null && effective != null && effective !== base) {
    return `基础上限 ${base} 个；当前体制 ${currentRegimeLabel.value}${confidenceText}，已动态收紧为 ${effective} 个。`
  }
  if (stats.value.current_regime) {
    return `当前体制 ${currentRegimeLabel.value}${confidenceText}；当前生效上限为 ${effective ?? '--'} 个。`
  }
  return base != null ? `当前使用基础配置上限 ${base} 个。` : ''
})

// L2 (MAX_POSITIONS_REACHED) 是否为主要拦截原因，且确实超出配置上限
const isL2Dominant = computed(() => {
  if (!stats.value) return false
  const breakdown = stats.value.rejection_breakdown ?? {}
  const l2Count = breakdown['MAX_POSITIONS_REACHED'] ?? 0
  const total = stats.value.total_evaluated ?? 0
  if (total === 0 || l2Count === 0) return false
  const currentPos = stats.value.current_positions_count ?? 0
  const maxCfg = effectiveMaxCapacity.value
  // 超过配置上限 且 L2 拒绝占比 > 30%
  return currentPos > maxCfg && (l2Count / total) > 0.3
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTs(ts: string | null | undefined): string {
  if (!ts) return '--'
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function regimeLabelFromAny(regime: string | null | undefined): string {
  if (!regime) return '基础配置'
  return REGIME_LABELS[regime as RegimeType] ?? regime
}

function capacityGuardStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    GENERATED: '已生成',
    VALIDATED: '已验证',
    QUEUED: '排队中',
    EXECUTING: '执行中',
    EXECUTED: '已执行',
    FAILED: '失败',
    CANCELLED: '已取消',
    EXPIRED: '已过期',
    SKIPPED: '已跳过',
    REJECTED: '已拒绝',
  }
  return labels[status] ?? status
}

function capacityGuardStatusClass(status: string): string {
  const pending = ['GENERATED', 'VALIDATED', 'QUEUED', 'EXECUTING']
  if (pending.includes(status)) return 'cg-status-pending'
  if (status === 'EXECUTED') return 'cg-status-done'
  if (['FAILED', 'CANCELLED', 'EXPIRED', 'REJECTED'].includes(status)) return 'cg-status-failed'
  return 'cg-status-neutral'
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────
async function reloadAll() {
  loading.value = true
  await Promise.all([loadStats(), loadConfig()])
  loading.value = false
  if (activeTab.value === 'audit') loadAuditLog()
  if (activeTab.value === 'ghost') {
    loadGhostTrades()
    loadGhostAnalysis()
  }
}

async function loadStats() {
  try {
    stats.value = await signalQualityService.getFunnelStats(sinceDays.value)
    await nextTick()
    renderFunnelChart()
    renderReasonChart()
    renderTrendChart()
  } catch (e) { console.error('[Watchtower] loadStats', e) }
}

async function loadConfig() {
  try {
    config.value = await signalQualityService.getConfig()
    editConfig.value = { ...config.value }
  } catch (e) { console.error('[Watchtower] loadConfig', e) }
}

async function loadAuditLog() {
  auditLoading.value = true
  try {
    const r = await signalQualityService.getAuditLog({
      limit:        auditLimit,
      offset:       auditOffset.value,
      funnel_result: auditFilter.value.funnel_result || undefined,
      symbol:       auditFilter.value.symbol || undefined,
      since_days:   sinceDays.value,
    })
    auditRows.value = r.data
  } catch (e) { console.error('[Watchtower] loadAuditLog', e) }
  finally { auditLoading.value = false }
}

async function loadGhostTrades() {
  ghostLoading.value = true
  try {
    const r = await signalQualityService.getGhostTrades({
      limit:        50,
      ghost_result: ghostFilter.value.ghost_result || undefined,
      symbol:       ghostFilter.value.symbol || undefined,
      since_days:   sinceDays.value,
    })
    ghostRows.value = r.data
  } catch (e) { console.error('[Watchtower] loadGhostTrades', e) }
  finally { ghostLoading.value = false }
}

async function loadGhostAnalysis() {
  try {
    ghostAnalysis.value = await signalQualityService.getGhostAnalysis(sinceDays.value)
  } catch (e) { console.error('[Watchtower] loadGhostAnalysis', e) }
}

async function triggerCapacityGuard() {
  capacityGuardRunning.value = true
  try {
    const { data } = await autonomyApi.triggerCapacityGuard()
    capacityGuardRunResult.value = data
    await loadStats()
  } catch (e) {
    console.error('[Watchtower] triggerCapacityGuard', e)
  } finally {
    capacityGuardRunning.value = false
  }
}

// ── 分页 ─────────────────────────────────────────────────────────────────────
function prevPage() { auditOffset.value = Math.max(0, auditOffset.value - auditLimit); loadAuditLog() }
function nextPage() { auditOffset.value += auditLimit; loadAuditLog() }

// ── 调参 ─────────────────────────────────────────────────────────────────────
async function applyConfig() {
  showConfirm.value = false
  try {
    await signalQualityService.patchConfig(editConfig.value as QualityConfigPatch)
    await loadConfig()
  } catch (e) { console.error('[Watchtower] applyConfig', e) }
}

async function resetConfig() {
  try {
    await signalQualityService.resetConfig()
    await loadConfig()
  } catch (e) { console.error('[Watchtower] resetConfig', e) }
}

// ── 图表渲染 ──────────────────────────────────────────────────────────────────
function renderFunnelChart() {
  if (!funnelChartRef.value || !stats.value) return
  if (!funnelChart) funnelChart = echarts.init(funnelChartRef.value)
  const s = stats.value
  const total = s.total_evaluated || 1
  const layers = [
    { name: 'L0 流动性过滤', val: s.layer_stats.layer_0_rejected },
    { name: 'L1 体制门控',   val: s.layer_stats.layer_1_rejected },
    { name: 'L2 组合容量',   val: s.layer_stats.layer_2_rejected },
    { name: 'L3 共振强制',   val: s.layer_stats.layer_3_rejected },
    { name: 'L4 置信度门',   val: s.layer_stats.layer_4_rejected },
  ]
  funnelChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { show: false },
    grid: { top: 12, bottom: 55, left: 0, right: 0, containLabel: true },
    xAxis: { type: 'category', data: ['进入', ...layers.map(l => l.name), '精英通过'],
      axisLabel: { color: '#9ca3af', fontSize: 10, rotate: 20 } },
    yAxis: { type: 'value', axisLabel: { color: '#6b7280', fontSize: 10 } },
    series: [{
      type: 'bar',
      data: [
        { value: total, itemStyle: { color: '#60a5fa' } },
        ...layers.map(l => ({ value: l.val, itemStyle: { color: '#f59e0b' } })),
        { value: s.total_passed, itemStyle: { color: '#22c55e' } },
      ],
      label: { show: true, position: 'top', color: '#e5e7eb', fontSize: 10 },
      barMaxWidth: 50,
    }],
  })
}

function renderReasonChart() {
  if (!reasonChartRef.value || !stats.value) return
  if (!reasonChart) reasonChart = echarts.init(reasonChartRef.value)
  const breakdown = stats.value.rejection_breakdown
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 10)
  reasonChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    grid: { top: 12, bottom: 12, left: 10, right: 10, containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#6b7280', fontSize: 9 } },
    yAxis: { type: 'category', data: entries.map(e => e[0]),
      axisLabel: { color: '#9ca3af', fontSize: 9 } },
    series: [{
      type: 'bar',
      data: entries.map(e => e[1]),
      itemStyle: { color: '#f87171' },
      label: { show: true, position: 'right', color: '#e5e7eb', fontSize: 9 },
    }],
  })
}

function renderTrendChart() {
  if (!trendChartRef.value || !stats.value?.daily_trend) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)
  const trend = stats.value.daily_trend
  trendChart.setOption({
    tooltip: { trigger: 'axis', formatter: (p: any) =>
      `${p[0].axisValue}<br/>精英率: ${p[0].value}% (${p[1]?.value ?? 0}通过/${p[2]?.value ?? 0}评估)` },
    legend: { show: false },
    grid: { top: 12, bottom: 24, left: 6, right: 6, containLabel: true },
    xAxis: { type: 'category', data: trend.map(t => t.date),
      axisLabel: { color: '#9ca3af', fontSize: 9 } },
    yAxis: [
      { type: 'value', name: '精英率%', axisLabel: { color: '#6b7280', fontSize: 9 },
        max: 100, splitLine: { lineStyle: { color: 'rgba(75,85,99,0.3)' } } },
    ],
    series: [
      {
        name: '精英率',
        type: 'line',
        data: trend.map(t => t.elite_rate),
        smooth: true,
        lineStyle: { color: '#22c55e', width: 2 },
        itemStyle: { color: '#22c55e' },
        areaStyle: { color: 'rgba(34,197,94,0.1)' },
      },
      // 5% 下限参考线
      { name: '5% 下限', type: 'line', data: trend.map(() => 5),
        lineStyle: { color: '#f59e0b', width: 1, type: 'dashed' },
        itemStyle: { opacity: 0 }, showSymbol: false },
      // 15% 上限参考线
      { name: '15% 上限', type: 'line', data: trend.map(() => 15),
        lineStyle: { color: '#ef4444', width: 1, type: 'dashed' },
        itemStyle: { opacity: 0 }, showSymbol: false },
    ],
  })
}

const _resizeHandler = () => {
  funnelChart?.resize()
  reasonChart?.resize()
  trendChart?.resize()
}

onMounted(() => {
  reloadAll()
  window.addEventListener('resize', _resizeHandler)
})

onUnmounted(() => {
  funnelChart?.dispose()
  reasonChart?.dispose()
  trendChart?.dispose()
  window.removeEventListener('resize', _resizeHandler)
})
</script>

<style scoped>
.signal-watchtower {
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  padding: 0;
}

/* ── 顶栏 ───────────────────────────────────────────────────────────────── */
.sw-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px 10px;
  background: linear-gradient(to right, #1e293b, #0f172a);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-wrap: wrap;
}
.sw-title {
  font-size: 16px;
  font-weight: 700;
  color: #e2e8f0;
  white-space: nowrap;
}
.sw-tabs {
  display: flex;
  gap: 4px;
  flex: 1;
  flex-wrap: wrap;
}
.sw-tab {
  padding: 5px 14px;
  border: 1px solid rgba(100,116,139,0.4);
  border-radius: 20px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}
.sw-tab.active, .sw-tab:hover {
  background: rgba(59,130,246,0.2);
  border-color: #3b82f6;
  color: #93c5fd;
}
.sw-actions { display: flex; gap: 8px; align-items: center; }
.period-select, .small-select, .small-input {
  background: #1e293b;
  border: 1px solid rgba(100,116,139,0.4);
  color: #e2e8f0;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
}
.icon-btn {
  background: transparent; border: none; cursor: pointer;
  color: #94a3b8; font-size: 16px; padding: 4px 6px;
}
.icon-btn:hover { color: #93c5fd; }
.spin { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Tab 内容 ────────────────────────────────────────────────────────────── */
.tab-content { padding: 16px 20px; }

/* ── 统计卡片行 ───────────────────────────────────────────────────────────── */
.stat-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.stat-card {
  flex: 1;
  min-width: 100px;
  background: rgba(30,41,59,0.8);
  border: 1px solid rgba(100,116,139,0.3);
  border-radius: 10px;
  padding: 12px 16px;
}
.sc-value {
  font-size: 28px;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.1;
}
.sc-good .sc-value { color: #22c55e; }
.sc-warn .sc-value { color: #f59e0b; }
.sc-label { font-size: 11px; color: #64748b; margin-top: 4px; }
.target-hint { font-size: 10px; color: #475569; }

/* ── 双列图 ───────────────────────────────────────────────────────────────── */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 0; }
@media (max-width: 640px) { .two-col { grid-template-columns: 1fr; } }
.mt-12 { margin-top: 12px; }

.chart-card {
  background: rgba(15,23,42,0.8);
  border: 1px solid rgba(100,116,139,0.25);
  border-radius: 10px;
  padding: 12px;
}
.card-title { font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
.chart-box { width: 100%; }
.h-240 { height: 240px; }
.h-180 { height: 180px; }

/* ── 过滤栏 ───────────────────────────────────────────────────────────────── */
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.sm-btn {
  padding: 4px 12px;
  background: rgba(59,130,246,0.2);
  border: 1px solid #3b82f6;
  color: #93c5fd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.sm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── 表格 ────────────────────────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th {
  background: rgba(30,41,59,0.9);
  color: #64748b; font-weight: 600; text-align: left;
  padding: 8px 10px; white-space: nowrap;
  border-bottom: 1px solid rgba(100,116,139,0.3);
}
.data-table td {
  padding: 7px 10px; border-bottom: 1px solid rgba(100,116,139,0.15);
  color: #cbd5e1;
}
.data-table tr:hover td { background: rgba(99,102,241,0.08); }
.row-pass td  { border-left: 2px solid #22c55e; }
.row-reject td { border-left: 2px solid #f87171; }

.badge-pass    { color: #22c55e; font-weight: 600; font-size: 11px; }
.badge-reject  { color: #f87171; font-weight: 600; font-size: 11px; }
.dir-long  { color: #22c55e; font-weight: 600; }
.dir-short { color: #f87171; font-weight: 600; }
.sym-cell  { font-weight: 600; color: #93c5fd; }
.num-cell  { font-variant-numeric: tabular-nums; }
.center-cell { text-align: center; }
.reason-cell { font-size: 10px; color: #94a3b8; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.anti-kill { font-size: 13px; }
.pnl-pos { color: #22c55e; }
.pnl-neg { color: #f87171; }

.ghost-result-win    { color: #22c55e; font-weight: 600; }
.ghost-result-loss   { color: #f87171; font-weight: 600; }
.ghost-result-open   { color: #60a5fa; }
.ghost-result-expired { color: #94a3b8; }

/* 分页 */
.pagination { display: flex; gap: 12px; align-items: center; justify-content: center; margin-top: 12px; font-size: 12px; color: #64748b; }

/* ── 幽灵交易分析摘要 ──────────────────────────────────────────────────────── */
.analysis-banner {
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  border: 1px solid;
}
.rec-loosen-threshold { background: rgba(245,158,11,0.1); border-color: #f59e0b; }
.rec-maintain          { background: rgba(34,197,94,0.1);  border-color: #22c55e; }
.rec-tighten-threshold { background: rgba(99,102,241,0.1); border-color: #818cf8; }
.ab-conclusion { font-size: 12px; margin-bottom: 4px; }
.ab-stats { font-size: 11px; color: #94a3b8; }
.ab-stats strong { color: #e2e8f0; }

.capacity-guard-run-banner {
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  border: 1px solid;
}
.capacity-guard-run-title {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
}
.capacity-guard-run-body {
  font-size: 11px;
  color: #cbd5e1;
}
.cg-run-success {
  background: rgba(34,197,94,0.1);
  border-color: rgba(34,197,94,0.4);
}
.cg-run-neutral {
  background: rgba(59,130,246,0.1);
  border-color: rgba(59,130,246,0.35);
}
.cg-run-warning {
  background: rgba(245,158,11,0.1);
  border-color: rgba(245,158,11,0.4);
}

/* ── L2 持仓满载诊断横幅 ───────────────────────────────────────────────── */
.l2-capacity-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.45);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
}
.l2-alert-icon { font-size: 18px; line-height: 1.4; flex-shrink: 0; }
.l2-alert-body { display: flex; flex-direction: column; gap: 3px; }
.l2-alert-body strong { color: #fca5a5; font-size: 13px; }
.l2-alert-detail { font-size: 11px; color: #94a3b8; }
.l2-alert-detail strong { color: #f87171; }

/* ── 容量守卫动作摘要 ───────────────────────────────────────────────────── */
.capacity-guard-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 640px) {
  .capacity-guard-summary { grid-template-columns: 1fr; }
}
.capacity-guard-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(30,41,59,0.6);
  border: 1px solid rgba(100,116,139,0.25);
}
.cg-label {
  font-size: 11px;
  color: #94a3b8;
}
.capacity-guard-metric strong {
  font-size: 18px;
  color: #e2e8f0;
}
.capacity-guard-last-run strong {
  font-size: 13px;
}
.capacity-guard-table td,
.capacity-guard-table th {
  white-space: nowrap;
}
.empty-guard-state {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(30,41,59,0.4);
  border: 1px dashed rgba(100,116,139,0.35);
  color: #94a3b8;
  font-size: 12px;
}
.cg-status-pending,
.cg-status-done,
.cg-status-failed,
.cg-status-neutral {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.cg-status-pending {
  color: #93c5fd;
  background: rgba(59,130,246,0.18);
  border: 1px solid rgba(59,130,246,0.35);
}
.cg-status-done {
  color: #86efac;
  background: rgba(34,197,94,0.16);
  border: 1px solid rgba(34,197,94,0.35);
}
.cg-status-failed {
  color: #fca5a5;
  background: rgba(239,68,68,0.14);
  border: 1px solid rgba(239,68,68,0.35);
}
.cg-status-neutral {
  color: #cbd5e1;
  background: rgba(148,163,184,0.12);
  border: 1px solid rgba(148,163,184,0.22);
}

/* ── 调参面板 ────────────────────────────────────────────────────────────── */
.config-panel {
  max-width: 680px;
  background: rgba(15,23,42,0.8);
  border: 1px solid rgba(100,116,139,0.3);
  border-radius: 12px;
  padding: 20px;
}
.config-warning {
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.4);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  color: #fcd34d;
  margin-bottom: 16px;
}
.config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 480px) { .config-grid { grid-template-columns: 1fr; } }
.config-row-item { display: flex; flex-direction: column; gap: 4px; }
.config-label { font-size: 12px; color: #94a3b8; }
.config-hint  { font-size: 10px; color: #475569; margin-left: 4px; }
.config-input {
  background: #1e293b;
  border: 1px solid rgba(100,116,139,0.4);
  color: #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  width: 100%;
}
.config-input:focus { outline: none; border-color: #3b82f6; }
.config-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
.btn-reset {
  padding: 6px 16px; background: transparent;
  border: 1px solid rgba(100,116,139,0.5); color: #94a3b8;
  border-radius: 6px; cursor: pointer; font-size: 12px;
}
.btn-apply {
  padding: 6px 20px; background: rgba(59,130,246,0.2);
  border: 1px solid #3b82f6; color: #93c5fd;
  border-radius: 6px; cursor: pointer; font-size: 12px;
}

/* 确认弹窗 */
.confirm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 999;
}
.confirm-dialog {
  background: #1e293b;
  border: 1px solid rgba(100,116,139,0.5);
  border-radius: 12px;
  padding: 24px 28px;
  min-width: 300px;
}
.cd-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.cd-body  { font-size: 12px; color: #94a3b8; margin-bottom: 18px; }
.cd-actions { display: flex; gap: 10px; justify-content: flex-end; }
.btn-cancel {
  padding: 6px 16px; background: transparent;
  border: 1px solid rgba(100,116,139,0.5); color: #94a3b8;
  border-radius: 6px; cursor: pointer; font-size: 12px;
}
.btn-confirm {
  padding: 6px 20px; background: rgba(239,68,68,0.2);
  border: 1px solid #ef4444; color: #f87171;
  border-radius: 6px; cursor: pointer; font-size: 12px;
}
</style>
