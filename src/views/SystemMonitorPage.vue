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
      <button :class="['tab-btn', { active: tab === 'tasks' }]" @click="tab = 'tasks'">📋 任务管理</button>
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

      <!-- WebSocket 连接状态 -->
      <section class="autonomy-health-section">
        <div class="sub-header">
          <h3 class="section-title">🔌 WebSocket 连接状态</h3>
        </div>
        <div class="ws-status-bar" :class="wsStore.connected ? 'ws-ok' : 'ws-err'">
          <span class="ws-dot"></span>
          <span v-if="wsStore.connected">已连接</span>
          <span v-else>
            已断线
            <template v-if="wsStore.reconnectAttempt > 0">
              &nbsp;· 第 {{ wsStore.reconnectAttempt }} 次重连
              <template v-if="wsStore.nextReconnectInMs > 0">（{{ (wsStore.nextReconnectInMs / 1000).toFixed(0) }}s 后）</template>
            </template>
          </span>
        </div>
      </section>

      <!-- 自主循环健康检查 -->
      <section class="autonomy-health-section">
        <div class="sub-header">
          <h3 class="section-title">🤖 自主循环健康检查（M4）</h3>
          <span v-if="autonomyHealth" class="overall-badge" :class="'overall-' + autonomyHealth.overall_status.toLowerCase()">
            {{ autonomyHealth.overall_status }}
          </span>
        </div>
        <div v-if="autonomyHealthLoading" class="loading-message">正在加载健康检查结果...</div>
        <div v-else-if="autonomyHealth" class="health-checks-grid">
          <div
            v-for="check in autonomyHealth.checks"
            :key="check.name"
            class="health-check-card"
            :class="'check-' + check.status.toLowerCase()"
          >
            <div class="check-name">{{ check.name }}</div>
            <div class="check-status-badge">{{ check.status }}</div>
            <div class="check-message">{{ check.message }}</div>
          </div>
        </div>
        <div v-else class="info-message">暂无健康检查数据（Job 每 2 分钟刷新）</div>
      </section>
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

        <!-- LLM 调用统计 -->
        <section class="llm-stats-section">
          <div class="sub-header">
            <h3 class="section-title">🤖 LLM 调用统计</h3>
            <select v-model="llmHours" class="time-range-select" @change="loadLlmStats">
              <option :value="6">近 6h</option>
              <option :value="24">近 24h</option>
              <option :value="72">近 72h</option>
              <option :value="168">近 7d</option>
            </select>
          </div>
          <div v-if="llmStats" class="llm-stats-body">
            <div class="llm-kpi-row">
              <div class="llm-kpi">
                <div class="llm-kpi-label">总调用</div>
                <div class="llm-kpi-value">{{ llmStats.total }}</div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">成功率</div>
                <div class="llm-kpi-value" :class="llmStats.total ? (llmStats.success / llmStats.total >= 0.95 ? 'ok' : 'warn') : ''">
                  {{ llmStats.total ? ((llmStats.success / llmStats.total) * 100).toFixed(1) + '%' : '-' }}
                </div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">超时</div>
                <div class="llm-kpi-value" :class="llmStats.timeout > 0 ? 'warn' : ''">
                  {{ llmStats.timeout }}
                </div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">错误</div>
                <div class="llm-kpi-value" :class="llmStats.error > 0 ? 'err' : ''">
                  {{ llmStats.error }}
                </div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">降级</div>
                <div class="llm-kpi-value" :class="llmStats.degraded > 0 ? 'warn' : ''">
                  {{ llmStats.degraded }}
                </div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">P50 延迟</div>
                <div class="llm-kpi-value">{{ llmStats.p50_latency_ms != null ? llmStats.p50_latency_ms + 'ms' : '-' }}</div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">P95 延迟</div>
                <div class="llm-kpi-value" :class="llmStats.p95_latency_ms != null && llmStats.p95_latency_ms > 5000 ? 'warn' : ''">
                  {{ llmStats.p95_latency_ms != null ? llmStats.p95_latency_ms + 'ms' : '-' }}
                </div>
              </div>
            </div>
            <div v-if="llmStats.total === 0" class="llm-empty">⏳ 暂无 LLM 调用记录（近 {{ llmHours }}h），首次 LLM 调用后将自动入库。</div>
            <div v-else-if="llmStats.by_model?.length" class="llm-breakdown">
              <div class="llm-breakdown-title">按模型分布</div>
              <div class="llm-model-row" v-for="m in llmStats.by_model" :key="m.model">
                <span class="llm-model-name">{{ m.model }}</span>
                <div class="llm-model-bar-wrap">
                  <div class="llm-model-bar" :style="{ width: (m.count / llmStats.total * 100).toFixed(1) + '%' }"></div>
                </div>
                <span class="llm-model-count">{{ m.count }}</span>
              </div>
            </div>
          </div>
          <div v-else class="llm-loading">加载中...</div>
        </section>
      </template>

      <p v-else class="info-message">暂无监控数据</p>
    </div>

    <!-- ===== 任务管理 Tab ===== -->
    <div v-if="tab === 'tasks'">
      <TaskManagementPage />
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
import TaskManagementPage from './TaskManagementPage.vue'
import { useWebSocketStore } from '../stores/websocket'
import {
  fetchMonitoringReport,
  fetchMonitoringHealth,
  fetchMonitoringStats,
  fetchLlmStats,
  fetchAutonomyHealth,
  type MonitoringReport,
  type ApiStats,
  type LlmStats,
  type AutonomyHealthReport,
} from '../api/client'

const wsStore = useWebSocketStore()
const tab = ref<'health' | 'api' | 'tasks'>('health')

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

// --- LLM Stats ---
const llmStats = ref<LlmStats | null>(null)
const llmHours = ref(24)

async function loadLlmStats() {
  try {
    llmStats.value = await fetchLlmStats(llmHours.value)
  } catch {
    llmStats.value = { window_hours: llmHours.value, since: '', total: 0, success: 0, timeout: 0,
      rate_limited: 0, error: 0, degraded: 0, error_rate_pct: 0,
      avg_latency_ms: null, p50_latency_ms: null, p95_latency_ms: null, by_model: [], by_caller: [] }
  }
}

// --- Autonomy Health ---
const autonomyHealth = ref<AutonomyHealthReport | null>(null)
const autonomyHealthLoading = ref(false)

async function loadAutonomyHealth() {
  autonomyHealthLoading.value = true
  try {
    autonomyHealth.value = await fetchAutonomyHealth()
  } catch {
    autonomyHealth.value = null
  } finally {
    autonomyHealthLoading.value = false
  }
}

async function loadMonitoringData() {
  loadingApi.value = true
  apiError.value = ''
  try {
    report.value = await fetchMonitoringReport()
    await Promise.all([loadStats(), loadLlmStats()])
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
  await Promise.all([loadHealth(), loadAutonomyHealth(), loadMonitoringData()])
  successMsg.value = '✅ 刷新成功'
  setTimeout(() => { successMsg.value = '' }, 2000)
}

onMounted(() => {
  loadHealth()
  loadAutonomyHealth()
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

/* Autonomy health & WS status */
.autonomy-health-section { margin: 24px 0; background: rgba(17,24,39,0.7); border: 1px solid rgba(55,65,81,0.6); border-radius: 14px; padding: 20px; }
.ws-status-bar {
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  border-radius: 10px; font-size: 0.95rem; font-weight: 500;
}
.ws-ok { background: rgba(52,211,153,0.12); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
.ws-err { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
.ws-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  background: currentColor; animation: pulse 2s infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.health-checks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; margin-top: 4px; }
.health-check-card {
  border-radius: 10px; padding: 14px 16px;
  border-left: 4px solid transparent;
}
.check-ok     { background: rgba(52,211,153,0.08); border-left-color: #34d399; }
.check-warn   { background: rgba(251,191,36,0.10); border-left-color: #fbbf24; }
.check-critical,
.check-error  { background: rgba(248,113,113,0.10); border-left-color: #f87171; }

.check-name { font-size: 0.8rem; color: #9ca3af; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .04em; }
.check-status-badge {
  display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 2px 8px;
  border-radius: 6px; margin-bottom: 8px; letter-spacing: .05em;
}
.check-ok     .check-status-badge { background: rgba(52,211,153,0.2); color: #34d399; }
.check-warn   .check-status-badge { background: rgba(251,191,36,0.2); color: #fbbf24; }
.check-critical .check-status-badge,
.check-error    .check-status-badge { background: rgba(248,113,113,0.2); color: #f87171; }
.check-message { font-size: 0.85rem; color: #d1d5db; line-height: 1.4; }

.overall-badge {
  padding: 4px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 700;
}
.overall-ok       { background: rgba(52,211,153,0.2); color: #34d399; }
.overall-warn     { background: rgba(251,191,36,0.2); color: #fbbf24; }
.overall-critical { background: rgba(248,113,113,0.2); color: #f87171; }

/* LLM stats */
.llm-stats-section { margin: 24px 0; background: rgba(17,24,39,0.7); border: 1px solid rgba(55,65,81,0.6); border-radius: 14px; padding: 20px; }
.llm-kpi-row { display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0; }
.llm-kpi { background: rgba(31,41,55,0.8); border: 1px solid rgba(55,65,81,0.5); border-radius: 10px; padding: 14px 20px; min-width: 100px; flex: 1; text-align: center; }
.llm-kpi-label { font-size: 0.75rem; color: #6b7280; margin-bottom: 6px; }
.llm-kpi-value { font-size: 1.4rem; font-weight: 700; color: #e5e7eb; }
.llm-kpi-value.ok { color: #34d399; }
.llm-kpi-value.warn { color: #fbbf24; }
.llm-kpi-value.err { color: #f87171; }
.llm-empty { text-align: center; padding: 20px; color: #6b7280; font-size: 0.9rem; }
.llm-loading { text-align: center; padding: 20px; color: #6b7280; }
.llm-breakdown { margin-top: 16px; }
.llm-breakdown-title { font-size: 0.85rem; font-weight: 600; color: #9ca3af; margin-bottom: 10px; }
.llm-model-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.llm-model-name { width: 160px; font-size: 0.85rem; color: #d1d5db; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
.llm-model-bar-wrap { flex: 1; height: 8px; background: rgba(55,65,81,0.6); border-radius: 4px; overflow: hidden; }
.llm-model-bar { height: 100%; background: linear-gradient(90deg, #38bdf8, #0ea5e9); border-radius: 4px; transition: width .4s ease; min-width: 2px; }
.llm-model-count { width: 40px; text-align: right; font-size: 0.85rem; color: #9ca3af; }

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
