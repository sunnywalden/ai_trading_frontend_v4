<template>
  <div class="plan-card" :class="statusClass">
    <div class="plan-header">
      <div class="symbol-wrap">
        <span class="symbol">{{ plan.symbol }}</span>
        <span class="type-chip">{{ plan.plan_type || 'AUTONOMOUS' }}</span>
      </div>
      <span class="status" :class="statusClass">{{ plan.status }}</span>
    </div>

    <div class="plan-details">
      <div class="detail">
        <span class="label">计划ID</span>
        <span class="value mono">#{{ plan.plan_id }}</span>
      </div>
      <div class="detail">
        <span class="label">创建时间</span>
        <span class="value">{{ formatTime(plan.created_at) }}</span>
      </div>
      <div class="detail" v-if="plan.target_price !== undefined && plan.target_price !== null">
        <span class="label">目标价</span>
        <span class="value">${{ Number(plan.target_price).toFixed(2) }}</span>
      </div>
      <div class="detail" v-if="plan.quantity && plan.quantity > 0">
        <span class="label">数量</span>
        <span class="value">{{ plan.quantity }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TradingPlanSummary } from '@/api/client'
import { formatClientDateTime } from '@/utils/datetime'

const props = defineProps<{
  plan: TradingPlanSummary
}>()

const statusClass = computed(() => {
  const status = (props.plan.status || '').toUpperCase()
  if (status === 'ACTIVE' || status === 'AUTO_EXECUTING') return 'status-active'
  if (status === 'EXECUTED' || status === 'COMPLETED') return 'status-executed'
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'REVOKED') return 'status-failed'
  return 'status-default'
})

function formatTime(raw?: string): string {
  return formatClientDateTime(raw)
}
</script>

<style scoped>
.plan-card {
  position: relative;
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.72), rgba(17, 24, 39, 0.62));
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  transition: all 0.18s ease;
  overflow: hidden;
}

.plan-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: rgba(100, 116, 139, 0.6);
}

.plan-card:hover {
  transform: translateY(-1px);
  border-color: rgba(56, 189, 248, 0.42);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.symbol-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.symbol {
  font-weight: 700;
  font-size: 0.96rem;
  color: #e2e8f0;
  letter-spacing: 0.02em;
}

.type-chip {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.68rem;
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #7dd3fc;
  background: rgba(56, 189, 248, 0.08);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.status {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
  white-space: nowrap;
}

.status-active {
  color: #10b981;
  background: rgba(16, 185, 129, 0.14);
  border-color: rgba(16, 185, 129, 0.35);
}

.status-executed {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.14);
  border-color: rgba(56, 189, 248, 0.35);
}

.status-failed {
  color: #f87171;
  background: rgba(248, 113, 113, 0.14);
  border-color: rgba(248, 113, 113, 0.35);
}

.status-default {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.28);
}

.plan-card.status-active::before {
  background: #10b981;
}

.plan-card.status-executed::before {
  background: #38bdf8;
}

.plan-card.status-failed::before {
  background: #f87171;
}

.plan-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.detail .label {
  color: #64748b;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.detail .value {
  font-weight: 600;
  font-size: 0.82rem;
  color: #e2e8f0;
}

.detail .value.mono {
  font-family: 'SF Mono', 'Fira Code', monospace;
}
</style>