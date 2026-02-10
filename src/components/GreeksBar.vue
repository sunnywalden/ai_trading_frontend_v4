<template>
  <div class="greeks-bar-item">
    <span class="bar-label">{{ label }}</span>
    <div class="bar-track">
      <div class="bar-fill" :class="barColor" :style="{ width: barWidth + '%' }"></div>
    </div>
    <span class="bar-value" :class="barColor">{{ value.toFixed(1) }}%</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ label: string; value: number }>()

const barWidth = computed(() => Math.min(Math.abs(props.value), 100))
const barColor = computed(() => {
  const abs = Math.abs(props.value)
  if (abs > 60) return 'bar-danger'
  if (abs > 40) return 'bar-warning'
  return 'bar-safe'
})
</script>

<style scoped>
.greeks-bar-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.bar-label { min-width: 48px; font-size: 0.85rem; font-weight: 600; }
.bar-track { flex: 1; height: 8px; background: var(--bg-secondary, #e5e7eb); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width .3s; }
.bar-value { min-width: 50px; text-align: right; font-size: 0.8rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.bar-safe .bar-fill, .bar-safe { background: #10b981; color: #10b981; }
.bar-warning .bar-fill, .bar-warning { background: #f59e0b; color: #f59e0b; }
.bar-danger .bar-fill, .bar-danger { background: #ef4444; color: #ef4444; }
.bar-safe .bar-fill { background: #10b981; }
.bar-warning .bar-fill { background: #f59e0b; }
.bar-danger .bar-fill { background: #ef4444; }
</style>
