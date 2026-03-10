<template>
  <div class="page-container copilot-layout">
    <!-- 左栏: 早间简报 + 快捷动作 -->
    <div class="side-panel">
      <div class="card brief-card">
        <!-- Header -->
        <div class="brief-header">
          <div class="brief-title-row">
            <span class="brief-title">📋 早间简报</span>
            <small class="brief-subtitle">(美股/港股)</small>
          </div>
          <button class="refresh-button brief-refresh" @click="copilotStore.fetchMorningBrief(true)">刷新</button>
        </div>

        <div v-if="copilotStore.loading" class="brief-loading">
          <div class="loading-bar"></div>
          <div class="loading-bar short"></div>
          <div class="loading-bar"></div>
        </div>

        <div v-else-if="brief" class="brief-content">
          <!-- Date & Regime -->
          <div class="brief-meta">
            <span class="brief-date">{{ brief.date }}</span>
            <span v-if="brief.market_regime" class="regime-badge" :class="`regime-${(brief.market_regime || '').toLowerCase()}`">
              {{ regimeLabel(brief.market_regime) }}
            </span>
          </div>

          <!-- Portfolio Snapshot -->
          <div v-if="brief.portfolio_snapshot" class="snapshot-row">
            <div class="snap-item">
              <span class="snap-label">持仓</span>
              <span class="snap-value">{{ brief.portfolio_snapshot.positions_count }}</span>
            </div>
            <div v-if="brief.portfolio_snapshot.unrealized_pnl_pct != null" class="snap-item">
              <span class="snap-label">浮盈</span>
              <span class="snap-value" :class="(brief.portfolio_snapshot.unrealized_pnl_pct ?? 0) >= 0 ? 'positive' : 'negative'">
                {{ (brief.portfolio_snapshot.unrealized_pnl_pct ?? 0) >= 0 ? '+' : '' }}{{ brief.portfolio_snapshot.unrealized_pnl_pct?.toFixed(1) }}%
              </span>
            </div>
            <div v-if="brief.portfolio_snapshot.beta_exposure != null" class="snap-item">
              <span class="snap-label">Beta</span>
              <span class="snap-value">{{ brief.portfolio_snapshot.beta_exposure?.toFixed(1) }}</span>
            </div>
            <div v-if="brief.portfolio_snapshot.top_contributor" class="snap-item">
              <span class="snap-label">贡献</span>
              <span class="snap-value highlight">{{ brief.portfolio_snapshot.top_contributor }}</span>
            </div>
          </div>

          <!-- Summary -->
          <p class="brief-summary">{{ brief.summary }}</p>

          <!-- Key Themes -->
          <div v-if="brief.key_themes && brief.key_themes.length" class="brief-section">
            <div class="section-label">💡 关注点</div>
            <ul class="themes-list">
              <li v-for="theme in brief.key_themes" :key="theme">{{ theme }}</li>
            </ul>
          </div>

          <!-- Signals -->
          <div v-if="brief.top_signals && brief.top_signals.length" class="brief-section">
            <div class="section-label">🎯 主要信号</div>
            <div v-for="sig in brief.top_signals" :key="sig.symbol" class="signal-card">
              <div class="signal-top-row">
                <span class="signal-symbol">{{ sig.symbol }}</span>
                <span class="signal-action" :class="signalActionClass(sig.action)">{{ sig.action }}</span>
                <span v-if="sig.confidence" class="signal-conf">{{ Math.round(sig.confidence * 100) }}%</span>
              </div>
              <p class="signal-reason">{{ sig.reason }}</p>
            </div>
          </div>

          <!-- Risk Alerts -->
          <div v-if="brief.risk_alerts && brief.risk_alerts.length" class="brief-section">
            <div class="section-label">⚠️ 风险提示</div>
            <div v-for="alert in brief.risk_alerts" :key="alert" class="risk-alert-item">{{ alert }}</div>
          </div>

          <!-- Market Outlook -->
          <div v-if="brief.market_outlook" class="brief-section market-outlook-section">
            <div class="section-label">📈 市场展望</div>
            <p class="outlook-text">{{ brief.market_outlook }}</p>
          </div>
        </div>

        <p v-else class="info-message">点击刷新获取早间简报</p>
      </div>

      <!-- 待确认操作列表 -->
      <div v-if="copilotStore.pendingActions.length" class="card">
        <h4 style="margin: 0 0 12px; color: #ff9800;">⚡ 待确认操作 ({{ copilotStore.pendingActions.length }})</h4>
        <div v-for="action in copilotStore.pendingActions" :key="action.action_id" class="pending-action">
          <p>{{ action.description }}</p>
          <button class="success-button small" @click="openConfirmModal(action)">确认执行</button>
        </div>
      </div>

      <!-- 操作意图确认弹窗 -->
      <ActionIntentConfirmModal
        :visible="!!activeConfirmAction"
        :action-id="activeConfirmAction?.action_id ?? ''"
        :intent="{ type: activeConfirmAction?.type ?? 'general', description: activeConfirmAction?.description, params: activeConfirmAction?.params }"
        :expires-seconds="30"
        @confirm="onModalConfirm"
        @cancel="activeConfirmAction = null"
      />
    </div>

    <!-- 右栏：对话框 -->
    <div class="chat-panel">
      <div class="chat-header">
        <h3>💬 AI Copilot</h3>
        <div class="header-actions">
          <!-- 模式切换 -->
          <div class="mode-toggle">
            <button
              class="mode-btn"
              :class="{ active: chatMode === 'standard' }"
              @click="chatMode = 'standard'"
            >标准</button>
            <button
              class="mode-btn deep"
              :class="{ active: chatMode === 'deep_research' }"
              @click="chatMode = 'deep_research'"
            >🔬 深度研究</button>
          </div>
          <button class="refresh-button" style="font-size: 12px; padding: 4px 10px;" @click="copilotStore.clearHistory()">清空</button>
        </div>
      </div>

      <!-- 深度研究模式 -->
      <div v-if="chatMode === 'deep_research'" class="deep-research-panel">
        <div class="dr-input-row">
          <input
            class="dr-symbol-input"
            v-model="drSymbol"
            placeholder="标的代码 (如 AAPL)"
            @keyup.enter="runDeepResearch"
          />
          <input
            class="dr-query-input"
            v-model="drQuery"
            placeholder="研究问题 (如：近期上涨驱动因素分析)"
            @keyup.enter="runDeepResearch"
          />
          <button class="dr-run-btn" :disabled="drLoading || !drSymbol.trim()" @click="runDeepResearch">
            {{ drLoading ? '研究中...' : '开始研究' }}
          </button>
        </div>
        <!-- 研究报告 -->
        <div v-if="drReport" class="dr-report">
          <div class="dr-report-header">
            <span class="dr-symbol">{{ drReport.symbol }}</span>
            <span class="dr-rating" :class="`rating-${drReport.rating?.toLowerCase()}`">{{ drReport.rating }}</span>
            <span v-if="drReport.price_target" class="dr-pt">目标价: {{ drReport.price_target }}</span>
            <span class="dr-timestamp">{{ formatClientDateTime(drReport.generated_at, { withSeconds: false }) }}</span>
          </div>
          <div class="dr-report-body">{{ drReport.body }}</div>
          <div class="dr-sources" v-if="drReport.sources?.length">
            <span class="dr-sources-label">数据来源:</span>
            <span v-for="s in drReport.sources" :key="s" class="dr-source-tag">{{ s }}</span>
          </div>
        </div>
        <div v-if="drLoading" class="dr-loading">
          <span class="dr-spinner">⟳</span> deepseek-reasoner 分析中，通常需要 10-30 秒...
        </div>
      </div>

      <!-- 标准对话模式 -->
      <div v-if="chatMode === 'standard'" class="messages-area" ref="messagesArea">
        <div v-if="copilotStore.messages.length === 0" class="empty-chat">
          <p>你好！我是 AI Copilot。你可以问我：</p>
          <ul>
            <li>今天市场怎么样？</li>
            <li>帮我分析 AAPL 的期权数据</li>
            <li>暂停自主交易</li>
            <li>当前持仓风险如何？</li>
          </ul>
        </div>
        <div
          v-for="(msg, idx) in copilotStore.messages"
          :key="idx"
          class="message"
          :class="msg.role"
        >
          <div class="message-bubble">
            <pre>{{ msg.content }}</pre>
            <span v-if="msg.model_used" class="model-tag">{{ msg.model_used }}</span>
          </div>
        </div>
        <div v-if="copilotStore.streaming" class="message assistant">
          <div class="message-bubble streaming">思考中...</div>
        </div>
      </div>

      <div v-if="chatMode === 'standard'" class="input-area">
        <textarea
          v-model="inputText"
          placeholder="输入消息... (Shift+Enter 换行, Enter 发送)"
          @keydown.enter.exact.prevent="handleSend"
          rows="2"
        />
        <button class="send-button" @click="handleSend" :disabled="!inputText.trim() || copilotStore.streaming">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useCopilotStore } from '@/stores/copilot'
import { storeToRefs } from 'pinia'
import ActionIntentConfirmModal from '@/components/ActionIntentConfirmModal.vue'
import { copilotService } from '@/api/copilotService'

const copilotStore = useCopilotStore()
const { morningBrief: brief } = storeToRefs(copilotStore)

// 操作意图确认弹窗
const activeConfirmAction = ref<typeof copilotStore.pendingActions[0] | null>(null)

function openConfirmModal(action: typeof copilotStore.pendingActions[0]) {
  activeConfirmAction.value = action
}

async function onModalConfirm(actionId: string) {
  await copilotStore.confirmAction(actionId)
  activeConfirmAction.value = null
}

// 标准对话
const inputText   = ref('')
const messagesArea = ref<HTMLElement>()

async function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  await copilotStore.sendMessage(text)
  await nextTick()
  if (messagesArea.value) {
    messagesArea.value.scrollTop = messagesArea.value.scrollHeight
  }
}

// ── 深度研究模式 ───────────────────────────────────────────────────────────
const chatMode = ref<'standard' | 'deep_research'>('standard')
const drSymbol = ref('')
const drQuery  = ref('')
const drLoading = ref(false)
const drReport  = ref<{
  symbol: string; rating?: string; price_target?: number;
  body: string; sources?: string[]; generated_at?: string
} | null>(null)

async function runDeepResearch() {
  if (!drSymbol.value.trim() || drLoading.value) return
  drLoading.value = true
  drReport.value  = null
  try {
    const res = await copilotService.deepResearch(drSymbol.value.trim().toUpperCase(), drQuery.value.trim() || undefined)
    drReport.value = res.data?.report ?? res.data
  } catch (e) {
    console.error('[Copilot] deepResearch failed', e)
  } finally {
    drLoading.value = false
  }
}

onMounted(async () => {
  await copilotStore.fetchMorningBrief()
  await copilotStore.loadHistory(30)
})

// ── 早间简报辅助函数 ────────────────────────────────────────────────────────
function regimeLabel(regime: string | undefined): string {
  const map: Record<string, string> = {
    BULL: '● 牛市', BEAR: '● 熊市', NEUTRAL: '● 震荡',
    RISK_OFF: '● 避险', CRISIS: '● 危机', UNKNOWN: '未知',
  }
  return map[(regime || '').toUpperCase()] ?? regime ?? ''
}

function signalActionClass(action: string | undefined): string {
  const a = (action || '').toUpperCase()
  if (a === 'BUY' || a === 'LONG') return 'buy'
  if (a === 'SELL' || a === 'SHORT') return 'sell'
  if (a.includes('HEDGE') || a.includes('MONITOR')) return 'hedge'
  return 'neutral'
}
</script>

<style scoped>
.copilot-layout {
  display: flex; gap: 20px; align-items: flex-start;
  height: calc(100vh - 100px);
}
.side-panel { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.chat-panel { flex: 1; display: flex; flex-direction: column; height: 100%; }
.card { background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 16px; }
/* ── 早间简报卡片 ──────────────────────────────────────────────────────────── */
.brief-card { padding: 14px; }
.brief-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.brief-title-row { display: flex; align-items: baseline; gap: 6px; }
.brief-title { font-size: 14px; font-weight: 600; color: #e0e0e0; }
.brief-subtitle { font-size: 11px; color: #666; }
.brief-refresh { font-size: 11px; padding: 3px 9px; }

/* Loading skeleton */
.brief-loading { display: flex; flex-direction: column; gap: 8px; padding: 4px 0; }
.loading-bar { height: 10px; background: rgba(255,255,255,0.07); border-radius: 4px; animation: shimmer 1.4s ease-in-out infinite; }
.loading-bar.short { width: 60%; }
@keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 0.9; } }

/* Date + regime */
.brief-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.brief-date { font-size: 12px; color: #888; }
.regime-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; letter-spacing: 0.3px; }
.regime-bull    { background: rgba(0,255,136,0.12); color: #00e57a; }
.regime-bear    { background: rgba(244,67,54,0.12); color: #ef9a9a; }
.regime-neutral { background: rgba(255,193,7,0.12); color: #ffc107; }
.regime-risk_off{ background: rgba(158,158,158,0.12); color: #9e9e9e; }
.regime-crisis  { background: rgba(244,67,54,0.2); color: #ff5252; }

/* Portfolio snapshot row */
.snapshot-row { display: flex; gap: 0; margin-bottom: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; overflow: hidden; }
.snap-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 6px 4px; border-right: 1px solid rgba(255,255,255,0.06); }
.snap-item:last-child { border-right: none; }
.snap-label { font-size: 10px; color: #666; margin-bottom: 2px; }
.snap-value { font-size: 12px; font-weight: 600; color: #ccc; }
.snap-value.positive { color: #4caf50; }
.snap-value.negative { color: #f44336; }
.snap-value.highlight { color: #64b5f6; }

/* Summary */
.brief-summary { font-size: 12px; line-height: 1.65; color: #c0c0c0; margin: 0 0 10px; }

/* Sections */
.brief-section { margin-top: 10px; }
.section-label { font-size: 11px; font-weight: 600; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }

/* Key themes */
.themes-list { margin: 0; padding: 0 0 0 14px; list-style: disc; }
.themes-list li { font-size: 11.5px; color: #aaa; line-height: 1.6; padding: 1px 0; }

/* Signal cards */
.signal-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; }
.signal-top-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.signal-symbol { font-size: 13px; font-weight: 700; color: #e0e0e0; }
.signal-conf { font-size: 10px; color: #888; margin-left: auto; }
.signal-action { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 8px; }
.signal-action.buy    { background: rgba(76,175,80,0.15); color: #4caf50; }
.signal-action.sell   { background: rgba(244,67,54,0.15); color: #f44336; }
.signal-action.hedge  { background: rgba(255,152,0,0.15); color: #ff9800; }
.signal-action.neutral{ background: rgba(158,158,158,0.12); color: #9e9e9e; }
.signal-reason { font-size: 11px; color: #888; margin: 0; line-height: 1.5; }

/* Risk alerts */
.risk-alert-item { font-size: 11.5px; color: #ffb74d; padding: 3px 0 3px 14px; position: relative; line-height: 1.5; }
.risk-alert-item::before { content: '▸'; position: absolute; left: 0; color: #ff9800; }

/* Market outlook */
.market-outlook-section { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; }
.outlook-text { font-size: 12px; color: #90caf9; line-height: 1.6; margin: 0; font-style: italic; }
.pending-action { background: rgba(255,152,0,0.05); border: 1px solid rgba(255,152,0,0.3); border-radius: 6px; padding: 10px; margin-bottom: 8px; }
.chat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.chat-header h3 { margin: 0; }
.messages-area { flex: 1; overflow-y: auto; padding: 12px; background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; margin-bottom: 12px; }
.empty-chat { color: #666; font-size: 14px; }
.empty-chat ul { padding-left: 20px; }
.empty-chat li { margin: 4px 0; }
.message { margin-bottom: 12px; display: flex; }
.message.user { justify-content: flex-end; }
.message.assistant { justify-content: flex-start; }
.message-bubble { max-width: 75%; padding: 10px 14px; border-radius: 12px; font-size: 13px; }
.message.user .message-bubble { background: rgba(74,144,226,0.2); text-align: right; }
.message.assistant .message-bubble { background: rgba(255,255,255,0.05); }
.message-bubble pre { white-space: pre-wrap; word-break: break-word; margin: 0; font-family: inherit; }
.model-tag { font-size: 10px; color: #555; display: block; margin-top: 4px; }
.streaming { color: #888; font-style: italic; }
.input-area { display: flex; gap: 10px; }
.input-area textarea { flex: 1; background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; color: inherit; padding: 10px; font-size: 14px; resize: none; }
.send-button { padding: 0 20px; background: #4a90e2; border: none; border-radius: 8px; color: #fff; cursor: pointer; font-size: 14px; }
.send-button:disabled { opacity: 0.5; cursor: not-allowed; }
.refresh-button { background: transparent; border: 1px solid #4a6fa5; color: #4a90e2; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.success-button { background: #2e7d32; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
.success-button.small { font-size: 12px; padding: 4px 10px; }

/* 模式切换 */
.header-actions { display: flex; align-items: center; gap: 10px; }
.mode-toggle { display: flex; background: #111827; border: 1px solid #334155; border-radius: 8px; padding: 2px; }
.mode-btn { background: transparent; border: none; color: #666; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.15s; }
.mode-btn.active { background: #1e293b; color: #fff; }
.mode-btn.deep.active { background: rgba(147,197,253,0.15); color: #93c5fd; }

/* 深度研究面板 */
.deep-research-panel { flex: 1; overflow-y: auto; padding: 16px; background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 16px; }
.dr-input-row { display: flex; gap: 10px; }
.dr-symbol-input { width: 120px; flex-shrink: 0; background: #111827; border: 1px solid #334155; color: #e0e0e0; border-radius: 6px; padding: 8px 12px; font-size: 0.9rem; }
.dr-query-input  { flex: 1; background: #111827; border: 1px solid #334155; color: #e0e0e0; border-radius: 6px; padding: 8px 12px; font-size: 0.9rem; }
.dr-run-btn { background: #93c5fd; color: #001; border: none; border-radius: 6px; padding: 8px 18px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.dr-run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.dr-report { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; }
.dr-report-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; flex-wrap: wrap; }
.dr-symbol { font-size: 1.3rem; font-weight: 700; color: #00ff88; }
.dr-rating { font-size: 0.8rem; padding: 3px 10px; border-radius: 10px; font-weight: 600; }
.rating-buy    { background: rgba(0,255,136,0.15); color: #00ff88; }
.rating-sell   { background: rgba(255,77,77,0.15); color: #ff4d4d; }
.rating-hold   { background: rgba(255,153,0,0.15); color: #ff9900; }
.dr-pt         { font-size: 0.85rem; color: #e0e0e0; }
.dr-timestamp  { font-size: 0.75rem; color: #555; margin-left: auto; }
.dr-report-body { font-size: 0.9rem; line-height: 1.8; color: #ccc; white-space: pre-wrap; }
.dr-sources { margin-top: 16px; padding-top: 12px; border-top: 1px solid #1e293b; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dr-sources-label { font-size: 0.75rem; color: #555; }
.dr-source-tag { font-size: 0.72rem; padding: 2px 8px; background: #1e293b; border-radius: 10px; color: #666; }
.dr-loading { display: flex; align-items: center; gap: 10px; color: #60a5fa; font-size: 0.85rem; }
.dr-spinner { display: inline-block; animation: spin 1s linear infinite; font-size: 1.2rem; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ── V10.4 M5: 375px 移动端适配 ── */
@media (max-width: 375px) {
  .copilot-page,
  .page-container {
    padding: 8px;
    flex-direction: column;
  }

  .chat-panel,
  .side-panel {
    width: 100%;
    min-width: 0;
  }

  .chat-messages {
    max-height: 55vh;
  }

  .input-wrap {
    flex-direction: column;
  }

  .send-btn {
    width: 100%;
  }

  .section-tabs {
    flex-wrap: wrap;
    gap: 4px;
  }

  .tab-btn {
    font-size: 0.75rem;
    padding: 6px 10px;
  }
}
</style>
