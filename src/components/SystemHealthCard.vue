<template>
  <div class="health-card">
    <div class="header">
      <h3>系统健康</h3>
      <span class="status" :class="statusClass">{{ statusText }}</span>
    </div>
    <div class="body">
      <div class="item">
        <span class="label">监控状态</span>
        <span class="value">{{ enabledText }}</span>
      </div>
      <div class="item">
        <span class="label">最近更新时间</span>
        <span class="value">{{ lastUpdated }}</span>
      </div>
    </div>
    <button class="retry" @click="$emit('retry')">重试</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
  monitoringEnabled: boolean;
  lastUpdated: string;
}>();

defineEmits<{ retry: [] }>();

const statusText = computed(() => props.status.toUpperCase());
const enabledText = computed(() => (props.monitoringEnabled ? '已启用' : '未启用'));

const statusClass = computed(() => {
  const st = props.status.toLowerCase();
  if (st === 'healthy') return 'ok';
  if (st === 'warning') return 'warn';
  if (st === 'critical') return 'danger';
  return 'unknown';
});
</script>

<style scoped>
.health-card {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h3 {
  margin: 0;
  font-size: 1rem;
  color: #e5e7eb;
}

.status {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status.ok {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.status.warn {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

.status.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.status.unknown {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

.body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e5e7eb;
}

.retry {
  align-self: flex-end;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  font-size: 0.85rem;
}

.retry:hover {
  background: rgba(56, 189, 248, 0.2);
}
</style>
