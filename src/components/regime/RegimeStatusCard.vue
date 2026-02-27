<template>
  <div class="regime-status-card" :class="`regime-${regimeKey}`">
    <!-- 头部：标题 + 刷新 -->
    <div class="card-header">
      <span class="card-title">🧠 市场体制感知</span>
      <div class="header-actions">
        <span v-if="info?.is_override" class="override-badge">手动覆写</span>
        <button class="refresh-btn" :disabled="loading" @click="emit('refresh')">
          <span :class="{ spinning: loading }">↺</span>
        </button>
      </div>
    </div>

    <!-- 主体：体制名称 + 置信度 -->
    <div v-if="info" class="card-body">
      <div class="regime-badge" :style="{ borderColor: regimeColor, color: regimeColor }">
        {{ regimeLabel }}
      </div>

      <div class="confidence-row">
        <span class="meta-label">置信度</span>
        <div class="confidence-bar-wrap">
          <div
            class="confidence-bar"
            :style="{ width: `${(info.confidence * 100).toFixed(0)}%`, backgroundColor: regimeColor }"
          />
        </div>
        <span class="confidence-pct" :style="{ color: regimeColor }">
          {{ (info.confidence * 100).toFixed(1) }}%
        </span>
      </div>

      <!-- 元数据行 -->
      <div class="meta-row">
        <div class="meta-item">
          <span class="meta-label">VaR 倍数</span>
          <span class="meta-value" :style="{ color: varColor }">×{{ varMultiplier.toFixed(2) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">持续时间</span>
          <span class="meta-value">{{ daysActive }} 天</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">上一体制</span>
          <span class="meta-value prev">{{ prevLabel }}</span>
        </div>
      </div>

      <!-- 推理摘要 -->
      <div v-if="info.reasoning" class="reasoning">
        <span class="meta-label">分析：</span>{{ info.reasoning }}
      </div>
    </div>

    <!-- 无数据 -->
    <div v-else-if="!loading" class="empty-state">
      <p>⚡ 今日体制尚未分类，等待早 08:00 任务运行</p>
    </div>

    <!-- 加载中 -->
    <div v-else class="loading-state">
      <span class="spinner" />
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  type RegimeInfo,
  type RegimeType,
  REGIME_LABELS,
  REGIME_COLORS,
} from '@/api/regimeService'

interface Props {
  info: RegimeInfo | null
  varMultiplier: number
  loading: boolean
}

const props = withDefaults(defineProps<Props>(), {
  varMultiplier: 1.0,
  loading: false,
})

const emit = defineEmits<{ (e: 'refresh'): void }>()

const regimeKey = computed(() =>
  props.info ? props.info.regime.toLowerCase() : 'unknown',
)

const regimeColor = computed(() =>
  props.info ? (REGIME_COLORS[props.info.regime] ?? '#aaaaaa') : '#555555',
)

const regimeLabel = computed(() =>
  props.info ? (REGIME_LABELS[props.info.regime] ?? props.info.regime) : '—',
)

const prevLabel = computed(() => {
  if (!props.info?.prev_regime) return '首次'
  return REGIME_LABELS[props.info.prev_regime as RegimeType] ?? props.info.prev_regime
})

const varColor = computed(() => {
  if (props.varMultiplier > 1.05) return '#00ff88'
  if (props.varMultiplier < 0.75) return '#ff4d4d'
  return '#aaaaaa'
})

const daysActive = computed(() => {
  if (!props.info?.valid_from) return '—'
  const startDate = new Date(props.info.valid_from)
  if (isNaN(startDate.getTime())) return '—'
  const ms = Date.now() - startDate.getTime()
  return Math.max(1, Math.floor(ms / 86_400_000))
})
</script>

<style scoped>
.regime-status-card {
  background: #12122a;
  border: 1px solid #1e1e4a;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color 0.3s;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.override-badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 10px;
  background: rgba(255, 153, 0, 0.15);
  color: #ff9900;
  border: 1px solid #ff9900;
}

.refresh-btn {
  background: none;
  border: none;
  color: #666688;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
  transition: color 0.2s;
}
.refresh-btn:hover { color: #00ff88; }
.refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.spinning { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.regime-badge {
  font-size: 22px;
  font-weight: 700;
  border: 2px solid currentColor;
  display: inline-block;
  padding: 4px 18px;
  border-radius: 6px;
  letter-spacing: 0.08em;
  background: rgba(255, 255, 255, 0.04);
}

.confidence-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.confidence-bar-wrap {
  flex: 1;
  height: 6px;
  background: #222240;
  border-radius: 3px;
  overflow: hidden;
}
.confidence-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}
.confidence-pct {
  font-size: 13px;
  font-weight: 600;
  min-width: 44px;
  text-align: right;
}

.meta-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.meta-label {
  font-size: 10px;
  color: #555577;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.meta-value {
  font-size: 14px;
  font-weight: 600;
  color: #ccccdd;
}
.meta-value.prev {
  font-size: 12px;
  color: #888899;
}

.reasoning {
  font-size: 12px;
  color: #7777aa;
  line-height: 1.5;
  border-top: 1px solid #1e1e4a;
  padding-top: 10px;
}

.empty-state,
.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #555577;
  font-size: 13px;
  padding: 12px 0;
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #333355;
  border-top-color: #00ff88;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
</style>
