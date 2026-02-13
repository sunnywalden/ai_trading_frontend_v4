<template>
  <div class="signal-card" @click="$emit('click')">
    <div class="signal-header">
      <span class="symbol">{{ signal.symbol }}</span>
      <span class="direction" :class="signal.direction.toLowerCase()">{{ signal.direction }}</span>
    </div>
    <div class="signal-content">
      <div class="metric">
        <span class="metric-label">置信度:</span>
        <span class="metric-value">{{ (signal.confidence * 100).toFixed(0) }}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">预期收益:</span>
        <span class="metric-value">{{ signal.expected_return.toFixed(2) }}%</span>
      </div>
      <div class="metric">
        <span class="metric-label">风险分:</span>
        <span class="metric-value">{{ signal.risk_score.toFixed(1) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SignalSummary } from '@/api/client'

defineProps<{
  signal: SignalSummary
}>()

defineEmits(['click'])
</script>

<style scoped>
.signal-card {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.signal-card:hover {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

.signal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.symbol {
  font-weight: 700;
  font-size: 0.95rem;
}

.direction {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.direction.buy,
.direction.long {
  background: #d1fae5;
  color: #065f46;
}

.direction.sell,
.direction.short {
  background: #fee2e2;
  color: #991b1b;
}

.signal-content {
  display: flex;
  gap: 16px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 0.7rem;
  color: var(--text-secondary, #888);
}

.metric-value {
  font-size: 0.85rem;
  font-weight: 600;
}
</style>