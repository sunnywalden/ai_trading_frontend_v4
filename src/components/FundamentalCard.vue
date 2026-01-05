<template>
  <div class="fundamental-card">
    <div class="card-header">
      <h3>{{ symbol }} 基本面分析</h3>
      <div class="grades">
        <span class="grade-badge" :class="'grade-' + valuationGrade.toLowerCase()">
          估值 {{ valuationGrade }}
        </span>
        <span class="grade-badge" :class="'grade-' + profitabilityGrade.toLowerCase()">
          盈利 {{ profitabilityGrade }}
        </span>
      </div>
    </div>

    <div class="metrics-section">
      <h4 class="section-title">估值指标</h4>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">P/E</span>
          <span class="metric-value">{{ peRatio.toFixed(2) }}</span>
          <span class="metric-comp">行业 {{ sectorAvgPe.toFixed(1) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">PEG</span>
          <span class="metric-value">{{ pegRatio.toFixed(2) }}</span>
          <span class="metric-comp">{{ getPegComment() }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">P/B</span>
          <span class="metric-value">{{ pbRatio.toFixed(2) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">P/S</span>
          <span class="metric-value">{{ psRatio.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="metrics-section">
      <h4 class="section-title">盈利能力</h4>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">ROE</span>
          <span class="metric-value highlight">{{ (roe * 100).toFixed(1) }}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">毛利率</span>
          <span class="metric-value">{{ (grossMargin * 100).toFixed(1) }}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">净利率</span>
          <span class="metric-value">{{ (netMargin * 100).toFixed(1) }}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">营收增长</span>
          <span class="metric-value" :class="revenueGrowthYoy > 0 ? 'positive' : 'negative'">
            {{ (revenueGrowthYoy * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>

    <div class="metrics-section">
      <h4 class="section-title">财务健康</h4>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">资产负债率</span>
          <span class="metric-value">{{ debtToEquity.toFixed(2) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">流动比率</span>
          <span class="metric-value">{{ currentRatio.toFixed(2) }}</span>
        </div>
        <div class="metric-item wide">
          <span class="metric-label">自由现金流</span>
          <span class="metric-value">${{ formatLargeNumber(freeCashFlow) }}</span>
        </div>
      </div>
    </div>

    <div class="analyst-section" v-if="analystConsensus">
      <div class="analyst-header">
        <h4 class="section-title">分析师评级</h4>
        <span class="consensus" :class="consensusClass">{{ analystConsensus }}</span>
      </div>
      <div class="ratings-breakdown">
        <div class="rating-bar">
          <div class="bar-segment buy" :style="{ width: getRatingPercent('buy') + '%' }">
            <span v-if="strongBuy + buy > 0">{{ strongBuy + buy }}</span>
          </div>
          <div class="bar-segment hold" :style="{ width: getRatingPercent('hold') + '%' }">
            <span v-if="hold > 0">{{ hold }}</span>
          </div>
          <div class="bar-segment sell" :style="{ width: getRatingPercent('sell') + '%' }">
            <span v-if="strongSell + sell > 0">{{ strongSell + sell }}</span>
          </div>
        </div>
        <div class="rating-labels">
          <span class="label-buy">买入</span>
          <span class="label-hold">持有</span>
          <span class="label-sell">卖出</span>
        </div>
      </div>
      <div class="price-target">
        <span class="target-label">目标价:</span>
        <span class="target-value">${{ avgPriceTarget.toFixed(2) }}</span>
        <span class="target-range">(${{ priceTargetLow.toFixed(0) }} - ${{ priceTargetHigh.toFixed(0) }})</span>
      </div>
    </div>

    <div class="ai-insight" v-if="aiSummary">
      <div class="insight-icon">📊</div>
      <div class="insight-text">{{ aiSummary }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  symbol: string;
  peRatio: number;
  pegRatio: number;
  pbRatio: number;
  psRatio: number;
  sectorAvgPe: number;
  valuationGrade: string;
  roe: number;
  grossMargin: number;
  netMargin: number;
  revenueGrowthYoy: number;
  profitabilityGrade: string;
  debtToEquity: number;
  currentRatio: number;
  freeCashFlow: number;
  analystConsensus?: string;
  strongBuy?: number;
  buy?: number;
  hold?: number;
  sell?: number;
  strongSell?: number;
  avgPriceTarget?: number;
  priceTargetLow?: number;
  priceTargetHigh?: number;
  aiSummary?: string;
}

const props = withDefaults(defineProps<Props>(), {
  strongBuy: 0,
  buy: 0,
  hold: 0,
  sell: 0,
  strongSell: 0,
  avgPriceTarget: 0,
  priceTargetLow: 0,
  priceTargetHigh: 0
});

const consensusClass = computed(() => {
  if (!props.analystConsensus) return '';
  const consensus = props.analystConsensus.toLowerCase();
  if (consensus.includes('buy')) return 'consensus-buy';
  if (consensus.includes('sell')) return 'consensus-sell';
  return 'consensus-hold';
});

function getPegComment() {
  if (props.pegRatio < 1) return '低估';
  if (props.pegRatio < 2) return '合理';
  return '高估';
}

function formatLargeNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  return num.toFixed(0);
}

function getRatingPercent(type: string): number {
  const total = props.strongBuy + props.buy + props.hold + props.sell + props.strongSell;
  if (total === 0) return 0;
  
  if (type === 'buy') return ((props.strongBuy + props.buy) / total) * 100;
  if (type === 'hold') return (props.hold / total) * 100;
  if (type === 'sell') return ((props.sell + props.strongSell) / total) * 100;
  return 0;
}
</script>

<style scoped>
.fundamental-card {
  background: rgba(15, 23, 42, 0.95);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(55, 65, 81, 0.9);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #e5e7eb;
}

.grades {
  display: flex;
  gap: 8px;
}

.grade-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.grade-a, .grade-a\+ {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.grade-b {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.grade-c {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.grade-d, .grade-f {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.metrics-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 0.85rem;
  color: #9ca3af;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.metric-item {
  background: rgba(31, 41, 55, 0.5);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(55, 65, 81, 0.7);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-item.wide {
  grid-column: span 2;
}

.metric-label {
  font-size: 0.7rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #e5e7eb;
}

.metric-value.highlight {
  color: #22c55e;
}

.metric-value.positive {
  color: #22c55e;
}

.metric-value.negative {
  color: #ef4444;
}

.metric-comp {
  font-size: 0.7rem;
  color: #6b7280;
}

.analyst-section {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(31, 41, 55, 0.4);
  border-radius: 10px;
  border: 1px solid rgba(55, 65, 81, 0.6);
}

.analyst-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.consensus {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}

.consensus-buy {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.consensus-hold {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.consensus-sell {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.ratings-breakdown {
  margin-bottom: 12px;
}

.rating-bar {
  display: flex;
  height: 24px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  transition: width 0.3s ease;
}

.bar-segment.buy {
  background: linear-gradient(90deg, #22c55e, #16a34a);
  color: #fff;
}

.bar-segment.hold {
  background: linear-gradient(90deg, #f59e0b, #d97706);
  color: #fff;
}

.bar-segment.sell {
  background: linear-gradient(90deg, #ef4444, #dc2626);
  color: #fff;
}

.rating-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #9ca3af;
}

.price-target {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.target-label {
  color: #9ca3af;
}

.target-value {
  font-weight: 700;
  color: #3b82f6;
  font-size: 1rem;
}

.target-range {
  color: #6b7280;
  font-size: 0.75rem;
}

.ai-insight {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: rgba(236, 72, 153, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(236, 72, 153, 0.3);
}

.insight-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.insight-text {
  font-size: 0.85rem;
  color: #d1d5db;
  line-height: 1.5;
}
</style>
