<template>
  <div class="page-container">
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
        <div>
          <h2>🔍 策略筛选</h2>
          <p>基于策略信号筛选可执行标的</p>
        </div>
      </div>
    </section>

    <section class="strategy-management">
      <div class="strategy-management__head">
        <div>
          <h3>⚙️ 策略管理</h3>
          <p>浏览平台策略、触发异步运行并实时查看进度</p>
        </div>
        <div class="strategy-status">
          <p v-if="strategyError" class="strategy-error">{{ strategyError }}</p>
          <p v-else-if="strategyLoading" class="strategy-loading">策略加载中...</p>
          <p v-else-if="strategyActionMessage" class="strategy-message">{{ strategyActionMessage }}</p>
        </div>
      </div>
      <div class="strategy-management__body">
        <div v-if="strategies.length" class="strategy-grid">
          <StrategyCard
            v-for="strategy in strategies"
            :key="strategy.id"
            :strategy="strategy"
            @run="openStrategyRunModal"
            @view="openStrategyRunModal"
          />
        </div>
        <div v-else class="strategy-empty">
          <p class="strategy-empty-text">暂无可用策略，稍后刷新页面看看</p>
        </div>
        <StrategyRecentRunCard
          v-if="recentStrategyRun"
          class="recent-card"
          :run="recentStrategyRun"
          :assets="strategyRunAssets"
          @export="handleExportStrategyRun"
          @view-results="handleViewStrategyResults"
        />
      </div>
    </section>

    <section class="strategy-history-section">
      <div class="strategy-history-header">
        <h3>🧾 策略运行历史（最近 {{ strategyHistoryLimit }} 次）</h3>
        <button class="refresh-history-btn" @click="loadStrategyRunHistory" :disabled="strategyHistoryLoading">
          {{ strategyHistoryLoading ? '加载中...' : '刷新策略历史' }}
        </button>
      </div>

      <div v-if="strategyHistory.length" class="runs-table-container">
        <table class="runs-table">
          <thead>
            <tr>
              <th>Run ID</th>
              <th>策略 ID</th>
              <th>状态</th>
              <th>命中 / 命中率</th>
              <th>平均强度</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in strategyHistory" :key="run.run_id" class="run-row">
              <td>{{ run.run_id }}</td>
              <td>{{ run.strategy_id }}</td>
              <td>{{ run.status }}</td>
              <td>{{ run.hits ?? '--' }} / {{ run.hit_rate ?? '--' }}</td>
              <td>{{ run.avg_signal_strength ?? '--' }}</td>
              <td>
                {{ run.started_at ? formatDateTime(run.started_at) : '--' }}
                <span v-if="run.finished_at">→ {{ formatDateTime(run.finished_at) }}</span>
              </td>
              <td>
                <button class="view-detail-btn" @click.stop="handleViewStrategyResults(run.run_id)">查看结果</button>
                <button class="view-detail-btn" @click.stop="handleExportStrategyRun(run.run_id)">导出</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="info-message">暂无策略运行记录</p>
    </section>

    <StrategyRunModal
      :show="showStrategyModal"
      :strategy="modalStrategy"
      @close="closeStrategyModal"
      @submit="handleStrategyRun"
    />

    <StrategyResultsModal
      :show="showResultsModal"
      :run-id="selectedRunId"
      :assets="modalAssets"
      @close="showResultsModal = false"
    />

    <!-- 说明指南 -->
    <OpportunitiesGuideline />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import OpportunitiesGuideline from '../components/OpportunitiesGuideline.vue';
import StrategyCard from '../components/StrategyCard.vue';
import StrategyRunModal from '../components/StrategyRunModal.vue';
import StrategyRecentRunCard from '../components/StrategyRecentRunCard.vue';
import StrategyResultsModal from '../components/StrategyResultsModal.vue';
import {
  fetchStrategies,
  fetchStrategyDetail,
  fetchLatestStrategyRun,
  runStrategy,
  fetchStrategyRunStatus,
  fetchStrategyRunResults,
  fetchStrategyRuns,
  exportStrategyRun,
  type StrategySummaryView,
  type StrategyDetailView,
  type StrategyRunStatusView,
  type StrategyRunAssetView,
  type StrategyRunRequest,
  type StrategyRunHistoryItem,
} from '../api/client';

const strategies = ref<StrategySummaryView[]>([]);
const strategyLoading = ref(false);
const strategyError = ref('');
const strategyHistory = ref<StrategyRunHistoryItem[]>([]);
const strategyHistoryLoading = ref(false);
const strategyHistoryLimit = ref(8);
const showStrategyModal = ref(false);
const modalStrategy = ref<StrategyDetailView | null>(null);
const recentStrategyRun = ref<StrategyRunStatusView | null>(null);
const strategyRunAssets = ref<StrategyRunAssetView[]>([]);
const strategyPollTimer = ref<number | null>(null);
const strategyExporting = ref(false);
const strategyActionMessage = ref('');
const showResultsModal = ref(false);
const selectedRunId = ref('');
const modalAssets = ref<StrategyRunAssetView[]>([]);

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

async function loadStrategies() {
  strategyLoading.value = true;
  strategyError.value = '';
  try {
    const response = await fetchStrategies({ limit: 6 });
    strategies.value = response.strategies || [];
  } catch (err) {
    console.error('加载策略失败:', err);
    strategyError.value = '策略列表暂时不可用';
  } finally {
    strategyLoading.value = false;
  }
}

async function openStrategyRunModal(strategy: StrategySummaryView) {
  try {
    strategyLoading.value = true;
    const response = await fetchStrategyDetail(strategy.id);
    modalStrategy.value = response.strategy;
    showStrategyModal.value = true;
  } catch (err) {
    console.error('加载策略详情失败:', err);
    strategyError.value = '无法获取策略详情';
  } finally {
    strategyLoading.value = false;
  }
}

function closeStrategyModal() {
  showStrategyModal.value = false;
  modalStrategy.value = null;
}

async function handleStrategyRun(payload: StrategyRunRequest) {
  if (!modalStrategy.value) return;
  const strategyId = modalStrategy.value.id;
  closeStrategyModal();
  strategyActionMessage.value = '策略已提交，正在等待执行';
  try {
    const result = await runStrategy(strategyId, payload);
    await pollStrategyStatus(result.run_id);
    await loadStrategyRunHistory();
    await loadLatestStrategyRun();
  } catch (err) {
    console.error('运行策略失败:', err);
    strategyError.value = '策略执行失败，请稍后重试';
  } finally {
    setTimeout(() => {
      strategyActionMessage.value = '';
    }, 6000);
  }
}

async function loadLatestStrategyRun() {
  try {
    const response = await fetchLatestStrategyRun();
    recentStrategyRun.value = response.run;
    if (response.run?.run_id) {
      await loadStrategyRunResults(response.run.run_id);
    }
  } catch (err) {
    console.error('加载最近策略运行失败:', err);
  }
}

async function loadStrategyRunHistory() {
  strategyHistoryLoading.value = true;
  try {
    const response = await fetchStrategyRuns({ limit: strategyHistoryLimit.value });
    strategyHistory.value = response.runs || [];
  } catch (err) {
    console.error('加载策略运行历史失败:', err);
  } finally {
    strategyHistoryLoading.value = false;
  }
}

const terminalStatuses = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

async function pollStrategyStatus(runId: string) {
  try {
    const status = await fetchStrategyRunStatus(runId);
    recentStrategyRun.value = status;
    if (terminalStatuses.has(status.status.toUpperCase())) {
      await loadStrategyRunResults(runId);
      return;
    }
  } catch (err) {
    console.warn('查询策略状态失败，稍后重试:', err);
  }
  scheduleStrategyPoll(runId);
}

function scheduleStrategyPoll(runId: string) {
  clearStrategyPoll();
  strategyPollTimer.value = window.setTimeout(() => pollStrategyStatus(runId), 2500);
}

function clearStrategyPoll() {
  if (strategyPollTimer.value) {
    window.clearTimeout(strategyPollTimer.value);
    strategyPollTimer.value = null;
  }
}

async function loadStrategyRunResults(runId: string) {
  try {
    const response = await fetchStrategyRunResults(runId);
    strategyRunAssets.value = response.assets || [];
  } catch (err) {
    console.warn('加载策略运行结果失败:', err);
  }
}

async function loadStrategyModalResults(runId: string) {
  try {
    const response = await fetchStrategyRunResults(runId);
    modalAssets.value = response.assets || [];
  } catch (err) {
    console.warn('加载详细结果失败:', err);
  }
}

async function handleExportStrategyRun(runId: string) {
  if (strategyExporting.value) return;
  strategyExporting.value = true;
  try {
    const response = await exportStrategyRun(runId);
    // 直接打开返回的 URL。Vite Proxy 已配置转发 /exports 路径到后端端口
    window.open(response.download_url, '_blank');
  } catch (err) {
    console.error('导出失败:', err);
    strategyError.value = '导出失败，请稍后重试';
  } finally {
    strategyExporting.value = false;
  }
}

function handleViewStrategyResults(runId: string) {
  selectedRunId.value = runId;
  modalAssets.value = [];
  showResultsModal.value = true;
  loadStrategyModalResults(runId);
}

onMounted(() => {
  loadStrategies();
  loadStrategyRunHistory();
  loadLatestStrategyRun();
});

onBeforeUnmount(() => {
  clearStrategyPoll();
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 24px;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: #e5e7eb;
}

.section-header p {
  margin: 0;
  font-size: 0.9rem;
  color: #9ca3af;
}

.scan-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 10px;
  min-width: 420px;
}

.control-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.control-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  color: #9ca3af;
}

.control-select,
.control-input {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: #020617;
  color: #e5e7eb;
  font-size: 0.85rem;
}

.control-input {
  width: 80px;
}

.control-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #9ca3af;
  cursor: pointer;
}

.control-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.scan-button {
  padding: 10px 20px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  background: linear-gradient(to right, #22c55e, #16a34a);
  color: #e5e7eb;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
  transition: all 0.2s ease;
}

.scan-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 18px rgba(34, 197, 94, 0.8);
}

.scan-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.warning-banner {
  padding: 12px 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #fbbf24;
  font-size: 0.85rem;
}

.status-bar {
  display: flex;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 10px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.status-value {
  font-size: 1rem;
  font-weight: 600;
  color: #e5e7eb;
}

.macro-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.macro-badge.risk-low {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.macro-badge.risk-medium {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.macro-badge.risk-high {
  background: rgba(249, 115, 22, 0.2);
  color: #fdba74;
  border: 1px solid rgba(249, 115, 22, 0.4);
}

.macro-badge.risk-extreme,
.macro-badge.risk-critical {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.macro-adjustment-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 8px;
  color: #fdba74;
  font-size: 0.85rem;
}

.alert-icon {
  font-size: 1.2rem;
}

.adjustment-detail {
  font-size: 0.75rem;
  color: #9ca3af;
}

.idempotent-notice,
.fallback-notice {
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #93c5fd;
  font-size: 0.85rem;
}

.error-message,
.loading-message,
.scanning-message,
.info-message {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.loading-message,
.scanning-message {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #93c5fd;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.scanning-icon {
  font-size: 2rem;
  margin-bottom: 8px;
  animation: pulse 1.5s ease-in-out infinite;
}

.scanning-text {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 500;
}

.scanning-hint {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

.info-message {
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.3);
  color: #9ca3af;
  text-align: center;
}

.top-picks-section h3,
.history-section h3 {
  margin: 0 0 16px;
  font-size: 1.1rem;
  color: #e5e7eb;
}

.opportunity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.empty-picks {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px dashed rgba(107, 114, 128, 0.5);
  border-radius: 10px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-picks p {
  margin: 4px 0;
  color: #9ca3af;
}

.empty-hint {
  font-size: 0.85rem;
  color: #6b7280;
}

.history-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
}

.refresh-history-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.refresh-history-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.6);
}

.refresh-history-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.runs-table-container {
  overflow-x: auto;
}

.runs-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(15, 23, 42, 0.85);
  border-radius: 10px;
  overflow: hidden;
}

.runs-table thead {
  background: rgba(30, 41, 59, 0.8);
}

.runs-table th {
  padding: 12px;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
  color: #9ca3af;
  border-bottom: 1px solid rgba(55, 65, 81, 0.8);
}

.runs-table td {
  padding: 12px;
  font-size: 0.85rem;
  color: #d1d5db;
  border-bottom: 1px solid rgba(55, 65, 81, 0.5);
}

.run-row {
  cursor: pointer;
  transition: background 0.2s ease;
}

.run-row:hover {
  background: rgba(56, 189, 248, 0.05);
}

.macro-badge-small {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.macro-badge-small.risk-low {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.macro-badge-small.risk-medium {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

.macro-badge-small.risk-high {
  background: rgba(249, 115, 22, 0.2);
  color: #fdba74;
}

.macro-badge-small.risk-extreme,
.macro-badge-small.risk-critical {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.view-detail-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.view-detail-btn:hover {
  background: rgba(56, 189, 248, 0.2);
}

.first-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-illustration {
  font-size: 6rem;
  margin-bottom: 24px;
  opacity: 0.6;
}

.first-empty-state h3 {
  margin: 0 0 12px;
  font-size: 1.3rem;
  color: #e5e7eb;
}

.first-empty-state p {
  margin: 0;
  color: #9ca3af;
}

/* 详情抽屉 */
.detail-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: flex-end;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.drawer-content {
  width: 600px;
  max-width: 90vw;
  background: #0f172a;
  border-left: 1px solid rgba(56, 189, 248, 0.3);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.8);
}

.drawer-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #e5e7eb;
}

.close-btn {
  padding: 8px 12px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px;
  font-size: 1rem;
  color: #9ca3af;
}

.macro-snapshot-card {
  padding: 16px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 8px;
}

.snapshot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.snapshot-label {
  font-size: 0.85rem;
  color: #9ca3af;
}

.snapshot-value {
  font-size: 1rem;
  font-weight: 600;
  color: #e5e7eb;
}

.snapshot-summary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(55, 65, 81, 0.5);
  font-size: 0.85rem;
  color: #d1d5db;
  line-height: 1.6;
}

.detail-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-detail-items {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 0.9rem;
}

.strategy-management {
  padding: 16px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(59, 130, 246, 0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.strategy-management__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.strategy-management__head h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #e5e7eb;
}

.strategy-management__head p {
  margin: 0;
  color: #9ca3af;
  font-size: 0.85rem;
}

.strategy-status {
  min-width: 220px;
  text-align: right;
}

.strategy-error {
  color: #fca5a5;
}

.strategy-loading {
  color: #93c5fd;
}

.strategy-message {
  color: #86efac;
}

.strategy-management__body {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
}

.strategy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.strategy-empty {
  padding: 40px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px dashed rgba(107, 114, 128, 0.5);
}

.strategy-empty-text {
  margin: 0;
  color: #9ca3af;
  text-align: center;
}

.recent-card {
  width: 100%;
}

.strategy-history-section {
  padding: 16px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.strategy-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.strategy-history-header h3 {
  margin: 0;
  color: #e5e7eb;
}

@media (max-width: 900px) {
  .scan-controls {
    min-width: auto;
    width: 100%;
  }

  .control-row {
    flex-wrap: wrap;
  }

  .opportunity-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .drawer-content {
    width: 100vw;
  }

  .strategy-management__body {
    grid-template-columns: 1fr;
  }
}
</style>
