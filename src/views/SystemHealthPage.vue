<template>
  <div class="page-container">
    <section class="section-header">
      <div>
        <h2>🩺 系统健康</h2>
        <p>仅展示服务状态与最近更新时间</p>
      </div>
      <button class="refresh-button" @click="loadHealth" :disabled="loading">
        {{ loading ? '刷新中...' : '刷新状态' }}
      </button>
    </section>

    <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
    <SystemHealthCard
      v-else
      :status="healthStatus"
      :monitoring-enabled="monitoringEnabled"
      :last-updated="lastUpdated"
      @retry="loadHealth"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import SystemHealthCard from '../components/SystemHealthCard.vue';
import { fetchMonitoringHealth } from '../api/client';

const loading = ref(false);
const errorMsg = ref('');
const healthStatus = ref('unknown');
const monitoringEnabled = ref(false);
const lastUpdated = ref('-');

async function loadHealth() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const health = await fetchMonitoringHealth();
    healthStatus.value = health.status || 'unknown';
    monitoringEnabled.value = !!(health.monitoring_active ?? health.monitoring_enabled ?? health.redis_enabled);
    lastUpdated.value = health.last_updated || health.timestamp || new Date().toISOString();
  } catch (e: any) {
    console.error('加载健康状态失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = '⏱️ 请求超时，请稍后再试！';
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = '🌐 网络连接失败，请检查网络或后端服务状态';
    } else {
      errorMsg.value = '❌ 获取系统健康失败';
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadHealth();
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.section-header h2 {
  margin: 0 0 6px 0;
  font-size: 1.5rem;
  color: #e5e7eb;
}

.section-header p {
  margin: 0;
  font-size: 0.9rem;
  color: #9ca3af;
}

.refresh-button {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.6);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.9rem;
}
</style>
