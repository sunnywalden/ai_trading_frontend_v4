<template>
  <div class="page-container">
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
        <div>
          <h2>📌 执行列表</h2>
          <p>基于计划与评分筛选可执行标的</p>
        </div>
        
        <!-- 扫描参数控制区 -->
        <div class="scan-controls">
          <div class="control-row">
            <label class="control-label">
              股票池
              <select v-model="scanParams.universe_name" class="control-select">
                <option value="US_LARGE_MID_TECH">美股中大型科技</option>
              </select>
            </label>
            
            <label class="control-label">
              最低评分
              <input 
                v-model.number="scanParams.min_score" 
                type="number" 
                min="0" 
                max="100"
                class="control-input"
              />
            </label>
            
            <label class="control-label">
              最多展示
              <input 
                v-model.number="scanParams.max_results" 
                type="number" 
                min="1" 
                max="10"
                class="control-input"
              />
            </label>
          </div>
          
          <div class="control-row">
            <label class="control-checkbox">
              <input type="checkbox" v-model="scanParams.force_refresh" />
              <span>强制刷新（可能触发限流，耗时更长）</span>
            </label>
          </div>
          
          <button 
            class="scan-button" 
            @click="onScanOpportunities" 
            :disabled="scanning"
          >
            <span v-if="!scanning">🔍 立即扫描</span>
            <span v-else>扫描中...</span>
          </button>
        </div>
      </div>
      
      <!-- 警告提示条 -->
      <div v-if="scanParams.force_refresh" class="warning-banner">
        ⚠️ 强制刷新将触发外部API调用，可能耗时 30-90 秒，且有限流风险
      </div>
    </section>

    <ExecutionListHeader
      :universe-name="scanParams.universe_name || 'US_LARGE_MID_TECH'"
      :min-score="scanParams.min_score || 0"
      :max-results="scanParams.max_results || 0"
      :force-refresh="!!scanParams.force_refresh"
    />

    <!-- 状态栏 -->
    <section v-if="latestRun" class="status-bar">
      <div class="status-item">
        <span class="status-label">最新扫描</span>
        <span class="status-value">{{ formatDateTime(latestRun.as_of) }}</span>
      </div>
      
      <div class="status-item">
        <span class="status-label">宏观风险</span>
        <span 
          class="macro-badge" 
          :class="`risk-${(latestRun.macro_risk?.risk_level || 'unknown').toLowerCase()}`"
        >
          {{ latestRun.macro_risk?.risk_level || 'UNKNOWN' }} ({{ latestRun.macro_risk?.overall_score || 0 }})
        </span>
      </div>
      
      <div class="status-item">
        <span class="status-label">符合条件</span>
        <span class="status-value">{{ latestRun.qualified_symbols }} / {{ latestRun.total_symbols }}</span>
      </div>
      
      <div class="status-item">
        <span class="status-label">用时</span>
        <span class="status-value">{{ (latestRun.elapsed_ms / 1000).toFixed(2) }}秒</span>
      </div>
    </section>

    <!-- 宏观风险调整提示 -->
    <div 
      v-if="latestRun && latestRun.macro_risk?.risk_level && ['HIGH', 'EXTREME', 'CRITICAL'].includes(latestRun.macro_risk.risk_level)" 
      class="macro-adjustment-alert"
    >
      <span class="alert-icon">🚨</span>
      <span>宏观风险偏高，本次机会筛选阈值自动提高到 80 分</span>
      <span 
        v-if="latestRun.notes?.macro_adjustment" 
        class="adjustment-detail"
      >
        ({{ latestRun.notes.macro_adjustment.before_threshold }} → 
        {{ latestRun.notes.macro_adjustment.after_threshold }})
      </span>
    </div>

    <!-- 幂等提示 -->
    <div v-if="idempotentNotice" class="idempotent-notice">
      ℹ️ 本次请求命中幂等缓存，返回今日已生成结果
    </div>

    <!-- 兜底股票池提示 -->
    <div v-if="latestRun?.notes?.universe?.fallback_used" class="fallback-notice">
      ⚠️ 数据源限流，已使用兜底股票池（结果可能偏保守）
    </div>

    <!-- 加载/错误/空状态 -->
    <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
    <p v-else-if="loading" class="loading-message">正在加载潜在机会数据...</p>
    <div v-else-if="scanning" class="scanning-message">
      <div class="scanning-icon">🔍</div>
      <p class="scanning-text">正在扫描股票池...</p>
      <p class="scanning-hint">扫描已提交后台执行，预计 30-90 秒完成</p>
    </div>

    <!-- Top Picks 推荐卡片 -->
    <div v-else-if="latestRun">
      <section v-if="latestRun.items && latestRun.items.length > 0" class="top-picks-section">
        <h3>🎯 Top {{ latestRun.items.length }} 推荐</h3>
        <div class="opportunity-grid">
          <OpportunityCard 
            v-for="item in latestRun.items" 
            :key="item.symbol"
            :opportunity="item"
          />
        </div>
      </section>
      
      <div v-else class="empty-picks">
        <div class="empty-icon">🔍</div>
        <p>当前无符合条件的机会</p>
        <p class="empty-hint">尝试降低最低评分或调整筛选条件</p>
      </div>
    </div>

    <!-- 首次空状态 -->
    <div v-else-if="!loading && !scanning" class="first-empty-state">
      <div class="empty-illustration">💡</div>
      <h3>开始发现潜在机会</h3>
      <p>点击右上角「立即扫描」生成今日机会推荐</p>
    </div>

    <!-- 历史回溯（独立显示，不依赖 latestRun） -->
    <section v-if="!loading && !scanning" class="history-section">
      <h3>📜 历史扫描记录（最近 {{ historyLimit }} 次）</h3>
      <button class="refresh-history-btn" @click="loadRunHistory" :disabled="loadingHistory">
        {{ loadingHistory ? '加载中...' : '刷新历史' }}
      </button>
    </section>

    <div v-if="!loading && !scanning && runHistory.length > 0" class="runs-table-container">
      <table class="runs-table">
        <thead>
          <tr>
            <th>扫描时间</th>
            <th>股票池</th>
            <th>符合条件</th>
            <th>用时</th>
            <th>宏观风险</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="run in runHistory" 
            :key="run.run_id"
            @click="onViewRunDetail(run.run_id)"
            class="run-row"
          >
            <td>{{ formatDateTime(run.as_of) }}</td>
            <td>{{ run.universe_name }}</td>
            <td>{{ run.qualified_symbols }} / {{ run.total_symbols }}</td>
            <td>{{ (run.elapsed_ms / 1000).toFixed(2) }}s</td>
            <td>
              <span 
                class="macro-badge-small" 
                :class="`risk-${(run.macro_risk_level || 'unknown').toLowerCase()}`"
              >
                {{ run.macro_risk_level || 'UNKNOWN' }}
              </span>
            </td>
            <td>
              <button class="view-detail-btn" @click.stop="onViewRunDetail(run.run_id)">
                查看详情
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else-if="!loading && !scanning && !loadingHistory" class="info-message">暂无历史记录</p>

    <!-- 说明指南 -->
    <OpportunitiesGuideline />

    <!-- 定时任务配置 -->
    <SchedulerConfig />

    <!-- 详情抽屉 (简化版) -->
    <div v-if="selectedRunDetail" class="detail-drawer" @click="closeDetailDrawer">
      <div class="drawer-content" @click.stop>
        <div class="drawer-header">
          <h3>扫描详情</h3>
          <button class="close-btn" @click="closeDetailDrawer">✕</button>
        </div>
        <div class="drawer-body">
          <div class="detail-section">
            <h4>宏观快照</h4>
            <div class="macro-snapshot-card">
              <div class="snapshot-item">
                <span class="snapshot-label">风险等级</span>
                <span 
                  class="macro-badge" 
                  :class="`risk-${(selectedRunDetail.macro_risk?.risk_level || 'unknown').toLowerCase()}`"
                >
                  {{ selectedRunDetail.macro_risk?.risk_level || 'UNKNOWN' }}
                </span>
              </div>
              <div class="snapshot-item">
                <span class="snapshot-label">风险评分</span>
                <span class="snapshot-value">{{ selectedRunDetail.macro_risk?.overall_score || 0 }}</span>
              </div>
              <div class="snapshot-summary">
                {{ selectedRunDetail.macro_risk?.risk_summary || '暂无摘要' }}
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>推荐标的 ({{ selectedRunDetail.items.length }})</h4>
            <div v-if="selectedRunDetail.items.length > 0" class="detail-items-list">
              <OpportunityCard 
                v-for="item in selectedRunDetail.items" 
                :key="item.symbol"
                :opportunity="item"
              />
            </div>
            <p v-else class="empty-detail-items">无符合条件的标的</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import OpportunityCard from '../components/OpportunityCard.vue';
import ExecutionListHeader from '../components/ExecutionListHeader.vue';
import OpportunitiesGuideline from '../components/OpportunitiesGuideline.vue';
import SchedulerConfig from '../components/SchedulerConfig.vue';
import {
  fetchLatestOpportunities,
  scanOpportunities,
  fetchOpportunityRuns,
  fetchOpportunityRunDetail,
  type LatestOpportunitiesResponse,
  type OpportunityRunSummary,
  type OpportunityRun,
  type ScanOpportunitiesRequest
} from '../api/client';

const latestRun = ref<OpportunityRun | null>(null);
const runHistory = ref<OpportunityRunSummary[]>([]);
const selectedRunDetail = ref<OpportunityRun | null>(null);
const loading = ref(false);
const scanning = ref(false);
const loadingHistory = ref(false);
const errorMsg = ref('');
const idempotentNotice = ref(false);
const historyLimit = ref(20);

const scanParams = ref<ScanOpportunitiesRequest>({
  universe_name: 'US_LARGE_MID_TECH',
  min_score: 75,
  max_results: 3,
  force_refresh: false
});

async function loadLatestOpportunities() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const response = await fetchLatestOpportunities(scanParams.value.universe_name);
    latestRun.value = response.latest;
  } catch (e: any) {
    console.error('加载潜在机会失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = '⏱️ 请求超时，请稍后再试！';
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = '🌐 网络连接失败，请检查网络或后端服务状态';
    } else if (e.response?.status === 404) {
      // 404 表示还没有数据，这不是错误
      errorMsg.value = '';
      latestRun.value = null;
    } else {
      errorMsg.value = '❌ 获取潜在机会数据失败';
    }
  } finally {
    loading.value = false;
  }
}

async function onScanOpportunities() {
  scanning.value = true;
  errorMsg.value = '';
  idempotentNotice.value = false;
  
  try {
    const result = await scanOpportunities(scanParams.value);
    
    // 判断是否为异步扫描（基于 run.status）
    if (result.run.status === 'SCHEDULED') {
      const scheduledRunId = result.notes?.scheduled_run_id;
      
      if (scheduledRunId) {
        // 提示用户扫描已启动
        console.log(`📋 扫描任务已提交，run_id: ${scheduledRunId}，正在后台执行...`);
        
        // 开始轮询查询结果
        await pollScanResult(scheduledRunId);
      } else {
        // 如果没有run_id，直接使用占位结果
        latestRun.value = result.run;
        errorMsg.value = '⏳ 扫描任务已提交，请稍后手动刷新查看结果';
      }
    } else {
      // 同步返回的结果（SUCCESS状态）
      latestRun.value = result.run;
      
      // 检查是否幂等
      if (result.notes?.idempotent) {
        idempotentNotice.value = true;
        setTimeout(() => {
          idempotentNotice.value = false;
        }, 5000);
      }
    }
    
    // 刷新历史记录
    await loadRunHistory();
  } catch (e: any) {
    console.error('扫描失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = '⏱️ 扫描超时，请稍后再试（建议关闭强制刷新）';
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = '🌐 网络连接失败，无法执行扫描';
    } else {
      errorMsg.value = '❌ 扫描失败，请稍后重试';
    }
  } finally {
    scanning.value = false;
  }
}

// 轮询查询扫描结果
async function pollScanResult(runId: number, maxAttempts = 30, intervalMs = 2000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      
      const runDetail = await fetchOpportunityRunDetail(runId);
      
      if (runDetail.status === 'SUCCESS') {
        // 扫描成功
        latestRun.value = runDetail;
        console.log(`✅ 扫描完成，共找到 ${runDetail.qualified_symbols} 个机会`);
        return;
      } else if (runDetail.status === 'FAILED') {
        // 扫描失败
        errorMsg.value = '❌ 扫描任务执行失败，请重试';
        return;
      }
      // 状态为 SCHEDULED 或 RUNNING，继续轮询
      
    } catch (e: any) {
      console.error('查询扫描结果失败:', e);
      if (attempt >= maxAttempts - 1) {
        errorMsg.value = '⏱️ 扫描任务超时，请稍后手动刷新查看结果';
      }
    }
  }
  
  // 超过最大尝试次数
  errorMsg.value = '⏳ 扫描任务仍在执行中，请稍后手动刷新查看结果';
}

async function loadRunHistory() {
  loadingHistory.value = true;
  try {
    const result = await fetchOpportunityRuns(historyLimit.value, scanParams.value.universe_name);
    runHistory.value = result.runs;
  } catch (e: any) {
    console.error('加载历史失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      console.warn('⏱️ 历史记录加载超时，请点击"刷新历史"重试');
    } else if (e.code === 'ERR_NETWORK') {
      console.warn('🌐 网络连接失败，无法加载历史记录');
    }
  } finally {
    loadingHistory.value = false;
  }
}

async function onViewRunDetail(runId: number) {
  try {
    selectedRunDetail.value = await fetchOpportunityRunDetail(runId);
  } catch (e: any) {
    console.error('加载详情失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = '⏱️ 加载详情超时，请稍后重试';
    } else if (e.code === 'ERR_NETWORK') {
      errorMsg.value = '🌐 网络连接失败，无法加载详情';
    } else {
      errorMsg.value = '❌ 加载详情失败';
    }
  }
}

function closeDetailDrawer() {
  selectedRunDetail.value = null;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

onMounted(() => {
  loadLatestOpportunities();
  loadRunHistory();
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
}
</style>
