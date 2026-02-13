<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="batch-trade-dialog">
      <div class="dialog-header">
        <div>
          <h3>🎯 批量交易</h3>
          <p class="subtitle">{{ selectedSymbols.length }} 个标的</p>
        </div>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="dialog-body">
        <!-- 仓位分配方法 -->
        <section class="section">
          <h4>仓位分配方法</h4>
          <div class="sizing-methods">
            <label 
              v-for="method in sizingMethods" 
              :key="method.value"
              :class="['method-card', { active: selectedMethod === method.value }]"
            >
              <input 
                type="radio" 
                :value="method.value"
                v-model="selectedMethod"
                class="method-radio"
              />
              <div class="method-content">
                <span class="method-icon">{{ method.icon }}</span>
                <div>
                  <div class="method-name">{{ method.label }}</div>
                  <div class="method-desc">{{ method.description }}</div>
                </div>
              </div>
            </label>
          </div>
        </section>

        <!-- 总风险预算 -->
        <section class="section">
          <h4>总风险预算</h4>
          <div class="risk-budget-control">
            <input 
              type="range" 
              min="5" 
              max="50" 
              v-model.number="totalRiskBudget"
              class="slider"
            />
            <div class="budget-display">
              <span class="budget-value">{{ totalRiskBudget }}%</span>
              <span class="budget-label">账户权益占比</span>
            </div>
          </div>
          <div class="risk-warning" v-if="totalRiskBudget > 30">
            ⚠ 风险预算较高，建议控制在30%以内
          </div>
        </section>

        <!-- 标的列表与权重分配 -->
        <section class="section">
          <h4>标的列表与权重分配</h4>
          <div class="assets-list">
            <div 
              v-for="asset in assets" 
              :key="asset.symbol"
              class="asset-item"
            >
              <div class="asset-info">
                <span class="asset-symbol">{{ asset.symbol }}</span>
                <span :class="['asset-direction', (asset.direction || '').toLowerCase()]">
                  {{ translateDirection(asset.direction) }}
                </span>
                <span class="asset-strength">
                  强度: {{ asset.signal_strength?.toFixed(1) || '--' }}
                </span>
              </div>
              <div class="asset-weight">
                <span class="weight-label">建议权重</span>
                <span class="weight-value">{{ ((asset.weight || 0) * 100).toFixed(1) }}%</span>
              </div>
              <div class="asset-allocation">
                <span class="allocation-label">分配</span>
                <span class="allocation-value">{{ calculateAllocation(asset).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 风险评估摘要 -->
        <section class="section summary-section">
          <h4>执行摘要</h4>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">标的数量</span>
              <span class="summary-value">{{ selectedSymbols.length }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">总风险预算</span>
              <span class="summary-value highlight">{{ totalRiskBudget }}%</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">平均信号强度</span>
              <span class="summary-value">{{ averageSignalStrength.toFixed(1) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">执行模式</span>
              <span class="summary-value">{{ executionModeLabel }}</span>
            </div>
          </div>
        </section>
      </div>

      <div class="dialog-actions">
        <button class="btn btn-secondary" @click="close">取消</button>
        <button 
          class="btn btn-plan" 
          @click="handleBatchTrade('PLAN')"
          :disabled="loading"
        >
          创建批量计划
        </button>
        <button 
          class="btn btn-primary" 
          @click="handleBatchTrade('IMMEDIATE')"
          :disabled="loading"
        >
          {{ loading ? '执行中...' : '批量市价单' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { executeBatchQuickTrade, type StrategyRunAssetView } from '../api/client';

const props = defineProps<{
  show: boolean;
  runId: string;
  selectedSymbols: string[];
  assets: StrategyRunAssetView[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', result: any): void;
}>();

const loading = ref(false);
const selectedMethod = ref<'WEIGHT' | 'EQUAL' | 'RISK_BASED'>('WEIGHT');
const totalRiskBudget = ref(20); // 默认20%

const sizingMethods = [
  {
    value: 'WEIGHT',
    label: '按策略权重',
    description: '使用策略建议的权重分配',
    icon: '⚖️'
  },
  {
    value: 'EQUAL',
    label: '均等分配',
    description: '每个标的平均分配仓位',
    icon: '📊'
  },
  {
    value: 'RISK_BASED',
    label: '风险平衡',
    description: '根据风险调整仓位大小',
    icon: '🛡️'
  }
];

const averageSignalStrength = computed(() => {
  if (props.assets.length === 0) return 0;
  const sum = props.assets.reduce((acc, asset) => acc + (asset.signal_strength || 0), 0);
  return sum / props.assets.length;
});

const executionModeLabel = computed(() => {
  const labels: Record<string, string> = {
    'IMMEDIATE': '立即市价单',
    'LIMIT': '限价单',
    'PLAN': '交易计划'
  };
  return labels['IMMEDIATE'];
});

function calculateAllocation(asset: StrategyRunAssetView): number {
  if (selectedMethod.value === 'EQUAL') {
    return totalRiskBudget.value / props.assets.length;
  }
  
  if (selectedMethod.value === 'WEIGHT') {
    // 按权重分配
    const totalWeight = props.assets.reduce((sum, a) => sum + (a.weight || 0), 0);
    if (totalWeight === 0) return totalRiskBudget.value / props.assets.length;
    return (asset.weight || 0) / totalWeight * totalRiskBudget.value;
  }
  
  if (selectedMethod.value === 'RISK_BASED') {
    // 简化的风险平衡：信号强度越高，分配越多
    const totalStrength = props.assets.reduce((sum, a) => sum + (a.signal_strength || 50), 0);
    if (totalStrength === 0) return totalRiskBudget.value / props.assets.length;
    return (asset.signal_strength || 50) / totalStrength * totalRiskBudget.value;
  }
  
  return 0;
}

async function handleBatchTrade(mode: 'IMMEDIATE' | 'PLAN') {
  if (props.assets.length === 0) return;
  
  loading.value = true;
  try {
    const result = await executeBatchQuickTrade(props.runId, {
      asset_symbols: props.selectedSymbols,
      execution_mode: mode,
      position_sizing_method: selectedMethod.value,
      total_risk_budget: totalRiskBudget.value / 100,
      notes: `批量交易 [${selectedMethod.value}] ${props.selectedSymbols.length}个标的`
    });
    
    emit('success', result);
    close();
  } catch (error: any) {
    alert(`批量交易失败: ${error.message || '未知错误'}`);
  } finally {
    loading.value = false;
  }
}

function translateDirection(dir: string | null | undefined): string {
  if (!dir) return '--';
  const map: Record<string, string> = {
    'LONG': '做多', 'SHORT': '做空', 'NEUTRAL': '中性'
  };
  return map[dir] || dir;
}

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
  backdrop-filter: blur(4px);
}

.batch-trade-dialog {
  background: linear-gradient(135deg, #1e2a3a 0%, #2a3f5f 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: rgba(0, 0, 0, 0.2);
}

.dialog-header h3 {
  margin: 0 0 6px 0;
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.subtitle {
  font-size: 14px;
  color: #64b5f6;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.section {
  margin-bottom: 28px;
}

.section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #aaa;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 仓位分配方法 */
.sizing-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.method-card {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: block;
}

.method-card:hover {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.05);
}

.method-card.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.15);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.method-radio {
  display: none;
}

.method-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.method-icon {
  font-size: 24px;
}

.method-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.method-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

/* 风险预算控制 */
.risk-budget-control {
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(0, 0, 0, 0.3);
  padding: 20px;
  border-radius: 12px;
}

.slider {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  cursor: pointer;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
}

.budget-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.budget-value {
  font-size: 32px;
  font-weight: 700;
  color: #3b82f6;
  line-height: 1;
}

.budget-label {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.risk-warning {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 8px;
  color: #ff9800;
  font-size: 13px;
}

/* 标的列表 */
.assets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.asset-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
}

.asset-info {
  display: flex;
  gap: 10px;
  align-items: center;
}

.asset-symbol {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  min-width: 60px;
}

.asset-direction {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.asset-direction.long {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.asset-direction.short {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.asset-strength {
  font-size: 12px;
  color: #999;
}

.asset-weight, .asset-allocation {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.weight-label, .allocation-label {
  font-size: 10px;
  color: #999;
}

.weight-value {
  font-size: 14px;
  color: #aaa;
}

.allocation-value {
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
}

/* 执行摘要 */
.summary-section {
  background: rgba(59, 130, 246, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-label {
  font-size: 12px;
  color: #999;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.summary-value.highlight {
  color: #3b82f6;
}

/* 操作按钮 */
.dialog-actions {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.2);
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn-plan {
  background: linear-gradient(135deg, #7b1fa2, #9c27b0);
  color: #fff;
}

.btn-plan:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.4);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}
</style>
