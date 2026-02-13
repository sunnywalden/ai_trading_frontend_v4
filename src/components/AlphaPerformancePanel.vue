<template>
  <div class="alpha-performance-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h2 class="panel-title">
        <span class="icon">📊</span>
        Alpha/Beta 性能分析
      </h2>
      <div class="header-actions">
        <select v-model="selectedPeriod" @change="loadData" class="period-select">
          <option value="30">30天</option>
          <option value="90">90天</option>
          <option value="180">180天</option>
          <option value="365">365天</option>
        </select>
        <select v-model="selectedBenchmark" @change="loadData" class="benchmark-select">
          <option value="SPY">SPY (S&P 500)</option>
          <option value="QQQ">QQQ (纳斯达克100)</option>
          <option value="IWM">IWM (罗素2000)</option>
        </select>
        <button @click="loadData" class="refresh-btn" :disabled="loading">
          <span class="icon">🔄</span>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在计算Alpha/Beta指标...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <span class="icon">⚠️</span>
      <p>{{ error }}</p>
      <button @click="loadData" class="retry-btn">重试</button>
    </div>

    <!-- 数据展示 -->
    <div v-else-if="metrics" class="metrics-grid">
      <!-- Alpha 指标卡片 -->
      <MetricCard
        title="Alpha (超额收益)"
        :value="formatPercent(metrics.alpha)"
        :trend="metrics.alpha > 0 ? 'up' : 'down'"
        :status="getAlphaStatus(metrics.alpha)"
        icon="🎯"
        :description="`相对${selectedBenchmark}的超额收益`"
      />

      <!-- Beta 指标卡片 -->
      <MetricCard
        title="Beta (系统风险)"
        :value="formatNumber(metrics.beta, 2)"
        :trend="metrics.beta > 1 ? 'up' : 'down'"
        :status="getBetaStatus(metrics.beta)"
        icon="📈"
        description="市场敞口系数"
      />

      <!-- Sharpe Ratio -->
      <MetricCard
        title="Sharpe Ratio (夏普比率)"
        :value="formatNumber(metrics.sharpe_ratio, 2)"
        :trend="metrics.sharpe_ratio > 1 ? 'up' : 'down'"
        :status="getSharpeStatus(metrics.sharpe_ratio)"
        icon="⚡"
        description="风险调整后收益"
      />

      <!-- Information Ratio -->
      <MetricCard
        title="Information Ratio (信息比率)"
        :value="formatNumber(metrics.information_ratio, 2)"
        :trend="metrics.information_ratio > 0 ? 'up' : 'down'"
        :status="getIRStatus(metrics.information_ratio)"
        icon="🎓"
        description="超额收益稳定性"
      />

      <!-- Sortino Ratio -->
      <MetricCard
        title="Sortino Ratio (索提诺比率)"
        :value="formatNumber(metrics.sortino_ratio, 2)"
        :trend="metrics.sortino_ratio > 1 ? 'up' : 'down'"
        :status="getSortinoStatus(metrics.sortino_ratio)"
        icon="🛡️"
        description="下行风险调整收益"
      />

      <!-- Calmar Ratio -->
      <MetricCard
        title="Calmar Ratio (卡玛比率)"
        :value="formatNumber(metrics.calmar_ratio, 2)"
        :trend="metrics.calmar_ratio > 1 ? 'up' : 'down'"
        :status="getCalmarStatus(metrics.calmar_ratio)"
        icon="🏔️"
        description="最大回撤调整收益"
      />
    </div>

    <!-- 解读面板 -->
    <div v-if="metrics && metrics.interpretation" class="interpretation-panel">
      <h3>📝 分析解读</h3>
      <p>{{ metrics.interpretation }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MetricCard from './MetricCard.vue'
import QuantLoopService from '@/api/quantLoopService'

// Props
const props = defineProps<{
  accountId: string
}>()

// 状态
const loading = ref(false)
const error = ref<string | null>(null)
const metrics = ref<any>(null)
const selectedPeriod = ref(90)
const selectedBenchmark = ref('SPY')

// 加载数据
const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    const service = QuantLoopService.getInstance()
    metrics.value = await service.getAlphaBetaMetrics(
      props.accountId, 
      selectedPeriod.value, 
      selectedBenchmark.value
    )
  } catch (e: any) {
    error.value = e.message || '网络错误'
  } finally {
    loading.value = false
  }
}

// 格式化函数
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`
}

const formatNumber = (value: number, decimals: number = 2) => {
  return value.toFixed(decimals)
}

// 状态评估函数
const getAlphaStatus = (alpha: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (alpha >= 0.05) return 'excellent'  // ≥5%
  if (alpha >= 0.02) return 'good'       // ≥2%
  if (alpha >= 0) return 'fair'          // ≥0%
  return 'poor'                          // <0%
}

const getBetaStatus = (beta: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  const absBeta = Math.abs(beta - 1)
  if (absBeta <= 0.1) return 'excellent'  // 接近1
  if (absBeta <= 0.2) return 'good'
  if (absBeta <= 0.4) return 'fair'
  return 'poor'
}

const getSharpeStatus = (sharpe: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (sharpe >= 2.0) return 'excellent'
  if (sharpe >= 1.5) return 'good'
  if (sharpe >= 1.0) return 'fair'
  return 'poor'
}

const getIRStatus = (ir: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (ir >= 0.6) return 'excellent'
  if (ir >= 0.4) return 'good'
  if (ir >= 0.2) return 'fair'
  return 'poor'
}

const getSortinoStatus = (sortino: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (sortino >= 2.5) return 'excellent'
  if (sortino >= 2.0) return 'good'
  if (sortino >= 1.5) return 'fair'
  return 'poor'
}

const getCalmarStatus = (calmar: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (calmar >= 1.5) return 'excellent'
  if (calmar >= 1.0) return 'good'
  if (calmar >= 0.5) return 'fair'
  return 'poor'
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.alpha-performance-panel {
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

.period-select,
.benchmark-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: border-color 0.2s;
}

.period-select:hover,
.benchmark-select:hover {
  border-color: var(--color-primary);
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

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.error-state .icon {
  font-size: 48px;
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

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.interpretation-panel {
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  border-left: 4px solid var(--color-primary);
}

.interpretation-panel h3 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.interpretation-panel p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.icon {
  display: inline-block;
}
</style>
