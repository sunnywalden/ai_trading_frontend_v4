<template>
  <div class="trend-snapshot-card">
    <!-- 空态 -->
    <div v-if="!snapshot" class="empty-state">
      <div class="empty-icon">📊</div>
      <p class="empty-text">尚未生成今日快照</p>
      <button class="refresh-btn" @click="$emit('refresh')">
        刷新评估
      </button>
    </div>

    <!-- 快照内容 -->
    <div v-else class="snapshot-content">
      <!-- 标题与时间 -->
      <div class="snapshot-header">
        <h4>日线趋势快照</h4>
        <span class="timestamp">{{ formatTime(snapshot.timestamp) }}</span>
      </div>

      <!-- 趋势方向与强度 -->
      <div class="trend-section">
        <div class="trend-direction">
          <span class="trend-icon" :class="trendClass">
            {{ trendIcon }}
          </span>
          <div class="trend-info">
            <span class="trend-label">{{ trendLabel }}</span>
            <span class="trend-desc" v-if="snapshot.trend_description">
              {{ snapshot.trend_description }}
            </span>
          </div>
        </div>
        
        <div v-if="snapshot.trend_strength != null" class="trend-strength">
          <div class="strength-header">
            <span class="strength-label">趋势强度</span>
            <span class="strength-value">{{ snapshot.trend_strength }}</span>
          </div>
          <div class="strength-bar">
            <div 
              class="strength-fill" 
              :class="strengthClass"
              :style="{ width: (snapshot.trend_strength ?? 0) + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 技术指标 -->
      <div class="indicators-section">
        <div v-if="snapshot.rsi_value != null" class="indicator-item">
          <span class="indicator-label">RSI</span>
          <span class="indicator-value">{{ snapshot.rsi_value.toFixed(1) }}</span>
          <span class="indicator-status" :class="'status-' + (snapshot.rsi_status || '').toLowerCase()">
            {{ rsiStatusLabel }}
          </span>
        </div>

        <div v-if="snapshot.macd_status" class="indicator-item">
          <span class="indicator-label">MACD</span>
          <span class="indicator-status" :class="macdStatusClass">
            {{ macdStatusLabel }}
          </span>
        </div>

        <div v-if="snapshot.bollinger_position" class="indicator-item">
          <span class="indicator-label">布林带</span>
          <span class="indicator-status">{{ snapshot.bollinger_position }}</span>
        </div>

        <div v-if="snapshot.volume_ratio != null" class="indicator-item">
          <span class="indicator-label">量能</span>
          <span class="volume-value" :class="volumeClass">
            {{ snapshot.volume_ratio.toFixed(2) }}x
            <span class="volume-label">{{ volumeLabel }}</span>
          </span>
        </div>
      </div>

      <!-- 关键价位 -->
      <div class="price-levels-section" v-if="hasLevels">
        <div v-if="snapshot.support_levels?.length" class="levels-group">
          <span class="levels-label">支撑位</span>
          <div class="levels-list">
            <span 
              v-for="(level, idx) in visibleSupports" 
              :key="'s' + idx"
              class="level-tag support"
            >
              ${{ (level != null) ? level.toFixed(2) : '-' }}
            </span>
            <span v-if="snapshot.support_levels.length > 3" class="more-tag">
              +{{ snapshot.support_levels.length - 3 }}
            </span>
          </div>
        </div>

        <div v-if="snapshot.resistance_levels?.length" class="levels-group">
          <span class="levels-label">阻力位</span>
          <div class="levels-list">
            <span 
              v-for="(level, idx) in visibleResistances" 
              :key="'r' + idx"
              class="level-tag resistance"
            >
              ${{ (level != null) ? level.toFixed(2) : '-' }}
            </span>
            <span v-if="snapshot.resistance_levels.length > 3" class="more-tag">
              +{{ snapshot.resistance_levels.length - 3 }}
            </span>
          </div>
        </div>
      </div>

      <!-- AI摘要 -->
      <div v-if="snapshot.ai_summary" class="ai-summary">
        <div class="summary-icon">💬</div>
        <div class="summary-content">
          <div class="summary-label">交易员摘要</div>
          <p class="summary-text">{{ snapshot.ai_summary }}</p>
        </div>
      </div>

      <!-- 降级提示 -->
      <div v-else-if="!snapshot.ai_summary && snapshot.trend_description" class="fallback-notice">
        <span class="notice-icon">ℹ️</span>
        <span class="notice-text">已使用规则摘要</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TrendSnapshot } from '../api/client';

interface Props {
  snapshot: TrendSnapshot | null;
}

const props = defineProps<Props>();
defineEmits<{
  refresh: [];
}>();

// 趋势方向相关
const trendClass = computed(() => {
  const direction = props.snapshot?.trend_direction;
  if (direction === 'BULLISH') return 'trend-bullish';
  if (direction === 'BEARISH') return 'trend-bearish';
  return 'trend-sideways';
});

const trendIcon = computed(() => {
  const direction = props.snapshot?.trend_direction;
  if (direction === 'BULLISH') return '↗️';
  if (direction === 'BEARISH') return '↘️';
  return '↔️';
});

const trendLabel = computed(() => {
  const direction = props.snapshot?.trend_direction;
  if (direction === 'BULLISH') return '看涨';
  if (direction === 'BEARISH') return '看跌';
  return '横盘';
});

const strengthClass = computed(() => {
  const strength = props.snapshot?.trend_strength || 0;
  if (strength >= 75) return 'strength-high';
  if (strength >= 50) return 'strength-medium';
  return 'strength-low';
});

// RSI状态
const rsiStatusLabel = computed(() => {
  const status = props.snapshot?.rsi_status;
  if (status === 'OVERSOLD') return '超卖';
  if (status === 'OVERBOUGHT') return '超买';
  return '中性';
});

// MACD状态
const macdStatusClass = computed(() => {
  const status = props.snapshot?.macd_status?.toLowerCase() || '';
  if (status.includes('bullish')) return 'status-bullish';
  if (status.includes('bearish')) return 'status-bearish';
  return '';
});

const macdStatusLabel = computed(() => {
  const status = props.snapshot?.macd_status;
  if (status === 'BULLISH_CROSSOVER') return '金叉';
  if (status === 'BEARISH_CROSSOVER') return '死叉';
  return status || '';
});

// 量能相关
const volumeClass = computed(() => {
  const ratio = props.snapshot?.volume_ratio || 0;
  return ratio > 1 ? 'volume-up' : 'volume-down';
});

const volumeLabel = computed(() => {
  const ratio = props.snapshot?.volume_ratio || 0;
  return ratio > 1 ? '放量' : '缩量';
});

// 关键价位
const hasLevels = computed(() => {
  return (props.snapshot?.support_levels?.length || 0) > 0 ||
         (props.snapshot?.resistance_levels?.length || 0) > 0;
});

const visibleSupports = computed(() => {
  return props.snapshot?.support_levels?.slice(0, 3) || [];
});

const visibleResistances = computed(() => {
  return props.snapshot?.resistance_levels?.slice(0, 3) || [];
});

// 时间格式化
function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return timestamp;
  }
}
</script>

<style scoped>
.trend-snapshot-card {
  margin-top: 16px;
  padding: 16px;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

/* 空态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.5;
}

.empty-text {
  margin: 0;
  color: #9ca3af;
  font-size: 0.9rem;
}

.refresh-btn {
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.6);
}

/* 快照内容 */
.snapshot-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.snapshot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.6);
}

.snapshot-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #38bdf8;
  font-weight: 600;
}

.timestamp {
  font-size: 0.75rem;
  color: #6b7280;
}

/* 趋势部分 */
.trend-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trend-direction {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trend-icon {
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.6);
}

.trend-icon.trend-bullish {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}

.trend-icon.trend-bearish {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}

.trend-icon.trend-sideways {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
}

.trend-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trend-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e5e7eb;
}

.trend-desc {
  font-size: 0.8rem;
  color: #9ca3af;
}

/* 趋势强度 */
.trend-strength {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.strength-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.strength-label {
  color: #9ca3af;
}

.strength-value {
  color: #e5e7eb;
  font-weight: 600;
}

.strength-bar {
  height: 6px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(55, 65, 81, 0.6);
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.strength-fill.strength-high {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.strength-fill.strength-medium {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.strength-fill.strength-low {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

/* 技术指标 */
.indicators-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.indicator-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 6px;
  font-size: 0.85rem;
}

.indicator-label {
  color: #9ca3af;
  font-size: 0.75rem;
}

.indicator-value {
  color: #e5e7eb;
  font-weight: 600;
}

.indicator-status {
  color: #38bdf8;
  font-size: 0.8rem;
}

.indicator-status.status-oversold {
  color: #22c55e;
}

.indicator-status.status-overbought {
  color: #ef4444;
}

.indicator-status.status-neutral {
  color: #f59e0b;
}

.indicator-status.status-bullish {
  color: #22c55e;
}

.indicator-status.status-bearish {
  color: #ef4444;
}

.volume-value {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.volume-value.volume-up {
  color: #22c55e;
}

.volume-value.volume-down {
  color: #f59e0b;
}

.volume-label {
  font-size: 0.75rem;
  font-weight: 400;
}

/* 关键价位 */
.price-levels-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
}

.levels-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.levels-label {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 600;
}

.levels-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.level-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.level-tag.support {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.level-tag.resistance {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.more-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  color: #6b7280;
  background: rgba(55, 65, 81, 0.3);
}

/* AI摘要 */
.ai-summary {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: rgba(56, 189, 248, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.summary-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.summary-label {
  font-size: 0.75rem;
  color: #38bdf8;
  font-weight: 600;
}

.summary-text {
  margin: 0;
  font-size: 0.85rem;
  color: #d1d5db;
  line-height: 1.5;
}

/* 降级提示 */
.fallback-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 6px;
  font-size: 0.8rem;
  color: #fbbf24;
}

.notice-icon {
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .indicators-section {
    grid-template-columns: 1fr;
  }
}
</style>
