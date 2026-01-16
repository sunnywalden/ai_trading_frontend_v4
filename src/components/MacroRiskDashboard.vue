<template>
  <div class="macro-dashboard">
    <div class="dashboard-header">
      <h2>宏观风险分析</h2>
      <div class="overall-risk">
        <div class="risk-score" :class="overallRiskClass">{{ data.overall_risk.score }}</div>
        <div class="risk-label">
          <div class="label-text">综合评分</div>
          <div class="risk-level" :class="overallRiskClass">{{ data.overall_risk.level }}</div>
        </div>
      </div>
    </div>

    <!-- AI 分析摘要 -->
    <div class="ai-summary-section" v-if="data.ai_analysis">
      <div class="summary-header">
        <span class="summary-icon">🤖</span>
        <h3>AI 综合分析</h3>
      </div>
      <p class="summary-content">{{ data.ai_analysis }}</p>
    </div>

    <!-- 风险警报 -->
    <div class="alerts-section" v-if="data.alerts && data.alerts.length > 0">
      <h3>⚠️ 风险警报</h3>
      <div class="alerts-list">
        <div v-for="(alert, index) in data.alerts" :key="index" class="alert-item" :class="'alert-' + alert.level.toLowerCase()">
          <div class="alert-header">
            <span class="alert-level">{{ alert.level }}</span>
            <span class="alert-dimension">{{ alert.dimension }}</span>
          </div>
          <p class="alert-message">{{ alert.message }}</p>
          <p class="alert-recommendation">💡 {{ alert.recommendation }}</p>
        </div>
      </div>
    </div>

    <!-- 风险维度 -->
    <div class="risk-dimensions">
      <!-- 货币政策 -->
      <div class="risk-card">
        <div class="risk-header">
          <div class="risk-icon">💰</div>
          <div class="risk-info">
            <h3>货币政策</h3>
            <p class="risk-status">{{ data.risk_breakdown.monetary_policy.description }}</p>
          </div>
          <div class="risk-score-badge" :class="getScoreClass(data.risk_breakdown.monetary_policy.score)">
            {{ data.risk_breakdown.monetary_policy.score }}
          </div>
        </div>
      </div>

      <!-- 地缘政治 -->
      <div class="risk-card">
        <div class="risk-header">
          <div class="risk-icon">🌍</div>
          <div class="risk-info">
            <h3>地缘政治</h3>
            <p class="risk-status">{{ data.risk_breakdown.geopolitical.description }}</p>
          </div>
          <div class="risk-score-badge" :class="getScoreClass(data.risk_breakdown.geopolitical.score)">
            {{ data.risk_breakdown.geopolitical.score }}
          </div>
        </div>
      </div>

      <!-- 行业泡沫 -->
      <div class="risk-card">
        <div class="risk-header">
          <div class="risk-icon">📈</div>
          <div class="risk-info">
            <h3>行业泡沫</h3>
            <p class="risk-status">{{ data.risk_breakdown.sector_bubble.description }}</p>
          </div>
          <div class="risk-score-badge" :class="getScoreClass(data.risk_breakdown.sector_bubble.score)">
            {{ data.risk_breakdown.sector_bubble.score }}
          </div>
        </div>
      </div>

      <!-- 经济周期 -->
      <div class="risk-card">
        <div class="risk-header">
          <div class="risk-icon">📊</div>
          <div class="risk-info">
            <h3>经济周期</h3>
            <p class="risk-status">{{ data.risk_breakdown.economic_cycle.description }}</p>
          </div>
          <div class="risk-score-badge" :class="getScoreClass(data.risk_breakdown.economic_cycle.score)">
            {{ data.risk_breakdown.economic_cycle.score }}
          </div>
        </div>
      </div>

      <!-- 市场情绪 -->
      <div class="risk-card">
        <div class="risk-header">
          <div class="risk-icon">😱</div>
          <div class="risk-info">
            <h3>市场情绪</h3>
            <p class="risk-status">{{ data.risk_breakdown.market_sentiment.description }}</p>
          </div>
          <div class="risk-score-badge" :class="getScoreClass(data.risk_breakdown.market_sentiment.score)">
            {{ data.risk_breakdown.market_sentiment.score }}
          </div>
        </div>
      </div>
    </div>

    <!-- 主要关注点 -->
    <div class="key-concerns" v-if="data.key_concerns && data.key_concerns.length > 0">
      <h3>🔍 主要关注点</h3>
      <ul class="concerns-list">
        <li v-for="(concern, index) in data.key_concerns" :key="index">{{ concern }}</li>
      </ul>
    </div>

    <!-- 总体建议 -->
    <div class="recommendations-section" v-if="recommendationsList.length">
      <h3>💡 总体建议</h3>
      <ul v-if="recommendationsList.length > 1" class="recommendations-list">
        <li v-for="(item, index) in recommendationsList" :key="index">{{ item }}</li>
      </ul>
      <p v-else class="recommendations-text">{{ recommendationsList[0] }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MacroRiskOverviewResponse } from '../api/client';

interface Props {
  data: MacroRiskOverviewResponse;
}

const props = defineProps<Props>();

const overallRiskClass = computed(() => {
  const score = props.data.overall_risk.score;
  if (score >= 70) return 'risk-low';
  if (score >= 50) return 'risk-medium';
  if (score >= 30) return 'risk-high';
  return 'risk-extreme';
});

const recommendationsList = computed(() => {
  const raw = props.data.recommendations;
  if (!raw) return [] as string[];
  return Array.isArray(raw) ? raw : [raw];
});

function getScoreClass(score: number): string {
  if (score >= 70) return 'score-safe';
  if (score >= 50) return 'score-caution';
  if (score >= 30) return 'score-warning';
  return 'score-danger';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
</script>

<style scoped>
.macro-dashboard {
  background: rgba(15, 23, 42, 0.95);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(55, 65, 81, 0.9);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(55, 65, 81, 0.6);
}

.dashboard-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #e5e7eb;
}

.overall-risk {
  display: flex;
  align-items: center;
  gap: 16px;
}

.risk-score {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
}

.risk-score.risk-low {
  color: #22c55e;
}

.risk-score.risk-medium {
  color: #f59e0b;
}

.risk-score.risk-high {
  color: #f97316;
}

.risk-score.risk-extreme {
  color: #ef4444;
}

.risk-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label-text {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.risk-level {
  font-size: 1rem;
  font-weight: 700;
}

.risk-dimensions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.ai-summary-section {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 20px;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.summary-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #e5e7eb;
}

.summary-icon {
  font-size: 1.5rem;
}

.summary-content {
  margin: 0;
  font-size: 0.9rem;
  color: #d1d5db;
  line-height: 1.6;
}

.alerts-section {
  margin-bottom: 20px;
}

.alerts-section h3 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  color: #e5e7eb;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  padding: 14px;
  border-radius: 10px;
  border: 1px solid;
}

.alert-info {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.alert-warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.alert-critical {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.alert-header {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.alert-level {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: #e5e7eb;
}

.alert-dimension {
  font-size: 0.75rem;
  color: #9ca3af;
}

.alert-message {
  margin: 0 0 6px 0;
  font-size: 0.9rem;
  color: #e5e7eb;
  line-height: 1.5;
}

.alert-recommendation {
  margin: 0;
  font-size: 0.85rem;
  color: #9ca3af;
  line-height: 1.4;
}

.key-concerns {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 20px;
}

.key-concerns h3 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  color: #e5e7eb;
}

.concerns-list {
  margin: 0;
  padding-left: 20px;
  list-style: disc;
  color: #d1d5db;
  font-size: 0.9rem;
  line-height: 1.6;
}

.concerns-list li {
  margin-bottom: 6px;
}

.recommendations-section {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 18px;
}

.recommendations-section h3 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  color: #e5e7eb;
}

.recommendations-text {
  margin: 0;
  font-size: 0.9rem;
  color: #d1d5db;
  line-height: 1.6;
}

.risk-dimensions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.risk-card {
  background: rgba(31, 41, 55, 0.6);
  border-radius: 12px;
  padding: 18px;
  border: 1px solid rgba(55, 65, 81, 0.8);
  transition: all 0.3s ease;
}

.risk-card:hover {
  border-color: rgba(56, 189, 248, 0.5);
  transform: translateY(-2px);
}

.risk-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.risk-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.risk-info {
  flex: 1;
}

.risk-info h3 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  color: #e5e7eb;
}

.risk-status {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.risk-score-badge {
  font-size: 1.5rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 8px;
}

.score-safe {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.score-caution {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.score-warning {
  background: rgba(249, 115, 22, 0.2);
  color: #fb923c;
}

.score-danger {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.risk-indicators {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.indicator-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.ind-label {
  color: #9ca3af;
}

.ind-value {
  color: #e5e7eb;
  font-weight: 600;
}

.ind-value.positive {
  color: #22c55e;
}

.ind-value.negative {
  color: #ef4444;
}

.ind-value.warning {
  color: #f59e0b;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.8rem;
  color: #d1d5db;
  line-height: 1.4;
}

.event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.severity-high {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.severity-medium {
  background: #f59e0b;
}

.severity-low {
  background: #3b82f6;
}

.bubble-sectors {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bubble-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sector-name {
  font-size: 0.8rem;
  color: #d1d5db;
  min-width: 80px;
}

.bubble-bar {
  flex: 1;
  height: 8px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 999px;
  overflow: hidden;
}

.bubble-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #ef4444);
  border-radius: inherit;
  transition: width 0.4s ease;
}

.bubble-prob {
  font-size: 0.75rem;
  color: #f59e0b;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

.ai-recommendations {
  background: rgba(59, 130, 246, 0.1);
  border-radius: 12px;
  padding: 18px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  margin-bottom: 24px;
}

.ai-recommendations h3 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #e5e7eb;
}

.recommendations-list {
  margin: 0;
  padding-left: 20px;
  color: #d1d5db;
}

.recommendations-list li {
  margin-bottom: 8px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.key-events {
  background: rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  padding: 18px;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.key-events h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: #e5e7eb;
}

.events-timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.timeline-event {
  display: flex;
  align-items: center;
  gap: 16px;
}

.event-date {
  font-size: 0.8rem;
  color: #8b5cf6;
  font-weight: 600;
  min-width: 50px;
}

.event-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.event-name {
  font-size: 0.85rem;
  color: #d1d5db;
}

.event-importance {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.imp-critical {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.imp-high {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.imp-medium {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}
</style>
