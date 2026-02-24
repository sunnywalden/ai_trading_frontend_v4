<template>
  <div class="page-container">
    <section class="section-header">
      <div>
        <h2>{{ $t('nav.service_health') }}</h2>
        <p>系统核心组件运行状态实时监控</p>
      </div>
      <button class="refresh-button" @click="loadHealth" :disabled="loading">
        {{ loading ? '刷新中...' : '🔄 刷新' }}
      </button>
    </section>

    <div class="content-body">
      <p v-if="error" class="error-message">{{ error }}</p>
      <SystemHealthCard
        v-else
        :status="healthStatus"
        :monitoring-enabled="monitoringEnabled"
        :last-updated="lastUpdated"
        @retry="loadHealth"
      />
    </div>

    <!-- 成功提示 -->
    <div v-if="successMsg" class="success-toast">{{ successMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SystemHealthCard from '../components/SystemHealthCard.vue'
import { fetchMonitoringHealth } from '../api/client'

const loading = ref(false)
const error = ref('')
const healthStatus = ref('unknown')
const monitoringEnabled = ref(false)
const lastUpdated = ref('-')
const successMsg = ref('')

async function loadHealth() {
  loading.value = true
  error.value = ''
  try {
    const health = await fetchMonitoringHealth()
    healthStatus.value = health.status || 'unknown'
    monitoringEnabled.value = !!(health.monitoring_active ?? health.monitoring_enabled ?? health.redis_enabled)
    lastUpdated.value = health.last_updated || health.timestamp || new Date().toISOString()
  } catch (e: any) {
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      error.value = '⏱️ 请求超时，请稍后再试！'
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      error.value = '🌐 网络连接失败，请检查后端服务状态'
    } else {
      error.value = '❌ 获取系统健康失败'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadHealth()
})
</script>

<style scoped>
.page-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.section-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 24px; }
.section-header h2 { margin: 0 0 6px; font-size: 1.5rem; color: #e5e7eb; }
.section-header p { margin: 0; font-size: 0.9rem; color: #9ca3af; }

.refresh-button {
  padding: 10px 20px; background: linear-gradient(135deg,#38bdf8,#0ea5e9);
  border: 1px solid rgba(56,189,248,0.5); border-radius: 8px; color: #fff;
  font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all .2s; white-space: nowrap;
}
.refresh-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(56,189,248,0.4); }
.refresh-button:disabled { opacity: .5; cursor: not-allowed; }

.content-body { min-height: 400px; }
.error-message {
  text-align: center; padding: 24px; background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; color: #fca5a5; font-size: .9rem;
}
.success-toast {
  position: fixed; top: 80px; right: 20px; padding: 16px 24px;
  background: rgba(34,197,94,0.95); color: #fff; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4); font-weight: 600; z-index: 1000;
  animation: slideIn .3s ease;
}
@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
</style>
