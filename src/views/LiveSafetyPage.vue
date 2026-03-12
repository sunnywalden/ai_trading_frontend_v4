<template>
  <div class="page-container">
    <SystemOperationsNav />

    <section class="section-header">
      <div>
        <h2>AI 安全</h2>
        <p>模型退化监控、数据陈旧矩阵与自主度节流；作为系统监控体系的独立二级页面运行。</p>
      </div>
      <div class="header-actions">
        <button
          class="classify-button"
          @click="triggerClassify"
          :disabled="classifying"
          title="立即触发市场体制重新分类，消除陈旧告警"
        >
          {{ classifying ? '分类中...' : '🧠 重新分类' }}
        </button>
        <button class="refresh-button" @click="loadAll" :disabled="loading">
          {{ loading ? '刷新中...' : '🔄 刷新' }}
        </button>
      </div>
    </section>

    <!-- 重新分类结果提示 -->
    <transition name="fade">
      <div v-if="classifyResult" class="classify-toast" :class="classifyResult.ok ? 'toast-ok' : 'toast-error'">
        <span class="toast-icon">{{ classifyResult.ok ? '✅' : '❌' }}</span>
        <span class="toast-msg">{{ classifyResult.message }}</span>
        <button class="toast-close" @click="classifyResult = null">✕</button>
      </div>
    </transition>

    <!-- 总体节流状态横幅 -->
    <div v-if="throttle" class="throttle-banner" :class="`banner-${bannerClass}`">
      <span class="banner-icon">{{ bannerIcon }}</span>
      <div class="banner-body">
        <div class="banner-title">
          推荐自主度：<strong>{{ throttle.recommended_level }}</strong>
          <span v-if="throttle.downgrade_needed" class="badge badge-danger">需降级</span>
          <span v-else-if="throttle.upgrade_possible" class="badge badge-ok">可升级</span>
          <span v-else class="badge badge-ok">与当前一致</span>
        </div>
        <div class="banner-reasons">
          <span v-for="(r, idx) in throttle.reasons" :key="idx" class="reason-chip">{{ r }}</span>
        </div>
      </div>
      <div class="banner-meta">
        当前：<strong>{{ throttle.current_level }}</strong>
        <span class="sep">|</span>
        <span class="as-of">{{ fmtTime(throttle.as_of) }}</span>
      </div>
    </div>

    <div v-if="tigerGatewayService" class="card tiger-status-card" :class="tigerGatewayService.degraded ? 'tiger-degraded' : 'tiger-healthy'">
      <div class="tiger-card-head">
        <div>
          <h3>📡 Tiger 历史行情通道</h3>
          <p>{{ tigerGatewayService.last_error_message || 'Tiger OHLCV 主路径健康，当前未处于冷却状态。' }}</p>
        </div>
        <span class="sev-badge" :class="`badge-sev-${tigerBadgeClass}`">{{ tigerGatewayService.status }}</span>
      </div>
      <div class="tiger-meta-row">
        <span><strong>Code:</strong> {{ tigerGatewayService.last_error_code || 'HEALTHY' }}</span>
        <span><strong>最近恢复:</strong> {{ tigerGatewayService.last_recovered_at ? fmtTime(tigerGatewayService.last_recovered_at) : '—' }}</span>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <button :class="['tab-btn', { active: tab === 'degradation' }]" @click="tab = 'degradation'">
        🧬 模型退化
      </button>
      <button :class="['tab-btn', { active: tab === 'freshness' }]" @click="tab = 'freshness'">
        🕒 数据陈旧矩阵
      </button>
    </div>

    <!-- 模型退化 Tab -->
    <div v-if="tab === 'degradation' && degradation" class="tab-content">
      <div class="overview-strip">
        <div class="ov-card" :class="`sev-${degradation.overall_severity.toLowerCase()}`">
          <div class="ov-label">综合等级</div>
          <div class="ov-value">{{ degradation.overall_severity }}</div>
        </div>
        <div class="ov-card sev-critical">
          <div class="ov-label">CRITICAL</div>
          <div class="ov-value">{{ degradation.critical_count }}</div>
        </div>
        <div class="ov-card sev-warning">
          <div class="ov-label">WARNING</div>
          <div class="ov-value">{{ degradation.warning_count }}</div>
        </div>
        <div class="ov-card sev-ok">
          <div class="ov-label">OK</div>
          <div class="ov-value">{{ degradation.ok_count }}</div>
        </div>
      </div>

      <div class="card metrics-card">
        <h3 style="margin: 0 0 16px;">退化指标明细</h3>
        <div v-if="!degradation.metrics.length" class="empty-state">暂无退化数据，系统各维度均在正常范围内。</div>
        <div v-else class="metrics-list">
          <div v-for="m in degradation.metrics" :key="m.metric_type + (m.strategy_id || '')"
               class="metric-row" :class="`sev-border-${m.severity.toLowerCase()}`">
            <div class="metric-head">
              <span class="metric-type">{{ metricLabel(m.metric_type) }}</span>
              <span v-if="m.strategy_id" class="strategy-tag">{{ m.strategy_id }}</span>
              <span class="sev-badge" :class="`badge-sev-${m.severity.toLowerCase()}`">{{ m.severity }}</span>
            </div>
            <div class="metric-bars">
              <div class="bar-row">
                <span class="bar-label">当前</span>
                <div class="bar-bg">
                  <div class="bar-fill current-fill"
                       :style="{ width: barWidth(m.current_value, m.baseline_value) }"></div>
                </div>
                <span class="bar-val">{{ fmtVal(m.metric_type, m.current_value) }}</span>
              </div>
              <div class="bar-row">
                <span class="bar-label">基线</span>
                <div class="bar-bg">
                  <div class="bar-fill baseline-fill"
                       :style="{ width: '60%' }"></div>
                </div>
                <span class="bar-val">{{ fmtVal(m.metric_type, m.baseline_value) }}</span>
              </div>
            </div>
            <div class="metric-footer">
              <span>漂移幅度：{{ fmtVal(m.metric_type, m.drift_magnitude) }}</span>
              <span class="drift-dir" :class="`dir-${m.drift_direction.toLowerCase()}`">
                {{ m.drift_direction === 'UP' ? '▲ 上升' : m.drift_direction === 'DOWN' ? '▼ 下降' : '→ 平稳' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据陈旧 Tab -->
    <div v-if="tab === 'freshness' && freshness" class="tab-content">
      <div class="overview-strip">
        <div class="ov-card" :class="`sev-${freshness.overall_status.toLowerCase()}`">
          <div class="ov-label">综合状态</div>
          <div class="ov-value">{{ freshness.overall_status }}</div>
        </div>
        <div class="ov-card" :class="freshness.freeze_new_open ? 'sev-critical' : 'sev-ok'">
          <div class="ov-label">新开仓</div>
          <div class="ov-value">{{ freshness.freeze_new_open ? '冻结' : '正常' }}</div>
        </div>
        <div class="ov-card">
          <div class="ov-label">推荐动作</div>
          <div class="ov-value" style="font-size: 13px;">{{ freshness.recommended_action }}</div>
        </div>
      </div>

      <div class="card">
        <h3 style="margin: 0 0 16px;">数据源陈旧度矩阵</h3>
        <table class="freshness-table">
          <thead>
            <tr>
              <th>数据源</th>
              <th>最后更新</th>
              <th>陈旧(h)</th>
              <th>WARNING阈值</th>
              <th>CRITICAL阈值</th>
              <th>状态</th>
              <th>CRITICAL触发动作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in freshness.matrix" :key="entry.source" :class="`row-${entry.status.toLowerCase()}`">
              <td><strong>{{ sourceLabel(entry.source) }}</strong></td>
              <td>{{ entry.last_seen ? fmtTime(entry.last_seen) : '—' }}</td>
              <td>{{ entry.age_hours != null ? entry.age_hours.toFixed(1) : '∞' }}</td>
              <td>{{ entry.warn_threshold_hours }}h</td>
              <td>{{ entry.crit_threshold_hours }}h</td>
              <td>
                <span class="sev-badge" :class="`badge-sev-${entry.status.toLowerCase()}`">
                  {{ entry.status }}
                </span>
              </td>
              <td><span class="action-chip">{{ entry.action_on_critical }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { liveSafetyApi, type DegradationReport, type FreshnessMatrix, type ThrottleStatus } from '@/api/liveSafetyService'
import { fetchSystemServiceOverview } from '@/api/systemMonitorService'
import { regimeApi } from '@/api/regimeService'
import SystemOperationsNav from '@/components/SystemOperationsNav.vue'
import type { ServiceHealthItem } from '@/types/systemMonitor'
import { CLIENT_TIME_ZONE, parseBackendDateTime } from '@/utils/datetime'
import { computed, onMounted, ref } from 'vue'

const tab = ref<'degradation' | 'freshness'>('degradation')
const loading = ref(false)
const error = ref<string | null>(null)
const classifying = ref(false)
const classifyResult = ref<{ ok: boolean; message: string } | null>(null)

const degradation = ref<DegradationReport | null>(null)
const freshness = ref<FreshnessMatrix | null>(null)
const throttle = ref<ThrottleStatus | null>(null)
const tigerGatewayService = ref<ServiceHealthItem | null>(null)

const bannerClass = computed(() => {
  if (!throttle.value) return 'ok'
  const level = throttle.value.recommended_level
  if (level === 'FREEZE' || level === 'ADVISORY') return 'critical'
  if (level === 'SEMI') return 'warning'
  return 'ok'
})

const bannerIcon = computed(() => {
  if (!throttle.value) return '🟢'
  const level = throttle.value.recommended_level
  if (level === 'FREEZE') return '🚫'
  if (level === 'ADVISORY') return '🔴'
  if (level === 'SEMI') return '🟡'
  return '🟢'
})

const tigerBadgeClass = computed(() => {
  const status = tigerGatewayService.value?.status || 'OK'
  if (status === 'CRITICAL') return 'critical'
  if (status === 'WARN') return 'warning'
  return 'ok'
})

function fmtTime(iso: string) {
  const d = parseBackendDateTime(iso)
  if (!d) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: CLIENT_TIME_ZONE,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

function metricLabel(type: string) {
  const map: Record<string, string> = {
    HIT_RATE_DRIFT: '命中率漂移',
    ECE_DRIFT: '置信度校准漂移 (ECE)',
    EXEC_COST_DRIFT: '执行成本漂移',
    BROKER_REJECT_SPIKE: '券商拒绝率突增',
    FEATURE_FRESHNESS: '特征陈旧度',
  }
  return map[type] ?? type
}

function sourceLabel(source: string) {
  const map: Record<string, string> = {
    quote_data: '行情数据',
    positions: '仓位数据',
    event_calendar: '事件日历',
    factor_snapshot: '因子快照',
    market_regime: '市场体制',
  }
  return map[source] ?? source
}

function fmtVal(type: string, val: number) {
  if (type === 'EXEC_COST_DRIFT') return val.toFixed(2) + ' bps'
  if (type === 'HIT_RATE_DRIFT' || type === 'ECE_DRIFT' || type === 'BROKER_REJECT_SPIKE') {
    return (val * 100).toFixed(1) + '%'
  }
  return val.toFixed(4)
}

function barWidth(current: number, baseline: number) {
  if (baseline === 0) return '0%'
  const ratio = Math.min(current / Math.max(baseline, 0.001), 1.5)
  return Math.min(ratio * 60, 90) + '%'
}

async function triggerClassify() {
  classifying.value = true
  classifyResult.value = null
  try {
    const res = await regimeApi.classify()
    classifyResult.value = { ok: true, message: res.data.message }
    // 同步刷新数据陈旧矩阵，让 market_regime last_seen 立即更新
    const fresh = await liveSafetyApi.getFreshness()
    freshness.value = fresh.data
  } catch (e: any) {
    classifyResult.value = {
      ok: false,
      message: e?.response?.data?.detail ?? e?.message ?? '分类触发失败',
    }
  } finally {
    classifying.value = false
  }
}

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [deg, fresh, thr, services] = await Promise.all([
      liveSafetyApi.getDegradation(),
      liveSafetyApi.getFreshness(),
      liveSafetyApi.getThrottle(),
      fetchSystemServiceOverview({ window_minutes: 60 }),
    ])
    degradation.value = deg.data
    freshness.value = fresh.data
    throttle.value = thr.data
    tigerGatewayService.value = services.services.find(item => item.service_key === 'tiger_ohlcv_gateway') || null
  } catch (e: any) {
    error.value = e?.response?.data?.detail ?? e?.message ?? '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
/* ─── Layout ─────────────────────────────────────────────────────────────── */
.section-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.section-header h2 { margin: 0 0 4px; font-size: 22px; }
.section-header p  { margin: 0; color: #9aa4bf; font-size: 14px; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.tab-bar { display: flex; gap: 8px; margin: 20px 0 0; border-bottom: 1px solid var(--border-color, #2d2d4e); }
.tab-btn { background: none; border: none; padding: 10px 20px; color: #9aa4bf; cursor: pointer; font-size: 14px; border-bottom: 2px solid transparent; }
.tab-btn.active { color: #4a90e2; border-bottom-color: #4a90e2; }
.tab-content { margin-top: 20px; }
.card { background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 20px; }
.metrics-card { margin-top: 20px; }
.refresh-button { background: rgba(74,144,226,0.12); border: 1px solid rgba(74,144,226,0.3); color: #4a90e2; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-size: 13px; }
.refresh-button:hover { background: rgba(74,144,226,0.22); }
.classify-button { background: rgba(76,175,80,0.12); border: 1px solid rgba(76,175,80,0.35); color: #81c784; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-size: 13px; }
.classify-button:hover:not(:disabled) { background: rgba(76,175,80,0.22); }
.classify-button:disabled { opacity: 0.5; cursor: not-allowed; }
.classify-toast { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 6px; margin-bottom: 12px; font-size: 13px; }
.toast-ok    { background: rgba(76,175,80,0.12);   border: 1px solid rgba(76,175,80,0.4);   color: #a5d6a7; }
.toast-error { background: rgba(255,118,117,0.12); border: 1px solid rgba(255,118,117,0.4); color: #ef9a9a; }
.toast-msg { flex: 1; }
.toast-close { background: none; border: none; color: inherit; cursor: pointer; opacity: 0.6; font-size: 14px; padding: 0 4px; line-height: 1; }
.toast-close:hover { opacity: 1; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.error-message { color: #ff7675; margin-top: 16px; font-size: 13px; }
.empty-state { color: #666; text-align: center; padding: 32px; font-size: 14px; }
.tiger-status-card { margin-top: 16px; }
.tiger-degraded { border-color: rgba(255, 193, 7, 0.35); }
.tiger-healthy { border-color: rgba(76,175,80,0.28); }
.tiger-card-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
.tiger-card-head h3 { margin: 0 0 6px; font-size: 16px; }
.tiger-card-head p { margin: 0; color: #9aa4bf; font-size: 13px; line-height: 1.6; }
.tiger-meta-row { display: flex; gap: 16px; flex-wrap: wrap; color: #c9d3ea; font-size: 12px; }

/* ─── Throttle Banner ────────────────────────────────────────────────────── */
.throttle-banner { display: flex; align-items: flex-start; gap: 16px; padding: 16px 20px; border-radius: 8px; border: 1px solid; margin-bottom: 4px; }
.banner-ok       { border-color: rgba(76, 175, 80, 0.4);  background: rgba(76, 175, 80, 0.08); }
.banner-warning  { border-color: rgba(255, 193, 7, 0.4);  background: rgba(255, 193, 7, 0.06); }
.banner-critical { border-color: rgba(255, 118, 117, 0.5); background: rgba(255, 118, 117, 0.08); }
.banner-icon { font-size: 28px; line-height: 1; flex-shrink: 0; }
.banner-body { flex: 1; }
.banner-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
.banner-reasons { display: flex; flex-wrap: wrap; gap: 6px; }
.reason-chip { background: rgba(255,255,255,0.06); border-radius: 4px; padding: 3px 8px; font-size: 12px; color: #ccc; }
.banner-meta { font-size: 12px; color: #9aa4bf; white-space: nowrap; align-self: center; }
.sep { margin: 0 6px; }
.as-of { opacity: 0.7; }

/* ─── Badges ─────────────────────────────────────────────────────────────── */
.badge { border-radius: 4px; padding: 2px 8px; font-size: 11px; margin-left: 8px; }
.badge-danger { background: rgba(255,118,117,0.18); color: #ff9f9f; }
.badge-ok     { background: rgba(76,175,80,0.18);   color: #81c784; }
.sev-badge { border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
.badge-sev-ok       { background: rgba(76,175,80,0.18);   color: #81c784; }
.badge-sev-warning  { background: rgba(255,193,7,0.18);   color: #ffca28; }
.badge-sev-critical { background: rgba(255,118,117,0.2);  color: #ff7675; }

/* ─── Overview Strip ─────────────────────────────────────────────────────── */
.overview-strip { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.ov-card { flex: 1; min-width: 120px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 14px 16px; }
.ov-label { font-size: 11px; color: #888; margin-bottom: 6px; }
.ov-value { font-size: 22px; font-weight: 700; }
.sev-ok       .ov-value { color: #4caf50; }
.sev-warning  .ov-value { color: #ffc107; }
.sev-critical .ov-value { color: #ff7675; }

/* ─── Metrics List ───────────────────────────────────────────────────────── */
.metrics-list { display: flex; flex-direction: column; gap: 12px; }
.metric-row { border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 14px 16px; }
.sev-border-ok       { border-left: 4px solid #4caf50; }
.sev-border-warning  { border-left: 4px solid #ffc107; }
.sev-border-critical { border-left: 4px solid #ff7675; }
.metric-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.metric-type { font-weight: 600; font-size: 14px; }
.strategy-tag { background: rgba(74,144,226,0.12); color: #4a90e2; border-radius: 4px; padding: 2px 8px; font-size: 11px; }
.metric-bars { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.bar-row { display: flex; align-items: center; gap: 10px; }
.bar-label { width: 32px; font-size: 11px; color: #888; }
.bar-bg { flex: 1; height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 5px; transition: width 0.4s; }
.current-fill  { background: linear-gradient(90deg, #4a90e2, #45aaf2); }
.baseline-fill { background: rgba(255,255,255,0.15); }
.bar-val { width: 80px; text-align: right; font-size: 12px; font-family: monospace; }
.metric-footer { display: flex; gap: 16px; font-size: 12px; color: #9aa4bf; }
.drift-dir { font-weight: 600; }
.dir-up   { color: #ff7675; }
.dir-down { color: #4caf50; }
.dir-none { color: #9aa4bf; }

/* ─── Freshness Table ────────────────────────────────────────────────────── */
.freshness-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.freshness-table th { padding: 10px 12px; color: #888; font-weight: 500; border-bottom: 1px solid var(--border-color, #2d2d4e); text-align: left; }
.freshness-table td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.row-critical td { background: rgba(255, 118, 117, 0.04); }
.row-warning  td { background: rgba(255, 193, 7, 0.03); }
.action-chip { background: rgba(255,255,255,0.06); border-radius: 4px; padding: 2px 8px; font-size: 11px; }
</style>
