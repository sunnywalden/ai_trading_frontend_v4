<template>
  <div class="signal-pipeline-chart">
    <h3>{{ $t('dashboard.pipeline_status') }}</h3>
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
        <span class="label">{{ $t('dashboard.total') }}:</span>
        <span class="value">{{ totalSignals }}</span>
      </div>
      <div class="summary-item">
        <span class="label">{{ $t('dashboard.pass') }}:</span>
        <span class="value">{{ passRate }}%</span>
      </div>
      <div class="summary-item">
        <span class="label">{{ $t('dashboard.execution_rate') }}:</span>
        <span class="value">{{ executionRate }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps<{
  data: Record<string, number>
}>()

const pipelineStages = computed(() => [
  { key: 'GENERATED', name: t('dashboard.pipeline_stages.generated'), icon: '✨', count: props.data?.GENERATED || 0 },
  { key: 'VALIDATED', name: t('dashboard.pipeline_stages.validated'), icon: '✓', count: props.data?.VALIDATED || 0 },
  { key: 'QUEUED', name: t('dashboard.pipeline_stages.queued'), icon: '⏳', count: props.data?.QUEUED || 0 },
  { key: 'EXECUTING', name: t('dashboard.pipeline_stages.executing'), icon: '▶', count: props.data?.EXECUTING || 0 },
  { key: 'EXECUTED', name: t('dashboard.pipeline_stages.executed'), icon: '✔', count: props.data?.EXECUTED || 0 }
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
  /* 移动端触摸优化 */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
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

/* 移动端响应式优化 */
@media (max-width: 1024px) {
  .pipeline-flow {
    padding: 20px 16px;
    gap: 16px;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .pipeline-stage {
    min-width: 90px;
    flex-shrink: 0;
  }
  
  .stage-icon {
    font-size: 28px;
  }
  
  .stage-name {
    font-size: 12px;
  }
  
  .stage-count {
    font-size: 20px;
    padding: 6px 12px;
    min-width: 40px;
  }
}

@media (max-width: 768px) {
  .signal-pipeline-chart {
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
  }
  
  h3 {
    margin-bottom: var(--spacing-lg);
    font-size: 18px;
  }
  
  h3::before {
    font-size: 20px;
  }
  
  .pipeline-flow {
    flex-direction: column;
    align-items: stretch;
    padding: var(--spacing-lg);
    gap: var(--spacing-md);
    overflow-x: visible;
  }
  
  .pipeline-stage {
    flex-direction: row;
    justify-content: space-between;
    padding: var(--spacing-md);
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: var(--radius-md);
    min-width: auto;
  }
  
  .pipeline-stage:hover {
    transform: none;
  }
  
  .pipeline-stage:active {
    transform: scale(0.98);
    background: rgba(139, 92, 246, 0.15);
  }
  
  .stage-icon {
    font-size: 24px;
  }
  
  .stage-name {
    flex: 1;
    text-align: left;
    margin-left: var(--spacing-md);
    font-size: 14px;
  }
  
  .stage-count {
    font-size: 18px;
    padding: 6px 14px;
    min-width: 48px;
  }
  
  .stage-arrow {
    display: none;
  }
  
  .pipeline-summary {
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
  }
  
  .summary-item {
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  }
  
  .summary-item:last-child {
    border-bottom: none;
  }
  
  .summary-item .label {
    font-size: 13px;
  }
  
  .summary-item .value {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .signal-pipeline-chart {
    padding: var(--spacing-md);
  }
  
  h3 {
    font-size: 16px;
  }
  
  .pipeline-flow {
    padding: var(--spacing-md);
  }
  
  .pipeline-stage {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .stage-icon {
    font-size: 20px;
  }
  
  .stage-name {
    font-size: 13px;
    margin-left: var(--spacing-sm);
  }
  
  .stage-count {
    font-size: 16px;
    padding: 4px 12px;
    min-width: 44px;
  }
}
  font-weight: 700;
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
