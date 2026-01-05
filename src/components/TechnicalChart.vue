<template>
  <div class="technical-chart">
    <div class="chart-header">
      <h3>{{ symbol }} 技术分析</h3>
      <span class="trend-badge" :class="trendClass">{{ trendDirection }}</span>
    </div>

    <div class="indicators-grid">
      <div class="indicator-card">
        <div class="indicator-label">趋势强度</div>
        <div class="indicator-value">{{ trendStrength }}/100</div>
        <div class="progress-mini">
          <div class="progress-fill-mini" :style="{ width: trendStrength + '%', background: getTrendColor() }"></div>
        </div>
      </div>

      <div class="indicator-card">
        <div class="indicator-label">RSI (14)</div>
        <div class="indicator-value" :class="getRsiClass()">{{ rsiValue.toFixed(1) }}</div>
        <div class="indicator-status">{{ rsiStatus }}</div>
      </div>

      <div class="indicator-card">
        <div class="indicator-label">MACD</div>
        <div class="indicator-value" :class="macdSignal === 'BULLISH_CROSSOVER' ? 'bullish' : 'bearish'">
          {{ macdValue.toFixed(2) }}
        </div>
        <div class="indicator-status">{{ getMacdLabel() }}</div>
      </div>

      <div class="indicator-card">
        <div class="indicator-label">布林带</div>
        <div class="indicator-value">{{ currentPrice.toFixed(2) }}</div>
        <div class="indicator-status">{{ bbPosition }}</div>
      </div>
    </div>

    <div class="support-resistance">
      <div class="sr-section">
        <div class="sr-label">关键阻力位</div>
        <div class="sr-levels">
          <span v-for="level in keyResistance" :key="level" class="sr-level resistance">
            ${{ level.toFixed(2) }}
          </span>
        </div>
      </div>

      <div class="current-price-line">
        <span class="price-tag">当前: ${{ currentPrice.toFixed(2) }}</span>
      </div>

      <div class="sr-section">
        <div class="sr-label">关键支撑位</div>
        <div class="sr-levels">
          <span v-for="level in keySupport" :key="level" class="sr-level support">
            ${{ level.toFixed(2) }}
          </span>
        </div>
      </div>
    </div>

    <div class="ai-analysis" v-if="aiSummary">
      <div class="analysis-icon">🤖</div>
      <div class="analysis-text">{{ aiSummary }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  symbol: string;
  trendDirection: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  trendStrength: number;
  rsiValue: number;
  rsiStatus: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  macdValue: number;
  macdSignal: string;
  currentPrice: number;
  bbPosition: string;
  keySupport: number[];
  keyResistance: number[];
  aiSummary?: string;
}

const props = defineProps<Props>();

const trendClass = computed(() => {
  const map = {
    'BULLISH': 'trend-bullish',
    'BEARISH': 'trend-bearish',
    'SIDEWAYS': 'trend-sideways'
  };
  return map[props.trendDirection];
});

function getTrendColor() {
  if (props.trendStrength >= 70) return 'linear-gradient(90deg, #22c55e, #16a34a)';
  if (props.trendStrength >= 40) return 'linear-gradient(90deg, #3b82f6, #2563eb)';
  return 'linear-gradient(90deg, #6b7280, #4b5563)';
}

function getRsiClass() {
  if (props.rsiValue > 70) return 'overbought';
  if (props.rsiValue < 30) return 'oversold';
  return 'neutral';
}

function getMacdLabel() {
  if (props.macdSignal === 'BULLISH_CROSSOVER') return '金叉看涨';
  if (props.macdSignal === 'BEARISH_CROSSOVER') return '死叉看跌';
  return '观望';
}
</script>

<style scoped>
.technical-chart {
  background: rgba(15, 23, 42, 0.95);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(55, 65, 81, 0.9);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #e5e7eb;
}

.trend-badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.trend-bullish {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.trend-bearish {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.trend-sideways {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.indicators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.indicator-card {
  background: rgba(31, 41, 55, 0.6);
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(55, 65, 81, 0.8);
}

.indicator-label {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.indicator-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #e5e7eb;
  margin-bottom: 4px;
}

.indicator-value.bullish {
  color: #22c55e;
}

.indicator-value.bearish {
  color: #ef4444;
}

.indicator-value.overbought {
  color: #f59e0b;
}

.indicator-value.oversold {
  color: #3b82f6;
}

.indicator-value.neutral {
  color: #e5e7eb;
}

.indicator-status {
  font-size: 0.75rem;
  color: #6b7280;
}

.progress-mini {
  height: 4px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill-mini {
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}

.support-resistance {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(31, 41, 55, 0.4);
  border-radius: 10px;
  border: 1px solid rgba(55, 65, 81, 0.6);
}

.sr-section {
  margin-bottom: 12px;
}

.sr-label {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sr-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sr-level {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.sr-level.resistance {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.sr-level.support {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.current-price-line {
  padding: 10px 0;
  text-align: center;
  border-top: 2px dashed rgba(59, 130, 246, 0.5);
  border-bottom: 2px dashed rgba(59, 130, 246, 0.5);
  margin: 12px 0;
}

.price-tag {
  font-size: 0.9rem;
  font-weight: 600;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  padding: 4px 12px;
  border-radius: 6px;
}

.ai-analysis {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.analysis-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.analysis-text {
  font-size: 0.85rem;
  color: #d1d5db;
  line-height: 1.5;
}
</style>
