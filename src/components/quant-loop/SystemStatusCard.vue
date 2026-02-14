<template>
  <div class="system-status-card">
    <div class="status-header">
      <h3>{{ $t('dashboard.system_status') }}</h3>
      <span :class="['status-badge', statusClass]">
        {{ status?.system_status || 'UNKNOWN' }}
      </span>
    </div>
    
    <div class="status-body">
      <div class="status-item">
        <span class="label">{{ $t('dashboard.account') }}:</span>
        <span class="value">{{ status?.account_id || '-' }}</span>
      </div>
      <div class="status-item">
        <span class="label">{{ $t('dashboard.last') }}:</span>
        <span class="value">{{ formatTime(status?.last_cycle) }}</span>
      </div>
      <div class="status-item">
        <span class="label">{{ $t('dashboard.next') }}:</span>
        <span class="value">{{ formatTime(status?.next_cycle) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SystemStatus } from '@/api/quantLoopService'

const { locale } = useI18n()
const props = defineProps<{
  status: SystemStatus | null
}>()

const statusClass = computed(() => {
  if (!props.status) return 'unknown'
  switch (props.status.system_status) {
    case 'ACTIVE':
      return 'active'
    case 'PAUSED':
      return 'paused'
    case 'ERROR':
      return 'error'
    default:
      return 'unknown'
  }
})

function formatTime(time: string | undefined) {
  if (!time) return '-'
  return new Date(time).toLocaleString(locale.value)
}
</script>

<style scoped>
.system-status-card {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  /* 移动端触摸优化 */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.system-status-card:hover {
  border-color: rgba(167, 139, 250, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(139, 92, 246, 0.2);
}

.status-header h3 {
  margin: 0;
  font-size: 20px;
  color: #f1f5f9;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-header h3::before {
  content: '📊';
  font-size: 22px;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

.status-badge.active {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  box-shadow: 0 2px 12px rgba(34, 197, 94, 0.4);
}

.status-badge.paused {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 2px 12px rgba(245, 158, 11, 0.4);
}

.status-badge.error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 2px 12px rgba(239, 68, 68, 0.4);
}

.status-badge.unknown {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  color: white;
  box-shadow: 0 2px 12px rgba(100, 116, 139, 0.4);
}

.status-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  transition: all 0.2s;
  border: 1px solid rgba(148, 163, 184, 0.05);
}

.status-item:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.2);
  transform: translateX(4px);
}

.status-item .label {
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
}

.status-item .value {
  color: #f1f5f9;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Monaco', 'Courier New', monospace;
}

/* 移动端响应式优化 */
@media (max-width: 768px) {
  .system-status-card {
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
  }
  
  .status-header {
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
  
  .status-header h3 {
    font-size: 18px;
  }
  
  .status-header h3::before {
    font-size: 20px;
  }
  
  .status-badge {
    padding: 6px 12px;
    font-size: 12px;
    letter-spacing: 0.3px;
  }
  
  .status-body {
    gap: var(--spacing-md);
  }
  
  .status-item {
    padding: var(--spacing-md);
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
    min-height: 48px;
  }
  
  .status-item:hover {
    transform: none;
  }
  
  .status-item:active {
    transform: scale(0.98);
    background: rgba(139, 92, 246, 0.15);
  }
  
  .status-item .label {
    font-size: 13px;
    color: #a0aec0;
  }
  
  .status-item .value {
    font-size: 15px;
    word-break: break-all;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .system-status-card {
    padding: var(--spacing-md);
  }
  
  .status-header h3 {
    font-size: 16px;
  }
  
  .status-badge {
    font-size: 11px;
    padding: 4px 10px;
  }
}
</style>
