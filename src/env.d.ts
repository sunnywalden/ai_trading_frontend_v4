/// <reference types="vite/client" />

interface Window {
  __APP_CONFIG__?: {
    VITE_BACKEND_URL?: string
    BACKEND_URL?: string
    VITE_WS_BASE_URL?: string
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}
