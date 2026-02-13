<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="plan-dialog">
      <div class="dialog-header">
        <h3>{{ isEdit ? '编辑交易计划' : '新建交易计划' }}</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="dialog-body">
        <div class="form-group">
          <label>交易标的 *</label>
          <input 
            v-model="formData.symbol" 
            :disabled="isEdit"
            placeholder="如: AAPL, META, TSLA" 
            class="input-field"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>入场价格 *</label>
            <input 
              v-model.number="formData.entry_price" 
              type="number"
              step="0.01"
              placeholder="0.00" 
              class="input-field"
            />
          </div>
          
          <div class="form-group">
            <label>止损价格 *</label>
            <input 
              v-model.number="formData.stop_loss" 
              type="number"
              step="0.01"
              placeholder="0.00" 
              class="input-field"
              :class="{ 'error': stopLossError }"
            />
            <span v-if="stopLossError" class="error-text">止损价必须低于入场价</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>止盈价格 *</label>
            <input 
              v-model.number="formData.take_profit" 
              type="number"
              step="0.01"
              placeholder="0.00" 
              class="input-field"
              :class="{ 'error': takeProfitError }"
            />
            <span v-if="takeProfitError" class="error-text">止盈价必须高于入场价</span>
          </div>
          
          <div class="form-group">
            <label>目标仓位 * (%)</label>
            <input 
              v-model.number="targetPositionPercent" 
              type="number"
              step="1"
              min="1"
              max="100"
              placeholder="10" 
              class="input-field"
            />
          </div>
        </div>

        <div v-if="isEdit" class="form-group">
          <label>计划状态</label>
          <select v-model="formData.plan_status" class="input-field">
            <option value="ACTIVE">待执行</option>
            <option value="PAUSED">暂停</option>
            <option value="CANCELLED">取消</option>
          </select>
        </div>

        <div class="form-group">
          <label>备注</label>
          <textarea 
            v-model="formData.notes" 
            placeholder="交易备注..." 
            class="input-field textarea"
            rows="3"
          ></textarea>
        </div>

        <!-- 风险预览 -->
        <div v-if="formData.entry_price && formData.stop_loss && formData.take_profit" class="risk-preview">
          <h4>风险预览</h4>
          <div class="preview-grid">
            <div class="preview-item">
              <span class="label">止损幅度</span>
              <span class="value risk">{{ stopLossPercent }}%</span>
            </div>
            <div class="preview-item">
              <span class="label">止盈幅度</span>
              <span class="value profit">{{ takeProfitPercent }}%</span>
            </div>
            <div class="preview-item">
              <span class="label">风险收益比</span>
              <span class="value">1 : {{ riskRewardRatio }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="btn btn-secondary" @click="close">取消</button>
        <button 
          class="btn btn-primary" 
          @click="save"
          :disabled="!isValid || loading"
        >
          {{ loading ? '保存中...' : (isEdit ? '更新' : '创建') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { client } from '../api/client';

interface TradingPlan {
  id?: number;
  symbol: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  target_position: number;
  plan_status?: string;
  notes?: string;
}

const props = defineProps<{
  show: boolean;
  plan?: TradingPlan | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const isEdit = computed(() => !!props.plan?.id);
const loading = ref(false);

const formData = ref<TradingPlan>({
  symbol: '',
  entry_price: 0,
  stop_loss: 0,
  take_profit: 0,
  target_position: 0.1,
  plan_status: 'ACTIVE',
  notes: ''
});

const targetPositionPercent = computed({
  get: () => (formData.value.target_position * 100),
  set: (val) => { formData.value.target_position = val / 100; }
});

// 验证
const stopLossError = computed(() => {
  return formData.value.entry_price > 0 && 
         formData.value.stop_loss >= formData.value.entry_price;
});

const takeProfitError = computed(() => {
  return formData.value.entry_price > 0 && 
         formData.value.take_profit <= formData.value.entry_price;
});

const isValid = computed(() => {
  return formData.value.symbol &&
         formData.value.entry_price > 0 &&
         formData.value.stop_loss > 0 &&
         formData.value.take_profit > 0 &&
         formData.value.target_position > 0 &&
         formData.value.target_position <= 1 &&
         !stopLossError.value &&
         !takeProfitError.value;
});

// 风险计算
const stopLossPercent = computed(() => {
  if (!formData.value.entry_price || !formData.value.stop_loss) return '0.0';
  const percent = ((formData.value.entry_price - formData.value.stop_loss) / formData.value.entry_price) * 100;
  return percent.toFixed(1);
});

const takeProfitPercent = computed(() => {
  if (!formData.value.entry_price || !formData.value.take_profit) return '0.0';
  const percent = ((formData.value.take_profit - formData.value.entry_price) / formData.value.entry_price) * 100;
  return percent.toFixed(1);
});

const riskRewardRatio = computed(() => {
  const stopLoss = parseFloat(stopLossPercent.value);
  const takeProfit = parseFloat(takeProfitPercent.value);
  if (stopLoss === 0) return '0.0';
  return (takeProfit / stopLoss).toFixed(2);
});

// 监听 plan prop 变化
watch(() => props.plan, (newPlan) => {
  if (newPlan) {
    formData.value = { ...newPlan };
  } else {
    resetForm();
  }
}, { immediate: true });

function resetForm() {
  formData.value = {
    symbol: '',
    entry_price: 0,
    stop_loss: 0,
    take_profit: 0,
    target_position: 0.1,
    plan_status: 'ACTIVE',
    notes: ''
  };
}

async function save() {
  if (!isValid.value) return;
  
  loading.value = true;
  try {
    if (isEdit.value) {
      // 更新现有计划
      await client.put(`/v1/execution-center/plans/${props.plan!.id}`, formData.value);
      alert('计划更新成功！');
    } else {
      // 创建新计划
      await client.post('/v1/execution-center/plans', formData.value);
      alert('计划创建成功！');
    }
    emit('success');
  } catch (error: any) {
    console.error('保存计划失败:', error);
    alert(error.response?.data?.detail || '保存失败');
  } finally {
    loading.value = false;
  }
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
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.plan-dialog {
  background: linear-gradient(180deg, #1a1f3a 0%, #151932 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  color: #fff;
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.dialog-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #999;
  font-size: 13px;
  margin-bottom: 8px;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #2196f3;
  background: rgba(0, 0, 0, 0.5);
}

.input-field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-field.error {
  border-color: #f44336;
}

.error-text {
  display: block;
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
}

.textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.risk-preview {
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.risk-preview h4 {
  color: #64b5f6;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-item .label {
  color: #999;
  font-size: 12px;
}

.preview-item .value {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.preview-item .value.risk {
  color: #f44336;
}

.preview-item .value.profit {
  color: #4caf50;
}

.dialog-actions {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}
</style>
