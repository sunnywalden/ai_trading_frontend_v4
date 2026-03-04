<template>
  <!-- ── 悬浮触发按钮 ── -->
  <Teleport to="body">
    <div class="copilot-floating-root" :class="{ open: isOpen }">
      <!-- 悬浮按钮（未打开时显示） -->
      <button
        v-if="!isOpen"
        class="copilot-fab"
        :class="{ 'has-alerts': unreadAlerts > 0 }"
        :title="`AI Copilot (${cmdKey}+K)`"
        @click="open"
      >
        <span class="fab-icon">🤖</span>
        <span v-if="unreadAlerts > 0" class="fab-badge">{{ unreadAlerts }}</span>
      </button>

      <!-- 浮动窗口 -->
      <Transition name="widget-slide">
        <div v-if="isOpen" class="copilot-widget" @keydown.esc="close">
          <!-- 标题栏 -->
          <header class="widget-header">
            <div class="header-left">
              <span class="header-icon">🤖</span>
              <span class="header-title">AI Copilot</span>
              <span v-if="context" class="ctx-badge">
                <span v-if="context.active_positions" class="ctx-item">
                  📊 {{ context.active_positions }} 仓
                </span>
                <span v-if="context.unread_alerts" class="ctx-item alert">
                  🔔 {{ context.unread_alerts }}
                </span>
                <span v-if="context.market_regime" class="ctx-item regime">
                  {{ context.market_regime }}
                </span>
              </span>
            </div>
            <div class="header-actions">
              <button class="header-btn" title="清空对话" @click="clearMessages">🗑️</button>
              <button class="header-btn" title="在完整页面打开" @click="goToFullPage">⤢</button>
              <button class="header-btn close-btn" :title="`关闭 (${cmdKey}+K)`" @click="close">✕</button>
            </div>
          </header>

          <!-- 消息区域 -->
          <div class="widget-messages" ref="messagesEl">
            <!-- 空状态 / 欢迎语 -->
            <div v-if="messages.length === 0 && !isLoading" class="empty-state">
              <div class="empty-icon">✨</div>
              <p class="empty-title">你好！我是 AI Copilot</p>
              <p class="empty-hint">
                你可以问我关于当前持仓、市场动态、策略信号等任何问题
              </p>
              <div class="quick-actions">
                <button
                  v-for="q in quickQuestions"
                  :key="q"
                  class="quick-btn"
                  @click="sendQuick(q)"
                >{{ q }}</button>
              </div>
            </div>

            <!-- 消息列表 -->
            <div
              v-for="(msg, i) in messages"
              :key="i"
              class="message-row"
              :class="msg.role"
            >
              <div class="msg-bubble">
                <span v-if="msg.role === 'assistant'" class="msg-role-icon">🤖</span>
                <span v-else class="msg-role-icon">👤</span>
                <div class="msg-content" v-html="formatMessage(msg.content)" />
              </div>
            </div>

            <!-- 正在思考... -->
            <div v-if="isThinking" class="message-row assistant">
              <div class="msg-bubble thinking">
                <span class="msg-role-icon">🤖</span>
                <div class="thinking-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <footer class="widget-footer">
            <div class="input-wrap">
              <textarea
                ref="inputEl"
                v-model="inputText"
                class="chat-input"
                placeholder="输入消息... (Enter 发送 / Shift+Enter 换行)"
                rows="1"
                :disabled="isThinking"
                @keydown.enter.exact.prevent="send"
                @keydown.enter.shift.exact="() => {}"
                @input="autoResize"
              />
              <button
                class="send-btn"
                :disabled="!inputText.trim() || isThinking"
                @click="send"
              >
                <span v-if="isThinking">⏳</span>
                <span v-else>➤</span>
              </button>
            </div>
            <div class="footer-hint">
              <span v-if="context?.llm_status && Object.keys(context.llm_status).length > 0" class="llm-degraded">
                ⚠️ LLM 降级中
              </span>
              <span v-else-if="context" class="llm-ok">✅ LLM 正常</span>
            </div>
          </footer>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCopilotStore } from '@/stores/copilot'
import { copilotApi, type CopilotContext } from '@/api/copilotService'

// ── 状态 ──────────────────────────────────────────────────────
const isOpen = ref(false)
const inputText = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)
const context = ref<CopilotContext | null>(null)

const store = useCopilotStore()
const router = useRouter()

const messages = computed(() => store.messages)
const isThinking = computed(() => store.streaming)
const isLoading = computed(() => store.loading)
const unreadAlerts = computed(() => context.value?.unread_alerts ?? 0)

// Meta(Mac) 或 Ctrl(Win/Lin)
const isMac = navigator.platform.toUpperCase().includes('MAC')
const cmdKey = isMac ? '⌘' : 'Ctrl'

const quickQuestions = [
  '今日有哪些高置信度信号？',
  '当前持仓的五因子敞口如何？',
  '最近的市场体制是什么？',
  '今日盘前摘要',
]

// ── 开/关逻辑 ─────────────────────────────────────────────────
async function open() {
  isOpen.value = true
  await nextTick()
  inputEl.value?.focus()
  scrollToBottom()
  loadContext()
}

function close() {
  isOpen.value = false
}

function toggle() {
  if (isOpen.value) close()
  else open()
}

// ── 系统上下文 ────────────────────────────────────────────────
async function loadContext() {
  try {
    const res = await copilotApi.getContext()
    context.value = res.data
  } catch {
    // 非致命，忽略
  }
}

// ── 发送消息 ──────────────────────────────────────────────────
async function send() {
  const text = inputText.value.trim()
  if (!text || isThinking.value) return
  inputText.value = ''
  resetInputHeight()
  await store.sendMessage(text)
  await nextTick()
  scrollToBottom()
}

async function sendQuick(q: string) {
  inputText.value = q
  await send()
}

function clearMessages() {
  store.messages.length = 0
}

function goToFullPage() {
  close()
  router.push('/copilot')
}

// ── 滚动 & 输入框自适应高度 ───────────────────────────────────
function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function resetInputHeight() {
  if (inputEl.value) inputEl.value.style.height = 'auto'
}

// ── 消息格式化（简单 markdown → HTML） ───────────────────────
function formatMessage(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// ── 键盘快捷键 Cmd/Ctrl+K ─────────────────────────────────────
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'k' && (isMac ? e.metaKey : e.ctrlKey)) {
    e.preventDefault()
    toggle()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 消息更新时自动滚动
watch(() => store.messages.length, scrollToBottom)
watch(() => store.streaming, (v) => { if (!v) scrollToBottom() })
</script>

<style scoped>
/* ── 根容器 ── */
.copilot-floating-root {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9000;
}

/* ── FAB 按钮 ── */
.copilot-fab {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 22px rgba(59, 130, 246, 0.65);
  }

  &.has-alerts {
    animation: pulse 2s infinite;
  }
}

.fab-icon { font-size: 22px; }

.fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-base, #0f1623);
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(59,130,246,0.5); }
  50%       { box-shadow: 0 4px 24px rgba(59,130,246,0.85); }
}

/* ── 浮动窗口 ── */
.copilot-widget {
  width: 380px;
  height: 560px;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel, #1a1f2e);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.04);
  overflow: hidden;
}

/* ── 标题栏 ── */
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(29,78,216,0.1));
  border-bottom: 1px solid rgba(59,130,246,0.2);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.header-icon { font-size: 18px; }

.header-title {
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary, #e5e7eb);
  flex-shrink: 0;
}

.ctx-badge {
  display: flex;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}

.ctx-item {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
  color: #9ca3af;
  white-space: nowrap;

  &.alert { color: #f59e0b; background: rgba(245,158,11,0.12); }
  &.regime { color: #34d399; background: rgba(52,211,153,0.12); }
}

.header-actions { display: flex; gap: 2px; flex-shrink: 0; }

.header-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;

  &:hover { background: rgba(255,255,255,0.08); color: #e5e7eb; }
}

.close-btn:hover { color: #f87171 !important; }

/* ── 消息区域 ── */
.widget-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.empty-state {
  text-align: center;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon { font-size: 32px; }

.empty-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #e5e7eb;
}

.empty-hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 8px;
}

.quick-btn {
  padding: 5px 10px;
  border: 1px solid rgba(59,130,246,0.3);
  background: rgba(59,130,246,0.08);
  color: #93c5fd;
  border-radius: 12px;
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { background: rgba(59,130,246,0.18); border-color: rgba(59,130,246,0.5); }
}

/* 消息气泡 */
.message-row {
  display: flex;

  &.user { justify-content: flex-end; }
  &.assistant { justify-content: flex-start; }
}

.msg-bubble {
  display: flex;
  gap: 6px;
  max-width: 86%;
  align-items: flex-start;
}

.message-row.user .msg-bubble { flex-direction: row-reverse; }

.msg-role-icon { font-size: 16px; flex-shrink: 0; margin-top: 2px; }

.msg-content {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;

  :deep(code) {
    background: rgba(255,255,255,0.1);
    padding: 1px 4px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 12px;
  }

  :deep(strong) { color: #fff; }
}

.message-row.user .msg-content {
  background: rgba(59,130,246,0.2);
  color: #dbeafe;
  border-bottom-right-radius: 4px;
}

.message-row.assistant .msg-content {
  background: rgba(255,255,255,0.06);
  color: #e5e7eb;
  border-bottom-left-radius: 4px;
}

/* 思考中动画 */
.thinking .msg-content { display: none; }

.thinking-dots {
  padding: 10px 12px;
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  display: flex;
  gap: 4px;
  align-items: center;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6b7280;
    animation: blink 1.2s infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes blink {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

/* ── 输入区域 ── */
.widget-footer {
  padding: 10px 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.input-wrap {
  display: flex;
  gap: 6px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #e5e7eb;
  font-size: 13px;
  padding: 8px 12px;
  resize: none;
  line-height: 1.4;
  max-height: 120px;
  transition: border-color 0.15s;

  &::placeholder { color: #4b5563; }
  &:focus { outline: none; border-color: rgba(59,130,246,0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.send-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #3b82f6;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) { background: #2563eb; transform: scale(1.05); }
  &:disabled { background: #374151; cursor: not-allowed; }
}

.footer-hint {
  margin-top: 4px;
  font-size: 11px;
  color: #4b5563;
  text-align: center;
}

.llm-degraded { color: #f59e0b; }
.llm-ok { color: #34d399; }

/* ── 动画 ── */
.widget-slide-enter-active { animation: widgetIn 0.25s ease; }
.widget-slide-leave-active { animation: widgetOut 0.2s ease; }

@keyframes widgetIn {
  from { opacity: 0; transform: translateY(16px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes widgetOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(16px) scale(0.95); }
}

/* ── 移动端适配 ── */
@media (max-width: 480px) {
  .copilot-widget {
    width: calc(100vw - 16px);
    height: 70vh;
    max-height: 520px;
    bottom: 70px;
    right: 8px;
  }

  .copilot-floating-root {
    right: 12px;
    bottom: 12px;
  }
}
</style>
