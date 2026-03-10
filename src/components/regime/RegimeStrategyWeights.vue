<template>
  <div class="regime-weights-card">
    <div class="card-header">
      <span class="card-title">⚖️ 策略风格权重</span>
      <span v-if="regime" class="regime-pill" :style="{ borderColor: regimeColor, color: regimeColor }">
        {{ regimeLabel }}
      </span>
    </div>

    <div v-if="weights.length > 0" class="weights-list">
      <div
        v-for="item in sortedWeights"
        :key="item.style"
        class="weight-row"
      >
        <span class="style-label">{{ styleLabel(item.style) }}</span>
        <div class="bar-container">
          <!-- 基线标记 -->
          <div class="baseline-mark" :style="{ left: baselineLeft }" />
          <!-- 权重条 -->
          <div
            class="weight-bar"
            :style="{
              width: barWidth(item.weight),
              backgroundColor: barColor(item.weight),
              opacity: 0.85,
            }"
          />
        </div>
        <span class="weight-val" :style="{ color: barColor(item.weight) }">
          {{ item.weight.toFixed(2) }}×
        </span>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <p>暂无权重数据</p>
    </div>
    <div v-else class="loading-state">
      <span class="spinner" /><span>加载中...</span>
    </div>

    <div v-if="updatedAt" class="footer-note">
      更新于 {{ formattedUpdatedAt }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseBackendDateTime } from '@/utils/datetime'
import {
  type RegimeType,
  type RegimeStrategyWeight,
  REGIME_LABELS,
  REGIME_COLORS,
} from '@/api/regimeService'

interface Props {
  regime: RegimeType | null
  weights: RegimeStrategyWeight[]
  updatedAt: string | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const STYLE_LABELS: Record<string, string> = {
  trend_following:  '趋势跟踪',
  mean_reversion:   '均值回归',
  momentum:         '动量策略',
  volatility:       '波动率策略',
  carry:            '套息策略',
  arbitrage:        '套利策略',
  long_short:       '多空对冲',
  defensive:        '防御型策略',
}

// 最大权重倍数（用于 bar 缩放基准）
const MAX_WEIGHT = 2.0
// 基线（1.0）在 bar 容器中的位置百分比
const baselineLeft = `${(1.0 / MAX_WEIGHT) * 100}%`

const regimeColor = computed(() =>
  props.regime ? (REGIME_COLORS[props.regime] ?? '#aaaaaa') : '#555555',
)

const regimeLabel = computed(() =>
  props.regime ? (REGIME_LABELS[props.regime] ?? props.regime) : '—',
)

const sortedWeights = computed(() => {
  if (!Array.isArray(props.weights)) return []
  return [...props.weights].sort((a, b) => b.weight - a.weight)
})

const formattedUpdatedAt = computed(() => {
  if (!props.updatedAt) return ''
  const d = parseBackendDateTime(props.updatedAt)
  if (!d) return ''
  return new Intl.DateTimeFormat(undefined, {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)
})

function styleLabel(style: string): string {
  return STYLE_LABELS[style] ?? style
}

function barWidth(weight: number): string {
  const pct = Math.min(weight / MAX_WEIGHT, 1) * 100
  return `${pct.toFixed(1)}%`
}

function barColor(weight: number): string {
  if (weight >= 1.4) return '#00ff88'
  if (weight >= 1.0) return '#00ccff'
  if (weight >= 0.6) return '#ff9900'
  return '#ff4d4d'
}
</script>

<style scoped>
.regime-weights-card {
  background: #12122a;
  border: 1px solid #1e1e4a;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #ccccdd;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.regime-pill {
  font-size: 11px;
  padding: 2px 9px;
  border-radius: 10px;
  border: 1px solid currentColor;
  font-weight: 600;
}

.weights-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weight-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.style-label {
  font-size: 12px;
  color: #888899;
  min-width: 72px;
  flex-shrink: 0;
}

.bar-container {
  flex: 1;
  height: 10px;
  background: #1a1a3a;
  border-radius: 5px;
  position: relative;
  overflow: visible;
}

.baseline-mark {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 1;
}

.weight-bar {
  height: 100%;
  border-radius: 5px;
  transition: width 0.4s ease, background-color 0.3s;
}

.weight-val {
  font-size: 12px;
  font-weight: 700;
  min-width: 40px;
  text-align: right;
}

.footer-note {
  font-size: 10px;
  color: #444466;
  text-align: right;
  border-top: 1px solid #1a1a3a;
  padding-top: 8px;
}

.empty-state,
.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #555577;
  font-size: 13px;
  padding: 20px 0;
  justify-content: center;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #333355;
  border-top-color: #00ff88;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
