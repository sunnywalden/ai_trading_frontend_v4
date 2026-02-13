<template>
  <div class="signal-quality-dashboard">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h2 class="panel-title">
        <span class="icon">🎯</span>
        信号质量追踪
      </h2>
      <div class="header-actions">
        <select v-model="selectedPeriod" @change="loadData" class="period-select">
          <option value="7">7天</option>
          <option value="14">14天</option>
          <option value="30">30天</option>
          <option value="90">90天</option>
        </select>
        <button @click="loadData" class="refresh-btn" :disabled="loading">
          <span class="icon">🔄</span>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载信号质量数据...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <span class="icon">⚠️</span>
      <p>{{ error }}</p>
      <button @click="loadData" class="retry-btn">重试</button>
    </div>

    <!-- 数据展示 -->
    <div v-else-if="qualityData" class="dashboard-content">
      <!-- 总体胜率概览 -->
      <div class="overview-section">
        <div class="win-rate-card large-card">
          <div class="card-header">
            <h3>总体胜率</h3>
            <span class="period-label">{{ selectedPeriod }}天</span>
          </div>
          <div class="win-rate-display">
            <div class="circular-progress" :style="{ '--progress': qualityData.overall_win_rate }">
              <span class="progress-value">{{ formatPercent(qualityData.overall_win_rate) }}</span>
            </div>
            <div class="win-rate-details">
              <div class="detail-row">
                <span class="label">总信号数:</span>
                <span class="value">{{ qualityData.total_signals }}</span>
              </div>
              <div class="detail-row success">
                <span class="label">盈利信号:</span>
                <span class="value">{{ qualityData.winning_signals }}</span>
              </div>
              <div class="detail-row danger">
                <span class="label">亏损信号:</span>
                <span class="value">{{ qualityData.total_signals - qualityData.winning_signals }}</span>
              </div>
            </div>
          </div>
          <div class="win-rate-status" :class="getWinRateStatusClass(qualityData.overall_win_rate)">
            {{ getWinRateStatusText(qualityData.overall_win_rate) }}
          </div>
        </div>
      </div>

      <!-- 按策略分组 -->
      <div class="strategy-section">
        <h3 class="section-title">
          <span class="icon">📊</span>
          按策略分组
        </h3>
        <div class="strategy-grid">
          <div
            v-for="(stats, strategy) in qualityData.by_strategy"
            :key="strategy"
            class="strategy-card"
          >
            <div class="strategy-header">
              <h4 class="strategy-name">{{ strategy }}</h4>
              <span class="signal-count">{{ stats.count }} 个信号</span>
            </div>
            <div class="strategy-win-rate">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${stats.win_rate * 100}%` }"
                  :class="getProgressClass(stats.win_rate)"
                ></div>
              </div>
              <span class="win-rate-value">{{ formatPercent(stats.win_rate) }}</span>
            </div>
            <div class="strategy-stats">
              <span class="stat-item success">✓ {{ Math.round(stats.count * stats.win_rate) }}</span>
              <span class="stat-item danger">✗ {{ stats.count - Math.round(stats.count * stats.win_rate) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 按信号源分组 -->
      <div class="source-section">
        <h3 class="section-title">
          <span class="icon">🔍</span>
          按信号源分组
        </h3>
        <div class="source-grid">
          <div
            v-for="(stats, source) in qualityData.by_source"
            :key="source"
            class="source-card"
          >
            <div class="source-header">
              <span class="source-icon">{{ getSourceIcon(String(source)) }}</span>
              <h4 class="source-name">{{ formatSourceName(String(source)) }}</h4>
            </div>
            <div class="source-metrics">
              <div class="metric">
                <span class="metric-label">胜率</span>
                <span class="metric-value" :class="getWinRateClass(stats.win_rate)">
                  {{ formatPercent(stats.win_rate) }}
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">信号数</span>
                <span class="metric-value">{{ stats.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QuantLoopService from '@/api/quantLoopService'

// Props
const props = defineProps<{
  accountId: string
}>()

// 状态
const loading = ref(false)
const error = ref<string | null>(null)
const qualityData = ref<any>(null)
const selectedPeriod = ref(30)

// 加载数据
const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    const service = QuantLoopService.getInstance()
    qualityData.value = await service.getSignalQualityMetrics(
      props.accountId,
      selectedPeriod.value
    )
  } catch (e: any) {
    error.value = e.message || '网络错误'
  } finally {
    loading.value = false
  }
}

// 格式化函数
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`
}

const formatSourceName = (source: string) => {
  const nameMap: Record<string, string> = {
    'deepseek': 'DeepSeek AI',
    'technical_analysis': '技术分析',
    'manual': '手动输入',
    'quantitative': '量化模型'
  }
  return nameMap[source] || source
}

const getSourceIcon = (source: string) => {
  const iconMap: Record<string, string> = {
    'deepseek': '🤖',
    'technical_analysis': '📈',
    'manual': '✍️',
    'quantitative': '🧮'
  }
  return iconMap[source] || '📊'
}

// 胜率状态评估
const getWinRateStatusClass = (winRate: number) => {
  if (winRate >= 0.60) return 'status-excellent'
  if (winRate >= 0.55) return 'status-good'
  if (winRate >= 0.50) return 'status-fair'
  return 'status-poor'
}

const getWinRateStatusText = (winRate: number) => {
  if (winRate >= 0.60) return '🎉 优秀 - 远超预期'
  if (winRate >= 0.55) return '✅ 良好 - 达标'
  if (winRate >= 0.50) return '⚠️ 一般 - 需改进'
  return '❌ 较差 - 需要优化'
}

const getProgressClass = (winRate: number) => {
  if (winRate >= 0.60) return 'progress-excellent'
  if (winRate >= 0.55) return 'progress-good'
  if (winRate >= 0.50) return 'progress-fair'
  return 'progress-poor'
}

const getWinRateClass = (winRate: number) => {
  if (winRate >= 0.60) return 'text-excellent'
  if (winRate >= 0.55) return 'text-good'
  if (winRate >= 0.50) return 'text-fair'
  return 'text-poor'
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.signal-quality-dashboard {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.panel-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.period-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.refresh-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-md);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 总体胜率卡片 */
.overview-section {
  margin-bottom: var(--spacing-xl);
}

.win-rate-card {
  background: linear-gradient(135deg, var(--color-primary-bg) 0%, var(--color-bg-base) 100%);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.win-rate-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.win-rate-card h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.period-label {
  background: var(--color-bg-elevated);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.win-rate-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
}

/* 环形进度条 */
.circular-progress {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    var(--color-success) calc(var(--progress) * 360deg),
    var(--color-bg-subtle) 0deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.circular-progress::before {
  content: '';
  position: absolute;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--color-bg-base);
}

.progress-value {
  position: relative;
  z-index: 1;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.win-rate-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm);
  background: var(--color-bg-base);
  border-radius: var(--radius-md);
}

.detail-row .label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.detail-row .value {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.detail-row.success .value {
  color: var(--color-success);
}

.detail-row.danger .value {
  color: var(--color-danger);
}

.win-rate-status {
  text-align: center;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.status-excellent {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-good {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.status-fair {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.status-poor {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

/* 策略分组 */
.strategy-section,
.source-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.strategy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.strategy-card {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all 0.2s;
}

.strategy-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.strategy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.strategy-name {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.signal-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.strategy-win-rate {
  margin-bottom: var(--spacing-sm);
}

.progress-bar {
  height: 8px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: var(--spacing-xs);
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-excellent {
  background: var(--color-success);
}

.progress-good {
  background: var(--color-info);
}

.progress-fair {
  background: var(--color-warning);
}

.progress-poor {
  background: var(--color-danger);
}

.win-rate-value {
  display: block;
  text-align: right;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.strategy-stats {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.stat-item {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.stat-item.success {
  color: var(--color-success);
}

.stat-item.danger {
  color: var(--color-danger);
}

/* 信号源网格 */
.source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.source-card {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all 0.2s;
}

.source-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.source-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.source-icon {
  font-size: 24px;
}

.source-name {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.source-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.metric-value {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.text-excellent {
  color: var(--color-success) !important;
}

.text-good {
  color: var(--color-info) !important;
}

.text-fair {
  color: var(--color-warning) !important;
}

.text-poor {
  color: var(--color-danger) !important;
}

.icon {
  display: inline-block;
}

.retry-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-md);
  transition: background 0.2s;
}

.retry-btn:hover {
  background: var(--color-primary-dark);
}
</style>
