<template>
  <div class="regime-timeline-card">
    <div class="card-header">
      <span class="card-title">🕘 体制历史时间轴</span>
      <div class="header-actions">
        <span class="total-label">共 {{ total }} 条</span>
        <button v-if="hasMore" class="load-more-btn" :disabled="loading" @click="emit('load-more')">
          加载更多
        </button>
      </div>
    </div>

    <div v-if="regimes.length > 0" class="timeline">
      <div
        v-for="(item, idx) in regimes"
        :key="item.id"
        class="timeline-item"
        :class="{ current: item.valid_until === null }"
      >
        <!-- 时间线轨道 -->
        <div class="track">
          <div class="dot" :style="{ background: getColor(item.regime) }" />
          <div v-if="idx < regimes.length - 1" class="line" />
        </div>

        <!-- 内容 -->
        <div class="item-content">
          <div class="item-header">
            <span class="regime-label" :style="{ color: getColor(item.regime) }">
              {{ getLabel(item.regime) }}
            </span>
            <span v-if="item.valid_until === null" class="current-badge">当前</span>
            <span v-if="item.is_override" class="override-badge">覆写</span>
          </div>

          <div class="item-meta">
            <span class="meta-date">{{ formatDate(item.valid_from) }}</span>
            <span class="meta-sep">→</span>
            <span class="meta-date">{{ item.valid_until ? formatDate(item.valid_until) : '至今' }}</span>
            <span class="meta-dur">（{{ duration(item) }}）</span>
            <span class="meta-conf">置信度 {{ ((item.confidence || 0) * 100).toFixed(0) }}%</span>
          </div>

          <div v-if="item.reasoning" class="item-reasoning">
            {{ item.reasoning }}
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state">
      <p>暂无历史体制记录</p>
    </div>

    <div v-if="loading" class="loading-state">
      <span class="spinner" /><span>加载历史...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseBackendDateTime } from '@/utils/datetime'
import {
  type RegimeInfo,
  type RegimeType,
  REGIME_LABELS,
  REGIME_COLORS,
} from '@/api/regimeService'

interface Props {
  regimes: RegimeInfo[]
  total: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const emit = defineEmits<{ (e: 'load-more'): void }>()

const hasMore = computed(() => props.regimes.length < props.total)

function getColor(regime: string): string {
  return REGIME_COLORS[regime as RegimeType] ?? '#aaaaaa'
}

function getLabel(regime: string): string {
  return REGIME_LABELS[regime as RegimeType] ?? regime
}

function formatDate(iso: string): string {
  const d = parseBackendDateTime(iso)
  if (!d) return iso
  return new Intl.DateTimeFormat(undefined, {
    year: '2-digit', month: '2-digit', day: '2-digit', hour12: false,
  }).format(d)
}

function duration(item: RegimeInfo): string {
  if (!item.valid_from) return '未知'
  const start = new Date(item.valid_from)
  if (isNaN(start.getTime())) return '未知'
  
  const end = item.valid_until ? new Date(item.valid_until) : new Date()
  if (isNaN(end.getTime())) return '未知'
  
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000)
  if (days < 1) return '不足1天'
  if (days < 30) return `${days} 天`
  const months = Math.floor(days / 30)
  return `约 ${months} 个月`
}
</script>

<style scoped>
.regime-timeline-card {
  background: #12122a;
  border: 1px solid #1e1e4a;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
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
  gap: 12px;
}

.total-label {
  font-size: 11px;
  color: #555577;
}

.load-more-btn {
  font-size: 11px;
  padding: 3px 10px;
  border: 1px solid #333366;
  border-radius: 4px;
  background: transparent;
  color: #00ccff;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.load-more-btn:hover { border-color: #00ccff; }
.load-more-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 14px;
}

.track {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  box-shadow: 0 0 6px currentColor;
}

.line {
  flex: 1;
  width: 1px;
  background: #1e1e4a;
  margin: 4px 0;
  min-height: 12px;
}

.item-content {
  flex: 1;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(30, 30, 74, 0.4);
}

.timeline-item:last-child .item-content {
  border-bottom: none;
  padding-bottom: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.regime-label {
  font-size: 15px;
  font-weight: 700;
}

.current-badge {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 8px;
  background: rgba(0, 255, 136, 0.12);
  color: #00ff88;
  border: 1px solid #00ff88;
}

.override-badge {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 8px;
  background: rgba(255, 153, 0, 0.1);
  color: #ff9900;
  border: 1px solid #ff9900;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  font-size: 11px;
  color: #555577;
}

.meta-date {
  color: #7777aa;
}
.meta-sep {
  color: #333355;
}
.meta-dur {
  color: #555577;
}
.meta-conf {
  color: #444466;
  margin-left: 4px;
}

.item-reasoning {
  margin-top: 5px;
  font-size: 11px;
  color: #555577;
  line-height: 1.5;
}

.timeline-item.current .regime-label {
  text-shadow: 0 0 10px currentColor;
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
