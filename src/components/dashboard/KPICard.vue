<template>
  <div class="kpi-card" :class="trend ? `trend-${trend}` : ''">
    <div class="kpi-icon" v-if="icon">{{ icon }}</div>
    <div class="kpi-content">
      <div class="kpi-label">{{ label }}</div>
      <div class="kpi-value">{{ value }}</div>
      <div class="kpi-sub" v-if="subValue">{{ subValue }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  subValue?: string
  icon?: string
  trend?: 'up' | 'down'
}>()
</script>

<style scoped>
.kpi-card {
  background: var(--bg-card, #fff);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.kpi-icon {
  font-size: 2rem;
  line-height: 1;
}

.kpi-content {
  flex: 1;
}

.kpi-label {
  font-size: 0.85rem;
  color: var(--text-secondary, #888);
  margin-bottom: 4px;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary, #111);
}

.kpi-sub {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  margin-top: 4px;
}

.trend-up .kpi-value {
  color: #10b981;
}

.trend-down .kpi-value {
  color: #ef4444;
}
</style>
