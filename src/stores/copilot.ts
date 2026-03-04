import { defineStore } from 'pinia'
import { ref } from 'vue'
import { copilotApi, type CopilotMessage, type MorningBrief } from '@/api/copilotService'

export const useCopilotStore = defineStore('copilot', () => {
  const messages = ref<CopilotMessage[]>([])
  const morningBrief = ref<MorningBrief | null>(null)
  const sessionId = ref<string | undefined>(undefined)
  const loading = ref(false)
  const streaming = ref(false)
  const error = ref<string | null>(null)
  const pendingActions = ref<Array<{
    action_id: string
    description: string
    type?: string
    params?: Record<string, any>
    expires_at?: string
  }>>([])

  function normalizeMessage<T extends Partial<CopilotMessage>>(msg: T): CopilotMessage {
    const content =
      typeof msg.content === 'string'
        ? msg.content
        : msg.content == null
          ? ''
          : typeof msg.content === 'object'
            ? JSON.stringify(msg.content, null, 2)
            : String(msg.content)

    return {
      id: msg.id,
      role: (msg.role as CopilotMessage['role']) ?? 'assistant',
      content,
      model_used: msg.model_used,
      action_intent: msg.action_intent,
      created_at: msg.created_at,
    }
  }

  async function sendMessage(content: string) {
    messages.value.push({ role: 'user', content })
    try {
      streaming.value = true
      error.value = null
      const res = await copilotApi.chat(content, sessionId.value)
      const reply = normalizeMessage(res.data)
      messages.value.push(reply)
      // 如果 AI 返回了需要确认的 action
      if (reply.action_intent?.action_id) {
        pendingActions.value.push({
          action_id: reply.action_intent.action_id,
          description: reply.action_intent.description ?? '',
          type: reply.action_intent.type ?? 'general',
          params: reply.action_intent.params,
          expires_at: reply.action_intent.expires_at,
        })
      }
    } catch (e: any) {
      error.value = e.message || 'Chat failed'
    } finally {
      streaming.value = false
    }
  }

  async function loadHistory(limit = 50) {
    try {
      loading.value = true
      const res = await copilotApi.getHistory({ limit, session_id: sessionId.value })
      messages.value = (res.data.messages || []).map(m => normalizeMessage(m))
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchMorningBrief(force = false) {
    try {
      loading.value = true
      const res = await copilotApi.getMorningBrief(force)
      morningBrief.value = res.data
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function confirmAction(actionId: string) {
    await copilotApi.confirmAction(actionId)
    pendingActions.value = pendingActions.value.filter(a => a.action_id !== actionId)
  }

  function clearHistory() {
    messages.value = []
    pendingActions.value = []
  }

  return {
    messages, morningBrief, sessionId, loading, streaming, error, pendingActions,
    sendMessage, loadHistory, fetchMorningBrief, confirmAction, clearHistory,
  }
})
