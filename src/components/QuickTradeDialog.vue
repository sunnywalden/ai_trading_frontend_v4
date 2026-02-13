<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="quick-trade-dialog">
      <div class="dialog-header">
        <div>
          <h3>⚡ 快捷交易</h3>
          <p class="symbol-title">{{ symbol }}</p>
        </div>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="dialog-body" v-if="preview">
        <!-- 价格不可用警告 -->
        <div v-if="!preview.price_available" class="warning-banner">
          <span class="warning-icon">⚠️</span>
          <div class="warning-content">
            <strong>市价单模式</strong>
            <p>{{ preview.warning || '无法获取实时价格，将以市价成交，不设置止盈止损' }}</p>
          </div>
        </div>

        <!-- 市场信息 -->
        <section class="section">
          <h4>市场信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">当前价格</span>
              <span v-if="preview.current_price" class="value price-value">
                ${{ preview.current_price.toFixed(2) }}
              </span>
              <span v-else class="value price-value market-price">
                市价
              </span>
            </div>
            <div class="info-item">
              <span class="label">信号强度</span>
              <div class="strength-display">
                <div class="strength-bar" :style="{ width: preview.signal_strength + '%' }"></div>
                <span class="strength-text">{{ preview.signal_strength?.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 策略建议 -->
        <section class="section">
          <h4>策略建议</h4>
          <div class="suggestion-tags">
            <span :class="['tag', 'direction-tag', preview.suggested_direction.toLowerCase()]">
              {{ translateDirection(preview.suggested_direction) }}
            </span>
            <span :class="['tag', 'action-tag', preview.suggested_action.toLowerCase()]">
              {{ translateAction(preview.suggested_action) }}
            </span>
            <span class="tag weight-tag">
              权重: {{ (preview.suggested_weight * 100).toFixed(1) }}%
            </span>
          </div>
          
          <!-- 维度分析 -->
          <div v-if="Object.keys(preview.signal_dimensions).length" class="dimensions">
            <span v-for="(val, key) in preview.signal_dimensions" :key="key" class="dim-chip">
              {{ translateDimension(key) }}: {{ formatValue(val) }}
            </span>
          </div>
        </section>

        <!-- 交易参数 -->
        <section class="section">
          <h4>交易参数</h4>
          <div class="params-form">
            <div class="form-row">
              <label>交易数量</label>
              <input 
                v-if="preview.calculated_quantity"
                type="number" 
                v-model.number="params.quantity"
                :placeholder="preview.calculated_quantity.toString()"
                class="input-field"
              />
              <input 
                v-else
                type="text" 
                value="市价成交"
                disabled
                class="input-field disabled"
              />
              <span class="unit">股</span>
            </div>
            <div class="form-row">
              <label>止损价</label>
              <input 
                v-if="preview.calculated_stop_loss !== null && preview.calculated_stop_loss !== undefined"
                type="number" 
                step="0.01"
                v-model.number="params.stopLoss"
                :placeholder="preview.calculated_stop_loss?.toFixed(2) || 'N/A'"
                class="input-field"
              />
              <input 
                v-else
                type="text" 
                value="不设置"
                disabled
                class="input-field disabled"
              />
            </div>
            <div class="form-row">
              <label>止盈价</label>
              <input 
                v-if="preview.calculated_take_profit !== null && preview.calculated_take_profit !== undefined"
                type="number" 
                step="0.01"
                v-model.number="params.takeProfit"
                :placeholder="preview.calculated_take_profit?.toFixed(2) || 'N/A'"
                class="input-field"
              />
              <input 
                v-else
                type="text" 
                value="不设置"
                disabled
                class="input-field disabled"
              />
            </div>
          </div>
        </section>

        <!-- 风险评估 -->
        <section class="section risk-section">
          <h4>风险评估</h4>
          <div class="risk-grid">
            <div class="risk-item">
              <span class="label">持仓市值</span>
              <span v-if="preview.estimated_position_value" class="value">
                ${{ preview.estimated_position_value.toFixed(0) }}
              </span>
              <span v-else class="value">--</span>
            </div>
            <div class="risk-item">
              <span class="label">账户占比</span>
              <span v-if="preview.estimated_position_ratio !== null && preview.estimated_position_ratio !== undefined" :class="['value', positionRatioClass]">
                {{ (preview.estimated_position_ratio * 100).toFixed(1) }}%
              </span>
              <span v-else class="value">--</span>
            </div>
            <div class="risk-item">
              <span class="label">风险评分</span>
              <span :class="['value', riskScoreClass]">
                {{ preview.risk_score?.toFixed(0) }}
              </span>
            </div>
          </div>
          <div v-if="preview.risk_flags && preview.risk_flags.length" class="risk-warnings">
            <span v-for="flag in preview.risk_flags" :key="flag" class="risk-flag">
              ⚠ {{ translateRiskFlag(flag) }}
            </span>
          </div>
        </section>
      </div>

      <div class="dialog-actions">
        <button class="btn btn-secondary" @click="close">取消</button>
        <button 
          class="btn btn-plan" 
          @click="handleCreatePlan"
          :disabled="loading"
        >
          创建计划
        </button>
        <button 
          class="btn btn-limit" 
          @click="handleLimitOrder"
          :disabled="loading"
        >
          限价单
        </button>
        <button 
          class="btn btn-primary" 
          @click="handleMarketOrder"
          :disabled="loading"
        >
          {{ loading ? '执行中...' : '市价单' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { executeQuickTrade, previewQuickTrade } from '../api/client';

interface QuickTradePreview {
  symbol: string;
  order_mode?: string;  // 'LIMIT' | 'MARKET'
  price_available?: boolean;
  current_price: number | null;
  suggested_direction: string;
  suggested_action: string;
  signal_strength: number;
  suggested_weight: number;
  calculated_quantity: number | null;
  calculated_stop_loss: number | null;
  calculated_take_profit: number | null;
  estimated_position_value: number | null;
  estimated_position_ratio: number | null;
  risk_score: number;
  risk_flags: string[];
  signal_dimensions: Record<string, any>;
  warning?: string;  // 市价单警告信息
}

const props = defineProps<{
  show: boolean;
  runId: string;
  symbol: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', result: any): void;
}>();

const preview = ref<QuickTradePreview | null>(null);
const loading = ref(false);
const params = ref({
  quantity: null as number | null,
  stopLoss: null as number | null,
  takeProfit: null as number | null,
});

const positionRatioClass = computed(() => {
  const ratio = preview.value?.estimated_position_ratio || 0;
  if (ratio > 0.3) return 'danger';
  if (ratio > 0.2) return 'warning';
  return 'normal';
});

const riskScoreClass = computed(() => {
  const score = preview.value?.risk_score || 0;
  if (score > 70) return 'danger';
  if (score > 50) return 'warning';
  return 'normal';
});

watch(() => props.show, async (newVal) => {
  if (newVal && props.runId && props.symbol) {
    await loadPreview();
  }
});

async function loadPreview() {
  try {
    const result = await previewQuickTrade(props.runId, props.symbol);
    preview.value = result.preview as QuickTradePreview;
  } catch (error) {
    console.error('Failed to load preview:', error);
  }
}

async function handleMarketOrder() {
  await executeTrade('IMMEDIATE');
}

async function handleLimitOrder() {
  await executeTrade('LIMIT');
}

async function handleCreatePlan() {
  await executeTrade('PLAN');
}

async function executeTrade(mode: 'IMMEDIATE' | 'LIMIT' | 'PLAN') {
  if (!preview.value) return;
  
  loading.value = true;
  try {
    const result = await executeQuickTrade(props.runId, props.symbol, {
      execution_mode: mode,
      override_quantity: params.value.quantity || undefined,
      override_stop_loss: params.value.stopLoss || undefined,
      override_take_profit: params.value.takeProfit || undefined,
    });
    
    emit('success', result);
    close();
  } catch (error: any) {
    alert(`交易执行失败: ${error.message || '未知错误'}`);
  } finally {
    loading.value = false;
  }
}

function translateDirection(dir: string): string {
  const map: Record<string, string> = {
    'LONG': '做多', 'SHORT': '做空', 'NEUTRAL': '中性'
  };
  return map[dir] || dir;
}

function translateAction(action: string): string {
  const map: Record<string, string> = {
    'BUY': '买入', 'SELL': '卖出', 'HOLD': '持有', 
    'INCREASE': '加仓', 'DECREASE': '减仓'
  };
  return map[action] || action;
}

function translateDimension(key: string): string {
  const map: Record<string, string> = {
    'volume': '成交量', 'momentum': '动量', 'sentiment': '情绪',
    'volatility': '波动率', 'growth': '成长性'
  };
  return map[key.toLowerCase()] || key;
}

function translateRiskFlag(flag: string): string {
  const map: Record<string, string> = {
    'volatile': '波动巨大', 'high_risk': '高风险', 
    'suspicious': '异常波动', 'TREND_FOLLOWING': '趋势跟随'
  };
  return map[flag] || flag;
}

function formatValue(val: any): string {
  if (typeof val === 'number') return val.toFixed(2);
  return String(val);
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.quick-trade-dialog {
  background: linear-gradient(135deg, #1e2a3a 0%, #2a3f5f 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
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
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.symbol-title {
  font-size: 18px;
  font-weight: 600;
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
  margin-bottom: 24px;
}

.section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #aaa;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item .label {
  font-size: 12px;
  color: #999;
}

.info-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.price-value {
  color: #4caf50;
}

.strength-display {
  position: relative;
  height: 24px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  overflow: hidden;
}

.strength-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s;
}

.strength-text {
  position: relative;
  z-index: 1;
  line-height: 24px;
  padding: 0 8px;
  color: #fff;
  font-weight: 600;
  font-size: 12px;
}

.suggestion-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tag {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.direction-tag.long {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid #4caf50;
}

.direction-tag.short {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border: 1px solid #f44336;
}

.action-tag {
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
  border: 1px solid #2196f3;
}

.weight-tag {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
  border: 1px solid #ff9800;
}

.dimensions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dim-chip {
  padding: 4px 10px;
  background: rgba(156, 39, 176, 0.15);
  color: #ce93d8;
  border-radius: 12px;
  font-size: 11px;
  border: 1px solid rgba(206, 147, 216, 0.3);
}

.params-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  align-items: center;
  gap: 12px;
}

.form-row label {
  font-size: 13px;
  color: #ccc;
}

.input-field {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 8px 12px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #64b5f6;
  background: rgba(0, 0, 0, 0.6);
}

.input-field.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.2);
}

.unit {
  font-size: 12px;
  color: #999;
  width: 30px;
}

.market-price {
  color: #ff9800 !important;
  font-weight: 600;
}

/* 警告横幅样式 */
.warning-banner {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 193, 7, 0.08) 100%);
  border: 1px solid rgba(255, 152, 0, 0.4);
  border-radius: 8px;
  margin-bottom: 16px;
  animation: pulse-warning 2s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%, 100% {
    border-color: rgba(255, 152, 0, 0.4);
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
  }
  50% {
    border-color: rgba(255, 152, 0, 0.6);
    box-shadow: 0 0 12px 0 rgba(255, 152, 0, 0.3);
  }
}

.warning-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-content strong {
  display: block;
  font-size: 14px;
  color: #ffa726;
  margin-bottom: 4px;
}

.warning-content p {
  font-size: 13px;
  color: #ffb74d;
  margin: 0;
  line-height: 1.4;
}

.risk-section {
  background: rgba(244, 67, 54, 0.05);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(244, 67, 54, 0.2);
}

.risk-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.risk-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.risk-item .value.danger {
  color: #f44336;
}

.risk-item .value.warning {
  color: #ff9800;
}

.risk-item .value.normal {
  color: #4caf50;
}

.risk-warnings {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.risk-flag {
  font-size: 12px;
  color: #ff9800;
  padding: 4px 8px;
  background: rgba(255, 152, 0, 0.1);
  border-radius: 4px;
}

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
  min-width: 96px;
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

.btn-limit {
  background: linear-gradient(135deg, #1976d2, #2196f3);
  color: #fff;
}

.btn-limit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

.btn-primary {
  background: linear-gradient(135deg, #388e3c, #4caf50);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}
</style>
