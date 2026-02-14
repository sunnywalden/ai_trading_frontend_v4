<template>
  <div class="optimization-panel">
    <h3>优化建议</h3>
    
    <div v-if="opportunities?.recommendations?.length === 0" class="empty-state">
      <p>🎯 系统运行良好</p>
    </div>
    
    <div v-else class="recommendations-list">
      <div 
        v-for="(rec, index) in opportunities?.recommendations || []" 
        :key="index"
        class="recommendation-card"
        :class="getPriorityClass(rec.priority)"
      >
        <div class="rec-header">
          <span class="rec-category">{{ rec.category }}</span>
          <span class="rec-priority" :class="`priority-${rec.priority.toLowerCase()}`">
            {{ getPriorityLabel(rec.priority) }}
          </span>
        </div>
        <h4 class="rec-title">{{ rec.title }}</h4>
        <p class="rec-description">{{ rec.description }}</p>
        <div v-if="rec.impact" class="rec-impact">
          影响: {{ rec.impact }}
        </div>
      </div>
    </div>
    
    <div class="pattern-summary">
      <h4>模式统计</h4>
      <div class="pattern-grid">
        <div class="pattern-item">
          <div class="pattern-icon">🎯</div>
          <div class="pattern-info">
            <div class="pattern-label">过度自信</div>
            <div class="pattern-count">{{ opportunities?.patterns?.overconfident_signals?.length || 0 }}</div>
          </div>
        </div>
        <div class="pattern-item">
          <div class="pattern-icon">⚠️</div>
          <div class="pattern-info">
            <div class="pattern-label">高风险</div>
            <div class="pattern-count">{{ opportunities?.patterns?.high_risk_failures?.length || 0 }}</div>
          </div>
        </div>
        <div class="pattern-item">
          <div class="pattern-icon">⏱️</div>
          <div class="pattern-info">
            <div class="pattern-label">执行问题</div>
            <div class="pattern-count">{{ opportunities?.patterns?.execution_issues?.length || 0 }}</div>
          </div>
        </div>
        <div class="pattern-item">
          <div class="pattern-icon">📉</div>
          <div class="pattern-info">
            <div class="pattern-label">时机问题</div>
            <div class="pattern-count">{{ opportunities?.patterns?.timing_issues?.length || 0 }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { OptimizationOpportunities } from '@/api/quantLoopService'

withDefaults(defineProps<{
  opportunities?: OptimizationOpportunities
}>(), {
  opportunities: () => ({
    period_days: 30,
    total_poor_performers: 0,
    patterns: {
      overconfident_signals: [],
      high_risk_failures: [],
      execution_issues: [],
      timing_issues: []
    },
    recommendations: []
  })
})

function getPriorityClass(priority: string) {
  return `priority-${priority.toLowerCase()}`
}

function getPriorityLabel(priority: string) {
  const labels: Record<string, string> = {
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低'
  }
  return labels[priority] || priority
}
</script>

<style scoped>
.optimization-panel {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
}

h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #f1f5f9;
}

h4 {
  margin: 20px 0 12px 0;
  font-size: 16px;
  color: #f1f5f9;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  font-size: 16px;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.recommendation-card {
  background: #0f172a;
  border-left: 4px solid #64748b;
  border-radius: 6px;
  padding: 16px;
  transition: all 0.2s;
}

.recommendation-card:hover {
  transform: translateX(4px);
}

.recommendation-card.priority-high {
  border-left-color: #ef4444;
}

.recommendation-card.priority-medium {
  border-left-color: #f59e0b;
}

.recommendation-card.priority-low {
  border-left-color: #22c55e;
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rec-category {
  color: #94a3b8;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rec-priority {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.rec-priority.priority-high {
  background: #ef444420;
  color: #ef4444;
}

.rec-priority.priority-medium {
  background: #f59e0b20;
  color: #f59e0b;
}

.rec-priority.priority-low {
  background: #22c55e20;
  color: #22c55e;
}

.rec-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #f1f5f9;
  font-weight: 600;
}

.rec-description {
  margin: 0 0 8px 0;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.6;
}

.rec-impact {
  color: #a78bfa;
  font-size: 13px;
  font-style: italic;
}

.pattern-summary {
  padding-top: 20px;
  border-top: 1px solid #334155;
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.pattern-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0f172a;
  padding: 16px;
  border-radius: 6px;
}

.pattern-icon {
  font-size: 32px;
}

.pattern-info {
  flex: 1;
}

.pattern-label {
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 4px;
}

.pattern-count {
  color: #f1f5f9;
  font-size: 24px;
  font-weight: 700;
}
</style>
