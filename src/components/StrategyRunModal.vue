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
        <div class="field-grid">
          <div class="field-group">
            <label>方向</label>
            <select v-model="form.direction">
              <option value="">自动</option>
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
          </div>
          <div class="field-group">
            <label>优先级</label>
            <input v-model.number="form.priority" type="number" min="0" placeholder="可选" />
          </div>
        </div>

        <div class="field-grid">
          <div class="field-group">
            <label>目标股票池</label>
            <select v-model="form.target_universe">
              <option value="US_LARGE_MID_TECH">美股中大型科技</option>
              <option value="PRECIOUS_METALS">黄金白银贵金属</option>
              <option value="US_SMALL_TECH">美股科技潜力股</option>
              <option value="TRADITIONAL_QUALITY">传统行业优质资产</option>
              <option value="EMERGING_QUALITY">新兴行业优质资产</option>
              <option value="BLOCKCHAIN_CRYPTO">区块链/加密相关</option>
            </select>
          </div>
          <div class="field-group">
            <label>最低评分</label>
            <input v-model.number="form.min_score" type="number" min="0" max="100" />
          </div>
        </div>

        <div class="field-grid">
          <div class="field-group">
            <label>最多展示</label>
            <input v-model.number="form.max_results" type="number" min="1" max="50" />
          </div>
          <div class="field-group">
            <label>通知频道（逗号分隔）</label>
            <input v-model="notifyChannelsInput" type="text" placeholder="例如 slack-strategy|email-trading" />
          </div>
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
  direction: undefined,
  target_universe: 'US_LARGE_MID_TECH',
  min_score: 75,
  max_results: 3
});

const notifyChannelsInput = ref('');
const errorMsg = ref('');
const loading = ref(false);

watch(
  () => props.show,
  (show) => {
    if (show && props.strategy) {
      form.direction = undefined;
      form.target_universe = props.strategy.default_params?.universe || 'US_LARGE_MID_TECH';
      form.min_score = 75;
      form.max_results = 3;
      form.priority = undefined;
      notifyChannelsInput.value = '';
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
    const payload: StrategyRunRequest = {
      direction: form.direction || undefined,
      notify_channels: notifyChannelsInput.value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      target_universe: form.target_universe || undefined,
      min_score: form.min_score,
      max_results: form.max_results,
      priority: form.priority || undefined
    };

    emit('submit', payload);
  } catch (error: any) {
    console.error('提交失败：', error);
    errorMsg.value = '提交失败，请重试';
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

.read-only-field {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.1);
  background: rgba(15, 23, 42, 0.5);
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: not-allowed;
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
