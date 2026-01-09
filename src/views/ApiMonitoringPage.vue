<template>
  <div class="page-container">
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap;">
        <div>
          <h2>📡 API监控</h2>
          <p>实时监控外部API调用，管理Rate Limit，确保系统稳定运行</p>
        </div>
        
        <div class="header-controls">
          <select v-model="timeRange" class="time-range-select" @change="onTimeRangeChange">
            <option value="day">日统计</option>
            <option value="hour">时统计</option>
            <option value="minute">分统计</option>
          </select>
          
          <button 
            class="refresh-button" 
            @click="onRefresh" 
            :disabled="loading"
          >
            <span v-if="!loading">🔄 刷新</span>
            <span v-else>刷新中...</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 加载状态 -->
    <p v-if="loading && !report" class="loading-message">
      正在加载监控数据...
    </p>

    <!-- 错误状态 -->
    <p v-else-if="errorMsg" class="error-message">
      {{ errorMsg }}
    </p>

    <!-- 主内容 -->
    <template v-else-if="report">
      <!-- 健康状态栏 -->
      <HealthStatusBar
        :summary="report.summary"
        :generated-at="report.generated_at"
        :monitoring-enabled="monitoringEnabled"
      />

      <!-- API提供商卡片网格 -->
      <section class="providers-section">
        <h3 class="section-title">API 提供商状态</h3>
        <div class="providers-grid">
          <ApiProviderCard
            v-for="stats in report.daily_stats"
            :key="stats.provider"
            :stats="stats"
            :policy="report.rate_limit_policies[stats.provider] || {}"
          />
        </div>
      </section>

      <!-- 告警和错误面板 -->
      <section class="alerts-section">
        <AlertsPanel
          :critical-alerts="report.critical_alerts"
          :warnings="report.warnings"
          :recent-errors="report.recent_errors"
        />
      </section>

      <!-- 监控说明指南 -->
      <section class="guideline-section">
        <MonitoringGuideline />
      </section>
    </template>

    <!-- 空状态 -->
    <p v-else class="info-message">
      暂无监控数据
    </p>

    <!-- 成功提示 -->
    <div v-if="successMsg" class="success-toast">
      {{ successMsg }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import HealthStatusBar from '../components/HealthStatusBar.vue';
import ApiProviderCard from '../components/ApiProviderCard.vue';
import AlertsPanel from '../components/AlertsPanel.vue';
import MonitoringGuideline from '../components/MonitoringGuideline.vue';
import { fetchMonitoringReport, fetchMonitoringHealth, type MonitoringReport } from '../api/client';

const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');
const report = ref<MonitoringReport | null>(null);
const timeRange = ref<'day' | 'hour' | 'minute'>('day');
const monitoringEnabled = ref(true);

onMounted(() => {
  loadMonitoringData();
  checkHealth();
});

async function loadMonitoringData() {
  loading.value = true;
  errorMsg.value = '';
  
  try {
    const data = await fetchMonitoringReport();
    report.value = data;
  } catch (e: any) {
    console.error('获取监控数据失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = '⏱️ 请求超时，请稍后再试！';
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = '🌐 网络连接失败，请检查网络或后端服务状态';
    } else {
      errorMsg.value = '❌ 获取监控数据失败';
    }
  } finally {
    loading.value = false;
  }
}

async function checkHealth() {
  try {
    const health = await fetchMonitoringHealth();
    monitoringEnabled.value = health.monitoring_enabled && health.redis_enabled;
  } catch (e) {
    console.error('健康检查失败:', e);
    monitoringEnabled.value = false;
  }
}

async function onRefresh() {
  await loadMonitoringData();
  await checkHealth();
  
  // 显示成功提示
  successMsg.value = '✅ 刷新成功';
  setTimeout(() => {
    successMsg.value = '';
  }, 2000);
}

async function onTimeRangeChange() {
  // 注意：当前后端只支持 /report 端点，不支持按时间范围筛选
  // 这里保留接口以便后续扩展
  console.log('时间范围切换为:', timeRange.value);
  // await loadMonitoringData();
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0 0 8px;
  font-size: 1.8rem;
  font-weight: 700;
  color: #e5e7eb;
}

.section-header p {
  margin: 0;
  font-size: 0.95rem;
  color: #9ca3af;
  line-height: 1.6;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-range-select {
  padding: 10px 16px;
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid rgba(55, 65, 81, 0.8);
  border-radius: 8px;
  color: #e5e7eb;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-range-select:hover {
  border-color: rgba(56, 189, 248, 0.5);
}

.time-range-select:focus {
  outline: none;
  border-color: #38bdf8;
}

.refresh-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
  border: 1px solid rgba(56, 189, 248, 0.5);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.refresh-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.4);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-message {
  text-align: center;
  padding: 60px 20px;
  font-size: 1rem;
  color: #9ca3af;
  background: rgba(31, 41, 55, 0.5);
  border: 1px dashed rgba(107, 114, 128, 0.5);
  border-radius: 12px;
  margin: 20px 0;
}

.error-message {
  text-align: center;
  padding: 24px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 12px;
  color: #ef4444;
  font-size: 1rem;
  margin: 20px 0;
}

.info-message {
  text-align: center;
  padding: 60px 20px;
  font-size: 1rem;
  color: #9ca3af;
  background: rgba(31, 41, 55, 0.5);
  border: 1px dashed rgba(107, 114, 128, 0.5);
  border-radius: 12px;
  margin: 20px 0;
}

.providers-section {
  margin: 32px 0;
}

.section-title {
  margin: 0 0 20px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #e5e7eb;
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 20px;
}

.alerts-section {
  margin: 32px 0;
}

.guideline-section {
  margin: 48px 0 32px;
}

.success-toast {
  position: fixed;
  top: 80px;
  right: 20px;
  padding: 16px 24px;
  background: rgba(34, 197, 94, 0.95);
  color: white;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  font-weight: 600;
  font-size: 0.95rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .page-container {
    padding: 16px;
  }
  
  .section-header h2 {
    font-size: 1.5rem;
  }
  
  .providers-grid {
    grid-template-columns: 1fr;
  }
  
  .header-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
