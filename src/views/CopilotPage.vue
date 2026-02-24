<template>
  <div class="page-container copilot-layout">
    <!-- 左栏: 早间简报 + 快捷动作 -->
    <div class="side-panel">
      <div class="card brief-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0;">📋 早间简报</h3>
          <button class="refresh-button" @click="copilotStore.fetchMorningBrief()" style="font-size: 12px; padding: 4px 10px;">刷新</button>
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

      <!-- 待确认操作 -->
      <div v-if="copilotStore.pendingActions.length" class="card">
        <h4 style="margin: 0 0 12px; color: #ff9800;">⚡ 待确认操作</h4>
        <div v-for="action in copilotStore.pendingActions" :key="action.action_id" class="pending-action">
          <p>{{ action.description }}</p>
          <button class="success-button small" @click="copilotStore.confirmAction(action.action_id)">确认执行</button>
        </div>
      </div>
    </div>

    <!-- 右栏：对话框 -->
    <div class="chat-panel">
      <div class="chat-header">
        <h3>💬 AI Copilot</h3>
        <button class="refresh-button" style="font-size: 12px; padding: 4px 10px;" @click="copilotStore.clearHistory()">清空</button>
      </div>

      <div class="messages-area" ref="messagesArea">
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

      <div class="input-area">
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
import { ref, computed, nextTick, onMounted } from 'vue'
import { useCopilotStore } from '@/stores/copilot'
import { storeToRefs } from 'pinia'

const copilotStore = useCopilotStore()
const { morningBrief: brief } = storeToRefs(copilotStore)
const inputText = ref('')
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
</style>
