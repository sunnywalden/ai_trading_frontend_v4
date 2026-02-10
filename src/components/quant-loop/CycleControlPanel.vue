<template>
  <div class="cycle-control-panel">
    <h3>手动运行控制</h3>
    
    <div class="control-form">
      <div class="form-item">
        <label class="form-label">
          <input 
            type="checkbox" 
            v-model="config.execute_trades"
            class="form-checkbox"
          />
          <span>执行真实交易</span>
        </label>
        <div class="form-tip">
          ⚠️ 关闭 = DRY_RUN模式 (不实际交易)
        </div>
      </div>
      
      <div class="form-item">
        <label class="form-label">
          <input 
            type="checkbox" 
            v-model="config.optimize"
            class="form-checkbox"
          />
          <span>运行参数优化</span>
        </label>
        <div class="form-tip">
          💡 开启将在周期结束后运行参数优化
        </div>
      </div>
      
      <div class="form-actions">
        <button 
          class="btn-run"
          :class="{ loading: isRunning, danger: config.execute_trades }"
          :disabled="isRunning"
          @click="handleRunCycle"
        >
          <span v-if="isRunning">
            <span class="spinner"></span>
            运行中...
          </span>
          <span v-else>
            {{ config.execute_trades ? '⚠️ 执行真实交易' : '▶️ 运行完整周期' }}
          </span>
        </button>
        
        <button 
          class="btn-secondary"
          :disabled="isRunning"
          @click="$emit('run-optimization')"
        >
          🔧 仅运行优化
        </button>
      </div>
    </div>
    
    <div v-if="lastResult" class="result-section">
      <div class="result-header" @click="resultExpanded = !resultExpanded">
        <h4>上次运行结果</h4>
        <span class="toggle-icon">{{ resultExpanded ? '▼' : '▶' }}</span>
      </div>
      
      <div v-if="resultExpanded" class="result-body">
        <div class="result-summary">
          <div class="summary-item">
            <span class="label">周期ID:</span>
            <span class="value">{{ lastResult.cycle_id }}</span>
          </div>
          <div class="summary-item">
            <span class="label">运行时间:</span>
            <span class="value">{{ formatTime(lastResult.timestamp) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">账户ID:</span>
            <span class="value">{{ lastResult.account_id }}</span>
          </div>
        </div>
        
        <div class="phases-grid">
          <div 
            v-for="(phase, key) in lastResult.phases" 
            :key="key"
            class="phase-card"
          >
            <div class="phase-name">{{ getPhaseNameZh(key as string) }}</div>
            <div v-if="phase" class="phase-status" :class="phase.status?.toLowerCase()">
              {{ phase.status }}
            </div>
            <div v-if="key === 'signal_generation' && phase && 'total_signals_generated' in phase" class="phase-details">
              <div>生成信号: {{ phase.total_signals_generated }}</div>
              <div>处理策略: {{ phase.strategy_runs_processed }}</div>
            </div>
            <div v-if="key === 'signal_validation' && phase && 'validation_rate' in phase" class="phase-details">
              <div>验证率: {{ (phase.validation_rate * 100).toFixed(1) }}%</div>
              <div>通过: {{ phase.validated_signals }} / {{ phase.total_signals_checked }}</div>
            </div>
            <div v-if="key === 'adaptive_optimization' && phase && 'optimizations_count' in phase" class="phase-details">
              <div>优化项: {{ phase.optimizations_count }}</div>
            </div>
          </div>
        </div>
        
        <details class="result-json">
          <summary>查看完整JSON</summary>
          <pre>{{ JSON.stringify(lastResult, null, 2) }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { CycleConfig, CycleResult } from '@/api/quantLoopService'

defineProps<{
  isRunning: boolean
  lastResult?: CycleResult | null
}>()

const emit = defineEmits<{
  'run-cycle': [config: CycleConfig]
  'run-optimization': []
}>()

const config = reactive<CycleConfig>({
  execute_trades: false,
  optimize: true
})

const resultExpanded = ref(true)

function handleRunCycle() {
  if (config.execute_trades) {
    if (!confirm('确认要执行真实交易吗？此操作不可撤销！')) {
      return
    }
  }
  emit('run-cycle', { ...config })
}

function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN')
}

function getPhaseNameZh(key: string) {
  const names: Record<string, string> = {
    signal_generation: '信号生成',
    signal_validation: '信号验证',
    performance_evaluation: '性能评估',
    adaptive_optimization: '自适应优化'
  }
  return names[key] || key
}
</script>

<style scoped>
.cycle-control-panel {
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
  margin: 0;
  font-size: 16px;
  color: #f1f5f9;
}

.control-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #f1f5f9;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-tip {
  color: #94a3b8;
  font-size: 13px;
  margin-left: 30px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-run,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-run {
  flex: 1;
  background: #a78bfa;
  color: white;
}

.btn-run:hover:not(:disabled) {
  background: #8b5cf6;
}

.btn-run.danger {
  background: #ef4444;
}

.btn-run.danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-run:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-run.loading {
  background: #64748b;
}

.btn-secondary {
  background: #334155;
  color: #f1f5f9;
}

.btn-secondary:hover:not(:disabled) {
  background: #475569;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff40;
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #334155;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 8px 0;
}

.result-header:hover {
  color: #a78bfa;
}

.toggle-icon {
  color: #94a3b8;
  font-size: 12px;
}

.result-body {
  margin-top: 16px;
}

.result-summary {
  background: #0f172a;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #334155;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item .label {
  color: #94a3b8;
  font-size: 14px;
}

.summary-item .value {
  color: #f1f5f9;
  font-size: 14px;
  font-weight: 500;
}

.phases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.phase-card {
  background: #0f172a;
  border-radius: 6px;
  padding: 12px;
}

.phase-name {
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 8px;
}

.phase-status {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.phase-status.completed {
  color: #22c55e;
}

.phase-status.failed {
  color: #ef4444;
}

.phase-details {
  color: #cbd5e1;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-json {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 12px;
}

.result-json summary {
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
}

.result-json summary:hover {
  color: #a78bfa;
}

.result-json pre {
  margin: 12px 0 0 0;
  padding: 12px;
  background: #020617;
  border-radius: 4px;
  color: #cbd5e1;
  font-size: 12px;
  overflow-x: auto;
}
</style>
