<template>
  <div class="performance-trend-chart">
    <div v-if="!data || data.length === 0" class="empty">暂无数据</div>
    <div v-else class="chart-container">
      <svg :width="width" :height="height" class="chart-svg">
        <!-- Grid lines -->
        <g class="grid">
          <line
            v-for="i in 5"
            :key="'h-' + i"
            :x1="padding.left"
            :y1="padding.top + (chartHeight / 4) * (i - 1)"
            :x2="padding.left + chartWidth"
            :y2="padding.top + (chartHeight / 4) * (i - 1)"
            stroke="#e5e7eb"
            stroke-width="1"
          />
        </g>
        
        <!-- Equity line -->
        <polyline
          :points="equityPoints"
          fill="none"
          stroke="#6366f1"
          stroke-width="2"
          class="line"
        />
        
        <!-- Data points -->
        <circle
          v-for="(point, i) in points"
          :key="i"
          :cx="point.x"
          :cy="point.y"
          r="3"
          fill="#6366f1"
          class="point"
        />
        
        <!-- X-axis labels -->
        <g class="x-axis">
          <text
            v-for="(label, i) in xLabels"
            :key="i"
            :x="label.x"
            :y="height - padding.bottom + 16"
            text-anchor="middle"
            font-size="11"
            fill="#888"
          >
            {{ label.text }}
          </text>
        </g>
        
        <!-- Y-axis labels -->
        <g class="y-axis">
          <text
            v-for="(label, i) in yLabels"
            :key="i"
            :x="padding.left - 8"
            :y="label.y"
            text-anchor="end"
            font-size="11"
            fill="#888"
          >
            {{ label.text }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PerformanceTrend } from '@/api/client'

const props = defineProps<{
  data: PerformanceTrend[]
}>()

const width = 800
const height = 300
const padding = { top: 20, right: 20, bottom: 40, left: 60 }
const chartWidth = width - padding.left - padding.right
const chartHeight = height - padding.top - padding.bottom

const equityValues = computed(() => props.data.map(d => d.equity))
const minEquity = computed(() => Math.min(...equityValues.value))
const maxEquity = computed(() => Math.max(...equityValues.value))

const points = computed(() => {
  if (!props.data.length) return []
  
  return props.data.map((d, i) => {
    const x = padding.left + (chartWidth / (props.data.length - 1)) * i
    const y = padding.top + chartHeight - 
      ((d.equity - minEquity.value) / (maxEquity.value - minEquity.value)) * chartHeight
    
    return { x, y }
  })
})

const equityPoints = computed(() => {
  return points.value.map(p => `${p.x},${p.y}`).join(' ')
})

const xLabels = computed(() => {
  const step = Math.max(1, Math.floor(props.data.length / 6))
  return props.data
    .filter((_, i) => i % step === 0)
    .map((d, idx) => ({
      x: padding.left + (chartWidth / (props.data.length - 1)) * idx * step,
      text: new Date(d.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    }))
})

const yLabels = computed(() => {
  const labels = []
  for (let i = 0; i < 5; i++) {
    const value = minEquity.value + (maxEquity.value - minEquity.value) * (i / 4)
    labels.push({
      y: padding.top + chartHeight - (chartHeight / 4) * i,
      text: `$${(value / 1000).toFixed(0)}k`
    })
  }
  return labels
})
</script>

<style scoped>
.performance-trend-chart {
  width: 100%;
  height: 300px;
}

.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-svg {
  max-width: 100%;
  height: auto;
}

.line {
  transition: stroke-dashoffset 0.5s ease;
}

.point {
  transition: r 0.2s ease;
}

.point:hover {
  r: 5;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary, #888);
}
</style>
