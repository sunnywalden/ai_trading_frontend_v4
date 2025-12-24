<template>
  <div class="card">
    <div class="header">
      <h3>{{ symbol }}</h3>
      <span class="tier" :class="'tier-' + tier.toLowerCase()">{{ tier }}</span>
    </div>
    <p class="label">行为画像（Demo 静态数据，可接后端 /behavior API）</p>

    <div class="grid">
      <div class="metric">
        <span class="name">行为评分</span>
        <span class="value">{{ behaviorScore }}</span>
      </div>
      <div class="metric">
        <span class="name">卖飞评分</span>
        <span class="value">{{ sellFlyScore }}</span>
      </div>
      <div class="metric">
        <span class="name">过度交易</span>
        <span class="value">{{ overtradeScore }}</span>
      </div>
      <div class="metric">
        <span class="name">报复性交易</span>
        <span class="value">{{ revengeScore }}</span>
      </div>
    </div>

    <div class="grid grid-secondary">
      <div class="metric small">
        <span class="name">统计窗口成交笔数</span>
        <span class="value">{{ tradeCount }}</span>
      </div>
      <div class="metric small">
        <span class="name">最近卖飞次数</span>
        <span class="value">{{ sellFlyEvents }}</span>
      </div>
      <div class="metric small">
        <span class="name">卖飞成本占比</span>
        <span class="value">{{ (sellFlyExtraCostRatio * 100).toFixed(1) }}%</span>
      </div>
      <div class="metric small">
        <span class="name">过度交易指数</span>
        <span class="value">{{ overtradeIndex.toFixed(2) }}</span>
      </div>
      <div class="metric small">
        <span class="name">报复性交易次数</span>
        <span class="value">{{ revengeEvents }}</span>
      </div>
    </div>

    <p class="hint">
      行为越“躁动”，该标的的 ShockPolicy / EarningsPolicy 就越收紧，
      自动对冲更倾向于减少裸暴露、增加保护性对冲。
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  symbol: string;
  tier: "T1" | "T2" | "T3" | "T4";
  behaviorScore: number;
  sellFlyScore: number;
  overtradeScore: number;
  revengeScore: number;

  tradeCount: number;
  sellFlyEvents: number;
  sellFlyExtraCostRatio: number;
  overtradeIndex: number;
  revengeEvents: number;
}

defineProps<Props>();
</script>


<style scoped>
.card {
  background: rgba(15, 23, 42, 0.9);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(55, 65, 81, 0.9);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header h3 {
  margin: 0;
  font-size: 1rem;
}
.label {
  margin: 6px 0 12px;
  font-size: 0.78rem;
  color: #9ca3af;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.name {
  font-size: 0.78rem;
  color: #9ca3af;
}
.value {
  font-size: 0.95rem;
  font-weight: 600;
}
.tier {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
}
.tier-t1 {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}
.tier-t2 {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}
.tier-t3 {
  background: rgba(245, 158, 11, 0.2);
  color: #fb923c;
}
.tier-t4 {
  background: rgba(239, 68, 68, 0.2);
  color: #f97373;
}

.grid-secondary {
  margin-top: 10px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.metric.small {
  padding: 6px 8px;
}

.metric.small .name {
  font-size: 0.72rem;
  color: #9ca3af;
}

.metric.small .value {
  font-size: 0.78rem;
}
.hint {
  margin-top: 10px;
  font-size: 0.76rem;
  color: #9ca3af;
}
</style>
