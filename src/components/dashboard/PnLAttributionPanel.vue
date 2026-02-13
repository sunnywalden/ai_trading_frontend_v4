<template>
  <div class="pnl-attribution-panel">
    <div class="tabs">
      <button 
        :class="{ active: activeTab === 'symbol' }" 
        @click="activeTab = 'symbol'"
      >按标的</button>
      <button 
        :class="{ active: activeTab === 'strategy' }" 
        @click="activeTab = 'strategy'"
      >按策略</button>
    </div>

    <div v-if="activeTab === 'symbol'" class="attribution-list">
      <div class="attr-group">
        <h4>盈利前五</h4>
        <div v-for="item in performers" :key="item.symbol" class="attr-item">
          <span class="label">{{ item.symbol }}</span>
          <span class="value pos">+${{ item.contribution.toLocaleString() }} ({{ item.contribution_pct.toFixed(1) }}%)</span>
        </div>
        <div v-if="performers.length === 0" class="empty">暂无盈利记录</div>
      </div>
      
      <div class="attr-group">
        <h4>亏损前五</h4>
        <div v-for="item in losers" :key="item.symbol" class="attr-item">
          <span class="label">{{ item.symbol }}</span>
          <span class="value neg">-${{ Math.abs(item.contribution).toLocaleString() }} ({{ item.contribution_pct.toFixed(1) }}%)</span>
        </div>
        <div v-if="losers.length === 0" class="empty">暂无亏损记录</div>
      </div>
    </div>

    <div v-else class="attribution-list">
      <div class="attr-group">
        <h4>策略表现</h4>
        <div v-for="item in strategies" :key="item.strategy_id" class="attr-item strategy">
          <div class="strategy-info">
            <span class="label">{{ item.strategy_name }}</span>
            <span class="sub">胜率: {{ (item.win_rate * 100).toFixed(1) }}% | Sharpe: {{ item.sharpe.toFixed(2) }}</span>
          </div>
          <span class="value" :class="item.avg_return >= 0 ? 'pos' : 'neg'">
            {{ item.avg_return >= 0 ? '+' : '' }}{{ (item.avg_return * 100).toFixed(2) }}%
          </span>
        </div>
        <div v-if="strategies.length === 0" class="empty">暂无策略表现数据</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PnLAttribution, StrategyPerformance } from '@/api/client'

defineProps<{
  performers: PnLAttribution[]
  losers: PnLAttribution[]
  strategies: StrategyPerformance[]
}>()

const activeTab = ref<'symbol' | 'strategy'>('symbol')
</script>

<style scoped>
.pnl-attribution-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border, #eee);
  padding-bottom: 8px;
}

.tabs button {
  padding: 4px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary, #888);
  border-radius: 4px;
}

.tabs button.active {
  background: var(--bg-hover, #f0f0f0);
  color: var(--primary, #6366f1);
  font-weight: 600;
}

.attribution-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.attr-group h4 {
  font-size: 0.85rem;
  color: var(--text-secondary, #888);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.attr-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border, #f5f5f5);
  font-size: 0.9rem;
}

.attr-item.strategy {
  padding: 10px 0;
}

.strategy-info {
  display: flex;
  flex-direction: column;
}

.strategy-info .sub {
  font-size: 0.75rem;
  color: var(--text-secondary, #888);
}

.label {
  font-weight: 600;
}

.value {
  font-family: 'Roboto Mono', monospace;
  font-weight: 500;
}

.pos { color: #10b981; }
.neg { color: #ef4444; }

.empty {
  padding: 12px 0;
  color: var(--text-secondary, #888);
  font-size: 0.85rem;
  font-style: italic;
}
</style>
