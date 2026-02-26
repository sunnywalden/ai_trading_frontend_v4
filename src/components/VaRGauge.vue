<template>
  <div class="var-gauge">
    <div class="gauge-header">
      <span class="gauge-label">{{ label }}</span>
      <span class="gauge-badge" :class="levelClass">{{ levelText }}</span>
    </div>

    <!-- SVG 半圆仪表盘 -->
    <svg class="gauge-svg" viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景弧 -->
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke="#2a2f3e"
        stroke-width="16"
        stroke-linecap="round"
      />
      <!-- 彩色进度弧 -->
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        :stroke="arcColor"
        stroke-width="16"
        stroke-linecap="round"
        stroke-dasharray="251.2"
        :stroke-dashoffset="dashOffset"
        class="gauge-arc"
      />
      <!-- 中心数值 -->
      <text x="100" y="95" text-anchor="middle" class="gauge-value-text">
        {{ displayValue }}%
      </text>
      <!-- 底部 sub label -->
      <text x="100" y="108" text-anchor="middle" class="gauge-sub-text">
        {{ sublabel }}
      </text>
    </svg>

    <!-- 刻度标注 -->
    <div class="gauge-scale">
      <span class="scale-min">0%</span>
      <span class="scale-mid">{{ midValue }}%</span>
      <span class="scale-max">{{ maxScale }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number        // 当前 VaR 值（百分比，如 2.5 表示 2.5%）
  maxScale?: number    // 刻度最大值，默认 10
  label?: string       // 标题，如 "1日 VaR (95%)"
  sublabel?: string    // 第二行说明
}

const props = withDefaults(defineProps<Props>(), {
  maxScale: 10,
  label: 'VaR',
  sublabel: '在险价值',
})

/** 圆弧周长 = π × r = π × 80 ≈ 251.2 */
const ARC_LENGTH = 251.2

const clampedValue = computed(() => Math.min(Math.max(props.value, 0), props.maxScale))

const displayValue = computed(() => props.value.toFixed(2))

const midValue = computed(() => (props.maxScale / 2).toFixed(0))

/** dashOffset 越小 → 弧线越长 */
const dashOffset = computed(() =>
  ARC_LENGTH - (clampedValue.value / props.maxScale) * ARC_LENGTH
)

const arcColor = computed(() => {
  const ratio = clampedValue.value / props.maxScale
  if (ratio < 0.3) return '#22c55e'  // 绿
  if (ratio < 0.6) return '#f59e0b'  // 黄
  if (ratio < 0.8) return '#f97316'  // 橙
  return '#ef4444'                    // 红
})

const levelClass = computed(() => {
  const ratio = clampedValue.value / props.maxScale
  if (ratio < 0.3) return 'level-low'
  if (ratio < 0.6) return 'level-medium'
  if (ratio < 0.8) return 'level-high'
  return 'level-extreme'
})

const levelText = computed(() => {
  const ratio = clampedValue.value / props.maxScale
  if (ratio < 0.3) return '低风险'
  if (ratio < 0.6) return '中风险'
  if (ratio < 0.8) return '高风险'
  return '极端风险'
})
</script>

<style scoped>
.var-gauge {
  background: var(--color-bg-secondary, #1a1f2e);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.gauge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.gauge-label {
  font-size: 13px;
  color: var(--color-text-secondary, #9ca3af);
  font-weight: 500;
}

.gauge-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}
.level-low     { background: rgba(34,197,94,0.15);  color: #22c55e; }
.level-medium  { background: rgba(245,158,11,0.15); color: #f59e0b; }
.level-high    { background: rgba(249,115,22,0.15); color: #f97316; }
.level-extreme { background: rgba(239,68,68,0.15);  color: #ef4444; }

.gauge-svg {
  width: 100%;
  max-width: 200px;
}

.gauge-arc {
  transition: stroke-dashoffset 0.6s ease, stroke 0.4s ease;
}

.gauge-value-text {
  font-size: 22px;
  font-weight: 700;
  fill: #f1f5f9;
  font-family: 'JetBrains Mono', monospace;
}

.gauge-sub-text {
  font-size: 10px;
  fill: #6b7280;
}

.gauge-scale {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #4b5563;
  margin-top: 4px;
  padding: 0 8px;
}
</style>
