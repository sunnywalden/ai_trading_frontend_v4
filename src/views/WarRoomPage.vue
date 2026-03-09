<template>
  <div
    class="war-room"
    :class="{ fullscreen: isFullscreen }"
    tabindex="0"
    @keydown="onKeyDown"
    ref="rootEl"
  >
    <!-- 顶部状态栏 -->
    <div class="wr-topbar">
      <div class="wr-title">⚔️ WAR ROOM</div>
      <div class="wr-clock">{{ clock }}</div>
      <div class="wr-stats">
        <span :class="totalPnL >= 0 ? 'pnl-pos' : 'pnl-neg'">
          P&L {{ totalPnL >= 0 ? '+' : '' }}{{ totalPnL.toFixed(0) }}
        </span>
        <span class="alert-count" v-if="store.unreadAlertsCount > 0">
          🔔 {{ store.unreadAlertsCount }}
        </span>
        <span class="crit-count" v-if="store.criticalAlerts.length > 0">
          🔴 CRIT {{ store.criticalAlerts.length }}
        </span>
        <span class="ai-paused-badge" v-if="autonomy.isPaused">⏸ AI PAUSED</span>
      </div>
      <div class="wr-controls">
        <span class="hotkey-hint">W=全屏 R=刷新 A=警报 P=暂停AI ` =Copilot 1-6=跳转 Esc=退出</span>
        <button class="wr-btn" @click="showConfigDrawer = true" title="面板配置">⚙️</button>
        <button class="wr-btn" @click="toggleFullscreen">{{ isFullscreen ? '⊡' : '⊞' }}</button>
        <button class="wr-btn" @click="manualRefresh">↺</button>
      </div>
    </div>

    <!-- 六面板网格（动态面板类型）-->
    <div class="wr-grid">
      <div
        v-for="(panelType, idx) in panelLayout"
        :key="idx"
        class="wr-panel"
        :class="{ focused: focusedPanel === idx + 1 }"
        :id="`panel-${idx + 1}`"
        @click="focusedPanel = idx + 1"
      >
        <!-- 面板内容按类型渲染 -->
        <template v-if="panelType === 'PNL_DETAIL'">
          <div class="wp-title">📊 P{{ idx + 1 }} · 实时 P&L Ticker</div>
          <div class="ticker-list">
            <div v-if="!store.exposure?.positions?.length" class="empty">暂无持仓</div>
            <div v-else v-for="t in store.exposure.positions" :key="t.symbol" class="ticker-row">
              <span class="t-symbol">{{ t.symbol }}</span>
              <span class="t-dir" :class="t.direction === 'long' ? 'long' : 'short'">{{ t.direction === 'long' ? '多' : '空' }}</span>
              <span class="t-qty">{{ t.quantity }}</span>
              <span class="t-pnl" :class="t.unrealized_pnl >= 0 ? 'good' : 'bad'">
                {{ t.unrealized_pnl >= 0 ? '+' : '' }}{{ t.unrealized_pnl?.toFixed(0) }}
              </span>
              <span class="t-pct" :class="(t.unrealized_pnl_pct ?? 0) >= 0 ? 'good' : 'bad'">
                {{ t.unrealized_pnl_pct?.toFixed(2) }}%
              </span>
            </div>
          </div>
        </template>

        <template v-else-if="panelType === 'INTEL_FEED'">
          <div class="wp-title">📡 P{{ idx + 1 }} · 情报流</div>
          <div class="feed-filters">
            <button v-for="cat in FEED_CATS" :key="cat" class="feed-filter-btn"
              :class="{ active: feedFilter === cat }"
              @click.stop="setFeedFilter(cat)">{{ cat }}</button>
          </div>
          <div class="feed-list">
            <div v-if="store.loadingFeed" class="empty">更新中...</div>
            <div v-else-if="!store.feed.length" class="empty">暂无情报</div>
            <div v-else v-for="item in filteredFeed" :key="item.id" class="feed-item" :class="`category-${item.category}`">
              <div class="fi-header">
                <span class="fi-cat">{{ item.category }}</span>
                <span class="fi-urgency" :style="{ color: urgencyColor(item.urgency_score) }">
                  ▲{{ item.urgency_score.toFixed(0) }}
                </span>
                <span class="fi-time">{{ fmtTs(item.created_at) }}</span>
              </div>
              <div class="fi-title">{{ item.title }}</div>
              <div class="fi-body">{{ item.content }}</div>
            </div>
          </div>
        </template>

        <template v-else-if="panelType === 'FACTOR_EXPOSURE'">
          <div class="wp-title">⚡ P{{ idx + 1 }} · 因子敞口</div>
          <div :ref="el => setChartEl('radar', idx, el)" class="chart-container" />
          <div class="exposure-metrics" v-if="store.exposure">
            <div class="em-row" v-if="store.exposure.latest_snapshot">
              <span>ES@97.5%</span><span class="danger">{{ store.exposure.latest_snapshot.es_97_5?.toFixed(2) }}%</span>
            </div>
            <div class="em-row" v-if="store.exposure.latest_snapshot">
              <span>相关性</span>
              <span :class="(store.exposure.latest_snapshot.avg_pairwise_corr ?? 0) > 0.65 ? 'danger' : 'warn'">
                {{ store.exposure.latest_snapshot.avg_pairwise_corr?.toFixed(3) }}
                {{ store.exposure.latest_snapshot.correlation_spike ? ' ⚠️' : '' }}
              </span>
            </div>
          </div>
        </template>

        <template v-else-if="panelType === 'SMART_ALERTS'">
          <div class="wp-title">🚨 P{{ idx + 1 }} · 智能警报</div>
          <div class="alert-stats-row" v-if="store.alertStats">
            <div class="as-item crit"><span>CRIT</span><span>{{ store.alertStats.critical ?? 0 }}</span></div>
            <div class="as-item high"><span>HIGH</span><span>{{ store.alertStats.high ?? 0 }}</span></div>
            <div class="as-item med"><span>MED</span><span>{{ store.alertStats.medium ?? 0 }}</span></div>
            <div class="as-item low"><span>LOW</span><span>{{ store.alertStats.low ?? 0 }}</span></div>
          </div>
          <div class="alerts-list">
            <div v-if="store.loadingAlerts" class="empty">加载中...</div>
            <div v-else-if="!store.alerts.length" class="empty">暂无警报</div>
            <div v-else v-for="a in store.alerts.filter((x) => !x.dismissed)" :key="a.id"
              class="alert-item" :class="`grade-${a.grade}`">
              <div class="ai-header">
                <span class="ai-grade">{{ a.grade }}</span>
                <span class="ai-type">{{ a.alert_type }}</span>
                <div class="ai-actions">
                  <button v-if="!a.acknowledged" @click.stop="store.ackAlert(String(a.id))" class="ack-btn">✓</button>
                  <button @click.stop="store.dsmAlert(String(a.id))" class="dsm-btn">✕</button>
                </div>
              </div>
              <div class="ai-content">{{ a.content }}</div>
              <div class="ai-action">→ {{ a.recommended_action_text }}</div>
            </div>
          </div>
        </template>

        <template v-else-if="panelType === 'FACTOR_WEIGHTS'">
          <div class="wp-title">⚖️ P{{ idx + 1 }} · 当前因子权重</div>
          <div :ref="el => setChartEl('weights', idx, el)" class="chart-container" />
        </template>

        <template v-else-if="panelType === 'AGENT_BRIEF'">
          <div class="wp-title">🤖 P{{ idx + 1 }} · Agent 最新建议</div>
          <div v-if="!latestRun" class="empty">暂无 Agent 运行结果</div>
          <div v-else class="agent-summary">
            <div class="as-symbol">{{ latestRun.symbol }}</div>
            <div class="as-rec" :class="recCss(latestRun.final_recommendation)">{{ latestRun.final_recommendation }}</div>
            <div class="as-conf">置信度 {{ ((latestRun.confidence ?? 0) * 100).toFixed(1) }}%</div>
            <div class="as-time">{{ fmtTs(latestRun.created_at) }}</div>
            <div class="as-msgs" v-if="latestRun.message_count">{{ latestRun.message_count }} 条 Agent 消息</div>
          </div>
          <div class="panel-divider" />
          <div class="wp-subtitle">📋 最近运行列表</div>
          <div v-for="run in recentRuns" :key="run.run_id" class="mini-run">
            <span class="mr-symbol">{{ run.symbol }}</span>
            <span :class="recCss(run.final_recommendation)" class="mr-rec">{{ run.final_recommendation }}</span>
            <span class="mr-time">{{ fmtTs(run.created_at) }}</span>
          </div>
        </template>

        <!-- 规划中面板类型占位 -->
        <template v-else-if="panelType === 'SIGNAL_BUDGET'">
          <!-- V10.4.2: 信号配额小组件 -->
          <SignalBudgetWidget style="height:100%;box-sizing:border-box;border-radius:0;" />
        </template>

        <!-- 其他未实现面板占位 -->
        <template v-else>
          <div class="wp-title">🔧 P{{ idx + 1 }} · {{ PANEL_LABELS[panelType] }}</div>
          <div class="empty placeholder-panel">
            <div class="ph-icon">🚧</div>
            <div>{{ PANEL_LABELS[panelType] }}</div>
            <div class="ph-sub">即将上线</div>
          </div>
        </template>
      </div>
    </div>

    <!-- ⚙️ 面板配置抽屉 -->
    <transition name="drawer-slide">
      <div v-if="showConfigDrawer" class="config-drawer-overlay" @click.self="closeConfigDrawer">
        <div class="config-drawer">
          <div class="drawer-header">
            <span class="drawer-title">⚙️ 面板布局配置</span>
            <button class="drawer-close" @click="closeConfigDrawer">✕</button>
          </div>
          <p class="drawer-hint">为 6 个面板槽位选择要显示的内容类型，配置自动保存至本地。</p>
          <div class="drawer-slots">
            <div v-for="(slot, idx) in panelLayoutDraft" :key="idx" class="drawer-slot">
              <div class="slot-label">面板 P{{ idx + 1 }}</div>
              <select
                :value="slot"
                @change="onPanelTypeChange(idx, $event)"
                class="slot-select"
              >
                <option v-for="pt in ALL_PANEL_TYPES" :key="pt" :value="pt">{{ PANEL_LABELS[pt] }}</option>
              </select>
            </div>
          </div>
          <div class="drawer-actions">
            <button class="btn-apply" @click="applyPanelLayout">✓ 应用布局</button>
            <button class="btn-reset" @click="resetPanelLayout">↺ 恢复默认</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- P键暂停确认对话框 -->
    <transition name="fade">
      <div v-if="showPauseConfirm" class="pause-overlay" @click.self="showPauseConfirm = false">
        <div class="pause-modal">
          <div class="pm-icon">{{ autonomy.isPaused ? '▶️' : '⏸' }}</div>
          <div class="pm-title">{{ autonomy.isPaused ? '恢复 AI 自主引擎' : '暂停 AI 自主引擎' }}</div>
          <div class="pm-body">
            {{ autonomy.isPaused
              ? 'AI 引擎将立即恢复自主决策，当前所有挂起计划将被重新调度。'
              : '所有自主交易计划将立即暂停。已提交的板块订单不受影响。' }}
          </div>
          <div class="pm-actions">
            <button class="pm-confirm" @click="confirmPauseToggle">
              {{ autonomy.isPaused ? '确认恢复' : '确认暂停' }}
            </button>
            <button class="pm-cancel" @click="showPauseConfirm = false">取消</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import SignalBudgetWidget from '@/components/SignalBudgetWidget.vue'; // V10.4.2
import { useAiHubStore } from '@/stores/aiHub'
import { useAutonomyStore } from '@/stores/autonomy'
import { useWarRoomStore } from '@/stores/warRoom'
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

// ── 面板类型定义（设计文档 V10.4 8-type spec）
type PanelType = 'PNL_DETAIL' | 'INTEL_FEED' | 'FACTOR_EXPOSURE' | 'SMART_ALERTS' | 'FACTOR_WEIGHTS' | 'AGENT_BRIEF' | 'SECTOR_HEATMAP' | 'RISK_GAUGES' | 'SIGNAL_PULSE' | 'EXEC_QUEUE' | 'ORDER_BOOK_MINI' | 'SIGNAL_BUDGET'

const ALL_PANEL_TYPES: PanelType[] = [
  'PNL_DETAIL', 'INTEL_FEED', 'FACTOR_EXPOSURE', 'SMART_ALERTS',
  'FACTOR_WEIGHTS', 'AGENT_BRIEF', 'SECTOR_HEATMAP', 'RISK_GAUGES',
  'SIGNAL_PULSE', 'EXEC_QUEUE', 'ORDER_BOOK_MINI', 'SIGNAL_BUDGET',
]

const PANEL_LABELS: Record<PanelType, string> = {
  PNL_DETAIL:      '实时 P&L Ticker',
  INTEL_FEED:      '情报流',
  FACTOR_EXPOSURE: '因子敞口快照',
  SMART_ALERTS:    '智能警报中心',
  FACTOR_WEIGHTS:  '因子权重仪表盘',
  AGENT_BRIEF:     'Agent 最新建议',
  SECTOR_HEATMAP:  '板块热力图',
  RISK_GAUGES:     '风险仪表盘',
  SIGNAL_PULSE:    '信号脉冲',
  EXEC_QUEUE:      '执行队列',
  ORDER_BOOK_MINI: '迷你订单簿',
  SIGNAL_BUDGET:   '信号配额 (V10.4.2)',  // V10.4.2
}

const DEFAULT_LAYOUT: PanelType[] = [
  'PNL_DETAIL', 'INTEL_FEED', 'FACTOR_EXPOSURE',
  'SMART_ALERTS', 'FACTOR_WEIGHTS', 'AGENT_BRIEF',
]
const LAYOUT_LS_KEY = 'war_room_panel_layout_v1'

function loadLayout(): PanelType[] {
  try {
    const raw = localStorage.getItem(LAYOUT_LS_KEY)
    if (!raw) return [...DEFAULT_LAYOUT]
    const parsed = JSON.parse(raw) as PanelType[]
    if (Array.isArray(parsed) && parsed.length === 6) return parsed
  } catch {}
  return [...DEFAULT_LAYOUT]
}

const store = useWarRoomStore()
const aiHub = useAiHubStore()
const autonomy = useAutonomyStore()

const rootEl = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const focusedPanel = ref(0)
const clock = ref('')
const feedFilter = ref('ALL')
const showPauseConfirm = ref(false)
const showConfigDrawer = ref(false)

// Panel layout
const panelLayout = ref<PanelType[]>(loadLayout())
const panelLayoutDraft = ref<PanelType[]>([...panelLayout.value])

// Dynamic chart element refs via callback ref
const chartEls = ref<Record<string, HTMLElement | null>>({})
const chartInstances = new Map<string, echarts.ECharts>()

function setChartEl(
  type: 'radar' | 'weights',
  idx: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  el: any,
) {
  chartEls.value[`${type}_${idx}`] = el instanceof HTMLElement ? el : null
}

let clockTimer: ReturnType<typeof setInterval> | null = null

const FEED_CATS = ['ALL', 'DECISION', 'RISK', 'EVENT', 'SIGNAL']
const DIMS = ['technical', 'fundamental', 'ml', 'sentiment', 'macro', 'event']
const DIM_LABELS = { technical: '技术', fundamental: '基本', ml: 'ML', sentiment: '情绪', macro: '宏观', event: '事件' } as Record<string, string>
const DIM_COLORS = ['#00ff88', '#ff6b35', '#ffd700', '#a8dadc', '#c77dff', '#4dffb8']
const FACTOR_EXPOSURE_MIN = 0
const FACTOR_EXPOSURE_MAX = 2
const FACTOR_EXPOSURE_INTERVAL = 0.5

const totalPnL = computed(() => store.totalUnrealizedPnL)
const filteredFeed = computed(() => feedFilter.value === 'ALL' ? store.feed : store.feed.filter((f) => f.category === feedFilter.value))
const latestRun = computed(() => aiHub.agentRuns[0] ?? null)
const recentRuns = computed(() => aiHub.agentRuns.slice(1, 5))

function urgencyColor(v: number) {
  if (v > 80) return '#ff4444'
  if (v > 50) return '#ffd700'
  return '#00ff88'
}

function recCss(r: string | null | undefined) {
  if (!r) return ''
  if (r.includes('BUY')) return 'rec-buy'
  if (r.includes('SELL')) return 'rec-sell'
  return 'rec-hold'
}

function fmtTs(ts: string | null) { return ts ? new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '' }
function setFeedFilter(cat: string) { feedFilter.value = cat }

function onPanelTypeChange(idx: number, event: Event) {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  panelLayoutDraft.value[idx] = target.value as PanelType
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) document.body.classList.add('war-room-fullscreen')
  else document.body.classList.remove('war-room-fullscreen')
}

// ── 键盘快捷键（完整 spec: W/Esc/R/A/1-6/`/P）
function onKeyDown(e: KeyboardEvent) {
  const key = e.key.toUpperCase()
  // 配置抽屉/暂停弹窗打开时忽略大部分快捷键
  if (showConfigDrawer.value || showPauseConfirm.value) {
    if (key === 'ESCAPE') { showConfigDrawer.value = false; showPauseConfirm.value = false }
    return
  }
  if (key === 'W') { toggleFullscreen(); e.preventDefault() }
  else if (key === 'ESCAPE') { isFullscreen.value = false; document.body.classList.remove('war-room-fullscreen') }
  else if (key === 'R') manualRefresh()
  else if (key === 'A') focusedPanel.value = 4
  else if (key === 'P') { showPauseConfirm.value = true; e.preventDefault() }
  else if (e.key === '`') {
    // ` 键唤起全局 Copilot
    e.preventDefault()
    globalThis.dispatchEvent(new CustomEvent('copilot:open', { detail: { context: 'war-room' } }))
  }
  else if (['1','2','3','4','5','6'].includes(key)) {
    focusedPanel.value = Number.parseInt(key, 10)
    document.getElementById(`panel-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

async function confirmPauseToggle() {
  if (autonomy.isPaused) {
    await autonomy.resume()
  } else {
    await autonomy.pause()
  }
  showPauseConfirm.value = false
}

async function manualRefresh() {
  try {
    await Promise.all([store.fetchSnapshot(), store.fetchAlerts()])
    await nextTick()
    renderAllCharts()
  } catch (error) {
    console.error('[WarRoom] manualRefresh', error)
  }
}

// ── 面板配置抽屉操作
function closeConfigDrawer() {
  panelLayoutDraft.value = [...panelLayout.value]
  showConfigDrawer.value = false
}

function applyPanelLayout() {
  panelLayout.value = [...panelLayoutDraft.value]
  try { localStorage.setItem(LAYOUT_LS_KEY, JSON.stringify(panelLayout.value)) } catch {}
  showConfigDrawer.value = false
  nextTick(() => renderAllCharts())
}

function resetPanelLayout() {
  panelLayoutDraft.value = [...DEFAULT_LAYOUT]
}

// ── 图表渲染
function renderAllCharts() {
  panelLayout.value.forEach((type, idx) => {
    if (type === 'FACTOR_EXPOSURE') renderRadarAt(idx)
    if (type === 'FACTOR_WEIGHTS') renderWeightsAt(idx)
  })
}

function renderRadarAt(idx: number) {
  const el = chartEls.value[`radar_${idx}`]
  if (!el) return
  const key = `radar_${idx}`
  if (!chartInstances.has(key)) chartInstances.set(key, echarts.init(el, 'dark'))
  const chart = chartInstances.get(key)!
  const s = store.exposure?.latest_snapshot
  if (!s) { chart.setOption({ title: { text: '无数据', textStyle: { color: '#555' } } }); return }
  chart.setOption({
    backgroundColor: 'transparent',
    radar: { 
      indicator: [
        { name: 'β Market', min: FACTOR_EXPOSURE_MIN, max: FACTOR_EXPOSURE_MAX, interval: FACTOR_EXPOSURE_INTERVAL, axisLabel: { show: false } }, 
        { name: 'HML', min: FACTOR_EXPOSURE_MIN, max: FACTOR_EXPOSURE_MAX, interval: FACTOR_EXPOSURE_INTERVAL, axisLabel: { show: false } }, 
        { name: 'SMB', min: FACTOR_EXPOSURE_MIN, max: FACTOR_EXPOSURE_MAX, interval: FACTOR_EXPOSURE_INTERVAL, axisLabel: { show: false } }, 
        { name: 'MOM', min: FACTOR_EXPOSURE_MIN, max: FACTOR_EXPOSURE_MAX, interval: FACTOR_EXPOSURE_INTERVAL, axisLabel: { show: false } }, 
        { name: 'QMJ', min: FACTOR_EXPOSURE_MIN, max: FACTOR_EXPOSURE_MAX, interval: FACTOR_EXPOSURE_INTERVAL, axisLabel: { show: false } }
      ], 
      radius: '65%', 
      axisLine: { lineStyle: { color: 'rgba(0,255,136,0.2)' } }, 
      splitLine: { lineStyle: { color: 'rgba(0,255,136,0.08)' } }, 
      axisName: { color: '#aaa', fontSize: 10 },
      splitNumber: Math.round((FACTOR_EXPOSURE_MAX - FACTOR_EXPOSURE_MIN) / FACTOR_EXPOSURE_INTERVAL),
      axisLabel: { show: false }
    },
    series: [{ 
      type: 'radar', 
      data: [{ 
        value: [
          Math.abs(s.beta_market ?? 0), 
          Math.abs(s.beta_hml ?? 0), 
          Math.abs(s.beta_smb ?? 0), 
          Math.abs(s.beta_mom ?? 0), 
          Math.abs(s.beta_qmj ?? 0)
        ], 
        itemStyle: { color: '#00ff88' }, 
        areaStyle: { color: 'rgba(0,255,136,0.12)' } 
      }] 
    }],
  })
}

function renderWeightsAt(idx: number) {
  const el = chartEls.value[`weights_${idx}`]
  if (!el || !aiHub.factorWeights) return
  const key = `weights_${idx}`
  if (!chartInstances.has(key)) chartInstances.set(key, echarts.init(el, 'dark'))
  const chart = chartInstances.get(key)!
  const w = aiHub.factorWeights
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    series: [{
      type: 'pie', radius: ['40%', '65%'],
      data: DIMS.map((d, i) => ({ name: DIM_LABELS[d], value: ((w[d] ?? 0) * 100).toFixed(1), itemStyle: { color: DIM_COLORS[i] } })),
      label: { color: '#ccc', fontSize: 10 },
    }],
  })
}

watch(() => store.exposure, () => {
  panelLayout.value.forEach((type, idx) => { if (type === 'FACTOR_EXPOSURE') renderRadarAt(idx) })
}, { deep: true })

watch(() => aiHub.factorWeights, () => {
  panelLayout.value.forEach((type, idx) => { if (type === 'FACTOR_WEIGHTS') renderWeightsAt(idx) })
}, { deep: true })

// Re-render charts when layout changes
watch(panelLayout, () => nextTick(() => renderAllCharts()))

onMounted(async () => {
  rootEl.value?.focus()
  clockTimer = setInterval(() => { clock.value = new Date().toLocaleTimeString('zh-CN') }, 1000)
  clock.value = new Date().toLocaleTimeString('zh-CN')
  await store.initWarRoom()
  await aiHub.fetchFactorWeights()
  await aiHub.fetchAgentRuns(5)
  await autonomy.fetchStatus()
  await nextTick()
  renderAllCharts()
})

onUnmounted(() => {
  store.cleanup()
  if (clockTimer) clearInterval(clockTimer)
  document.body.classList.remove('war-room-fullscreen')
  chartInstances.forEach(c => c.dispose())
  chartInstances.clear()
})
</script>

<style scoped>
.war-room { background: #0a0a15; min-height: 100vh; display: flex; flex-direction: column; outline: none; font-family: 'Courier New', monospace; }
.war-room.fullscreen { position: fixed; inset: 0; z-index: 9999; overflow: auto; }
.wr-topbar { display: flex; align-items: center; gap: 16px; padding: 8px 16px; background: #050510; border-bottom: 1px solid rgba(0,255,136,0.3); }
.wr-title { font-size: 1rem; font-weight: 700; color: #00ff88; letter-spacing: 2px; }
.wr-clock { font-size: 1.1rem; color: #ffd700; font-weight: 600; min-width: 80px; }
.wr-stats { display: flex; gap: 14px; flex: 1; }
.pnl-pos { color: #00ff88; font-size: 0.9rem; font-weight: 700; }
.pnl-neg { color: #ff4444; font-size: 0.9rem; font-weight: 700; }
.alert-count { color: #ffd700; font-size: 0.85rem; }
.crit-count { color: #ff4444; font-size: 0.85rem; font-weight: 700; animation: blink 1s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.wr-controls { display: flex; align-items: center; gap: 10px; }
.hotkey-hint { font-size: 0.68rem; color: #444; }
.wr-btn { background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3); color: #00ff88; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
.wr-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 1px; flex: 1; background: rgba(0,255,136,0.08); padding: 1px; }
.wr-panel { background: #0d1117; padding: 12px; overflow-y: auto; cursor: pointer; transition: box-shadow 0.15s; min-height: 280px; }
.wr-panel.focused { box-shadow: inset 0 0 0 1px #00ff88; }
.wp-title { font-size: 0.78rem; font-weight: 700; color: #00ff88; margin-bottom: 8px; letter-spacing: 0.5px; }
.wp-subtitle { font-size: 0.75rem; color: #555; margin: 6px 0 4px; }
.ticker-list { font-size: 0.78rem; }
.ticker-row { display: flex; gap: 8px; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.t-symbol { color: #e0e0e0; font-weight: 600; min-width: 70px; }
.t-dir { font-size: 0.7rem; padding: 1px 4px; border-radius: 2px; }
.t-dir.long { background: rgba(0,255,136,0.2); color: #00ff88; }
.t-dir.short { background: rgba(255,68,68,0.2); color: #ff4444; }
.t-qty { color: #666; font-size: 0.75rem; }
.t-pnl { margin-left: auto; font-weight: 700; }
.t-pct { font-size: 0.75rem; min-width: 60px; text-align: right; }
.good { color: #00ff88; } .bad { color: #ff4444; }
.feed-filters { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
.feed-filter-btn { font-size: 0.65rem; padding: 2px 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #666; border-radius: 3px; cursor: pointer; }
.feed-filter-btn.active { border-color: #00ff88; color: #00ff88; background: rgba(0,255,136,0.08); }
.feed-list { font-size: 0.78rem; max-height: 220px; overflow-y: auto; }
.feed-item { padding: 6px 8px; border-left: 2px solid rgba(255,255,255,0.1); margin-bottom: 5px; }
.feed-item.category-RISK { border-left-color: #ff4444; }
.feed-item.category-DECISION { border-left-color: #00ff88; }
.feed-item.category-EVENT { border-left-color: #ffd700; }
.feed-item.category-SIGNAL { border-left-color: #c77dff; }
.fi-header { display: flex; gap: 8px; margin-bottom: 2px; }
.fi-cat { font-size: 0.65rem; color: #555; }
.fi-urgency { font-size: 0.68rem; font-weight: 700; }
.fi-time { font-size: 0.65rem; color: #555; margin-left: auto; }
.fi-title { font-weight: 600; color: #d0d0d0; margin-bottom: 2px; font-size: 0.8rem; }
.fi-body { color: #888; font-size: 0.75rem; line-height: 1.45; }
.chart-container { width: 100%; height: 180px; }
.exposure-metrics { font-size: 0.78rem; }
.em-row { display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid rgba(255,255,255,0.05); }
.warn { color: #ffd700; } .danger { color: #ff4444; }
.alert-stats-row { display: flex; gap: 8px; margin-bottom: 8px; }
.as-item { flex: 1; text-align: center; border-radius: 4px; padding: 4px; display: flex; flex-direction: column; gap: 2px; font-size: 0.72rem; }
.as-item span:last-child { font-size: 1rem; font-weight: 700; }
.as-item.crit { background: rgba(255,68,68,0.1); border: 1px solid rgba(255,68,68,0.3); color: #ff4444; }
.as-item.high { background: rgba(255,107,53,0.1); border: 1px solid rgba(255,107,53,0.3); color: #ff6b35; }
.as-item.med { background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3); color: #ffd700; }
.as-item.low { background: rgba(168,218,220,0.1); border: 1px solid rgba(168,218,220,0.3); color: #a8dadc; }
.alerts-list { max-height: 200px; overflow-y: auto; font-size: 0.78rem; }
.alert-item { border-radius: 4px; padding: 6px 8px; margin-bottom: 4px; }
.alert-item.grade-CRITICAL { background: rgba(255,68,68,0.08); border-left: 2px solid #ff4444; }
.alert-item.grade-HIGH { background: rgba(255,107,53,0.08); border-left: 2px solid #ff6b35; }
.alert-item.grade-MEDIUM { background: rgba(255,215,0,0.05); border-left: 2px solid #ffd700; }
.alert-item.grade-LOW { background: rgba(168,218,220,0.05); border-left: 2px solid #a8dadc; }
.ai-header { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
.ai-grade { font-size: 0.65rem; font-weight: 700; }
.ai-type { font-size: 0.65rem; color: #666; }
.ai-actions { margin-left: auto; display: flex; gap: 4px; }
.ack-btn, .dsm-btn { font-size: 0.65rem; padding: 1px 5px; border-radius: 3px; cursor: pointer; border: none; }
.ack-btn { background: rgba(0,255,136,0.2); color: #00ff88; }
.dsm-btn { background: rgba(255,255,255,0.08); color: #666; }
.ai-content { color: #ccc; font-size: 0.78rem; margin-bottom: 2px; }
.ai-action { font-size: 0.72rem; color: #ffd700; font-style: italic; }
.agent-summary { text-align: center; padding: 10px 0; }
.as-symbol { font-size: 1.1rem; font-weight: 700; color: #e0e0e0; }
.as-rec { font-size: 1.2rem; font-weight: 700; margin: 4px 0; }
.as-conf { font-size: 0.8rem; color: #888; }
.as-time { font-size: 0.72rem; color: #555; }
.as-msgs { font-size: 0.72rem; color: #00ff88; margin-top: 4px; }
.rec-buy { color: #00ff88; } .rec-sell { color: #ff4444; } .rec-hold { color: #ffd700; }
.panel-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 8px 0; }
.mini-run { display: flex; align-items: center; gap: 8px; font-size: 0.74rem; padding: 3px 0; border-top: 1px solid rgba(255,255,255,0.04); }
.mr-symbol { color: #ccc; font-weight: 600; flex: 1; }
.mr-rec { font-size: 0.7rem; font-weight: 700; min-width: 60px; }
.mr-time { color: #555; font-size: 0.68rem; min-width: 80px; text-align: right; }
.empty { color: #444; font-size: 0.78rem; text-align: center; padding: 20px; }
.placeholder-panel { flex-direction: column; gap: 6px; }
.ph-icon { font-size: 1.6rem; }
.ph-sub { font-size: 0.68rem; color: #333; }
.ai-paused-badge { color: #ffd700; font-size: 0.78rem; font-weight: 700; background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3); padding: 2px 6px; border-radius: 3px; }

/* ── 面板配置抽屉 */
.config-drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; justify-content: flex-end; align-items: stretch; }
.config-drawer { width: 340px; background: #0d1117; border-left: 1px solid rgba(0,255,136,0.25); display: flex; flex-direction: column; padding: 20px; gap: 12px; overflow-y: auto; }
.drawer-header { display: flex; align-items: center; justify-content: space-between; }
.drawer-title { font-size: 0.9rem; font-weight: 700; color: #00ff88; letter-spacing: 0.5px; }
.drawer-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #888; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
.drawer-close:hover { color: #ff4444; border-color: rgba(255,68,68,0.4); }
.drawer-hint { font-size: 0.73rem; color: #555; line-height: 1.5; margin: 0; }
.drawer-slots { display: flex; flex-direction: column; gap: 10px; }
.drawer-slot { display: flex; flex-direction: column; gap: 4px; }
.slot-label { font-size: 0.72rem; color: #666; font-family: 'Courier New', monospace; }
.slot-select { background: #0a0a15; border: 1px solid rgba(0,255,136,0.2); color: #d0d0d0; padding: 5px 8px; border-radius: 4px; font-size: 0.78rem; cursor: pointer; outline: none; }
.slot-select:focus { border-color: rgba(0,255,136,0.5); }
.drawer-actions { display: flex; gap: 8px; margin-top: 8px; }
.btn-apply { flex: 1; background: rgba(0,255,136,0.15); border: 1px solid rgba(0,255,136,0.4); color: #00ff88; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 0.82rem; font-weight: 600; }
.btn-apply:hover { background: rgba(0,255,136,0.25); }
.btn-reset { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #666; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-size: 0.82rem; }
.btn-reset:hover { color: #aaa; }

/* ── 面板配置抽屉动画 */
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.25s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }

/* ── P键暂停确认弹窗 */
.pause-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1001; display: flex; align-items: center; justify-content: center; }
.pause-modal { background: #0d1117; border: 1px solid rgba(255,215,0,0.35); border-radius: 8px; padding: 28px 32px; width: 360px; text-align: center; }
.pm-icon { font-size: 2.5rem; margin-bottom: 10px; }
.pm-title { font-size: 1rem; font-weight: 700; color: #ffd700; margin-bottom: 12px; }
.pm-body { font-size: 0.8rem; color: #888; line-height: 1.55; margin-bottom: 20px; }
.pm-actions { display: flex; gap: 12px; justify-content: center; }
.pm-confirm { background: rgba(255,215,0,0.15); border: 1px solid rgba(255,215,0,0.5); color: #ffd700; padding: 8px 24px; border-radius: 5px; cursor: pointer; font-weight: 700; font-size: 0.85rem; }
.pm-confirm:hover { background: rgba(255,215,0,0.25); }
.pm-cancel { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #666; padding: 8px 24px; border-radius: 5px; cursor: pointer; font-size: 0.85rem; }
.pm-cancel:hover { color: #aaa; }

/* ── fade 过渡 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
