<template>
  <div v-if="run" class="recent-run-card">
    <div class="card-header">
      <div>
        <p class="small-label">最近策略运行</p>
        <h3>{{ run.run_id }}</h3>
        <p class="subtitle">状态：{{ run.status }} · 尝试次数 {{ run.attempt }}</p>
      </div>
      <button class="export-btn" @click="$emit('export', run.run_id)">导出 CSV</button>
    </div>

    <div class="progress-wrap">
      <div class="progress-bar" :style="{ width: `${run.progress}%` }"></div>
      <span class="progress-label">进度：{{ run.progress }}%</span>
    </div>

    <div class="timeline" v-if="timelineEntries.length">
      <div v-for="entry in timelineEntries" :key="entry.phase" class="timeline-item">
        <span class="phase-name">{{ entry.phase }}</span>
        <span class="phase-time">{{ entry.start }} → {{ entry.end || '进行中' }}</span>
      </div>
    </div>

    <div v-if="assets && assets.length" class="assets-section">
      <div class="assets-header">
        <strong>Top 标的</strong>
        <button class="ghost-btn" @click="$emit('view-results', run.run_id)">查看完整结果</button>
      </div>
      <div class="asset-list">
        <span
          v-for="asset in topAssets"
          :key="asset.symbol"
          class="asset-pill"
        >
          <span class="symbol">{{ asset.symbol }}</span>
          <span class="value">{{ asset.signal_strength?.toFixed(2) ?? '--' }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StrategyRunStatusView, StrategyRunAssetView } from '../api/client';
import { computed } from 'vue';

const props = defineProps<{ run: StrategyRunStatusView | null; assets?: StrategyRunAssetView[] }>();
const emit = defineEmits<{ (e: 'export', runId: string): void; (e: 'view-results', runId: string): void }>();

const timelineEntries = computed(() => {
  if (!props.run?.timeline) return [];
  return Object.entries(props.run.timeline).map(([phase, payload]) => ({
    phase,
    start: payload?.start ? formatTime(payload.start) : '未知',
    end: payload?.end ? formatTime(payload.end) : '',
  }));
});

const topAssets = computed(() => {
  if (!props.assets) return [];
  return props.assets.slice(0, 4);
});

function formatTime(value: string): string {
  try {
    const date = new Date(value);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return value;
  }
}
</script>

<style scoped>
.recent-run-card {
  padding: 18px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.small-label {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

h3 {
  margin: 4px 0 0;
  font-size: 1.2rem;
  color: #e5e7eb;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.export-btn {
  border-radius: 999px;
  border: 1px solid rgba(226, 232, 240, 0.3);
  background: transparent;
  color: #38bdf8;
  padding: 6px 16px;
  font-size: 0.8rem;
  cursor: pointer;
}

.progress-wrap {
  position: relative;
  height: 8px;
  background: rgba(55, 65, 81, 0.6);
  border-radius: 4px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(135deg, #22c55e, #4ade80);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.progress-label {
  margin-top: 4px;
  font-size: 0.75rem;
  color: #9ca3af;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.timeline-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #94a3b8;
}

.phase-name {
  font-weight: 600;
  color: #e5e7eb;
}

.timeline span {
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
}

.assets-section {
  padding-top: 6px;
  border-top: 1px solid rgba(55, 65, 81, 0.5);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.assets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ghost-btn {
  border-radius: 999px;
  padding: 4px 12px;
  border: 1px solid rgba(226, 232, 240, 0.3);
  background: transparent;
  color: #e5e7eb;
  font-size: 0.75rem;
}

.asset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.asset-pill {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(59, 130, 246, 0.1);
  font-size: 0.8rem;
  display: flex;
  gap: 6px;
  align-items: center;
}

.asset-pill .symbol {
  font-weight: 600;
  color: #38bdf8;
}

.asset-pill .value {
  color: #d1d5db;
}
</style>
