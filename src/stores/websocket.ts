/**
 * V10.4 M4: WebSocket Store (Pinia) — 指数退避重连
 *
 * 断线重连策略：
 *   delay = min(BASE * 2^attempt, MAX_DELAY) * jitter(0.8~1.2)
 *   BASE = 1000ms, MAX_DELAY = 60000ms
 *   重连成功后 attempt 重置为 0
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createWsUrl } from '@/api/client'

export interface WsMessage {
  event: string
  data: any
  ts: string
}

const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS  = 60_000
const HEARTBEAT_INTERVAL_MS = 30_000

export const useWebSocketStore = defineStore('websocket', () => {
  const connected = ref(false)
  const messages = ref<WsMessage[]>([])
  const lastMessage = ref<WsMessage | null>(null)
  const reconnectAttempt = ref(0)
  const nextReconnectInMs = ref(0)

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  /** 计算带 jitter 的指数退避延迟 */
  function calcDelay(attempt: number): number {
    const base = Math.min(RECONNECT_BASE_MS * Math.pow(2, attempt), RECONNECT_MAX_MS)
    const jitter = 0.8 + Math.random() * 0.4   // 0.8 ~ 1.2
    return Math.round(base * jitter)
  }

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

    const url = createWsUrl()
    ws = new WebSocket(url)

    ws.onopen = () => {
      connected.value = true
      reconnectAttempt.value = 0
      nextReconnectInMs.value = 0
      console.log('[WS] Connected (attempt reset)')

      // 心跳
      heartbeatTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) ws.send('ping')
      }, HEARTBEAT_INTERVAL_MS)
    }

    ws.onmessage = (event) => {
      if (event.data === 'pong') return
      try {
        const msg: WsMessage = JSON.parse(event.data)
        lastMessage.value = msg
        messages.value.push(msg)
        // 保留最近 200 条
        if (messages.value.length > 200) messages.value.shift()
      } catch { /* ignore */ }
    }

    ws.onclose = (event) => {
      connected.value = false
      cleanupTimers()

      // 非主动关闭时自动重连
      if (event.code !== 1000) {
        const delay = calcDelay(reconnectAttempt.value)
        nextReconnectInMs.value = delay
        console.log(
          `[WS] Disconnected (code=${event.code}). Reconnecting in ${delay}ms (attempt=${reconnectAttempt.value})`
        )
        reconnectTimer = setTimeout(() => {
          reconnectAttempt.value++
          connect()
        }, delay)
      }
    }

    ws.onerror = () => {
      ws?.close()
    }
  }

  function disconnect() {
    clearReconnect()
    cleanupTimers()
    ws?.close(1000)
    ws = null
    connected.value = false
    reconnectAttempt.value = 0
  }

  function cleanupTimers() {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
  }

  function clearReconnect() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  }

  const unreadCount = computed(() => messages.value.length)

  return {
    connected,
    messages,
    lastMessage,
    unreadCount,
    reconnectAttempt,
    nextReconnectInMs,
    connect,
    disconnect,
  }
})
