<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-body">
      <div class="modal-header">
        <div>
          <p class="modal-label">{{ $t('execution_list.run_modal.title') }}</p>
          <h3>{{ strategy?.name || $t('execution_list.run_modal.select_strategy') }}</h3>
        </div>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="modal-content">
        <div class="field-grid">
          <div class="field-group">
            <label>{{ $t('execution_list.run_modal.direction') }}</label>
            <select v-model="form.direction">
              <option value="">{{ $t('execution_list.run_modal.auto') }}</option>
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
          </div>
          <div class="field-group">
            <label>{{ $t('execution_list.run_modal.priority') }}</label>
            <input v-model.number="form.priority" type="number" min="0" :placeholder="$t('execution_list.run_modal.optional')" />
          </div>
        </div>

        <div class="field-grid">
          <div class="field-group">
            <label>{{ $t('execution_list.run_modal.target_universe') }}</label>
            <select v-model="form.target_universe">
              <option value="US_LARGE_MID_TECH">{{ $t('execution_list.run_modal.universes.US_LARGE_MID_TECH') }}</option>
              <option value="PRECIOUS_METALS">{{ $t('execution_list.run_modal.universes.PRECIOUS_METALS') }}</option>
              <option value="US_SMALL_TECH">{{ $t('execution_list.run_modal.universes.US_SMALL_TECH') }}</option>
              <option value="TRADITIONAL_QUALITY">{{ $t('execution_list.run_modal.universes.TRADITIONAL_QUALITY') }}</option>
              <option value="EMERGING_QUALITY">{{ $t('execution_list.run_modal.universes.EMERGING_QUALITY') }}</option>
              <option value="BLOCKCHAIN_CRYPTO">{{ $t('execution_list.run_modal.universes.BLOCKCHAIN_CRYPTO') }}</option>
            </select>
          </div>
          <div class="field-group">
            <label>{{ $t('execution_list.run_modal.min_score') }}</label>
            <input v-model.number="form.min_score" type="number" min="0" max="100" />
          </div>
        </div>

        <div class="field-grid">
          <div class="field-group">
            <label>{{ $t('execution_list.run_modal.max_results') }}</label>
            <input v-model.number="form.max_results" type="number" min="1" max="50" />
          </div>
          <div class="field-group">
            <label>{{ $t('execution_list.run_modal.notify_channels') }}</label>
            <input v-model="notifyChannelsInput" type="text" :placeholder="$t('execution_list.run_modal.placeholder_channels')" />
          </div>
        </div>

        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
      </div>

      <div class="modal-actions">
        <button class="ghost-btn" @click="close" :disabled="loading">{{ $t('execution_list.run_modal.cancel') }}</button>
        <button class="primary-btn" @click="submit" :disabled="loading">
          <span v-if="!loading">{{ $t('execution_list.run_modal.confirm') }}</span>
          <span v-else>{{ $t('execution_list.run_modal.submitting') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StrategyDetailView, StrategyRunRequest } from '../api/client';
import { PropType, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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
    console.error('Submit strategy run failed:', error);
    errorMsg.value = t('execution_list.run_modal.error_submit');
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
