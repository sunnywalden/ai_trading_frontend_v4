<template>
  <div class="api-provider-card">
    <div class="card-header">
      <div class="provider-info">
        <span class="provider-icon">{{ providerIcon }}</span>
        <div>
          <h3 class="provider-name">{{ providerName }}</h3>
          <p class="provider-desc">{{ providerDesc }}</p>
        </div>
      </div>
      <span :class="['status-badge', `status-${stats.status}`]">
        {{ statusLabel }}
      </span>
    </div>
    
    <div class="usage-section">
      <h4 class="section-title">使用情况</h4>
      <div class="usage-display">
        <div class="usage-ring">
          <svg viewBox="0 0 100 100" class="ring-svg">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(55, 65, 81, 0.5)"
              stroke-width="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              :stroke="ringColor"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="ringDashArray"
              :stroke-dashoffset="ringDashOffset"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div class="usage-percent">
            {{ Math.round(stats.usage_percent) }}%
          </div>
        </div>
        <div class="usage-details">
          <div class="usage-row">
            <span class="usage-label">已用</span>
            <span class="usage-value">{{ stats.total_calls }}</span>
          </div>
          <div class="usage-row">
            <span class="usage-label">限额</span>
            <span class="usage-value">{{ formatLimit(stats.rate_limit) }}</span>
          </div>
          <div class="usage-row">
            <span class="usage-label">剩余</span>
            <span :class="['usage-value', remainingClass]">{{ stats.remaining }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="stats-section">
      <h4 class="section-title">📊 统计</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">总调用</span>
          <span class="stat-value">{{ stats.total_calls }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">成功</span>
          <span class="stat-value success">{{ stats.success_calls }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">失败</span>
          <span class="stat-value error">{{ stats.error_calls }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">成功率</span>
          <span class="stat-value">{{ stats.success_rate.toFixed(1) }}%</span>
        </div>
      </div>
    </div>
    
    <div class="limits-section">
      <h4 class="section-title">⚙️ Rate Limit</h4>
      <div class="limits-grid">
        <div class="limit-item">
          <span class="limit-label">日限额</span>
          <span class="limit-value">{{ formatLimit(policy.daily_limit) }}</span>
        </div>
        <div class="limit-item">
          <span class="limit-label">小时</span>
          <span class="limit-value">{{ formatLimit(policy.hourly_limit) }}</span>
        </div>
        <div class="limit-item">
          <span class="limit-label">分钟</span>
          <span class="limit-value">{{ formatLimit(policy.minute_limit) }}</span>
        </div>
      </div>
      <p v-if="policy.notes" class="policy-notes">{{ policy.notes }}</p>
    </div>
    
    <div v-if="stats.suggestion" class="suggestion-section">
      <span class="suggestion-icon">💡</span>
      <p class="suggestion-text">{{ stats.suggestion }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ApiStats, RateLimitPolicy } from '../api/client';

interface Props {
  stats: ApiStats;
  policy: RateLimitPolicy;
}

const props = defineProps<Props>();

const PROVIDER_CONFIG: Record<string, { icon: string; name: string; desc: string }> = {
  'FRED': { icon: '🏦', name: 'FRED API', desc: '宏观经济数据' },
  'NewsAPI': { icon: '📰', name: 'News API', desc: '地缘政治新闻' },
  'Tiger': { icon: '🐅', name: 'Tiger API', desc: '行情数据' },
  'YahooFinance': { icon: '💹', name: 'Yahoo Finance', desc: '备用行情数据' },
  'OpenAI': { icon: '🤖', name: 'OpenAI API', desc: 'AI决策助手' }
};

const providerIcon = computed(() => PROVIDER_CONFIG[props.stats.provider]?.icon || '📡');
const providerName = computed(() => PROVIDER_CONFIG[props.stats.provider]?.name || props.stats.provider);
const providerDesc = computed(() => PROVIDER_CONFIG[props.stats.provider]?.desc || '外部API服务');

const statusLabel = computed(() => {
  const statusMap: Record<string, string> = {
    'normal': '正常',
    'warning': '警告',
    'critical': '临界'
  };
  return statusMap[props.stats.status] || props.stats.status.toUpperCase();
});

const ringColor = computed(() => {
  if (props.stats.usage_percent >= 90) return '#ef4444';
  if (props.stats.usage_percent >= 70) return '#f59e0b';
  return '#22c55e';
});

const ringDashArray = computed(() => {
  const circumference = 2 * Math.PI * 40;
  return `${circumference} ${circumference}`;
});

const ringDashOffset = computed(() => {
  const circumference = 2 * Math.PI * 40;
  return circumference * (1 - props.stats.usage_percent / 100);
});

const remainingClass = computed(() => {
  if (props.stats.usage_percent >= 90) return 'critical';
  if (props.stats.usage_percent >= 70) return 'warning';
  return 'normal';
});

function formatLimit(value?: number): string {
  if (value === null || value === undefined) return '-';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}
</script>

<style scoped>
.api-provider-card {
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(55, 65, 81, 0.8);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: all 0.3s ease;
}

.api-provider-card:hover {
  border-color: rgba(56, 189, 248, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-icon {
  font-size: 2rem;
}

.provider-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #e5e7eb;
}

.provider-desc {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #9ca3af;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}

.status-badge.status-normal {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.status-badge.status-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.status-badge.status-critical {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.section-title {
  margin: 0 0 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #9ca3af;
}

.usage-display {
  display: flex;
  align-items: center;
  gap: 24px;
}

.usage-ring {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.ring-svg {
  width: 100%;
  height: 100%;
}

.usage-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: 700;
  color: #e5e7eb;
}

.usage-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.usage-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.usage-label {
  font-size: 0.85rem;
  color: #9ca3af;
}

.usage-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e5e7eb;
}

.usage-value.warning {
  color: #f59e0b;
}

.usage-value.critical {
  color: #ef4444;
}

.usage-value.normal {
  color: #22c55e;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.8rem;
  color: #9ca3af;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #e5e7eb;
}

.stat-value.success {
  color: #22c55e;
}

.stat-value.error {
  color: #ef4444;
}

.limits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 8px;
}

.limit-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.limit-label {
  font-size: 0.8rem;
  color: #9ca3af;
}

.limit-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e5e7eb;
}

.policy-notes {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
  font-style: italic;
}

.suggestion-section {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
}

.suggestion-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.suggestion-text {
  margin: 0;
  font-size: 0.85rem;
  color: #f59e0b;
  line-height: 1.5;
}

@media (max-width: 600px) {
  .usage-display {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .limits-grid {
    grid-template-columns: 1fr;
  }
}
</style>
