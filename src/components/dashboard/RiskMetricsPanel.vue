<template>
  <div class="risk-metrics-panel">
    <!-- Visual Gauge for leading Risk Metric (VaR 1D) -->
    <div class="gauge-container">
      <VaRGauge 
        label="1日 VaR (95%)"
        :value="metrics.var_1d"
        :max-scale="5.0"
        sublabel="历史模拟法"
      />
    </div>

    <div class="metrics-grid">
      <div class="metric-item">
        <span class="m-label">最大回撤</span>
        <span class="m-value neg">{{ metrics.max_drawdown.toFixed(2) }}%</span>
      </div>
      <div class="metric-item">
        <span class="m-label">夏普比率 (Sharpe)</span>
        <span class="m-value accent">{{ (metrics.sharpe_ratio || 0).toFixed(2) }}</span>
      </div>
      <div class="metric-item">
        <span class="m-label">Beta 系数</span>
        <span class="m-value">{{ (metrics.beta || 0).toFixed(2) }}</span>
      </div>
      <div class="metric-item">
        <span class="m-label">持仓集中度</span>
        <span class="m-value" :class="metrics.concentration_risk > 30 ? 'warn' : ''">
          {{ metrics.concentration_risk.toFixed(1) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RiskMetrics } from '@/api/client'
import VaRGauge from '@/components/VaRGauge.vue'

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