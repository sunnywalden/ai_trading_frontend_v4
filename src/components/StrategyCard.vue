<template>
  <div class="strategy-card" :class="{ inactive: !strategy.is_active }">
    <!-- 顶部：分类标签 + 状态 -->
    <div class="card-top">
      <div class="badge-group">
        <span class="style-chip" v-if="strategy.style">{{ strategy.style }}</span>
        <span v-if="strategy.is_builtin" class="builtin-chip">{{ $t('execution_list.strategy_card.builtin') }}</span>
      </div>
      <span class="status-dot" :class="statusClass"></span>
      <span class="status-text" :class="statusClass">{{ statusLabel }}</span>
    </div>

    <!-- 策略名称 -->
    <h3 class="strategy-name">{{ strategy.name }}</h3>

    <!-- 策略描述 -->
    <p class="strategy-description">{{ strategy.description || $t('execution_list.strategy_card.no_desc') }}</p>

    <!-- 分隔线 -->
    <div class="card-divider"></div>

    <!-- 标签 -->
    <div class="tag-wrap" v-if="strategy.tags && strategy.tags.length">
      <span v-for="tag in strategy.tags.slice(0, 4)" :key="tag" class="tag-pill"># {{ tag }}</span>
    </div>

    <!-- 底部：时间 + 按钮 -->
    <div class="card-footer">
      <div class="last-run-info">
        <span class="last-run-icon">🕐</span>
        <span class="last-run-text">{{ lastRunText }}</span>
        <span class="last-run-relative" v-if="lastRunRelative">{{ lastRunRelative }}</span>
      </div>
      <button class="detail-btn" @click="$emit('view', strategy)">
        {{ $t('execution_list.strategy_card.details') }}
        <span class="detail-arrow">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Strategy } from '@/types/strategy';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

type StrategyLike = Strategy | { id: string; name: string; style?: string | null; description?: string | null; is_builtin: boolean; is_active: boolean; tags?: string[]; last_run_status?: string | null; last_run_at?: string | null; };

const props = defineProps<{ 
  strategy: StrategyLike;
  performance?: { total_signals: number; win_rate: number; avg_pnl_pct: number; total_pnl: number }
}>();
const emit = defineEmits<{ (e: 'run', strategy: StrategyLike): void; (e: 'view', strategy: StrategyLike): void }>();

const statusLabel = computed(() => {
  if (!props.strategy.last_run_status) return t('execution_list.strategy_card.not_run');
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
  if (!props.strategy.last_run_at) return t('execution_list.strategy_card.not_run');
  const date = new Date(props.strategy.last_run_at);
  return date.toLocaleString(locale.value, {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const lastRunRelative = computed(() => {
  if (!props.strategy.last_run_at) return '';
  const date = new Date(props.strategy.last_run_at);
  return formatRelativeTime(date);
});

function formatRelativeTime(date: Date): string {
  try {
    const now = Date.now();
    const diffMs = now - date.getTime();
    if (Number.isNaN(diffMs)) return t('execution_list.strategy_card.relative.unknown');
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return t('execution_list.strategy_card.relative.just_now');
    if (minutes < 60) return t('execution_list.strategy_card.relative.min_ago', { n: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('execution_list.strategy_card.relative.hour_ago', { n: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t('execution_list.strategy_card.relative.day_ago', { n: days });
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return t('execution_list.strategy_card.relative.week_ago', { n: weeks });
    const months = Math.floor(days / 30);
    if (months < 12) return t('execution_list.strategy_card.relative.month_ago', { n: months });
    const years = Math.floor(days / 365);
    return t('execution_list.strategy_card.relative.year_ago', { n: years });
  } catch (e) {
    return t('execution_list.strategy_card.relative.unknown');
  }
}
</script>

<style scoped>
/* ===== 卡片容器 ===== */
.strategy-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px;
  border-radius: 14px;
  border: 1px solid rgba(56, 189, 248, 0.15);
  background: linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
  transition: all 0.25s ease;
  cursor: pointer;
  height: 100%;
  box-sizing: border-box;
}

.strategy-card:hover {
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 8px 32px rgba(14, 165, 233, 0.15), 0 2px 8px rgba(0,0,0,0.4);
  transform: translateY(-2px);
}

.strategy-card.inactive {
  opacity: 0.55;
}

/* ===== 顶部标签行 ===== */
.card-top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.badge-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  flex-wrap: wrap;
}

.style-chip {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  background: rgba(14, 165, 233, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(14, 165, 233, 0.25);
}

.builtin-chip {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 500;
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.25);
}

/* ===== 状态指示 ===== */
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.status-completed .status-dot,
.status-dot.status-completed { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.6); }
.status-text.status-completed { color: #4ade80; }

.status-executing .status-dot,
.status-queued .status-dot,
.status-dot.status-executing,
.status-dot.status-queued { background: #3b82f6; box-shadow: 0 0 6px rgba(59, 130, 246, 0.6); }
.status-text.status-executing,
.status-text.status-queued { color: #60a5fa; }

.status-failed .status-dot,
.status-dot.status-failed { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.6); }
.status-text.status-failed { color: #f87171; }

.status-unknown .status-dot,
.status-dot.status-unknown { background: #6b7280; }
.status-text.status-unknown { color: #9ca3af; }

/* ===== 策略名称 ===== */
.strategy-name {
  margin: 6px 0 2px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.4;
  text-align: center;
  letter-spacing: 0.01em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===== 策略描述 ===== */
.strategy-description {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

/* ===== 分隔线 ===== */
.card-divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.1), transparent);
  margin: 2px 0;
}

/* ===== 标签 ===== */
.tag-wrap {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag-pill {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(30, 58, 138, 0.3);
  color: #93c5fd;
  font-size: 0.68rem;
  font-family: monospace;
  border: 1px solid rgba(59, 130, 246, 0.15);
}

/* ===== 底部行 ===== */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 4px;
}

.last-run-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: #475569;
  min-width: 0;
  overflow: hidden;
}

.last-run-icon {
  font-size: 0.75rem;
  flex-shrink: 0;
}

.last-run-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-run-relative {
  color: #334155;
  white-space: nowrap;
  flex-shrink: 0;
}

.detail-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  background: rgba(14, 165, 233, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(14, 165, 233, 0.25);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.detail-btn:hover {
  background: rgba(14, 165, 233, 0.25);
  border-color: rgba(14, 165, 233, 0.5);
  color: #7dd3fc;
}

.detail-arrow {
  font-size: 0.9rem;
  transition: transform 0.2s ease;
}

.detail-btn:hover .detail-arrow {
  transform: translateX(3px);
}
</style>
