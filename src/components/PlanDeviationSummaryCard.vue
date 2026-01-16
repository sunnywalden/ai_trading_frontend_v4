<template>
  <div class="summary-card">
    <div class="card-header">
      <span class="title">计划偏离概览</span>
      <span class="badge" :class="badgeClass">{{ badgeText }}</span>
    </div>
    <div class="stats">
      <div class="stat">
        <span class="label">监控标的</span>
        <span class="value">{{ totalSymbols }}</span>
      </div>
      <div class="stat">
        <span class="label">过度交易偏离</span>
        <span class="value warn">{{ overtradeCount }}</span>
      </div>
      <div class="stat">
        <span class="label">报复交易偏离</span>
        <span class="value danger">{{ revengeCount }}</span>
      </div>
    </div>
    <p class="hint">偏离过多时建议降低频率并复盘计划执行。</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  totalSymbols: number;
  overtradeCount: number;
  revengeCount: number;
}

const props = defineProps<Props>();

const badgeText = computed(() => {
  if (props.overtradeCount + props.revengeCount === 0) return '良好';
  if (props.overtradeCount + props.revengeCount <= 2) return '注意';
  return '警戒';
});

const badgeClass = computed(() => {
  if (props.overtradeCount + props.revengeCount === 0) return 'badge-ok';
  if (props.overtradeCount + props.revengeCount <= 2) return 'badge-warn';
  return 'badge-danger';
});
</script>

<style scoped>
.summary-card {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 1rem;
  font-weight: 600;
  color: #e5e7eb;
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-ok {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.badge-warn {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.badge-danger {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e5e7eb;
}

.value.warn {
  color: #fbbf24;
}

.value.danger {
  color: #f87171;
}

.hint {
  margin: 0;
  font-size: 0.78rem;
  color: #9ca3af;
}
</style>
