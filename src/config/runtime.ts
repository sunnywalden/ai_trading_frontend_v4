type RuntimeConfig = {
  VITE_BACKEND_URL?: string
  BACKEND_URL?: string
  VITE_WS_BASE_URL?: string
}

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig
  }
}

function trimTrailingSlash(value?: string): string {
  return String(value || '').trim().replace(/\/$/, '')
}

export function getRuntimeConfig(): RuntimeConfig {
  if (typeof window === 'undefined') return {}
  return window.__APP_CONFIG__ || {}
}

export function getBackendBaseUrl(): string {
  const runtimeConfig = getRuntimeConfig()
  const runtimeValue =
    runtimeConfig.VITE_BACKEND_URL ||
    runtimeConfig.BACKEND_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    ''

  if (import.meta.env.DEV) {
    return trimTrailingSlash(runtimeValue)
  }

  return trimTrailingSlash(runtimeValue)
}

export function getApiBaseUrl(): string {
  const backendBaseUrl = getBackendBaseUrl()

  if (import.meta.env.DEV) {
    return backendBaseUrl ? `${backendBaseUrl}/api` : '/api'
  }

  return backendBaseUrl ? `${backendBaseUrl}/api` : '/api'
}

export function getWsBaseUrl(): string {
  const runtimeConfig = getRuntimeConfig()
  const wsBaseRaw = trimTrailingSlash(
    runtimeConfig.VITE_WS_BASE_URL ||
    import.meta.env.VITE_WS_BASE_URL ||
    getBackendBaseUrl()
  )

  if (wsBaseRaw) {
    return wsBaseRaw
      .replace(/^http:\/\//i, 'ws://')
      .replace(/^https:\/\//i, 'wss://')
  }

  if (typeof window === 'undefined') {
    return ''
  }

  return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
}