<template>
  <div v-if="run" class="recent-run-card">
    <div class="card-header">
      <div>
        <p class="small-label">{{ $t('execution_list.recent_run.title') }}</p>
        <h3>{{ run.run_id }}</h3>
        <p class="subtitle">{{ $t('execution_list.recent_run.status_info', { status: run.status, attempt: run.attempt }) }}</p>
      </div>
      <button class="export-btn" @click="$emit('export', run.run_id)">{{ $t('execution_list.recent_run.export_csv') }}</button>
    </div>

    <div class="progress-wrap">
      <div class="progress-bar" :style="{ width: `${run.progress}%` }"></div>
      <span class="progress-label">{{ $t('execution_list.recent_run.progress', { progress: run.progress }) }}</span>
    </div>

    <div class="timeline" v-if="timelineEntries.length">
      <div v-for="entry in timelineEntries" :key="entry.phase" class="timeline-item">
        <span class="phase-name">{{ entry.phase }}</span>
        <span class="phase-time">{{ entry.start }} → {{ entry.end || $t('execution_list.recent_run.in_progress') }}</span>
      </div>
    </div>

    <div v-if="assets && assets.length" class="assets-section">
      <div class="assets-header">
        <strong>{{ $t('execution_list.recent_run.top_assets') }}</strong>
        <button class="ghost-btn" @click="$emit('view-results', run.run_id)">{{ $t('execution_list.recent_run.view_full') }}</button>
      </div>
        <div
          v-for="asset in topAssets"
          :key="asset.symbol"
          class="asset-item"
        >
          <div class="asset-main">
            <span class="symbol">{{ asset.symbol }}</span>
            <span class="strength">{{ $t('execution_list.recent_run.strength', { val: asset.signal_strength?.toFixed(1) }) }}</span>
            <div class="risk-flags">
              <span v-for="flag in asset.risk_flags" :key="flag" class="risk-tag">{{ flag }}</span>
            </div>
          </div>
          <p class="asset-notes">{{ asset.notes }}</p>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StrategyRunStatusView, StrategyRunAssetView } from '../api/client';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const props = defineProps<{ run: StrategyRunStatusView | null; assets?: StrategyRunAssetView[] }>();
const emit = defineEmits<{ (e: 'export', runId: string): void; (e: 'view-results', runId: string): void }>();

const timelineEntries = computed(() => {
  if (!props.run?.timeline) return [];
  return Object.entries(props.run.timeline).map(([phase, payload]) => ({
    phase,
    start: payload?.start ? formatTime(payload.start) : t('common.unknown'),
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
    return date.toLocaleString(locale.value, {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
  flex-direction: column;
  gap: 8px;
}

.asset-item {
  background: rgba(30, 41, 59, 0.4);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.asset-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.asset-main .symbol {
  font-weight: 700;
  color: #38bdf8;
  font-size: 1.05rem;
}

.strength {
  font-size: 0.8rem;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
}

.risk-flags {
  display: flex;
  gap: 4px;
}

.risk-tag {
  font-size: 0.7rem;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 0 4px;
  border-radius: 3px;
}

.asset-notes {
  margin: 0;
  font-size: 0.8rem;
  color: #9ca3af;
  font-style: italic;
}
</style>
