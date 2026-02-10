<template>
  <div class="signal-pipeline-chart">
    <h3>信号管道状态</h3>
    <div class="pipeline-flow">
      <div 
        v-for="(stage, index) in pipelineStages" 
        :key="stage.key"
        class="pipeline-stage"
      >
        <div class="stage-icon">{{ stage.icon }}</div>
        <div class="stage-name">{{ stage.name }}</div>
        <div class="stage-count" :class="getCountClass(stage.count)">
          {{ stage.count }}
        </div>
        <div v-if="index < pipelineStages.length - 1" class="stage-arrow">→</div>
      </div>
    </div>
    
    <div class="pipeline-summary">
      <div class="summary-item">
        <span class="label">总信号:</span>
        <span class="value">{{ totalSignals }}</span>
      </div>
      <div class="summary-item">
        <span class="label">通过率:</span>
        <span class="value">{{ passRate }}%</span>
      </div>
      <div class="summary-item">
        <span class="label">执行率:</span>
        <span class="value">{{ executionRate }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: Record<string, number>
}>()

const pipelineStages = computed(() => [
  { key: 'GENERATED', name: '已生成', icon: '✨', count: props.data?.GENERATED || 0 },
  { key: 'VALIDATED', name: '已验证', icon: '✓', count: props.data?.VALIDATED || 0 },
  { key: 'QUEUED', name: '队列中', icon: '⏳', count: props.data?.QUEUED || 0 },
  { key: 'EXECUTING', name: '执行中', icon: '▶', count: props.data?.EXECUTING || 0 },
  { key: 'EXECUTED', name: '已执行', icon: '✔', count: props.data?.EXECUTED || 0 }
])

const totalSignals = computed(() => {
  if (!props.data) return 0
  return Object.values(props.data).reduce((sum, count) => sum + count, 0)
})

const passRate = computed(() => {
  if (!props.data || !props.data.GENERATED) return 0
  const passed = props.data.VALIDATED || 0
  return ((passed / props.data.GENERATED) * 100).toFixed(1)
})

const executionRate = computed(() => {
  if (!props.data || !props.data.VALIDATED) return 0
  const executed = props.data.EXECUTED || 0
  return ((executed / props.data.VALIDATED) * 100).toFixed(1)
})

function getCountClass(count: number) {
  if (count === 0) return 'zero'
  if (count > 10) return 'high'
  return 'normal'
}
</script>

<style scoped>
.signal-pipeline-chart {
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

.pipeline-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 20px;
  background: #0f172a;
  border-radius: 6px;
}

.pipeline-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.stage-icon {
  font-size: 24px;
}

.stage-name {
  color: #94a3b8;
  font-size: 12px;
  white-space: nowrap;
}

.stage-count {
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
  padding: 4px 12px;
  background: #1e293b;
  border-radius: 4px;
  min-width: 40px;
  text-align: center;
}

.stage-count.zero {
  color: #64748b;
}

.stage-count.high {
  color: #22c55e;
}

.stage-arrow {
  position: absolute;
  right: -30px;
  font-size: 20px;
  color: #475569;
}

.pipeline-summary {
  display: flex;
  gap: 32px;
  padding-top: 16px;
  border-top: 1px solid #334155;
}

.summary-item {
  display: flex;
  gap: 8px;
}

.summary-item .label {
  color: #94a3b8;
  font-size: 14px;
}

.summary-item .value {
  color: #22c55e;
  font-size: 14px;
  font-weight: 600;
}
</style>
