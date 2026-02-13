<template>
  <div class="metric-card" :class="[`status-${status}`, `trend-${trend}`]">
    <div class="card-header">
      <span class="card-icon">{{ icon }}</span>
      <h4 class="card-title">{{ title }}</h4>
    </div>
    
    <div class="card-value">
      <span class="value-number">{{ value }}</span>
      <span v-if="trend" class="trend-indicator">
        {{ trend === 'up' ? '↑' : '↓' }}
      </span>
    </div>
    
    <p v-if="description" class="card-description">
      {{ description }}
    </p>
    
    <div class="status-badge" :class="`badge-${status}`">
      {{ statusText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: string
  icon: string
  status: 'excellent' | 'good' | 'fair' | 'poor'
  trend?: 'up' | 'down'
  description?: string
}>()

const statusText = computed(() => {
  const statusMap = {
    'excellent': '优秀',
    'good': '良好',
    'fair': '一般',
    'poor': '较差'
  }
  return statusMap[props.status]
})
</script>

<style scoped>
.metric-card {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  position: relative;
  transition: all 0.2s;
  overflow: hidden;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 状态左侧边框 */
.metric-card.status-excellent {
  border-left: 4px solid var(--color-success);
}

.metric-card.status-good {
  border-left: 4px solid var(--color-info);
}

.metric-card.status-fair {
  border-left: 4px solid var(--color-warning);
}

.metric-card.status-poor {
  border-left: 4px solid var(--color-danger);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.card-icon {
  font-size: 24px;
}

.card-title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.card-value {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.value-number {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.trend-indicator {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.trend-up .trend-indicator {
  color: var(--color-success);
}

.trend-down .trend-indicator {
  color: var(--color-danger);
}

.card-description {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  line-height: 1.4;
}

.status-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.badge-excellent {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.badge-good {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.badge-fair {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.badge-poor {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}
</style>
