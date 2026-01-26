<template>
  <span class="tag" :class="tagClass">
    计划偏离 {{ displayValue }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{ deviation?: number | null }>(),
  { deviation: 0 }
);

const safeDeviation = computed(() => props.deviation ?? 0);

const displayValue = computed(() => `${Math.round(safeDeviation.value)}%`);

const tagClass = computed(() => {
  if (safeDeviation.value <= 10) return 'ok';
  if (safeDeviation.value <= 30) return 'warn';
  return 'danger';
});
</script>

<style scoped>
.tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
}

.tag.ok {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.tag.warn {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

.tag.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}
</style>
