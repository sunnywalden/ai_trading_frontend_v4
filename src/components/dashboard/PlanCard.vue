<template>
  <div class="plan-card">
    <div class="plan-header">
      <span class="symbol">{{ plan.symbol }}</span>
      <span class="status" :class="'status-' + plan.status.toLowerCase()">{{ plan.status }}</span>
    </div>
    <div class="plan-details">
      <div class="detail">
        <span class="label">类型:</span>
        <span class="value">{{ plan.plan_type }}</span>
      </div>
      <div class="detail" v-if="plan.quantity">
        <span class="label">数量:</span>
        <span class="value">{{ plan.quantity }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TradingPlanSummary } from '@/api/client'

defineProps<{
  plan: TradingPlanSummary
}>()
</script>

<style scoped>
.plan-card {
  padding: 10px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.symbol {
  font-weight: 700;
  font-size: 0.9rem;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.plan-details {
  display: flex;
  gap: 12px;
}

.detail {
  display: flex;
  gap: 4px;
  font-size: 0.8rem;
}

.detail .label {
  color: var(--text-secondary, #888);
}

.detail .value {
  font-weight: 600;
}
</style>