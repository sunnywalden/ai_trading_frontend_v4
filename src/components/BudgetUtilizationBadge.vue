<template>
  <span class="badge" :class="badgeClass">
    预算占用 {{ displayValue }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ utilization: number }>();

const displayValue = computed(() => `${Math.round(props.utilization * 100)}%`);

const badgeClass = computed(() => {
  if (props.utilization <= 0.6) return 'ok';
  if (props.utilization <= 0.85) return 'warn';
  return 'danger';
});
</script>

<style scoped>
.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.badge.ok {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.badge.warn {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.badge.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
}
</style>
