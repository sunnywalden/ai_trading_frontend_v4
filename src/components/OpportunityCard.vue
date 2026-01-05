<template>
  <div class="opportunity-card">
    <div class="card-header">
      <div class="rank-badge">#{{ opportunity.rank }}</div>
      <div class="symbol-section">
        <div class="symbol-row">
          <span class="symbol">{{ opportunity.symbol }}</span>
          <span class="price">${{ opportunity.current_price.toFixed(2) }}</span>
        </div>
        <span 
          class="recommendation-badge" 
          :class="`recommendation-${opportunity.recommendation.toLowerCase()}`"
        >
          {{ recommendationText }}
        </span>
      </div>
      <div class="overall-score">
        <span class="score-label">综合评分</span>
        <span class="score-value">{{ opportunity.overall_score }}</span>
      </div>
    </div>

    <div class="scores-section">
      <div class="score-item">
        <span class="score-name">技术面</span>
        <div class="score-bar-container">
          <div class="score-bar" :style="{ width: `${opportunity.technical_score}%` }"></div>
        </div>
        <span class="score-number">{{ opportunity.technical_score }}</span>
      </div>

      <div class="score-item">
        <span class="score-name">基本面</span>
        <div class="score-bar-container">
          <div class="score-bar fundamental" :style="{ width: `${opportunity.fundamental_score}%` }"></div>
        </div>
        <span class="score-number">{{ opportunity.fundamental_score }}</span>
      </div>

      <div class="score-item">
        <span class="score-name">情绪面</span>
        <div class="score-bar-container">
          <div class="score-bar sentiment" :style="{ width: `${opportunity.sentiment_score}%` }"></div>
        </div>
        <span class="score-number">{{ opportunity.sentiment_score }}</span>
      </div>
    </div>

    <div class="reason-section">
      <span class="reason-label">🎯 推荐理由</span>
      <p class="reason-text">{{ opportunity.reason }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OpportunityItem } from '../api/client';

const props = defineProps<{
  opportunity: OpportunityItem;
}>();

const recommendationText = computed(() => {
  const map: Record<string, string> = {
    STRONG_BUY: '强力建仓',
    BUY: '建议建仓',
    HOLD: '持有观望',
    SELL: '减仓',
    STRONG_SELL: '清仓'
  };
  return map[props.opportunity.recommendation] || props.opportunity.recommendation;
});
</script>

<style scoped>
.opportunity-card {
  padding: 18px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.opportunity-card:hover {
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.2);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.3);
}

.symbol-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.symbol-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.symbol {
  font-size: 1.3rem;
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 0.5px;
}

.price {
  font-size: 1rem;
  font-weight: 600;
  color: #9ca3af;
}

.recommendation-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.recommendation-badge.recommendation-strong_buy {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.recommendation-badge.recommendation-buy {
  background: rgba(74, 222, 128, 0.2);
  color: #86efac;
  border: 1px solid rgba(74, 222, 128, 0.4);
}

.recommendation-badge.recommendation-hold {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.recommendation-badge.recommendation-sell {
  background: rgba(249, 115, 22, 0.2);
  color: #fdba74;
  border: 1px solid rgba(249, 115, 22, 0.4);
}

.recommendation-badge.recommendation-strong_sell {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.overall-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.score-label {
  font-size: 0.7rem;
  color: #9ca3af;
  text-transform: uppercase;
}

.score-value {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(to right, #22c55e, #86efac);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.scores-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-name {
  width: 60px;
  font-size: 0.8rem;
  color: #9ca3af;
}

.score-bar-container {
  flex: 1;
  height: 8px;
  background: rgba(55, 65, 81, 0.6);
  border-radius: 4px;
  overflow: hidden;
}

.score-bar {
  height: 100%;
  background: linear-gradient(to right, #22c55e, #86efac);
  border-radius: 4px;
  transition: width 0.8s ease;
}

.score-bar.fundamental {
  background: linear-gradient(to right, #3b82f6, #93c5fd);
}

.score-bar.sentiment {
  background: linear-gradient(to right, #f59e0b, #fcd34d);
}

.score-number {
  width: 32px;
  text-align: right;
  font-size: 0.85rem;
  font-weight: 600;
  color: #d1d5db;
}

.reason-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(55, 65, 81, 0.5);
}

.reason-label {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 600;
}

.reason-text {
  margin: 0;
  font-size: 0.85rem;
  color: #d1d5db;
  line-height: 1.6;
}
</style>
