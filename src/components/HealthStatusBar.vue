<template>
  <div class="health-status-bar">
    <div class="status-item">
      <span :class="['status-indicator', statusClass]">
        {{ statusIcon }}
      </span>
      <span class="status-text">{{ statusText }}</span>
    </div>
    
    <div class="divider"></div>
    
    <div class="status-item">
      <span class="label">⚠️ 警告:</span>
      <span class="value warning">{{ summary.warnings }}</span>
    </div>
    
    <div class="divider"></div>
    
    <div class="status-item">
      <span class="label">🚨 临界告警:</span>
      <span class="value critical">{{ summary.critical_alerts }}</span>
    </div>
    
    <div class="divider"></div>
    
    <div class="status-item">
      <span class="label">❌ 今日错误:</span>
      <span class="value error">{{ summary.total_errors_today }}</span>
    </div>
    
    <div class="divider"></div>
    
    <div class="status-item">
      <span class="label">🕐 最后更新:</span>
      <span class="value">{{ lastUpdateText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Summary {
  total_providers: number;
  critical_alerts: number;
  warnings: number;
  total_errors_today: number;
}

interface Props {
  summary: Summary;
  generatedAt: string;
  monitoringEnabled: boolean;
}

const props = defineProps<Props>();

const statusClass = computed(() => {
  if (!props.monitoringEnabled) return 'offline';
  if (props.summary.critical_alerts > 0) return 'critical';
  if (props.summary.warnings > 0) return 'warning';
  return 'normal';
});

const statusIcon = computed(() => {
  if (!props.monitoringEnabled) return '🔴';
  if (props.summary.critical_alerts > 0) return '🔴';
  if (props.summary.warnings > 0) return '🟡';
  return '🟢';
});

const statusText = computed(() => {
  if (!props.monitoringEnabled) return '监控服务离线';
  if (props.summary.critical_alerts > 0) return '存在临界告警';
  if (props.summary.warnings > 0) return '运行中（有警告）';
  return '监控服务运行正常';
});

const lastUpdateText = computed(() => {
  if (!props.generatedAt) return '--';
  
  const now = new Date();
  const generated = new Date(props.generatedAt);
  const diffMs = now.getTime() - generated.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  return `${Math.floor(diffHours / 24)}天前`;
});
</script>

<style scoped>
.health-status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  font-size: 1.2rem;
}

.status-text {
  font-weight: 600;
  font-size: 0.95rem;
}

.status-indicator.normal {
  color: #22c55e;
}

.status-indicator.warning {
  color: #f59e0b;
}

.status-indicator.critical {
  color: #ef4444;
}

.status-indicator.offline {
  color: #6b7280;
}

.divider {
  width: 1px;
  height: 20px;
  background: rgba(156, 163, 175, 0.3);
}

.label {
  font-size: 0.85rem;
  color: #9ca3af;
}

.value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e5e7eb;
}

.value.warning {
  color: #f59e0b;
}

.value.critical {
  color: #ef4444;
}

.value.error {
  color: #ef4444;
}

@media (max-width: 900px) {
  .health-status-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .divider {
    width: 100%;
    height: 1px;
  }
}
</style>
