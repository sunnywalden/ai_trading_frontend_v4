<template>
  <div class="alerts-panel">
    <!-- 临界告警 -->
    <div class="alerts-section">
      <h3 class="section-title">
        🚨 临界告警 <span class="count critical">({{ criticalAlerts.length }})</span>
      </h3>
      <div v-if="criticalAlerts.length === 0" class="empty-state">
        <p>🎉 暂无临界告警</p>
      </div>
      <div v-else class="alerts-list">
        <div
          v-for="(alert, index) in criticalAlerts"
          :key="`critical-${index}`"
          class="alert-item critical"
        >
          <div class="alert-header">
            <span class="alert-icon">🔴</span>
            <span class="alert-provider">{{ alert.provider }}</span>
          </div>
          <p class="alert-message">{{ alert.message }}</p>
          <div class="alert-footer">
            <span class="alert-remaining">剩余: {{ alert.remaining }} 次</span>
            <span v-if="alert.timestamp" class="alert-time">{{ formatTime(alert.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 警告 -->
    <div class="alerts-section">
      <h3 class="section-title">
        ⚠️ 警告 <span class="count warning">({{ warnings.length }})</span>
      </h3>
      <div v-if="warnings.length === 0" class="empty-state">
        <p>✅ 暂无警告</p>
      </div>
      <div v-else class="alerts-list">
        <div
          v-for="(alert, index) in warnings"
          :key="`warning-${index}`"
          class="alert-item warning"
        >
          <div class="alert-header">
            <span class="alert-icon">🟡</span>
            <span class="alert-provider">{{ alert.provider }}</span>
          </div>
          <p class="alert-message">{{ alert.message }}</p>
          <div class="alert-footer">
            <span class="alert-remaining">剩余: {{ alert.remaining }} 次</span>
            <span v-if="alert.timestamp" class="alert-time">{{ formatTime(alert.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 最近错误 -->
    <div class="errors-section">
      <h3 class="section-title">
        🐛 最近错误 <span class="count">(最多显示10条)</span>
      </h3>
      <div v-if="recentErrors.length === 0" class="empty-state">
        <p>✅ 今日暂无错误记录</p>
      </div>
      <div v-else class="errors-list">
        <div
          v-for="(error, index) in recentErrors"
          :key="`error-${index}`"
          class="error-item"
        >
          <div class="error-header">
            <span class="error-time">🕐 {{ formatDateTime(error.timestamp) }}</span>
            <span class="error-provider">{{ error.provider }}</span>
            <span class="error-endpoint">{{ error.endpoint }}</span>
          </div>
          <div class="error-message">
            <span class="error-icon">❌</span>
            <span>{{ error.error_message }}</span>
          </div>
          <button
            v-if="error.error_details"
            class="details-toggle"
            @click="toggleDetails(index)"
          >
            {{ expandedErrors.includes(index) ? '收起详情' : '展开详情' }}
          </button>
          <div v-if="expandedErrors.includes(index)" class="error-details">
            <pre>{{ JSON.stringify(error.error_details, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Alert, ErrorLog } from '../api/client';

interface Props {
  criticalAlerts: Alert[];
  warnings: Alert[];
  recentErrors: ErrorLog[];
}

defineProps<Props>();

const expandedErrors = ref<number[]>([]);

function toggleDetails(index: number) {
  const idx = expandedErrors.value.indexOf(index);
  if (idx > -1) {
    expandedErrors.value.splice(idx, 1);
  } else {
    expandedErrors.value.push(index);
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', { 
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}
</script>

<style scoped>
.alerts-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #e5e7eb;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count {
  font-size: 0.85rem;
  color: #9ca3af;
  font-weight: normal;
}

.count.critical {
  color: #ef4444;
}

.count.warning {
  color: #f59e0b;
}

.empty-state {
  padding: 32px;
  text-align: center;
  background: rgba(31, 41, 55, 0.5);
  border: 1px dashed rgba(107, 114, 128, 0.5);
  border-radius: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
  color: #9ca3af;
}

.alerts-list,
.errors-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  padding: 16px;
  border-radius: 10px;
  border: 1px solid;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item.critical {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.4);
}

.alert-item.warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.4);
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-icon {
  font-size: 1.2rem;
}

.alert-provider {
  font-weight: 600;
  color: #e5e7eb;
  font-size: 0.95rem;
}

.alert-message {
  margin: 0;
  font-size: 0.9rem;
  color: #e5e7eb;
  line-height: 1.5;
}

.alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #9ca3af;
}

.alert-remaining {
  font-weight: 600;
}

.error-item {
  padding: 16px;
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(55, 65, 81, 0.8);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.error-time {
  font-size: 0.85rem;
  color: #9ca3af;
}

.error-provider {
  padding: 4px 8px;
  background: rgba(56, 189, 248, 0.2);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #38bdf8;
}

.error-endpoint {
  font-size: 0.85rem;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
}

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.9rem;
  color: #ef4444;
  line-height: 1.5;
}

.error-icon {
  flex-shrink: 0;
}

.details-toggle {
  align-self: flex-start;
  padding: 6px 12px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 6px;
  color: #38bdf8;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.details-toggle:hover {
  background: rgba(56, 189, 248, 0.2);
}

.error-details {
  padding: 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(55, 65, 81, 0.6);
  border-radius: 8px;
  overflow-x: auto;
}

.error-details pre {
  margin: 0;
  font-size: 0.8rem;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
  line-height: 1.4;
}
</style>
