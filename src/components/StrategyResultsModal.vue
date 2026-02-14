<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-body">
      <div class="modal-header">
        <div>
          <p class="modal-label">{{ $t('execution_list.results_modal.title') }}</p>
          <h3>{{ $t('execution_list.results_modal.run_id', { id: runId }) }}</h3>
        </div>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <!-- 批量操作工具栏 -->
      <div v-if="assets.length" class="batch-toolbar">
        <div class="toolbar-left">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              :checked="isAllSelected"
              @change="toggleSelectAll"
              class="checkbox-input"
            />
            <span>{{ $t('execution_list.results_modal.select_all') }}</span>
          </label>
          <span class="selected-count">{{ $t('execution_list.results_modal.selected_count', { n: selectedAssets.size }) }}</span>
        </div>
        <div class="toolbar-right">
          <button 
            v-if="selectedAssets.size > 0" 
            class="batch-trade-btn"
            @click="showBatchTrade = true"
          >
            {{ $t('execution_list.results_modal.batch_trade', { n: selectedAssets.size }) }}
          </button>
        </div>
      </div>

      <div class="modal-content">
        <div v-if="assets.length" class="results-table-container">
          <table class="results-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input 
                    type="checkbox" 
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                    class="checkbox-input"
                  />
                </th>
                <th>{{ $t('execution_list.results_modal.table.symbol') }}</th>
                <th>{{ $t('execution_list.results_modal.table.action') }}</th>
                <th>{{ $t('execution_list.results_modal.table.direction') }}</th>
                <th>{{ $t('execution_list.results_modal.table.strength') }}</th>
                <th>{{ $t('execution_list.results_modal.table.weight') }}</th>
                <th>{{ $t('execution_list.results_modal.table.dimensions') }}</th>
                <th>{{ $t('execution_list.results_modal.table.risk_flags') }}</th>
                <th>{{ $t('execution_list.results_modal.table.notes') }}</th>
                <th>{{ $t('execution_list.results_modal.table.quick_trade') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in assets" :key="asset.symbol" :class="{ 'selected-row': selectedAssets.has(asset.symbol) }">
                <td class="checkbox-col">
                  <input 
                    type="checkbox" 
                    :checked="selectedAssets.has(asset.symbol)"
                    @change="toggleAssetSelection(asset.symbol)"
                    class="checkbox-input"
                  />
                </td>
                <td><span class="symbol-tag">{{ asset.symbol }}</span></td>
                <td>
                  <span :class="['action-tag', (asset.action || '').toLowerCase()]">
                    {{ translateAction(asset.action) }}
                  </span>
                </td>
                <td>
                  <span :class="['direction-tag', (asset.direction || '').toLowerCase()]">
                    {{ translateDirection(asset.direction) }}
                  </span>
                </td>
                <td>
                  <div class="strength-bar-wrap">
                    <div class="strength-bar" :style="{ width: (asset.signal_strength ?? 0) + '%' }"></div>
                    <span class="strength-value">{{ asset.signal_strength?.toFixed(2) ?? '--' }}</span>
                  </div>
                </td>
                <td>{{ ((asset.weight ?? 0) * 100).toFixed(2) }}%</td>
                <td>
                  <div class="dimensions">
                    <span v-for="(val, key) in asset.signal_dimensions" :key="key" class="dim-tag">
                      {{ translateDimension(key) }}: {{ typeof val === 'number' ? val.toFixed(2) : val }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="risk-flags">
                    <span v-for="flag in asset.risk_flags" :key="flag" class="risk-tag">
                      {{ translateRiskFlag(flag) }}
                    </span>
                    <span v-if="!asset.risk_flags?.length" class="safe-tag">正常</span>
                  </div>
                </td>
                <td class="notes">{{ translateNotes(asset.notes) }}</td>
                <td class="trade-actions">
                  <button class="trade-btn" @click="handleQuickTrade(asset.symbol)" title="快捷交易">
                    ⚡ 交易
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">
            <p>该策略未发现符合条件的标的或正在扫描中...</p>
        </div>
      </div>

      <div class="modal-actions">
        <button class="primary-btn" @click="close">关闭</button>
      </div>

      <!-- 快捷交易对话框 -->
      <QuickTradeDialog
        :show="showQuickTrade"
        :run-id="runId"
        :symbol="selectedSymbol"
        @close="showQuickTrade = false"
        @success="handleTradeSuccess"
      />

      <!-- 批量交易对话框 -->
      <BatchQuickTradeDialog
        :show="showBatchTrade"
        :run-id="runId"
        :selected-symbols="Array.from(selectedAssets)"
        :assets="getSelectedAssetDetails()"
        @close="showBatchTrade = false"
        @success="handleBatchTradeSuccess"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { StrategyRunAssetView } from '../api/client';
import QuickTradeDialog from './QuickTradeDialog.vue';
import BatchQuickTradeDialog from './BatchQuickTradeDialog.vue';

const { t } = useI18n();

const props = defineProps<{
  show: boolean;
  runId: string;
  assets: StrategyRunAssetView[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const showQuickTrade = ref(false);
const showBatchTrade = ref(false);
const selectedSymbol = ref('');
const selectedAssets = ref<Set<string>>(new Set());

const isAllSelected = computed(() => {
  return props.assets.length > 0 && selectedAssets.value.size === props.assets.length;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedAssets.value.clear();
  } else {
    selectedAssets.value = new Set(props.assets.map(a => a.symbol));
  }
}

function toggleAssetSelection(symbol: string) {
  if (selectedAssets.value.has(symbol)) {
    selectedAssets.value.delete(symbol);
  } else {
    selectedAssets.value.add(symbol);
  }
  // 触发响应式更新
  selectedAssets.value = new Set(selectedAssets.value);
}

function getSelectedAssetDetails(): StrategyRunAssetView[] {
  return props.assets.filter(asset => selectedAssets.value.has(asset.symbol));
}

function handleQuickTrade(symbol: string) {
  selectedSymbol.value = symbol;
  showQuickTrade.value = true;
}

function handleTradeSuccess(result: any) {
  console.log('Trade executed:', result);
  alert(t('execution_list.results_modal.messages.trade_created', { msg: result.message }));
}

function handleBatchTradeSuccess(result: any) {
  console.log('Batch trade executed:', result);
  alert(t('execution_list.results_modal.messages.batch_trade_complete', { msg: result.message }));
  // 清空选择
  selectedAssets.value.clear();
}

function translateDimension(key: string): string {
  const k = key.toLowerCase();
  return t(`execution_list.results_modal.enums.dimensions.${k}`, k);
}

function translateRiskFlag(flag: string): string {
  const f = flag.toLowerCase();
  return t(`execution_list.results_modal.enums.risk_flags.${f}`, f);
}

function translateAction(action: string | null | undefined): string {
  if (!action) return '--';
  const a = action.toLowerCase();
  return t(`execution_list.results_modal.enums.actions.${a}`, a);
}

function translateDirection(direction: string | null | undefined): string {
  if (!direction) return '--';
  const d = direction.toLowerCase();
  return t(`execution_list.results_modal.enums.directions.${d}`, d);
}

function translateNotes(note: string | null | undefined): string {
  if (!note) return '--';
  if (note.toLowerCase().includes('generated by strategy engine')) {
    return t('execution_list.results_modal.messages.auto_generated');
  }
  return note;
}

function close() {
  emit('close');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-body {
  background: #1e293b;
  width: 90%;
  max-width: 1000px;
  max-height: 85vh;
  border-radius: 16px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-label {
  font-size: 0.75rem;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 4px 0;
}

h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #f1f5f9;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px;
}

.modal-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.results-table-container {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.results-table th {
  background: rgba(30, 41, 59, 0.5);
  padding: 12px 16px;
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.results-table td {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
  color: #e2e8f0;
}

.symbol-tag {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-family: monospace;
}

.action-tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.action-tag.buy { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
.action-tag.sell { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.action-tag.hold { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }
.action-tag.increase { background: rgba(16, 185, 129, 0.2); color: #34d399; }

.direction-tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.direction-tag.long { border-color: #4ade80; color: #4ade80; }
.direction-tag.short { border-color: #f87171; color: #f87171; }

.strength-bar-wrap {
  width: 120px;
  height: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #818cf8);
}

.strength-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.dimensions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.dim-tag {
  font-size: 0.7rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
  color: #cbd5e1;
}

.risk-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.risk-tag {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.safe-tag {
    color: #4ade80;
    font-size: 0.7rem;
}

.notes {
    font-size: 0.8rem;
    color: #94a3b8;
    max-width: 200px;
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: #94a3b8;
}

.modal-actions {
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.primary-btn {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  background: #0ea5e9;
  transform: translateY(-1px);
}

.trade-actions {
  text-align: center;
}

.trade-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.trade-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, #059669, #10b981);
}

.trade-btn:active {
  transform: translateY(0);
}

/* 批量操作工具栏样式 */
.batch-toolbar {
  padding: 16px 24px;
  background: rgba(59, 130, 246, 0.05);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cbd5e1;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.checkbox-col {
  width: 50px;
  text-align: center;
}

.selected-count {
  color: #3b82f6;
  font-weight: 600;
  font-size: 14px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.batch-trade-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.batch-trade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.selected-row {
  background: rgba(59, 130, 246, 0.1) !important;
  border-left: 3px solid #3b82f6;
}
</style>
