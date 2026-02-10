<template>
  <div class="page-container">
    <section class="section-header">
      <div>
        <h2>系统监控</h2>
        <p>服务状态、API 调用与 Rate Limit 一站式管理</p>
      </div>
      <button class="refresh-button" @click="onRefreshAll" :disabled="loadingHealth || loadingApi">
        {{ (loadingHealth || loadingApi) ? '刷新中...' : '🔄 刷新' }}
      </button>
    </section>

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <button :class="['tab-btn', { active: tab === 'health' }]" @click="tab = 'health'">🩺 服务健康</button>
      <button :class="['tab-btn', { active: tab === 'api' }]" @click="tab = 'api'">📡 API 监控</button>
    </div>

    <!-- ===== 服务健康 Tab ===== -->
    <div v-if="tab === 'health'">
      <p v-if="healthError" class="error-message">{{ healthError }}</p>
      <SystemHealthCard
        v-else
        :status="healthStatus"
        :monitoring-enabled="monitoringEnabled"
        :last-updated="lastUpdated"
        @retry="loadHealth"
      />
    </div>

    <!-- ===== API 监控 Tab ===== -->
    <div v-if="tab === 'api'">
      <p v-if="loadingApi && !report" class="loading-message">正在加载监控数据...</p>
      <p v-else-if="apiError" class="error-message">{{ apiError }}</p>

      <template v-else-if="report">
        <HealthStatusBar
          :summary="report.summary"
          :generated-at="report.generated_at"
          :monitoring-enabled="monitoringEnabled"
        />

        <section class="providers-section">
          <div class="sub-header">
            <h3 class="section-title">API 提供商状态</h3>
            <select v-model="timeRange" class="time-range-select" @change="loadStats">
              <option value="day">日统计</option>
              <option value="hour">时统计</option>
              <option value="minute">分统计</option>
            </select>
          </div>
          <div class="providers-grid">
            <ApiProviderCard
              v-for="stats in providerStats?.length ? providerStats : report.daily_stats"
              :key="stats.provider"
              :stats="stats"
              :policy="report.rate_limit_policies[stats.provider] || {}"
            />
          </div>
        </section>

        <section class="alerts-section">
          <AlertsPanel
            :critical-alerts="report.critical_alerts"
            :warnings="report.warnings"
            :recent-errors="report.recent_errors"
          />
        </section>
      </template>

      <p v-else class="info-message">暂无监控数据</p>
    </div>

    <!-- 成功提示 -->
    <div v-if="successMsg" class="success-toast">{{ successMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SystemHealthCard from '../components/SystemHealthCard.vue'
import HealthStatusBar from '../components/HealthStatusBar.vue'
import ApiProviderCard from '../components/ApiProviderCard.vue'
import AlertsPanel from '../components/AlertsPanel.vue'
import {
  fetchMonitoringReport,
  fetchMonitoringHealth,
  fetchMonitoringStats,
  type MonitoringReport,
  type ApiStats,
} from '../api/client'

const tab = ref<'health' | 'api'>('health')

// --- Health ---
const loadingHealth = ref(false)
const healthError = ref('')
const healthStatus = ref('unknown')
const monitoringEnabled = ref(false)
const lastUpdated = ref('-')

async function loadHealth() {
  loadingHealth.value = true
  healthError.value = ''
  try {
    const health = await fetchMonitoringHealth()
    healthStatus.value = health.status || 'unknown'
    monitoringEnabled.value = !!(health.monitoring_active ?? health.monitoring_enabled ?? health.redis_enabled)
    lastUpdated.value = health.last_updated || health.timestamp || new Date().toISOString()
  } catch (e: any) {
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      healthError.value = '⏱️ 请求超时，请稍后再试！'
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      healthError.value = '🌐 网络连接失败，请检查后端服务状态'
    } else {
      healthError.value = '❌ 获取系统健康失败'
    }
  } finally {
    loadingHealth.value = false
  }
}

// --- API Monitoring ---
const loadingApi = ref(false)
const apiError = ref('')
const report = ref<MonitoringReport | null>(null)
const timeRange = ref<'day' | 'hour' | 'minute'>('day')
const providerStats = ref<ApiStats[] | null>(null)
const successMsg = ref('')

async function loadMonitoringData() {
  loadingApi.value = true
  apiError.value = ''
  try {
    report.value = await fetchMonitoringReport()
    await loadStats()
  } catch (e: any) {
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      apiError.value = '⏱️ 请求超时，请稍后再试！'
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      apiError.value = '🌐 网络连接失败，请检查后端服务状态'
    } else {
      apiError.value = '❌ 获取监控数据失败'
    }
  } finally {
    loadingApi.value = false
  }
}

async function loadStats() {
  try {
    providerStats.value = await fetchMonitoringStats(timeRange.value)
  } catch (e) {
    providerStats.value = null
  }
}

async function onRefreshAll() {
  await Promise.all([loadHealth(), loadMonitoringData()])
  successMsg.value = '✅ 刷新成功'
  setTimeout(() => { successMsg.value = '' }, 2000)
}

onMounted(() => {
  loadHealth()
  loadMonitoringData()
})
</script>

<style scoped>
.page-container { padding: 20px; max-width: 1600px; margin: 0 auto; }
.section-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px; }
.section-header h2 { margin: 0 0 6px; font-size: 1.5rem; color: #e5e7eb; }
.section-header p { margin: 0; font-size: 0.9rem; color: #9ca3af; }

.tab-bar { display: flex; gap: 4px; margin-bottom: 20px; background: rgba(31,41,55,0.5); border-radius: 10px; padding: 4px; }
.tab-btn {
  flex: 1; padding: 10px 16px; border: none; border-radius: 8px;
  background: transparent; color: #9ca3af; cursor: pointer; font-size: 0.9rem; font-weight: 500;
  transition: all .2s;
}
.tab-btn:hover { color: #e5e7eb; }
.tab-btn.active { background: rgba(56,189,248,0.15); color: #38bdf8; font-weight: 600; }

.refresh-button {
  padding: 10px 20px; background: linear-gradient(135deg,#38bdf8,#0ea5e9);
  border: 1px solid rgba(56,189,248,0.5); border-radius: 8px; color: #fff;
  font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all .2s; white-space: nowrap;
}
.refresh-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(56,189,248,0.4); }
.refresh-button:disabled { opacity: .5; cursor: not-allowed; }

.sub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { margin: 0; font-size: 1.2rem; font-weight: 600; color: #e5e7eb; }
.time-range-select {
  padding: 8px 14px; background: rgba(31,41,55,0.8); border: 1px solid rgba(55,65,81,0.8);
  border-radius: 8px; color: #e5e7eb; font-size: 0.85rem; cursor: pointer;
}
.time-range-select:hover { border-color: rgba(56,189,248,0.5); }

.providers-section { margin: 24px 0; }
.providers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px; }
.alerts-section { margin: 24px 0; }

.loading-message, .info-message {
  text-align: center; padding: 48px 20px; font-size: 1rem; color: #9ca3af;
  background: rgba(31,41,55,0.5); border: 1px dashed rgba(107,114,128,0.5); border-radius: 12px;
}
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
@media (max-width: 900px) {
  .page-container { padding: 16px; }
  .providers-grid { grid-template-columns: 1fr; }
}
</style>
