<template>
  <div class="cycle-control-panel">
    <h3>{{ $t('dashboard.manual_control') }}</h3>
    
    <div class="control-form">
      <div class="form-item">
        <label class="form-label">
          <input 
            type="checkbox" 
            v-model="config.execute_trades"
            class="form-checkbox"
          />
          <span class="checkbox-text">
            <span class="checkbox-label">{{ $t('dashboard.execute_real_trade_desc') }}</span>
            <span class="checkbox-hint">{{ $t('dashboard.irrevocable_warning') }}</span>
          </span>
        </label>
      </div>
      
      <div class="form-item">
        <label class="form-label">
          <input 
            type="checkbox" 
            v-model="config.optimize"
            class="form-checkbox"
          />
          <span class="checkbox-text">
            <span class="checkbox-label">{{ $t('dashboard.run_optimization_desc') }}</span>
            <span class="checkbox-hint">{{ $t('dashboard.optimization_hint') }}</span>
          </span>
        </label>
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
            {{ $t('dashboard.running') }}
          </span>
          <span v-else>
            {{ config.execute_trades ? $t('dashboard.execute_real_trade') : $t('dashboard.run_cycle') }}
          </span>
        </button>
        
        <button 
          class="btn-secondary"
          :disabled="isRunning"
          @click="$emit('run-optimization')"
        >
          {{ $t('dashboard.run_optimization') }}
        </button>
      </div>
    </div>
    
    <div v-if="lastResult" class="result-section">
      <div class="result-header" @click="resultExpanded = !resultExpanded">
        <h4>{{ $t('dashboard.last_result') }}</h4>
        <span class="toggle-icon">{{ resultExpanded ? '▼' : '▶' }}</span>
      </div>
      
      <div v-if="resultExpanded" class="result-body">
        <div class="result-summary">
          <div class="summary-item">
            <span class="label">{{ $t('dashboard.cycle_id') }}:</span>
            <span class="value">{{ lastResult.cycle_id }}</span>
          </div>
          <div class="summary-item">
            <span class="label">{{ $t('dashboard.run_time') }}:</span>
            <span class="value">{{ formatTime(lastResult.timestamp) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">{{ $t('dashboard.account_id') }}:</span>
            <span class="value">{{ lastResult.account_id }}</span>
          </div>
        </div>
        
        <div class="phases-grid">
          <div 
            v-for="(phase, key) in lastResult.phases" 
            :key="key"
            class="phase-card"
          >
            <div class="phase-name">{{ $t(`dashboard.phases.${key}`) }}</div>
            <div v-if="phase" class="phase-status" :class="phase.status?.toLowerCase()">
              {{ phase.status }}
            </div>
            <div v-if="key === 'signal_generation' && phase && 'total_signals_generated' in phase" class="phase-details">
              <div>{{ $t('dashboard.phase_details.gen_signals') }}: {{ (phase as any).total_signals_generated }}</div>
              <div>{{ $t('dashboard.phase_details.proc_strategies') }}: {{ (phase as any).strategy_runs_processed }}</div>
            </div>
            <div v-if="key === 'signal_validation' && phase && 'validation_rate' in phase" class="phase-details">
              <div>{{ $t('dashboard.phase_details.val_rate') }}: {{ ((phase as any).validation_rate * 100).toFixed(1) }}%</div>
              <div>{{ $t('dashboard.phase_details.passed') }}: {{ (phase as any).validated_signals }} / {{ (phase as any).total_signals_checked }}</div>
            </div>
            <div v-if="key === 'adaptive_optimization' && phase && 'optimizations_count' in phase" class="phase-details">
              <div>{{ $t('dashboard.optimizations') }}: {{ (phase as any).optimizations_count }}</div>
            </div>
          </div>
        </div>
        
        <details class="result-json">
          <summary>{{ $t('dashboard.show_json') }}</summary>
          <pre>{{ JSON.stringify(lastResult, null, 2) }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { CycleConfig, CycleResult } from '@/api/quantLoopService'

const { t, locale } = useI18n()
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
    if (!confirm(t('dashboard.confirm_execute_warning'))) {
      return
    }
  }
  emit('run-cycle', { ...config })
}

function formatTime(time: string) {
  return new Date(time).toLocaleString(locale.value)
}
</script>

<style scoped>
.cycle-control-panel {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.cycle-control-panel:hover {
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
  content: '⚙️';
  font-size: 24px;
}

h4 {
  margin: 0;
  font-size: 16px;
  color: #f1f5f9;
  font-weight: 600;
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
  align-items: flex-start;
  gap: 12px;
  color: #f1f5f9;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  padding: 14px 16px;
  border-radius: 10px;
  transition: all 0.2s;
  background: rgba(139, 92, 246, 0.08);
  border: 2px solid rgba(139, 92, 246, 0.2);
  min-height: 56px; /* 移动端触摸友好 */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.form-label:hover {
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.3);
}

.form-label:active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
  transform: scale(0.98);
}

.form-checkbox {
  width: 24px;
  height: 24px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: #8b5cf6;
  border-radius: 4px;
  flex-shrink: 0;
}

.checkbox-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkbox-label {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.4;
}

.checkbox-hint {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.3;
}

.form-tip {
  color: #94a3b8;
  font-size: 13px;
  margin-left: 44px;
  padding: 8px 12px;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 6px;
  border-left: 3px solid #64748b;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

/* 移动端：按钮纵向堆叠 */
@media (max-width: 767px) {
  .form-actions {
    flex-direction: column;
    gap: 10px;
  }
}

.btn-run,
.btn-secondary {
  padding: 14px 28px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-height: 52px; /* 移动端触摸友好 */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* 移动端：按钮全宽 */
@media (max-width: 767px) {
  .btn-run,
  .btn-secondary {
    width: 100%;
    padding: 16px 20px;
    font-size: 16px;
  }
}

.btn-run {
  flex: 1;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.btn-run:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
}

.btn-run:active:not(:disabled) {
  transform: translateY(0) scale(0.97);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.btn-run.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-run.danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

.btn-run:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.btn-run.loading {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
}

.btn-secondary {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  color: #f1f5f9;
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  box-shadow: 0 6px 16px rgba(71, 85, 105, 0.4);
  transform: translateY(-2px);
}

.btn-secondary:active:not(:disabled) {
  transform: translateY(0) scale(0.97);
  box-shadow: 0 2px 8px rgba(71, 85, 105, 0.3);
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
  margin-top: 28px;
  padding-top: 28px;
  border-top: 2px solid rgba(139, 92, 246, 0.2);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 12px 16px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  transition: all 0.2s;
}

.result-header:hover {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.toggle-icon {
  color: #94a3b8;
  font-size: 14px;
  font-weight: bold;
}

.result-body {
  margin-top: 16px;
}

.result-summary {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  transition: all 0.2s;
}

.summary-item:hover {
  background: rgba(139, 92, 246, 0.05);
  margin: 0 -8px;
  padding: 12px 8px;
  border-radius: 6px;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item .label {
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
}

.summary-item .value {
  color: #f1f5f9;
  font-size: 14px;
  font-weight: 600;
}

.phases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

/* 移动端：单列显示 */
@media (max-width: 767px) {
  .phases-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.phase-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.phase-card:hover {
  transform: translateY(-4px);
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.phase-name {
  color: #94a3b8;
  font-size: 13px;
  margin-bottom: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.phase-status {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 10px;
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
}

.phase-status.completed {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}

.phase-status.failed {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}

.phase-details {
  color: #cbd5e1;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  line-height: 1.5;
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
