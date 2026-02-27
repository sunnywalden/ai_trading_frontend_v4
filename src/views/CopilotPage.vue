<template>
  <div class="page-container copilot-layout">
    <!-- 左栏: 早间简报 + 快捷动作 -->
    <div class="side-panel">
      <div class="card brief-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0;">📋 早间简报</h3>
          <button class="refresh-button" @click="copilotStore.fetchMorningBrief(true)" style="font-size: 12px; padding: 4px 10px;">刷新</button>
        </div>
        <div v-if="copilotStore.loading" class="loading-message">加载中...</div>
        <div v-else-if="brief">
          <p class="brief-date">{{ brief.date }}</p>
          <p class="brief-summary">{{ brief.summary }}</p>
          <div v-if="brief.risk_alerts && brief.risk_alerts.length" class="risk-alerts">
            <div v-for="alert in brief.risk_alerts" :key="alert" class="risk-alert-item">⚠️ {{ alert }}</div>
          </div>
          <div v-if="brief.top_signals && brief.top_signals.length" class="signal-list">
            <div v-for="sig in brief.top_signals" :key="sig.symbol" class="signal-item">
              <span class="signal-symbol">{{ sig.symbol }}</span>
              <span class="signal-action" :class="(sig.action || 'BUY') === 'BUY' ? 'buy' : 'sell'">{{ sig.action }}</span>
              <span class="signal-reason">{{ sig.reason }}</span>
            </div>
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
            <span class="dr-timestamp">{{ drReport.generated_at?.slice(0,10) }}</span>
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
</script>

<style scoped>
.copilot-layout {
  display: flex; gap: 20px; align-items: flex-start;
  height: calc(100vh - 100px);
}
.side-panel { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.chat-panel { flex: 1; display: flex; flex-direction: column; height: 100%; }
.card { background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 16px; }
.brief-date { font-size: 12px; color: #888; margin: 0 0 8px; }
.brief-summary { font-size: 13px; line-height: 1.6; }
.risk-alerts { margin-top: 12px; }
.risk-alert-item { font-size: 12px; color: #ff9800; padding: 4px 0; }
.signal-list { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.signal-item { display: flex; gap: 8px; align-items: center; font-size: 12px; }
.signal-symbol { font-weight: 600; }
.signal-action.buy { color: #4caf50; }
.signal-action.sell { color: #f44336; }
.signal-reason { color: #888; }
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
</style>
