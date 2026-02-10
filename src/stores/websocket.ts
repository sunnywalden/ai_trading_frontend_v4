/**
 * V9: WebSocket Store (Pinia)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createWsUrl } from '@/api/client'

export interface WsMessage {
  event: string
  data: any
  ts: string
}

export const useWebSocketStore = defineStore('websocket', () => {
  const connected = ref(false)
  const messages = ref<WsMessage[]>([])
  const lastMessage = ref<WsMessage | null>(null)

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

    const url = createWsUrl()
    ws = new WebSocket(url)

    ws.onopen = () => {
      connected.value = true
      console.log('[WS] Connected')
      // 心跳
      heartbeatTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) ws.send('ping')
      }, 30000)
    }

    ws.onmessage = (event) => {
      if (event.data === 'pong') return
      try {
        const msg: WsMessage = JSON.parse(event.data)
        lastMessage.value = msg
        messages.value.push(msg)
        // 保留最近 100 条
        if (messages.value.length > 100) messages.value.shift()
      } catch { /* ignore */ }
    }

    ws.onclose = () => {
      connected.value = false
      cleanup()
      // 自动重连
      reconnectTimer = setTimeout(() => connect(), 5000)
    }

    ws.onerror = () => {
      ws?.close()
    }
  }

  function disconnect() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    cleanup()
    ws?.close()
    ws = null
    connected.value = false
  }

  function cleanup() {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
  }

  const unreadCount = computed(() => messages.value.length)

  return { connected, messages, lastMessage, unreadCount, connect, disconnect }
})
