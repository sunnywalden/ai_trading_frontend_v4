<template>
  <div class="ai-insight-card" :class="['priority-' + insight.priority, 'type-' + insight.insight_type]">
    <div class="insight-header">
      <span class="insight-icon">{{ getIcon(insight.insight_type) }}</span>
      <span class="insight-priority" :class="'priority-' + insight.priority">{{ getPriorityLabel(insight.priority) }}</span>
    </div>
    <h4 class="insight-title">{{ insight.title }}</h4>
    <p class="insight-content">{{ insight.content }}</p>
    <div class="insight-actions" v-if="insight.action_items.length > 0">
      <span class="action-label">建议行动:</span>
      <ul class="action-list">
        <li v-for="(action, idx) in insight.action_items" :key="idx">{{ action }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AIInsight } from '@/api/client'

defineProps<{
  insight: AIInsight
}>()

function getIcon(type: string): string {
  const icons: Record<string, string> = {
    'opportunity': '💡',
    'warning': '⚠️',
    'suggestion': '💭',
    'info': 'ℹ️',
  }
  return icons[type] || '•'
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    'high': '高优先级',
    'medium': '中优先级',
    'low': '低优先级',
  }
  return labels[priority] || priority
}
</script>

<style scoped>
.ai-insight-card {
  padding: 14px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #6366f1;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.insight-icon {
  font-size: 1.25rem;
}

.insight-priority {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.insight-priority.priority-high {
  background: #fee2e2;
  color: #991b1b;
}

.insight-priority.priority-medium {
  background: #fef3c7;
  color: #92400e;
}

.insight-priority.priority-low {
  background: #dbeafe;
  color: #1e40af;
}

.insight-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.insight-content {
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
  line-height: 1.5;
  margin: 0;
}

.insight-actions {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
}

.action-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6366f1;
}

.action-list {
  margin: 6px 0 0 0;
  padding-left: 20px;
  font-size: 0.8rem;
  line-height: 1.6;
}
</style>