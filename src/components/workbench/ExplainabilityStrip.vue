<template>
  <!-- V11.1.1 Explainability Strip — attached below any key workbench result -->
  <div class="es" :class="`es--${sourceType || 'unknown'}`">
    <div class="es__result">
      <span class="es__result-value">{{ resultValue }}</span>
      <span v-if="unit" class="es__result-unit">{{ unit }}</span>
    </div>

    <div class="es__explain">
      <span class="es__explain-text">{{ explanation || '—' }}</span>
    </div>

    <div class="es__meta">
      <span class="es__meta-item es__source" :title="`来源: ${sourceTypeLabel}`">
        {{ sourceTypeLabel }}
      </span>

      <span class="es__meta-sep">·</span>

      <span class="es__meta-item es__quality" :class="`es__quality--${qualityKey}`" :title="`数据质量: ${dataQuality || '未知'}`">
        {{ dataQuality || '未知' }}
      </span>

      <span class="es__meta-sep">·</span>

      <span class="es__meta-item es__updated" :title="`最后更新: ${lastUpdated}`">
        {{ lastUpdated || '—' }}
      </span>
    </div>

    <div v-if="suggestedAction" class="es__action">
      <span class="es__action-label">建议动作</span>
      <span class="es__action-value">{{ suggestedAction }}</span>
      <button v-if="actionable" class="es__action-btn" @click="$emit('action')">
        执行
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const SOURCE_LABELS: Record<string, string> = {
  ai: 'AI 推断',
  rule: '规则引擎',
  model: '模型输出',
  manual: '人工标注',
  backtest: '回测结果',
  live: '实盘数据',
  synthetic: '合成信号',
  unknown: '来源未知',
}

const props = withDefaults(defineProps<{
  /** The headline result number or label */
  resultValue: string | number
  /** Optional unit suffix (%, bps, 元, etc.) */
  unit?: string
  /** Human-readable explanation of how the result was derived */
  explanation?: string
  /** One of: ai | rule | model | manual | backtest | live | synthetic | unknown */
  sourceType?: string
  /** high | medium | low | unknown */
  dataQuality?: string
  /** Formatted timestamp string */
  lastUpdated?: string
  /** Optional suggested action text */
  suggestedAction?: string
  /** Whether the suggested action has an executable button */
  actionable?: boolean
}>(), {
  sourceType: 'unknown',
  actionable: false,
})

defineEmits<{ action: [] }>()

const sourceTypeLabel = computed(() =>
  SOURCE_LABELS[props.sourceType || 'unknown'] ?? props.sourceType ?? '来源未知'
)

const qualityKey = computed(() => {
  const q = (props.dataQuality || '').toLowerCase()
  if (['high', 'medium', 'low'].includes(q)) return q
  return 'unknown'
})
</script>

<style scoped>
/* ── Base ────────────────────────────────────────────────────────────── */
.es {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 14px;
  border-radius: 8px;
  border-left: 3px solid rgba(99, 102, 241, 0.5);
  background: rgba(15, 23, 42, 0.7);
  font-size: 0.82rem;
  flex-wrap: wrap;
}

/* Source-type accent colours */
.es--ai        { border-left-color: rgba(139, 92, 246, 0.7); }
.es--rule      { border-left-color: rgba(59, 130, 246, 0.7); }
.es--model     { border-left-color: rgba(16, 185, 129, 0.7); }
.es--manual    { border-left-color: rgba(245, 158, 11, 0.7); }
.es--backtest  { border-left-color: rgba(99, 102, 241, 0.7); }
.es--live      { border-left-color: rgba(34, 197, 94, 0.7); }
.es--synthetic { border-left-color: rgba(148, 163, 184, 0.3); }
.es--unknown   { border-left-color: rgba(148, 163, 184, 0.25); }

/* ── Result value ────────────────────────────────────────────────────── */
.es__result {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-shrink: 0;
}
.es__result-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
  font-variant-numeric: tabular-nums;
}
.es__result-unit {
  font-size: 0.78rem;
  color: #9ca3af;
}

/* ── Explanation ─────────────────────────────────────────────────────── */
.es__explain {
  flex: 1;
  min-width: 140px;
}
.es__explain-text {
  color: #d1d5db;
  line-height: 1.4;
}

/* ── Meta row ────────────────────────────────────────────────────────── */
.es__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  white-space: nowrap;
}
.es__meta-sep { opacity: 0.5; }
.es__source  { color: #818cf8; }
.es__updated { font-family: Consolas, Monaco, monospace; }

/* Data quality badge */
.es__quality { font-weight: 600; }
.es__quality--high    { color: #6ee7b7; }
.es__quality--medium  { color: #fbbf24; }
.es__quality--low     { color: #f87171; }
.es__quality--unknown { color: #6b7280; }

/* ── Suggested action ────────────────────────────────────────────────── */
.es__action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 0;
  flex-wrap: wrap;
}
.es__action-label {
  font-size: 0.72rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.es__action-value {
  color: #a5b4fc;
}
.es__action-btn {
  padding: 3px 10px;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  border-radius: 6px;
  color: #c7d2fe;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
}
.es__action-btn:hover { background: rgba(99, 102, 241, 0.35); }

/* ── Responsive ──────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .es { gap: 10px; padding: 8px 10px; }
  .es__meta { flex-wrap: wrap; }
  .es__explain { min-width: 100%; }
}
</style>
