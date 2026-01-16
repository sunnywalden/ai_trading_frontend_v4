<template>
  <div class="digest-card">
    <div class="header">
      <h3>宏观风险摘要</h3>
      <span class="level" :class="levelClass">{{ level }}</span>
    </div>
    <div class="score-row">
      <span class="score-label">综合评分</span>
      <span class="score-value">{{ score }}</span>
    </div>
    <p class="summary">{{ summary }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MacroRiskOverviewResponse } from '../api/client';

const props = defineProps<{ data: MacroRiskOverviewResponse }>();

const level = computed(() => props.data.overall_risk?.level || 'UNKNOWN');
const score = computed(() => props.data.overall_risk?.score ?? 0);
const summary = computed(() => props.data.overall_risk?.summary || '暂无摘要');

const levelClass = computed(() => {
  const lv = level.value.toLowerCase();
  if (lv === 'low') return 'low';
  if (lv === 'medium') return 'medium';
  if (lv === 'high') return 'high';
  if (lv === 'critical') return 'critical';
  return 'unknown';
});
</script>

<style scoped>
.digest-card {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.level {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.level.low {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.level.medium {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

.level.high {
  background: rgba(249, 115, 22, 0.2);
  color: #fdba74;
}

.level.critical {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.level.unknown {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

.score-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.score-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.score-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #e5e7eb;
}

.summary {
  margin: 0;
  font-size: 0.85rem;
  color: #d1d5db;
  line-height: 1.5;
}
</style>
