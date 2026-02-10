<template>
  <div class="system-status-card">
    <div class="status-header">
      <h3>系统状态</h3>
      <span :class="['status-badge', statusClass]">
        {{ status?.system_status || 'UNKNOWN' }}
      </span>
    </div>
    
    <div class="status-body">
      <div class="status-item">
        <span class="label">账户ID:</span>
        <span class="value">{{ status?.account_id || '-' }}</span>
      </div>
      <div class="status-item">
        <span class="label">上次运行:</span>
        <span class="value">{{ formatTime(status?.last_cycle) }}</span>
      </div>
      <div class="status-item">
        <span class="label">下次运行:</span>
        <span class="value">{{ formatTime(status?.next_cycle) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SystemStatus } from '@/api/quantLoopService'

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
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style scoped>
.system-status-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #334155;
}

.status-header h3 {
  margin: 0;
  font-size: 18px;
  color: #f1f5f9;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
}

.status-badge.active {
  background: #22c55e20;
  color: #22c55e;
}

.status-badge.paused {
  background: #f59e0b20;
  color: #f59e0b;
}

.status-badge.error {
  background: #ef444420;
  color: #ef4444;
}

.status-badge.unknown {
  background: #64748b20;
  color: #64748b;
}

.status-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-item .label {
  color: #94a3b8;
  font-size: 14px;
}

.status-item .value {
  color: #f1f5f9;
  font-size: 14px;
  font-weight: 500;
}
</style>
