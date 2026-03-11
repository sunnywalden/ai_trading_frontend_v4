<template>
  <div class="page-shell">
    <section class="hero-card">
      <div>
        <p class="eyebrow">Execution Policy Engine</p>
        <h2>执行策略控制台</h2>
        <p class="hero-copy">
          把意图、执行算法、预交易成本、异常和执行回放放到同一张控制台，直接回答“这笔单为什么这样下”。
        </p>
      </div>
      <div class="hero-actions">
        <select v-model="limit" class="toolbar-select" @change="loadOverview(false)">
          <option :value="12">最近 12 笔</option>
          <option :value="20">最近 20 笔</option>
          <option :value="40">最近 40 笔</option>
        </select>
        <button class="refresh-button" :disabled="loading" @click="loadOverview(true)">
          {{ loading ? '加载中...' : '刷新策略视图' }}
        </button>
      </div>
    </section>

    <section v-if="hasFocusContext" class="focus-banner">
      <div>
        <strong>跨页聚焦已启用</strong>
        <p>
          <span v-if="focusSymbol">Symbol: {{ focusSymbol }}</span>
          <span v-if="focusAction"> · Action: {{ focusAction }}</span>
          <span v-if="focusIntentId"> · Intent: {{ focusIntentId }}</span>
          <span v-if="focusOrderId"> · Order: {{ focusOrderId }}</span>
        </p>
        <div class="focus-meta" v-if="focusSourceLabel || focusMatchLabel">
          <span v-if="focusSourceLabel" class="focus-chip">{{ focusSourceLabel }}</span>
          <span v-if="focusMatchLabel" class="focus-chip accent">{{ focusMatchLabel }}</span>
        </div>
        <p v-if="focusResolutionNote" class="focus-note">{{ focusResolutionNote }}</p>
      </div>
      <button class="secondary-button" @click="clearFocus">清除聚焦</button>
    </section>

    <section class="summary-grid">
      <article class="summary-card accent-blue">
        <span class="summary-label">Control Mode</span>
        <strong class="summary-value">{{ overview?.control_state.mode ?? 'OBSERVE_ONLY' }}</strong>
        <span class="summary-foot">{{ overview?.control_state.enabled ? '策略可进入硬控制' : '当前只做观察与解释' }}</span>
      </article>
      <article class="summary-card accent-blue">
        <span class="summary-label">覆盖意图</span>
        <strong class="summary-value">{{ overview?.summary.total ?? 0 }}</strong>
        <span class="summary-foot">本次快照样本</span>
      </article>
      <article class="summary-card accent-red">
        <span class="summary-label">Forced Urgency</span>
        <strong class="summary-value">{{ overview?.summary.forced ?? 0 }}</strong>
        <span class="summary-foot">收盘/减仓/强制退出</span>
      </article>
      <article class="summary-card accent-gold">
        <span class="summary-label">高优先级</span>
        <strong class="summary-value">{{ overview?.summary.high_urgency ?? 0 }}</strong>
        <span class="summary-foot">HIGH + FORCED</span>
      </article>
      <article class="summary-card accent-green">
        <span class="summary-label">平均滑点预算</span>
        <strong class="summary-value">{{ bps(overview?.summary.avg_slippage_budget_bps) }}</strong>
        <span class="summary-foot">执行前预算约束</span>
      </article>
      <article class="summary-card accent-violet">
        <span class="summary-label">平均已实现 IS</span>
        <strong class="summary-value">{{ bps(overview?.summary.avg_realized_is_bps) }}</strong>
        <span class="summary-foot">回看真实代价</span>
      </article>
      <article class="summary-card accent-green">
        <span class="summary-label">画像覆盖率</span>
        <strong class="summary-value">{{ pct(overview?.summary.persistent_profile_coverage) }}</strong>
        <span class="summary-foot">命中长期反馈画像</span>
      </article>
      <article class="summary-card accent-gold">
        <span class="summary-label">V10.5.4 Rollout</span>
        <strong class="summary-value">{{ overview?.rollout?.stage ?? 'OBSERVE' }}</strong>
        <span class="summary-foot">{{ overview?.rollout?.policy_source ?? 'NATIVE_EXECUTION_POLICY' }}</span>
      </article>
    </section>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <section class="workspace-grid">
      <article class="panel-card">
        <div class="panel-head">
          <div>
            <h3>策略快照队列</h3>
            <p>按意图查看分配的执行算法、预算和预估成本。</p>
          </div>
        </div>

        <div class="table-wrap">
          <table class="policy-table">
            <thead>
              <tr>
                <th>标的</th>
                <th>动作</th>
                <th>算法</th>
                <th>紧急度</th>
                <th>预算</th>
                <th>已实现 IS</th>
                <th>预估总成本</th>
                <th>等级</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="empty-cell">加载中...</td>
              </tr>
              <tr v-else-if="!overview?.policies.length">
                <td colspan="8" class="empty-cell">暂无执行策略数据</td>
              </tr>
              <tr
                v-for="item in overview?.policies || []"
                :key="item.intent_id"
                class="table-row"
                :class="{ active: selectedIntentId === item.intent_id }"
                @click="selectIntent(item.intent_id)"
              >
                <td>
                  <div class="symbol-cell">
                    <strong>{{ item.symbol }}</strong>
                    <span>{{ shortTime(item.created_at) }}</span>
                  </div>
                </td>
                <td>
                  <span class="action-pill" :class="actionClass(item.action)">
                    {{ item.action }} {{ qty(item.qty) }}
                  </span>
                </td>
                <td>{{ item.policy.algo_type }}</td>
                <td>
                  <span class="urgency-pill" :class="urgencyClass(item.policy.urgency)">
                    {{ item.policy.urgency }}
                  </span>
                </td>
                <td>{{ bps(item.policy.slippage_budget_bps) }}</td>
                <td>{{ bps(item.policy.observed_total_is_bps) }}</td>
                <td>{{ bps(item.pretrade_cost.total_expected_cost_bps) }}</td>
                <td>
                  <span class="grade-pill" :class="gradeClass(item.grade)">
                    {{ item.grade || 'N/A' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel-card detail-card">
        <div class="panel-head">
          <div>
            <h3>意图明细</h3>
            <p v-if="detail">{{ detail.intent.symbol }} · {{ detail.intent.intent_id }}</p>
            <p v-if="detail?.intent.order_id" class="detail-subcopy">
              Broker Order · {{ detail.intent.order_id }}
            </p>
            <p v-else>选择左侧一笔执行意图以查看策略明细。</p>
          </div>
          <button
            v-if="detail"
            class="secondary-button"
            :disabled="detailLoading"
            @click="selectIntent(detail.intent.id)"
          >
            {{ detailLoading ? '刷新中...' : '刷新明细' }}
          </button>
        </div>

        <div v-if="detailLoading" class="detail-placeholder">正在加载明细...</div>
        <div v-else-if="!detail" class="detail-placeholder">暂无明细</div>
        <div v-else class="detail-stack">
          <section class="detail-section detail-links">
            <button class="secondary-button" @click="openExecutionMicroscope">
              查看执行显微镜
            </button>
            <button class="secondary-button" @click="openOrderBook">
              去智能订单簿
            </button>
          </section>

          <section class="detail-section metrics-strip">
            <div class="mini-metric">
              <span>控制模式</span>
              <strong>{{ detail.control_state.mode }}</strong>
            </div>
            <div class="mini-metric">
              <span>紧急度</span>
              <strong>{{ detail.policy.urgency }}</strong>
            </div>
            <div class="mini-metric">
              <span>算法</span>
              <strong>{{ detail.policy.algo_type }}</strong>
            </div>
            <div class="mini-metric">
              <span>参与率</span>
              <strong>{{ pct(detail.policy.max_participation_rate) }}</strong>
            </div>
            <div class="mini-metric">
              <span>成交率</span>
              <strong>{{ pct(detail.policy.observed_fill_rate) }}</strong>
            </div>
          </section>

          <section class="detail-section two-col">
            <div class="subpanel">
              <h4>策略约束</h4>
              <ul class="kv-list">
                <li><span>滑点预算</span><strong>{{ bps(detail.policy.slippage_budget_bps) }}</strong></li>
                <li><span>子单间隔</span><strong>{{ detail.policy.child_order_interval_seconds }}s</strong></li>
                <li><span>撤改单策略</span><strong>{{ detail.policy.cancel_replace_policy }}</strong></li>
                <li><span>限价偏移</span><strong>{{ bps(detail.policy.limit_offset_bps) }}</strong></li>
                <li><span>Closing Override</span><strong>{{ detail.policy.closing_override_policy ? 'ON' : 'OFF' }}</strong></li>
                <li><span>Policy Source</span><strong>{{ detail.policy_source || 'NATIVE_EXECUTION_POLICY' }}</strong></li>
              </ul>
            </div>
            <div class="subpanel">
              <h4>预交易成本</h4>
              <ul class="kv-list">
                <li><span>Spread</span><strong>{{ bps(detail.pretrade_cost.spread_cost_bps) }}</strong></li>
                <li><span>Delay</span><strong>{{ bps(detail.pretrade_cost.delay_cost_bps) }}</strong></li>
                <li><span>Impact</span><strong>{{ bps(detail.pretrade_cost.market_impact_bps) }}</strong></li>
                <li><span>Opportunity</span><strong>{{ bps(detail.pretrade_cost.opportunity_cost_bps) }}</strong></li>
                <li><span>Timing</span><strong>{{ bps(detail.pretrade_cost.timing_cost_bps) }}</strong></li>
              </ul>
            </div>
          </section>

          <section class="detail-section two-col" v-if="detail.feedback_profile || detail.persistent_profile">
            <div class="subpanel" v-if="detail.feedback_profile">
              <h4>反馈画像</h4>
              <ul class="kv-list">
                <li><span>Source</span><strong>{{ detail.feedback_profile.source || 'none' }}</strong></li>
                <li><span>Bias</span><strong>{{ detail.feedback_profile.feedback_bias }}</strong></li>
                <li><span>Sample</span><strong>{{ detail.feedback_profile.sample_size }}</strong></li>
                <li><span>Avg Fill</span><strong>{{ pct(detail.feedback_profile.avg_fill_rate) }}</strong></li>
                <li><span>Avg Quality</span><strong>{{ num(detail.feedback_profile.avg_quality_score) }}</strong></li>
              </ul>
            </div>
            <div class="subpanel" v-if="detail.persistent_profile">
              <h4>Persistent Profile</h4>
              <ul class="kv-list">
                <li><span>Algo</span><strong>{{ detail.persistent_profile.algo_type }}</strong></li>
                <li><span>Urgency</span><strong>{{ detail.persistent_profile.urgency_bucket }}</strong></li>
                <li><span>Sample</span><strong>{{ detail.persistent_profile.sample_size }}</strong></li>
                <li><span>Bias</span><strong>{{ detail.persistent_profile.feedback_bias }}</strong></li>
                <li><span>Limit Offset</span><strong>{{ bps(detail.persistent_profile.limit_offset_bps) }}</strong></li>
              </ul>
            </div>
          </section>

          <section class="detail-section" v-if="detail.execution_result">
            <h4>执行结果</h4>
            <div class="execution-grid">
              <div class="exec-box">
                <span>总 IS</span>
                <strong>{{ bps(detail.execution_result.total_is_bps) }}</strong>
              </div>
              <div class="exec-box">
                <span>质量分</span>
                <strong>{{ num(detail.execution_result.quality_score) }}</strong>
              </div>
              <div class="exec-box">
                <span>成交耗时</span>
                <strong>{{ detail.execution_result.time_to_fill_ms }} ms</strong>
              </div>
              <div class="exec-box">
                <span>价格偏离</span>
                <strong>{{ pxGap(detail.execution_result.arrival_price, detail.execution_result.fill_price) }}</strong>
              </div>
            </div>
          </section>

          <section class="detail-section two-col">
            <div class="subpanel">
              <h4>异常 / 解释</h4>
              <div class="exception-list">
                <div v-for="item in detail.exceptions" :key="`${item.type}-${item.message}`" class="exception-item" :class="severityClass(item.severity)">
                  <span class="exception-type">{{ item.type }}</span>
                  <p>{{ item.message }}</p>
                </div>
              </div>
            </div>
            <div class="subpanel">
              <h4>执行回放</h4>
              <div class="timeline">
                <div v-for="item in detail.timeline" :key="`${item.phase}-${item.timestamp}`" class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div>
                    <strong>{{ item.phase }}</strong>
                    <p>{{ item.label }}</p>
                    <span>{{ fullTime(item.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
    executionPolicyApi,
    type ExecutionPolicyDetailResponse,
    type ExecutionPolicyOverviewResponse,
} from '@/api/executionPolicyService'
import { formatClientDateTime } from '@/utils/datetime'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const limit = ref(20)
const loading = ref(false)
const detailLoading = ref(false)
const error = ref('')
const overview = ref<ExecutionPolicyOverviewResponse | null>(null)
const detail = ref<ExecutionPolicyDetailResponse | null>(null)
const selectedIntentId = ref<number | null>(null)
const focusResolutionNote = ref('')

const SOURCE_LABELS: Record<string, string> = {
  'order-book-row': '来源: 订单簿行级回溯',
  'order-book': '来源: 智能订单簿',
  'execution-policy': '来源: 执行策略控制台',
  'execution-microscope': '来源: 执行显微镜',
}

function queryString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function queryNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const focusSymbol = computed(() => queryString(route.query.symbol).toUpperCase())
const focusAction = computed(() => queryString(route.query.action).toUpperCase())
const focusIntentId = computed(() => queryNumber(route.query.intentId))
const focusOrderId = computed(() => queryString(route.query.orderId))
const focusSource = computed(() => queryString(route.query.source))
const hasFocusContext = computed(
  () => Boolean(
    focusSymbol.value
      || focusAction.value
      || focusIntentId.value
      || focusOrderId.value,
  ),
)
const focusSourceLabel = computed(
  () => SOURCE_LABELS[focusSource.value] || '',
)
const focusMatchLabel = computed(() => {
  if (focusIntentId.value) return '命中方式: Intent 精确定位'
  const matchMode = overview.value?.lookup?.match_mode
  if (matchMode === 'order_id') return '命中方式: Broker Order 精确定位'
  if (matchMode === 'fallback_filters') {
    return '命中方式: Broker Order 未命中，已回退筛选'
  }
  if (matchMode === 'not_found') return '命中方式: Broker Order 未命中'
  if (focusOrderId.value) return '命中方式: Broker Order 查询'
  if (focusSymbol.value || focusAction.value) {
    return '命中方式: Symbol/Action 聚焦'
  }
  return ''
})

function bps(value: number | null | undefined) {
  return `${Number(value || 0).toFixed(1)} bps`
}

function pct(value: number | null | undefined) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`
}

function qty(value: number | null | undefined) {
  return Number(value || 0).toFixed(0)
}

function num(value: number | null | undefined) {
  return Number(value || 0).toFixed(1)
}

function shortTime(value: string | null) {
  return formatClientDateTime(value)
}

function fullTime(value: string | null) {
  return formatClientDateTime(value)
}

function pxGap(arrival: number, fill: number) {
  const gap = Number(fill || 0) - Number(arrival || 0)
  return gap >= 0 ? `+${gap.toFixed(3)}` : gap.toFixed(3)
}

function actionClass(action: string) {
  return ['SELL', 'EXIT', 'REDUCE'].includes(action) ? 'sell' : 'buy'
}

function urgencyClass(urgency: string) {
  if (urgency === 'FORCED') return 'forced'
  if (urgency === 'HIGH') return 'high'
  if (urgency === 'MEDIUM') return 'medium'
  return 'low'
}

function gradeClass(grade: string | null) {
  if (!grade) return 'grade-na'
  return `grade-${grade.toLowerCase()}`
}

function severityClass(severity: string) {
  return `severity-${severity.toLowerCase()}`
}

function getRequestErrorMessage(err: any, scope: 'detail' | 'overview') {
  const status = Number(err?.response?.status || 0)
  const suffix = scope === 'detail' ? '明细' : '总览'

  if (!status) {
    return '执行策略接口暂时不可达；请检查当前站点与 API 域名配置、反向代理或跨域设置后重试。'
  }

  if (status === 401) {
    return '登录状态已失效，请重新登录后再查看执行策略。'
  }

  if (status === 403) {
    return '当前账号无权查看执行策略数据。'
  }

  if (status === 404) {
    return scope === 'detail'
      ? '未找到对应的执行意图，可能已被清理或当前筛选结果已变化。'
      : '未找到可展示的执行策略数据。'
  }

  if (status >= 500) {
    return `执行策略${suffix}暂时不可用，后端服务返回了 ${status} 错误。`
  }

  return `执行策略${suffix}加载失败（HTTP ${status}）。`
}

function clearFocus() {
  router.replace({ path: '/execution-policy' })
}

function openExecutionMicroscope() {
  if (!detail.value) return
  router.push({
    path: '/observability/execution',
    query: {
      symbol: detail.value.intent.symbol,
      intentId: String(detail.value.intent.id),
      orderId: detail.value.intent.order_id || focusOrderId.value || undefined,
      matchMode: overview.value?.lookup?.match_mode || undefined,
      upstreamSource: focusSource.value || undefined,
      source: 'execution-policy',
    },
  })
}

function openOrderBook() {
  if (!detail.value) return
  router.push({
    path: '/order-book',
    query: {
      symbol: detail.value.intent.symbol,
      action: detail.value.intent.action,
      intentId: String(detail.value.intent.id),
      orderId: detail.value.intent.order_id || focusOrderId.value || undefined,
      matchMode: overview.value?.lookup?.match_mode || undefined,
      upstreamSource: focusSource.value || undefined,
      source: 'execution-policy',
    },
  })
}

async function selectIntent(intentId: number) {
  selectedIntentId.value = intentId
  detailLoading.value = true
  try {
    const { data } = await executionPolicyApi.getDetail(intentId)
    detail.value = data
  } catch (err) {
    error.value = getRequestErrorMessage(err, 'detail')
  } finally {
    detailLoading.value = false
  }
}

async function loadOverview(refreshDetail: boolean) {
  loading.value = true
  error.value = ''
  focusResolutionNote.value = ''
  try {
    const { data } = await executionPolicyApi.getOverview(limit.value, {
      symbol: focusSymbol.value || undefined,
      action: focusAction.value || undefined,
      orderId: focusOrderId.value || undefined,
    })
    overview.value = data

    const nextIntentId = (
      focusIntentId.value
      ?? selectedIntentId.value
      ?? data.policies[0]?.intent_id
      ?? null
    )

    if (focusIntentId.value) {
      focusResolutionNote.value = '当前明细由 execution intent id 直接定位。'
    } else if (focusOrderId.value && data.lookup?.match_mode === 'order_id') {
      focusResolutionNote.value = `当前明细由 Broker Order ${focusOrderId.value} 精确命中。`
    } else if (
      focusOrderId.value
      && data.lookup?.match_mode === 'fallback_filters'
    ) {
      focusResolutionNote.value = `未找到 Broker Order ${focusOrderId.value} 的精确命中，当前由后端回退到 Symbol/Action 筛选结果。`
    } else if (focusOrderId.value && data.lookup?.match_mode === 'not_found') {
      focusResolutionNote.value = `未找到 Broker Order ${focusOrderId.value} 对应的执行策略。`
    } else if (focusSymbol.value || focusAction.value) {
      focusResolutionNote.value = '当前列表按 Symbol/Action 聚焦。'
    }

    if (!nextIntentId) {
      detail.value = null
      selectedIntentId.value = null
      return
    }

    const stillExists = data.policies.some((item) => item.intent_id === nextIntentId)
    const resolvedIntentId = stillExists ? nextIntentId : data.policies[0].intent_id
    if (refreshDetail || resolvedIntentId !== selectedIntentId.value || !detail.value) {
      await selectIntent(resolvedIntentId)
    } else {
      selectedIntentId.value = resolvedIntentId
    }
  } catch (err) {
    error.value = getRequestErrorMessage(err, 'overview')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOverview(true)
})

watch(
  () => [
    route.query.symbol,
    route.query.action,
    route.query.intentId,
    route.query.orderId,
    route.query.source,
  ],
  () => {
    loadOverview(true)
  },
)
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(60, 106, 255, 0.18), transparent 28%),
    radial-gradient(circle at left center, rgba(255, 168, 76, 0.14), transparent 22%),
    linear-gradient(180deg, #08111f 0%, #0f1728 52%, #131c2d 100%);
  color: #e7edf7;
}

.hero-card,
.panel-card,
.summary-card {
  border: 1px solid rgba(154, 171, 198, 0.18);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(10px);
}

.hero-card {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  padding: 24px 26px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(18, 33, 57, 0.94), rgba(24, 46, 75, 0.86));
}

.eyebrow {
  margin: 0 0 8px;
  color: #7fb2ff;
  letter-spacing: 0.18em;
  font-size: 12px;
  text-transform: uppercase;
}

.hero-card h2 {
  margin: 0;
  font-size: 34px;
  line-height: 1.1;
}

.hero-copy {
  max-width: 760px;
  margin: 12px 0 0;
  color: #aebbd1;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: start;
  gap: 12px;
}

.toolbar-select,
.refresh-button,
.secondary-button {
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
}

.toolbar-select {
  background: rgba(9, 17, 31, 0.9);
  border: 1px solid rgba(127, 178, 255, 0.28);
  color: #ecf3ff;
}

.refresh-button,
.secondary-button {
  border: 1px solid rgba(127, 178, 255, 0.32);
  background: linear-gradient(135deg, rgba(58, 116, 255, 0.24), rgba(37, 78, 179, 0.18));
  color: #e9f1ff;
  cursor: pointer;
}

.refresh-button:disabled,
.secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(11, 20, 35, 0.82);
}

.summary-label {
  color: #93a5c3;
  font-size: 12px;
}

.summary-value {
  font-size: 28px;
}

.summary-foot {
  color: #6d7f9d;
  font-size: 12px;
}

.accent-blue { border-color: rgba(94, 146, 255, 0.35); }
.accent-red { border-color: rgba(255, 115, 115, 0.35); }
.accent-gold { border-color: rgba(255, 193, 92, 0.35); }
.accent-green { border-color: rgba(68, 201, 155, 0.35); }
.accent-violet { border-color: rgba(179, 126, 255, 0.35); }

.error-banner {
  margin: 0 0 18px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 116, 116, 0.35);
  background: rgba(97, 25, 35, 0.4);
  color: #ffd2d2;
}

.focus-banner {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(127, 178, 255, 0.25);
  background: rgba(18, 38, 67, 0.78);
}

.focus-banner p {
  margin: 6px 0 0;
  color: #aac0df;
}

.focus-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.focus-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(127, 178, 255, 0.28);
  background: rgba(57, 91, 146, 0.24);
  color: #edf4ff;
  font-size: 12px;
  font-weight: 600;
}

.focus-chip.accent {
  border-color: rgba(255, 193, 92, 0.32);
  background: rgba(116, 86, 25, 0.34);
  color: #fff4d6;
}

.focus-note {
  margin: 10px 0 0;
  color: #d6e4f8;
  font-size: 12px;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.9fr);
  gap: 18px;
}

.panel-card {
  border-radius: 22px;
  padding: 20px;
  background: rgba(9, 17, 31, 0.78);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
  margin-bottom: 16px;
}

.panel-head h3,
.subpanel h4 {
  margin: 0;
}

.panel-head p,
.subpanel p {
  margin: 6px 0 0;
  color: #8ea1be;
}

.detail-subcopy {
  margin-top: 4px;
  color: #d9e7fb !important;
  font-size: 12px;
}

.table-wrap {
  overflow: auto;
}

.policy-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 820px;
}

.policy-table th,
.policy-table td {
  padding: 12px 10px;
  border-bottom: 1px solid rgba(154, 171, 198, 0.12);
  text-align: left;
  font-size: 13px;
}

.policy-table th {
  color: #8da2c4;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.table-row {
  cursor: pointer;
  transition: background-color 0.18s ease;
}

.table-row:hover,
.table-row.active {
  background: rgba(52, 88, 150, 0.22);
}

.symbol-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.symbol-cell span {
  color: #7184a5;
  font-size: 12px;
}

.action-pill,
.urgency-pill,
.grade-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.action-pill.buy { background: rgba(39, 103, 77, 0.7); color: #effff7; }
.action-pill.sell { background: rgba(130, 43, 54, 0.82); color: #fff1f1; }
.urgency-pill.forced { background: rgba(130, 43, 54, 0.82); color: #fff1f1; }
.urgency-pill.high { background: rgba(112, 79, 18, 0.88); color: #fff7df; }
.urgency-pill.medium { background: rgba(42, 72, 130, 0.88); color: #eef5ff; }
.urgency-pill.low { background: rgba(26, 92, 71, 0.78); color: #effff7; }
.grade-pill.grade-a { background: rgba(26, 92, 71, 0.78); color: #effff7; }
.grade-pill.grade-b { background: rgba(31, 84, 91, 0.82); color: #efffff; }
.grade-pill.grade-c { background: rgba(112, 79, 18, 0.88); color: #fff7df; }
.grade-pill.grade-d,
.grade-pill.grade-f,
.grade-pill.grade-na { background: rgba(130, 43, 54, 0.82); color: #fff1f1; }

.detail-card {
  min-height: 720px;
}

.detail-placeholder {
  display: grid;
  place-items: center;
  min-height: 220px;
  color: #7084a7;
  border: 1px dashed rgba(154, 171, 198, 0.18);
  border-radius: 18px;
}

.detail-stack {
  display: grid;
  gap: 16px;
}

.detail-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-section {
  border: 1px solid rgba(154, 171, 198, 0.12);
  border-radius: 18px;
  padding: 16px;
  background: rgba(13, 23, 40, 0.65);
}

.metrics-strip,
.two-col,
.execution-grid {
  display: grid;
  gap: 12px;
}

.metrics-strip {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mini-metric,
.exec-box {
  padding: 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
}

.mini-metric span,
.exec-box span,
.kv-list span {
  color: #8ea1be;
  font-size: 12px;
}

.mini-metric strong,
.exec-box strong {
  display: block;
  margin-top: 6px;
  font-size: 20px;
}

.execution-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 12px;
}

.subpanel {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  padding: 14px;
}

.kv-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
}

.kv-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(154, 171, 198, 0.08);
}

.kv-list li:last-child {
  border-bottom: 0;
}

.exception-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.exception-item {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(154, 171, 198, 0.14);
}

.exception-item p {
  margin: 6px 0 0;
  line-height: 1.6;
}

.exception-type {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.severity-info { background: rgba(87, 109, 145, 0.12); }
.severity-medium { background: rgba(255, 193, 92, 0.12); }
.severity-high { background: rgba(255, 122, 122, 0.12); }

.timeline {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.timeline-item p {
  margin: 4px 0;
  color: #a4b3cb;
}

.timeline-item span {
  color: #6f84a6;
  font-size: 12px;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6ea8ff, #ffbf66);
  box-shadow: 0 0 0 4px rgba(110, 168, 255, 0.12);
}

.empty-cell {
  text-align: center;
  color: #6f84a6;
}

@media (max-width: 1280px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .workspace-grid,
  .two-col,
  .execution-grid,
  .metrics-strip {
    grid-template-columns: 1fr;
  }

  .detail-card {
    min-height: auto;
  }
}

@media (max-width: 900px) {
  .page-shell {
    padding: 16px;
  }

  .hero-card {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>