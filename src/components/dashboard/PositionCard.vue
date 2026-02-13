<template>
  <div class="position-card">
    <div class="position-header">
      <div class="symbol-info">
        <span class="symbol">{{ position.symbol }}</span>
        <span class="name">{{ position.name }}</span>
      </div>
      <span class="pnl" :class="position.unrealized_pnl >= 0 ? 'positive' : 'negative'">
        {{ position.unrealized_pnl >= 0 ? '+' : '' }}{{ position.unrealized_pnl_pct.toFixed(2) }}%
      </span>
    </div>
    <div class="position-details">
      <div class="detail-item">
        <span class="label">持仓:</span>
        <span class="value">{{ position.quantity }}</span>
      </div>
      <div class="detail-item">
        <span class="label">市值:</span>
        <span class="value">${{ position.market_value.toFixed(0) }}</span>
      </div>
      <div class="detail-item">
        <span class="label">占比:</span>
        <span class="value">{{ position.weight.toFixed(1) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PositionSummary } from '@/api/client'

defineProps<{
  position: PositionSummary
}>()
</script>

<style scoped>
.position-card {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.position-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.symbol-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.symbol {
  font-weight: 700;
  font-size: 0.95rem;
}

.name {
  font-size: 0.75rem;
  color: var(--text-secondary, #888);
}

.pnl {
  font-size: 0.9rem;
  font-weight: 700;
}

.pnl.positive {
  color: #10b981;
}

.pnl.negative {
  color: #ef4444;
}

.position-details {
  display: flex;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item .label {
  font-size: 0.7rem;
  color: var(--text-secondary, #888);
}

.detail-item .value {
  font-size: 0.85rem;
  font-weight: 600;
}
</style>