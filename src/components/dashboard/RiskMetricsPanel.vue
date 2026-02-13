<template>
  <div class="risk-metrics-panel">
    <div class="metric-row">
      <span class="metric-label">1日VaR:</span>
      <span class="metric-value">${{ metrics.var_1d.toFixed(0) }}</span>
    </div>
    <div class="metric-row">
      <span class="metric-label">最大回撤:</span>
      <span class="metric-value">{{ metrics.max_drawdown.toFixed(2) }}%</span>
    </div>
    <div class="metric-row">
      <span class="metric-label">夏普比率:</span>
      <span class="metric-value">{{ metrics.sharpe_ratio.toFixed(2) }}</span>
    </div>
    <div class="metric-row">
      <span class="metric-label">Beta系数:</span>
      <span class="metric-value">{{ metrics.beta.toFixed(2) }}</span>
    </div>
    <div class="metric-row">
      <span class="metric-label">集中度:</span>
      <span class="metric-value">{{ metrics.concentration_risk.toFixed(1) }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RiskMetrics } from '@/api/client'

defineProps<{
  metrics: RiskMetrics
}>()
</script>

<style scoped>
.risk-metrics-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.metric-row:last-child {
  border-bottom: none;
}

.metric-label {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
}

.metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #111);
}
</style>