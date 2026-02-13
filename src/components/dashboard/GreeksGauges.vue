<template>
  <div class="greeks-gauges">
    <div class="gauge" v-for="(value, key) in greeksData" :key="key">
      <div class="gauge-label">{{ key }}</div>
      <div class="gauge-bar">
        <div 
          class="gauge-fill" 
          :style="{ 
            width: `${Math.abs(value.pct)}%`, 
            backgroundColor: getColor(value.pct) 
          }"
        ></div>
      </div>
      <div class="gauge-value">
        <span class="value-abs">${{ formatNumber(value.abs) }}</span>
        <span class="value-pct" :class="{ negative: value.pct < 0 }">
          {{ value.pct >= 0 ? '+' : '' }}{{ value.pct.toFixed(1) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GreeksExposure } from '@/api/client'

const props = defineProps<{
  greeks: GreeksExposure
}>()

const greeksData = computed(() => ({
  Delta: { abs: props.greeks.delta, pct: props.greeks.delta_pct },
  Gamma: { abs: props.greeks.gamma, pct: props.greeks.gamma_pct },
  Vega: { abs: props.greeks.vega, pct: props.greeks.vega_pct },
  Theta: { abs: props.greeks.theta, pct: props.greeks.theta_pct },
}))

function getColor(pct: number): string {
  const absPct = Math.abs(pct)
  if (absPct > 80) return '#ef4444'
  if (absPct > 60) return '#f59e0b'
  if (absPct > 40) return '#eab308'
  return '#10b981'
}

function formatNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1000) return (value / 1000).toFixed(1) + 'k'
  return value.toFixed(0)
}
</script>

<style scoped>
.greeks-gauges {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gauge {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gauge-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary, #111);
}

.gauge-bar {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.gauge-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease, background-color 0.3s ease;
}

.gauge-value {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.value-abs {
  color: var(--text-secondary, #666);
}

.value-pct {
  font-weight: 600;
  color: #10b981;
}

.value-pct.negative {
  color: #ef4444;
}
</style>
