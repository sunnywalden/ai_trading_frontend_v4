<template>
  <div 
    :class="[
      'hotspot-card',
      sentiment === 'BULLISH' ? 'sentiment-bullish' : (sentiment === 'BEARISH' ? 'sentiment-bearish' : 'sentiment-neutral')
    ]"
  >
    <div class="card-main">
      <!-- Left side: Impact Score & Sentiment -->
      <div class="impact-section">
        <div class="score-circle" :style="circleStyle">
          <div class="score-value">{{ impactScore }}</div>
          <div class="score-label">Impact</div>
        </div>
        <div class="sentiment-badge" :class="sentiment?.toLowerCase()">
          {{ sentimentIcon }} {{ sentiment || 'NEUTRAL' }}
        </div>
      </div>

      <!-- Right side: Content -->
      <div class="content-section">
        <div class="meta-header">
          <span class="category-tag" :class="categoryClass">
            {{ categoryIcon }} {{ category }}
          </span>
          <span class="source-info">{{ source }} • {{ formattedTime }}</span>
        </div>
        
        <h3 class="hotspot-title">{{ title }}</h3>
        
        <div class="description-box">
          <p>{{ description }}</p>
        </div>

        <div v-if="relatedSymbols?.length" class="symbols-list">
          <span v-for="sym in relatedSymbols" :key="sym" class="symbol-tag">
            {{ sym }}
          </span>
        </div>
      </div>
    </div>

    <!-- Footer: Link -->
    <div class="card-footer">
      <div class="severity-info">
        <span class="label">Severity:</span>
        <span class="value">{{ severity }}</span>
      </div>
      <a :href="url" target="_blank" class="insight-link">
        VIEW INSIGHT
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  description: string;
  impactScore: number;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  category: string;
  source: string;
  time: string;
  severity: string;
  url: string;
  relatedSymbols?: string[];
}>();

const sentimentIcon = computed(() => {
  if (props.sentiment === 'BULLISH') return '📈';
  if (props.sentiment === 'BEARISH') return '📉';
  return 'ℹ️';
});

const categoryIcon = computed(() => {
  const icons: Record<string, string> = {
    'WAR': '⚔️',
    'ECONOMY': '📊',
    'FINANCE': '🏦',
    'POLITICS': '⚖️',
    'COMPANY': '🏢',
    'TECH': '⚡️',
  };
  return icons[props.category] || '📋';
});

const categoryClass = computed(() => {
  return `cat-${props.category?.toLowerCase()}`;
});

const formattedTime = computed(() => {
  try {
    const d = new Date(props.time);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return props.time;
  }
});

const circleStyle = computed(() => {
  let color = '#3b82f6'; // Blue
  if (props.sentiment === 'BULLISH') color = '#22c55e'; // Green
  if (props.sentiment === 'BEARISH') color = '#ef4444'; // Red
  
  return {
    borderColor: `${color}44`,
    boxShadow: `0 0 15px ${color}22`
  };
});
</script>

<style scoped>
.hotspot-card {
  background: rgba(17, 24, 39, 0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.hotspot-card:hover {
  transform: translateY(-4px);
  background: rgba(17, 24, 39, 0.85);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.sentiment-bullish { border-left: 4px solid #22c55e; }
.sentiment-bearish { border-left: 4px solid #ef4444; }
.sentiment-neutral { border-left: 4px solid #3b82f6; }

.card-main {
  display: flex;
  padding: 20px;
  gap: 20px;
}

.impact-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 100px;
}

.score-circle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 4px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
}

.score-value {
  font-size: 22px;
  font-weight: 800;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: #f3f4f6;
  line-height: 1;
}

.score-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  margin-top: 2px;
  font-weight: bold;
}

.sentiment-badge {
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

.sentiment-badge.bullish { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.sentiment-badge.bearish { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.sentiment-badge.neutral { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }

.content-section {
  flex-grow: 1;
  min-width: 0;
}

.meta-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.category-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.cat-war { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.cat-economy { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.cat-finance { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.cat-politics { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
.cat-company { background: rgba(234, 179, 8, 0.15); color: #eab308; }
.cat-tech { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }

.source-info {
  font-size: 11px;
  color: #6b7280;
  font-family: ui-monospace, monospace;
}

.hotspot-title {
  font-size: 17px;
  font-weight: 700;
  color: #f9fafb;
  line-height: 1.3;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.description-box {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 12px;
}

.description-box p {
  font-size: 13px;
  color: #d1d5db;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.symbols-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.symbol-tag {
  font-size: 10px;
  font-weight: 800;
  font-family: ui-monospace, monospace;
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
}

.card-footer {
  margin-top: auto;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.severity-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.severity-info .label {
  font-size: 9px;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 700;
}

.severity-info .value {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 800;
  font-family: ui-monospace, monospace;
}

.insight-link {
  font-size: 11px;
  font-weight: 900;
  color: #3b82f6;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.05em;
  transition: color 0.2s;
}

.insight-link:hover {
  color: #60a5fa;
}
</style>
