<template>
  <div class="strategy-card" :class="{ inactive: !strategy.is_active }">
    <div class="card-header">
      <div>
        <div class="header-tags">
          <span class="style-chip" v-if="strategy.style">{{ strategy.style }}</span>
          <span v-if="strategy.is_builtin" class="builtin-chip">内置策略</span>
        </div>
        <h3 class="strategy-name">{{ strategy.name }}</h3>
        <p class="strategy-description">{{ strategy.description || '暂无描述' }}</p>
      </div>
      <span class="status-badge" :class="statusClass">{{ statusLabel }}</span>
    </div>

    <div class="meta-row">
      <div class="meta-item">
        <span class="meta-label">最近运行</span>
        <div class="meta-value">
          <span>{{ lastRunText }}</span>
          <span class="relative-label">{{ lastRunRelative }}</span>
        </div>
      </div>
      <div class="meta-item">
        <span class="meta-label">标签</span>
        <div class="tag-wrap">
          <span v-for="tag in strategy.tags" :key="tag" class="tag-pill">{{ tag }}</span>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="ghost-btn" @click="$emit('view', strategy)">策略逻辑详情</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StrategySummaryView } from '../api/client';
import { computed } from 'vue';

const props = defineProps<{ strategy: StrategySummaryView }>();
const emit = defineEmits<{ (e: 'run', strategy: StrategySummaryView): void; (e: 'view', strategy: StrategySummaryView): void }>();

const statusLabel = computed(() => {
  if (!props.strategy.last_run_status) return '未运行';
  return props.strategy.last_run_status;
});

const statusClass = computed(() => {
  const status = props.strategy.last_run_status?.toLowerCase();
  if (status === 'completed') return 'status-completed';
  if (status === 'executing') return 'status-executing';
  if (status === 'queued') return 'status-queued';
  if (status === 'failed') return 'status-failed';
  return 'status-unknown';
});

const lastRunText = computed(() => {
  if (!props.strategy.last_run_at) return '暂无记录';
  const date = new Date(props.strategy.last_run_at);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
});

const lastRunRelative = computed(() => {
  if (!props.strategy.last_run_at) return '暂无记录';
  const date = new Date(props.strategy.last_run_at);
  return formatRelativeTime(date);
});

function formatRelativeTime(date: Date): string {
  try {
    const now = Date.now();
    const diffMs = now - date.getTime();
    if (Number.isNaN(diffMs)) return '未知';
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} 天前`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} 周前`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} 个月前`;
    const years = Math.floor(days / 365);
    return `${years} 年前`;
  } catch (e) {
    return '未知';
  }
}
</script>

<style scoped>
.strategy-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  background: rgba(15, 23, 42, 0.8);
  transition: border 0.3s ease, box-shadow 0.3s ease;
}

.strategy-card:hover {
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.6);
}

.strategy-card.inactive {
  opacity: 0.6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.style-chip {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  text-transform: uppercase;
  background: rgba(14, 165, 233, 0.2);
  color: #38bdf8;
  margin-bottom: 4px;
}

.header-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.builtin-chip {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.65rem;
  text-transform: uppercase;
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
}

.strategy-name {
  margin: 0;
  font-size: 1.1rem;
  color: #e5e7eb;
}

.strategy-description {
  margin: 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-completed {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.status-executing,
.status-queued {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.status-unknown {
  background: rgba(107, 114, 128, 0.2);
  color: #cbd5f5;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 0.7rem;
  color: #9ca3af;
}

.meta-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.relative-label {
  font-size: 0.7rem;
  font-weight: 400;
  color: #94a3b8;
}

.tag-wrap {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  font-size: 0.7rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.primary-btn,
.ghost-btn {
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform 0.2s ease;
}

.primary-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
}

.ghost-btn {
  background: transparent;
  border: 1px solid rgba(226, 232, 240, 0.4);
  color: #e5e7eb;
}

.actions button:hover {
  transform: translateY(-1px);
}
</style>
