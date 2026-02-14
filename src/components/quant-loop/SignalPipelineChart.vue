<template>
  <div class="signal-pipeline-chart">
    <h3>管道状态</h3>
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
        <span class="label">总计:</span>
        <span class="value">{{ totalSignals }}</span>
      </div>
      <div class="summary-item">
        <span class="label">通过:</span>
        <span class="value">{{ passRate }}%</span>
      </div>
      <div class="summary-item">
        <span class="label">执行:</span>
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
  { key: 'GENERATED', name: '生成', icon: '✨', count: props.data?.GENERATED || 0 },
  { key: 'VALIDATED', name: '验证', icon: '✓', count: props.data?.VALIDATED || 0 },
  { key: 'QUEUED', name: '队列', icon: '⏳', count: props.data?.QUEUED || 0 },
  { key: 'EXECUTING', name: '执行中', icon: '▶', count: props.data?.EXECUTING || 0 },
  { key: 'EXECUTED', name: '完成', icon: '✔', count: props.data?.EXECUTED || 0 }
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
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.signal-pipeline-chart:hover {
  border-color: rgba(167, 139, 250, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  color: #f1f5f9;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

h3::before {
  content: '📊';
  font-size: 24px;
}

.pipeline-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 28px 24px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.5) 100%);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  backdrop-filter: blur(8px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
}

.pipeline-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.pipeline-stage:hover {
  background: rgba(139, 92, 246, 0.1);
  transform: translateY(-4px);
}

.stage-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.stage-name {
  color: #cbd5e1;
  font-size: 13px;
  white-space: nowrap;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stage-count {
  font-size: 24px;
  font-weight: 700;
  color: #f1f5f9;
  padding: 8px 16px;
  background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
  border-radius: 8px;
  min-width: 50px;
  text-align: center;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.stage-count:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.stage-count.zero {
  color: #64748b;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.stage-count.high {
  color: #22c55e;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
  border-color: rgba(34, 197, 94, 0.3);
  box-shadow: 0 2px 12px rgba(34, 197, 94, 0.3);
}

.stage-arrow {
  position: absolute;
  right: -30px;
  font-size: 24px;
  color: #8b5cf6;
  font-weight: bold;
  animation: slide 2s ease-in-out infinite;
}

@keyframes slide {
  0%, 100% { transform: translateX(0); opacity: 0.6; }
  50% { transform: translateX(4px); opacity: 1; }
}

.pipeline-summary {
  display: flex;
  gap: 40px;
  padding: 20px 24px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.summary-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.summary-item .label {
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 500;
}

.summary-item .value {
  color: #22c55e;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
