<template>
  <div class="signal-pipeline-flow">
    <div class="pipeline-item">
      <div class="count">{{ pipeline.generated_count }}</div>
      <div class="label">已生成</div>
    </div>
    <div class="arrow">→</div>
    <div class="pipeline-item">
      <div class="count highlight">{{ pipeline.validated_count }}</div>
      <div class="label">待执行</div>
    </div>
    <div class="arrow">→</div>
    <div class="pipeline-item">
      <div class="count success">{{ pipeline.executed_count }}</div>
      <div class="label">已执行</div>
    </div>
    <div class="arrow">×</div>
    <div class="pipeline-item">
      <div class="count rejected">{{ pipeline.rejected_count }}</div>
      <div class="label">已拒绝</div>
    </div>
    <div class="success-rate">
      <span>成功率</span>
      <strong>{{ pipeline.success_rate.toFixed(1) }}%</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SignalPipeline } from '@/api/client'

defineProps<{
  pipeline: SignalPipeline
}>()
</script>

<style scoped>
.signal-pipeline-flow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.pipeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.count {
  font-size: 1.5rem;
  font-weight: 700;
  color: #6b7280;
}

.count.highlight {
  color: #6366f1;
}

.count.success {
  color: #10b981;
}

.count.rejected {
  color: #ef4444;
}

.label {
  font-size: 0.75rem;
  color: var(--text-secondary, #888);
}

.arrow {
  font-size: 1.25rem;
  color: #d1d5db;
  margin: 0 4px;
}

.success-rate {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.success-rate span {
  font-size: 0.75rem;
  color: var(--text-secondary, #888);
}

.success-rate strong {
  font-size: 1.25rem;
  color: #10b981;
}
</style>