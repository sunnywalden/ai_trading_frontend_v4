<template>
  <div class="position-card">
    <div class="card-header">
      <div class="symbol-info">
        <h3>{{ symbol }}</h3>
        <span class="recommendation" :class="recommendationClass">{{ displayRecommendation }}</span>
        <span v-if="riskLevel" class="risk-badge" :class="'risk-' + riskLevel.toLowerCase()">
          {{ riskLevel }}
        </span>
      </div>
      <div class="overall-score">
        <div class="score-value" :class="scoreClass">{{ overallScore.toFixed(1) }}</div>
        <div class="score-label">综合评分</div>
      </div>
    </div>

    <div v-if="quantity !== undefined" class="position-info">
      <div class="info-row">
        <span class="info-label">持仓数量</span>
        <span class="info-value">{{ quantity }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">平均成本</span>
        <span class="info-value">${{ (avgCost ?? 0).toFixed(2) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">当前价格</span>
        <span class="info-value">${{ (currentPrice ?? 0).toFixed(2) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">未实现盈亏</span>
        <span class="info-value" :class="(unrealizedPnl ?? 0) >= 0 ? 'profit' : 'loss'">
          ${{ (unrealizedPnl ?? 0).toLocaleString() }}
          <span v-if="unrealizedPnlPercent !== undefined" class="pnl-percent">
            ({{ (unrealizedPnlPercent * 100).toFixed(1) }}%)
          </span>
        </span>
      </div>
    </div>

    <div class="score-breakdown">
      <div class="score-item">
        <div class="score-header">
          <span class="label">技术面</span>
          <span class="value">{{ technicalScore.toFixed(1) }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill technical" :style="{ width: technicalScore + '%' }"></div>
        </div>
      </div>

      <div class="score-item">
        <div class="score-header">
          <span class="label">基本面</span>
          <span class="value">{{ fundamentalScore.toFixed(1) }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill fundamental" :style="{ width: fundamentalScore + '%' }"></div>
        </div>
      </div>

      <div class="score-item">
        <div class="score-header">
          <span class="label">情绪面</span>
          <span class="value">{{ sentimentScore.toFixed(1) }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill sentiment" :style="{ width: sentimentScore + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 趋势快照 -->
    <TrendSnapshotCard 
      :snapshot="trendSnapshot ?? null" 
      @refresh="$emit('refreshSnapshot', symbol)"
    />

    <div class="ai-summary" v-if="aiAdvice">
      <div class="summary-icon">💡</div>
      <div class="summary-text">{{ aiAdvice }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TrendSnapshotCard from './TrendSnapshotCard.vue';
import type { TrendSnapshot } from '../api/client';

interface Props {
  symbol: string;
  quantity?: number;
  avgCost?: number;
  currentPrice?: number;
  unrealizedPnl?: number;
  unrealizedPnlPercent?: number;
  overallScore: number;
  technicalScore: number;
  fundamentalScore: number;
  sentimentScore: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'REDUCE' | 'SELL' | 'STRONG_SELL';
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  trendSnapshot?: TrendSnapshot | null;
  aiAdvice?: string;
  // 保持向后兼容
  aiSummary?: string;
}

const props = defineProps<Props>();

defineEmits<{
  refreshSnapshot: [symbol: string];
}>();

const scoreClass = computed(() => {
  if (props.overallScore >= 75) return 'excellent';
  if (props.overallScore >= 60) return 'good';
  if (props.overallScore >= 40) return 'neutral';
  return 'poor';
});

const recommendationClass = computed(() => {
  return `rec-${props.recommendation.toLowerCase().replace('_', '-')}`;
});

const displayRecommendation = computed(() => {
  return props.recommendation.replace('_', ' ');
});
</script>

<style scoped>
.position-card {
  background: rgba(15, 23, 42, 0.95);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(55, 65, 81, 0.9);
  transition: all 0.3s ease;
}

.position-card:hover {
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 8px 32px rgba(56, 189, 248, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.symbol-info h3 {
  margin: 0 0 8px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #e5e7eb;
}

.recommendation {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-right: 6px;
}

.rec-strong-buy {
  background: rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.rec-buy {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.rec-hold {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.rec-sell {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.rec-strong-sell {
  background: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.risk-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.risk-low {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.risk-medium {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.risk-high {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.risk-extreme {
  background: rgba(239, 68, 68, 0.25);
  color: #f87171;
  font-weight: 700;
}

.rec-reduce {
  background: rgba(245, 158, 11, 0.25);
  color: #fbbf24;
}

.position-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.info-label {
  color: #9ca3af;
}

.info-value {
  color: #e5e7eb;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-value.profit {
  color: #22c55e;
}

.info-value.loss {
  color: #ef4444;
}

.pnl-percent {
  font-size: 0.75rem;
  opacity: 0.8;
}

.overall-score {
  text-align: center;
}

.score-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.score-value.excellent {
  color: #22c55e;
}

.score-value.good {
  color: #3b82f6;
}

.score-value.neutral {
  color: #f59e0b;
}

.score-value.poor {
  color: #ef4444;
}

.score-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.score-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.score-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.score-header .label {
  color: #d1d5db;
  font-weight: 500;
}

.score-header .value {
  color: #e5e7eb;
  font-weight: 600;
}

.progress-bar {
  height: 8px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(55, 65, 81, 0.8);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}

.progress-fill.technical {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.progress-fill.fundamental {
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.progress-fill.sentiment {
  background: linear-gradient(90deg, #ec4899, #db2777);
}

.ai-summary {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.summary-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.summary-text {
  font-size: 0.85rem;
  color: #d1d5db;
  line-height: 1.5;
}
</style>
