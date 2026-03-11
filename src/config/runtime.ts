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

function stripLeadingWww(hostname: string): string {
  return String(hostname || '').replace(/^www\./i, '')
}

export function shouldPreferSameOriginBackend(runtimeValue?: string): boolean {
  if (typeof window === 'undefined') return false
  if (!runtimeValue) return false

  try {
    const resolved = new URL(runtimeValue, window.location.origin)
    const current = window.location
    const currentPort = current.port || (current.protocol === 'https:' ? '443' : '80')
    const resolvedPort = resolved.port || (resolved.protocol === 'https:' ? '443' : '80')

    if (
      resolved.protocol === current.protocol
      && resolvedPort === currentPort
      && stripLeadingWww(resolved.hostname) === stripLeadingWww(current.hostname)
    ) {
      return true
    }
  } catch {
    return false
  }

  return false
}

function getDefaultDevBackendOrigin(): string {
  if (typeof window === 'undefined') return ''

  const { protocol, hostname, port } = window.location
  const backendProtocol = protocol === 'https:' ? 'https:' : 'http:'

  // Vite dev/preview 常见端口下，如果没有显式配置后端地址，则默认回退到本机后端 8088。
  if (port === '5173' || port === '4173') {
    return `${backendProtocol}//${hostname}:8088`
  }

  return ''
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
    return trimTrailingSlash(runtimeValue || getDefaultDevBackendOrigin())
  }

  if (shouldPreferSameOriginBackend(runtimeValue)) {
    return ''
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

  if (import.meta.env.DEV) {
    const devBackendOrigin = getDefaultDevBackendOrigin()
    if (devBackendOrigin) {
      return devBackendOrigin
        .replace(/^http:\/\//i, 'ws://')
        .replace(/^https:\/\//i, 'wss://')
    }
  }

  return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
}