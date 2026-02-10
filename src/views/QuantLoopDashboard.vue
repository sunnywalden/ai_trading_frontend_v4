<template>
  <div class="quant-loop-dashboard">
    <div class="page-header">
      <h1>量化交易闭环系统</h1>
      <p class="subtitle">AI驱动的自动化交易决策与执行</p>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="quantLoopStore.loading" class="loading-overlay">
      <div class="spinner-large"></div>
      <p>加载系统数据中...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="quantLoopStore.error" class="error-message">
      <div class="error-icon">⚠️</div>
      <h3>加载失败</h3>
      <p>{{ quantLoopStore.error }}</p>
      <button @click="loadAllData" class="btn-retry">重试</button>
    </div>
    
    <!-- 主内容 -->
    <div v-else class="dashboard-content">
      <!-- 第一行: 系统状态 + 性能图表 -->
      <div class="row-1">
        <div class="col-left">
          <SystemStatusCard 
            v-if="quantLoopStore.systemStatus"
            :status="quantLoopStore.systemStatus"
          />
        </div>
        <div class="col-right">
          <PerformanceChart 
            v-if="quantLoopStore.dashboardOverview?.daily_performance"
            :metrics="quantLoopStore.dashboardOverview.daily_performance"
            :chart-data="quantLoopStore.dashboardOverview.daily_performance_history"
          />
        </div>
      </div>
      
      <!-- 第二行: 信号管道 -->
      <div class="row-2">
        <SignalPipelineChart 
          v-if="quantLoopStore.dashboardOverview?.signal_pipeline"
          :data="quantLoopStore.dashboardOverview.signal_pipeline"
        />
      </div>
      
      <!-- 第三行: 待执行信号 -->
      <div class="row-3">
        <div class="signals-header">
          <h2>待执行信号</h2>
          <div class="signals-controls">
            <label class="filter-toggle">
              <input 
                type="checkbox" 
                v-model="filterByPosition"
                @change="handleFilterToggle"
              />
              <span>持仓过滤</span>
              <span class="filter-hint">（过滤冲突信号）</span>
            </label>
          </div>
        </div>
        <PendingSignalsTable 
          :signals="quantLoopStore.pendingSignals"
          @execute="handleBatchExecute"
          @execute-single="handleExecuteSingle"
          @reject="handleReject"
          @reject-batch="handleBatchReject"
          @view-details="handleViewDetails"
        />
      </div>
      
      <!-- 第四行: 优化建议 + 周期控制 -->
      <div class="row-4">
        <div class="col-left">
          <OptimizationPanel 
            v-if="quantLoopStore.dashboardOverview?.optimization_opportunities"
            :opportunities="quantLoopStore.dashboardOverview.optimization_opportunities"
          />
        </div>
        <div class="col-right">
          <CycleControlPanel 
            :is-running="isCycleRunning"
            :last-result="lastCycleResult"
            @run-cycle="handleRunCycle"
            @run-optimization="handleRunOptimization"
          />
        </div>
      </div>
    </div>
    
    <!-- 信号详情模态框 -->
    <div v-if="selectedSignal" class="modal-overlay" @click="selectedSignal = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>信号详情</h3>
          <button @click="selectedSignal = null" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedSignal" class="signal-details-content">
            <div class="summary-section">
              <h4>信号摘要</h4>
              <p class="summary-text">{{ aiSignalSummary || '正在生成信号摘要...' }}</p>
            </div>
            
            <div class="metrics-grid">
              <div class="metric-item">
                <span class="label">标的</span>
                <span class="value">{{ selectedSignal.symbol }}</span>
              </div>
              <div class="metric-item">
                <span class="label">方向</span>
                <span class="value" :class="selectedSignal.direction === 'LONG' ? 'long' : 'short'">
                  {{ selectedSignal.direction === 'LONG' ? '做多' : '做空' }}
                </span>
              </div>
              <div class="metric-item">
                <span class="label">强度</span>
                <span class="value">{{ selectedSignal.signal_strength.toFixed(1) }}</span>
              </div>
              <div class="metric-item">
                <span class="label">置信度</span>
                <span class="value">{{ (selectedSignal.confidence * 100).toFixed(1) }}%</span>
              </div>
            </div>

            <div class="factor-scores" v-if="selectedSignal.factor_scores">
              <h4>评分维度</h4>
              <div class="scores-list">
                <div v-for="(score, name) in selectedSignal.factor_scores" :key="name" class="score-row">
                  <span class="score-name">{{ formatFactorName(name) }}</span>
                  <div class="score-bar-container">
                    <div class="score-bar" :style="{ width: `${score}%` }"></div>
                  </div>
                  <span class="score-value">{{ score.toFixed(1) }}</span>
                </div>
              </div>
            </div>

            <div class="raw-data-toggle">
              <details>
                <summary>查看原始 JSON 数据</summary>
                <pre>{{ JSON.stringify(selectedSignal, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useQuantLoopStore } from '@/stores/quantLoop'
import SystemStatusCard from '@/components/quant-loop/SystemStatusCard.vue'
import SignalPipelineChart from '@/components/quant-loop/SignalPipelineChart.vue'
import PendingSignalsTable from '@/components/quant-loop/PendingSignalsTable.vue'
import PerformanceChart from '@/components/quant-loop/PerformanceChart.vue'
import OptimizationPanel from '@/components/quant-loop/OptimizationPanel.vue'
import CycleControlPanel from '@/components/quant-loop/CycleControlPanel.vue'
import type { TradingSignal, CycleConfig, CycleResult } from '@/api/quantLoopService'

const quantLoopStore = useQuantLoopStore()

const isCycleRunning = ref(false)
const lastCycleResult = ref<CycleResult | null>(null)
const selectedSignal = ref<TradingSignal | null>(null)
const aiSignalSummary = ref('')
const filterByPosition = ref(false) // 持仓过滤开关
let autoRefreshInterval: number | null = null

onMounted(() => {
  loadAllData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

async function loadAllData() {
  try {
    await Promise.all([
      quantLoopStore.fetchSystemStatus(),
      quantLoopStore.fetchDashboardOverview(),
      quantLoopStore.fetchPendingSignals(20, filterByPosition.value)
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

async function handleFilterToggle() {
  await quantLoopStore.fetchPendingSignals(20, filterByPosition.value)
}

function startAutoRefresh() {
  // 每30秒自动刷新数据
  autoRefreshInterval = window.setInterval(() => {
    if (!isCycleRunning.value) {
      loadAllData()
    }
  }, 30000)
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
}

async function handleRunCycle(config: CycleConfig) {
  isCycleRunning.value = true
  try {
    const result = await quantLoopStore.runTradingCycle(config)
    lastCycleResult.value = result
    
    // 运行完成后刷新数据
    await loadAllData()
    
    // 显示通知
    alert(`交易周期完成!\n周期ID: ${result.cycle_id}\n执行模式: ${config.execute_trades ? '真实交易' : 'DRY RUN'}`)
  } catch (error: any) {
    console.error('运行交易周期失败:', error)
    alert(`运行失败: ${error.message || '未知错误'}`)
  } finally {
    isCycleRunning.value = false
  }
}

async function handleRunOptimization() {
  try {
    await quantLoopStore.runTradingCycle({ 
      execute_trades: false,
      optimize: true 
    })
    
    // 刷新优化建议
    await quantLoopStore.fetchDashboardOverview()
    
    alert('参数优化完成!')
  } catch (error: any) {
    console.error('运行优化失败:', error)
    alert(`优化失败: ${error.message || '未知错误'}`)
  }
}

async function handleBatchExecute(signals: TradingSignal[]) {
  if (signals.length === 0) {
    alert('请至少选择一个信号')
    return
  }
  
  if (!confirm(`确认执行 ${signals.length} 个信号?`)) {
    return
  }
  
  try {
    const signalIds = signals.map(s => s.signal_id)
    const result = await quantLoopStore.executeSignals(signalIds)
    
    // 刷新数据
    await loadAllData()
    
    alert(`执行结果:\n成功: ${result.success_count}\n失败: ${result.failed_count}`)
  } catch (error: any) {
    console.error('批量执行失败:', error)
    alert(`执行失败: ${error.message || '未知错误'}`)
  }
}

async function handleExecuteSingle(signal: TradingSignal) {
  if (!confirm('确认执行此信号?')) {
    return
  }
  
  try {
    const result = await quantLoopStore.executeSignals([signal.signal_id])
    
    // 刷新数据
    await loadAllData()
    
    alert(`执行${result.success_count > 0 ? '成功' : '失败'}`)
  } catch (error: any) {
    console.error('执行失败:', error)
    alert(`执行失败: ${error.message || '未知错误'}`)
  }
}

async function handleReject(signal: TradingSignal) {
  if (!confirm(`确认拒绝信号 ${signal.symbol}?`)) {
    return
  }
  
  try {
    const result = await quantLoopStore.rejectSignals([signal.signal_id])
    
    // 刷新数据
    await loadAllData()
    
    alert(`拒绝成功！\n已拒绝: ${result.rejected_count}\n失败: ${result.failed_count}`)
  } catch (error: any) {
    console.error('拒绝失败:', error)
    alert(`拒绝失败: ${error.message || '未知错误'}`)
  }
}

async function handleBatchReject(signals: TradingSignal[]) {
  if (signals.length === 0) {
    alert('请至少选择一个信号')
    return
  }
  
  if (!confirm(`确认拒绝 ${signals.length} 个信号?`)) {
    return
  }
  
  try {
    const signalIds = signals.map(s => s.signal_id)
    const result = await quantLoopStore.rejectSignals(signalIds)
    
    // 刷新数据
    await loadAllData()
    
    alert(`批量拒绝结果:\n成功: ${result.rejected_count}\n失败: ${result.failed_count}`)
  } catch (error: any) {
    console.error('批量拒绝失败:', error)
    alert(`拒绝失败: ${error.message || '未知错误'}`)
  }
}

function handleViewDetails(signal: TradingSignal) {
  selectedSignal.value = signal
  loadSignalSummary(signal)
}

async function loadSignalSummary(signal: TradingSignal) {
  aiSignalSummary.value = ''
  try {
    const data = await quantLoopStore.getSignalSummary(signal.signal_id)
    if (data.success) {
      aiSignalSummary.value = data.summary
    } else {
      aiSignalSummary.value = '无法生成信号摘要。'
    }
  } catch (error) {
    console.error('获取信号摘要失败:', error)
    aiSignalSummary.value = '获取摘要时出错。'
  }
}

function formatFactorName(name: string): string {
  const mapping: Record<string, string> = {
    'technical_score': '技术面',
    'fundamental_score': '基本面',
    'momentum_score': '动量反转',
    'sentiment_score': '市场情绪',
    'signal_strength': '综合强弱'
  }
  return mapping[name] || name
}
</script>

<style scoped>
.quant-loop-dashboard {
  padding: 24px;
  max-width: 1800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #f1f5f9;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  color: #94a3b8;
  font-size: 16px;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #94a3b8;
}

.spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid #334155;
  border-top-color: #a78bfa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 40px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message h3 {
  margin: 0 0 8px 0;
  color: #ef4444;
  font-size: 20px;
}

.error-message p {
  margin: 0 0 24px 0;
  color: #94a3b8;
  font-size: 14px;
}

.btn-retry {
  padding: 12px 24px;
  background: #a78bfa;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #8b5cf6;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.row-1,
.row-4 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.row-2,
.row-3 {
  display: grid;
  grid-template-columns: 1fr;
}

.signals-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.signals-header h2 {
  margin: 0;
  color: #f1f5f9;
  font-size: 20px;
}

.signals-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  color: #94a3b8;
  font-size: 14px;
}

.filter-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.filter-toggle span {
  white-space: nowrap;
}

.filter-hint {
  color: #64748b;
  font-size: 12px;
}

.filter-toggle:hover {
  color: #f1f5f9;
}

@media (max-width: 1200px) {
  .row-1,
  .row-4 {
    grid-template-columns: 1fr;
  }
}

/* 模态框样式 */
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
  z-index: 1000;
}

.modal-content {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #334155;
}

.modal-header h3 {
  margin: 0;
  color: #f1f5f9;
  font-size: 18px;
}

.btn-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.btn-close:hover {
  color: #f1f5f9;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.modal-body pre {
  margin: 0;
  padding: 16px;
  background: #0f172a;
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 13px;
  overflow-x: auto;
}

.signal-details-content {
  color: #f1f5f9;
}

.summary-section {
  background: #2dd4bf20;
  border-left: 4px solid #2dd4bf;
  padding: 16px;
  margin-bottom: 24px;
  border-radius: 4px;
}

.summary-section h4 {
  margin: 0 0 8px 0;
  color: #2dd4bf;
  font-size: 16px;
}

.summary-text {
  margin: 0;
  line-height: 1.6;
  font-size: 15px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #0f172a;
  padding: 12px;
  border-radius: 6px;
}

.metric-item .label {
  color: #94a3b8;
  font-size: 12px;
}

.metric-item .value {
  font-size: 18px;
  font-weight: 600;
}

.metric-item .value.long { color: #2dd4bf; }
.metric-item .value.short { color: #fb7185; }

.factor-scores h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #f1f5f9;
}

.scores-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-name {
  width: 80px;
  font-size: 13px;
  color: #94a3b8;
}

.score-bar-container {
  flex: 1;
  height: 8px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
}

.score-bar {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #3b82f6);
  border-radius: 4px;
}

.score-value {
  width: 40px;
  font-size: 13px;
  text-align: right;
  font-weight: 600;
}

.raw-data-toggle {
  margin-top: 24px;
  border-top: 1px solid #334155;
  padding-top: 16px;
}

.raw-data-toggle summary {
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 8px;
}

.raw-data-toggle summary:hover {
  color: #94a3b8;
}
</style>
