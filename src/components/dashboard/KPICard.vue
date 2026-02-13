<template>
  <div class="kpi-card" :class="[trend ? `trend-${trend}` : '', { 'is-loading': loading }]">
    <div class="kpi-icon" v-if="icon">{{ icon }}</div>
    <div class="kpi-content">
      <div class="kpi-header">
        <div class="kpi-label">{{ label }}</div>
        <button v-if="showRefresh" class="btn-icon btn-small" @click.stop="$emit('refresh')" :disabled="loading">
          <svg :class="{ 'spinning': loading }" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
        </button>
      </div>
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
  loading?: boolean
  showRefresh?: boolean
}>()

defineEmits(['refresh'])
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
  position: relative;
  overflow: hidden;
}

.kpi-card.is-loading::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.btn-icon {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background-color: #f1f5f9;
  color: #6366f1;
}

.btn-small {
  padding: 2px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
