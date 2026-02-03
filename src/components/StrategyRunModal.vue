<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-body">
      <div class="modal-header">
        <div>
          <p class="modal-label">策略执行</p>
          <h3>{{ strategy?.name || '选择策略' }}</h3>
        </div>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="modal-content">
        <div class="field-group">
          <label>账户 ID</label>
          <input v-model="form.account_id" type="text" placeholder="请输入账户 ID" />
        </div>

        <div class="field-grid">
          <div class="field-group">
            <label>预算（USD）</label>
            <input v-model.number="form.budget" type="number" min="0" step="0.01" placeholder="可选" />
          </div>
          <div class="field-group">
            <label>方向</label>
            <select v-model="form.direction">
              <option value="">自动</option>
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
          </div>
        </div>

        <div class="field-grid">
          <div class="field-group">
            <label>目标股票池</label>
            <input v-model="form.target_universe" type="text" placeholder="例如 US_LARGE_MID_TECH" />
          </div>
          <div class="field-group">
            <label>优先级</label>
            <input v-model.number="form.priority" type="number" min="0" placeholder="可选" />
          </div>
        </div>

        <div class="field-group">
          <label>通知频道（逗号分隔）</label>
          <input v-model="notifyChannelsInput" type="text" placeholder="例如 slack-strategy|email-trading" />
        </div>

        <div class="field-group">
          <label>参数快照（JSON，可选）</label>
          <textarea
            v-model="paramOverridesText"
            rows="5"
            spellcheck="false"
          ></textarea>
        </div>

        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
      </div>

      <div class="modal-actions">
        <button class="ghost-btn" @click="close" :disabled="loading">取消</button>
        <button class="primary-btn" @click="submit" :disabled="loading">
          <span v-if="!loading">确认运行</span>
          <span v-else>提交中...</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StrategyDetailView, StrategyRunRequest } from '../api/client';
import { PropType, reactive, ref, watch } from 'vue';

const props = defineProps<{ show: boolean; strategy: StrategyDetailView | null }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'submit', payload: StrategyRunRequest): void }>();

const form = reactive<StrategyRunRequest>({
  account_id: '',
  budget: undefined,
  direction: undefined,
  param_overrides: {}
});

const notifyChannelsInput = ref('');
const paramOverridesText = ref('{}');
const errorMsg = ref('');
const loading = ref(false);

watch(
  () => props.strategy,
  (strategy) => {
    if (!strategy) return;
    paramOverridesText.value = JSON.stringify(strategy.default_params || {}, null, 2);
  },
  { immediate: true }
);

watch(
  () => props.show,
  (show) => {
    if (show && props.strategy) {
      form.account_id = '';
      form.budget = undefined;
      form.direction = undefined;
      form.target_universe = props.strategy.default_params?.universe || '';
      form.priority = undefined;
      notifyChannelsInput.value = '';
      paramOverridesText.value = JSON.stringify(props.strategy.default_params || {}, null, 2);
      errorMsg.value = '';
    }
  }
);

function close() {
  if (loading.value) return;
  emit('close');
}

async function submit() {
  errorMsg.value = '';
  loading.value = true;
  try {
    let overrides: Record<string, any> = {};
    if (paramOverridesText.value.trim()) {
      overrides = JSON.parse(paramOverridesText.value);
    }

    const payload: StrategyRunRequest = {
      account_id: form.account_id,
      budget: form.budget,
      direction: form.direction || undefined,
      param_overrides: overrides,
      notify_channels: notifyChannelsInput.value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      target_universe: form.target_universe || undefined,
      priority: form.priority || undefined
    };

    emit('submit', payload);
  } catch (error: any) {
    console.error('解析参数失败：', error);
    errorMsg.value = '参数格式错误，请检查 JSON';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
}

.modal-body {
  width: min(640px, 90vw);
  background: #0f172a;
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.4);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-label {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.modal-header h3 {
  margin: 2px 0 0;
  color: #e5e7eb;
}

.close-btn {
  border: none;
  background: rgba(248, 113, 113, 0.1);
  color: #f87171;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1rem;
  cursor: pointer;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

label {
  font-size: 0.75rem;
  color: #9ca3af;
}

input,
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  background: #020617;
  color: #e5e7eb;
  font-size: 0.9rem;
}

textarea {
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
  resize: vertical;
}

.error-text {
  color: #fca5a5;
  font-size: 0.85rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.primary-btn,
.ghost-btn {
  border-radius: 999px;
  padding: 8px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.primary-btn {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: #fff;
}

.ghost-btn {
  background: transparent;
  border: 1px solid rgba(226, 232, 240, 0.3);
  color: #e5e7eb;
}

.primary-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
