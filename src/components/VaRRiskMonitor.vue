<template>
  <div class="var-risk-monitor">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h2 class="panel-title">
        <span class="icon">🛡️</span>
        VaR/CVaR 风险监控
      </h2>
      <div class="header-actions">
        <select v-model="selectedConfidence" @change="loadData" class="confidence-select">
          <option value="0.95">95% 置信度</option>
          <option value="0.99">99% 置信度</option>
        </select>
        <button @click="loadData" class="refresh-btn" :disabled="loading">
          <span class="icon">🔄</span>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在计算VaR/CVaR指标...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <span class="icon">⚠️</span>
      <p>{{ error }}</p>
      <button @click="loadData" class="retry-btn">重试</button>
    </div>

    <!-- 数据展示 -->
    <div v-else-if="riskData" class="risk-content">
      <!-- 风险等级指示器 -->
      <div class="risk-level-banner" :class="`risk-${riskData.risk_level.toLowerCase()}`">
        <span class="risk-icon">{{ getRiskIcon(riskData.risk_level) }}</span>
        <div class="risk-info">
          <h3>当前风险等级: {{ getRiskLevelText(riskData.risk_level) }}</h3>
          <p>账户权益: ${{ formatMoney(riskData.current_equity) }}</p>
        </div>
      </div>

      <!-- VaR/CVaR 仪表盘一览 -->
      <div class="gauge-row">
        <VaRGauge
          :value="Math.abs(riskData.var_95_pct) * 100"
          :max-scale="10"
          label="1日 VaR (95%)"
          sublabel="在险价值"
        />
        <VaRGauge
          :value="Math.abs(riskData.cvar_95_pct) * 100"
          :max-scale="15"
          label="CVaR (95%)"
          sublabel="期望尾部损失"
        />
      </div>

      <!-- VaR/CVaR 指标卡片 -->
      <div class="metrics-grid">
        <!-- VaR 95% -->
        <div class="risk-metric-card">
          <div class="card-header">
            <h4>VaR (95%)</h4>
            <span class="tooltip-icon">ℹ️</span>
          </div>
          <div class="metric-value danger">
            {{ formatPercent(riskData.var_95_pct) }}
          </div>
          <div class="metric-sub">
            ${{ formatMoney(Math.abs(riskData.var_95_dollar)) }}
          </div>
          <p class="metric-description">
            95%置信度下的日最大损失
          </p>
          <div class="risk-bar">
            <div
              class="risk-fill var"
              :style="{ width: `${Math.min(Math.abs(riskData.var_95_pct) * 100 / 5, 100)}%` }"
            ></div>
          </div>
        </div>

        <!-- CVaR 95% -->
        <div class="risk-metric-card">
          <div class="card-header">
            <h4>CVaR (95%)</h4>
            <span class="tooltip-icon">ℹ️</span>
          </div>
          <div class="metric-value danger">
            {{ formatPercent(riskData.cvar_95_pct) }}
          </div>
          <div class="metric-sub">
            ${{ formatMoney(Math.abs(riskData.cvar_95_dollar)) }}
          </div>
          <p class="metric-description">
            超过VaR时的预期损失
          </p>
          <div class="risk-bar">
            <div
              class="risk-fill cvar"
              :style="{ width: `${Math.min(Math.abs(riskData.cvar_95_pct) * 100 / 5, 100)}%` }"
            ></div>
          </div>
        </div>

        <!-- 最大回撤 -->
        <div class="risk-metric-card">
          <div class="card-header">
            <h4>最大回撤</h4>
            <span class="tooltip-icon">ℹ️</span>
          </div>
          <div class="metric-value warning">
            {{ formatPercent(riskData.max_drawdown_pct) }}
          </div>
          <div class="metric-sub">
            持续 {{ riskData.drawdown_duration_days }} 天
          </div>
          <p class="metric-description">
            历史最大亏损幅度
          </p>
          <div class="risk-bar">
            <div
              class="risk-fill drawdown"
              :style="{ width: `${Math.min(Math.abs(riskData.max_drawdown_pct) * 100 / 30, 100)}%` }"
            ></div>
          </div>
        </div>

        <!-- 年化波动率 -->
        <div class="risk-metric-card">
          <div class="card-header">
            <h4>年化波动率</h4>
            <span class="tooltip-icon">ℹ️</span>
          </div>
          <div class="metric-value info">
            {{ formatPercent(riskData.volatility_annualized) }}
          </div>
          <div class="metric-sub">
            {{ getVolatilityLevel(riskData.volatility_annualized) }}
          </div>
          <p class="metric-description">
            收益的波动程度
          </p>
          <div class="risk-bar">
            <div
              class="risk-fill volatility"
              :style="{ width: `${Math.min(riskData.volatility_annualized * 100 / 50, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 解读面板 -->
      <div class="interpretation-panel">
        <h3>
          <span class="icon">📝</span>
          风险解读
        </h3>
        <p>{{ riskData.interpretation }}</p>
      </div>

      <!-- 压力测试按钮 -->
      <div class="stress-test-section">
        <h3>
          <span class="icon">⚡</span>
          压力测试
        </h3>
        <div class="stress-test-buttons">
          <button
            v-for="scenario in stressScenarios"
            :key="scenario.value"
            @click="runStressTest(scenario.value)"
            class="stress-btn"
            :disabled="stressTestLoading"
          >
            {{ scenario.label }}
          </button>
        </div>

        <!-- 压力测试结果 -->
        <div v-if="stressTestResult" class="stress-test-result">
          <div class="result-header">
            <h4>{{ stressTestResult.scenario_name }}</h4>
            <span class="scenario-impact">市场情景: {{ formatPercent(stressTestResult.market_scenario) }}</span>
          </div>
          <div class="result-grid">
            <div class="result-item">
              <span class="label">组合Beta</span>
              <span class="value">{{ stressTestResult.portfolio_beta.toFixed(2) }}</span>
            </div>
            <div class="result-item danger">
              <span class="label">预估损失</span>
              <span class="value">
                {{ formatPercent(stressTestResult.estimated_loss_pct) }}
                (${{ formatMoney(Math.abs(stressTestResult.estimated_loss_dollar)) }})
              </span>
            </div>
            <div class="result-item">
              <span class="label">压力VaR</span>
              <span class="value">{{ formatPercent(stressTestResult.stress_var) }}</span>
            </div>
            <div class="result-item">
              <span class="label">压力后权益</span>
              <span class="value">${{ formatMoney(stressTestResult.post_stress_equity) }}</span>
            </div>
          </div>
          <div class="result-recommendation">
            <strong>建议:</strong> {{ stressTestResult.recommendation }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QuantLoopService from '@/api/quantLoopService'
import VaRGauge from '@/components/VaRGauge.vue'

// Props
const props = defineProps<{
  accountId: string
}>()

// 状态
const loading = ref(false)
const error = ref<string | null>(null)
const riskData = ref<any>(null)
const selectedConfidence = ref(0.95)
const stressTestLoading = ref(false)
const stressTestResult = ref<any>(null)

// 压力测试情景
const stressScenarios = [
  { value: '2008_crisis', label: '2008金融危机' },
  { value: '2020_covid', label: '2020疫情' },
  { value: 'black_monday', label: '黑色星期一' }
]

// 加载数据
const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    const service = QuantLoopService.getInstance()
    riskData.value = await service.getVaRRiskMetrics(props.accountId)
  } catch (e: any) {
    error.value = e.message || '网络错误'
  } finally {
    loading.value = false
  }
}

// 运行压力测试
const runStressTest = async (scenario: string) => {
  stressTestLoading.value = true
  stressTestResult.value = null

  try {
    const service = QuantLoopService.getInstance()
    stressTestResult.value = await service.getStressTestResults(props.accountId)
  } catch (e: any) {
    console.error('压力测试错误:', e)
  } finally {
    stressTestLoading.value = false
  }
}

// 格式化函数
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`
}

const formatMoney = (value: number) => {
  return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const getRiskLevelText = (level: string) => {
  const levelMap: Record<string, string> = {
    'LOW': '低风险',
    'MEDIUM': '中等风险',
    'HIGH': '高风险',
    'CRITICAL': '极高风险'
  }
  return levelMap[level] || level
}

const getRiskIcon = (level: string) => {
  const iconMap: Record<string, string> = {
    'LOW': '✅',
    'MEDIUM': '⚠️',
    'HIGH': '🔴',
    'CRITICAL': '🚨'
  }
  return iconMap[level] || '❓'
}

const getVolatilityLevel = (volatility: number) => {
  if (volatility < 0.15) return '低波动'
  if (volatility < 0.25) return '中等波动'
  if (volatility < 0.35) return '高波动'
  return '极高波动'
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.var-risk-monitor {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* VaR 仪表盘双列布局 */
.gauge-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
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
}

.confidence-select {
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

/* 风险等级横幅 */
.risk-level-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  border-left: 4px solid;
}

.risk-low {
  background: var(--color-success-bg);
  border-left-color: var(--color-success);
}

.risk-medium {
  background: var(--color-warning-bg);
  border-left-color: var(--color-warning);
}

.risk-high {
  background: var(--color-danger-bg);
  border-left-color: var(--color-danger);
}

.risk-critical {
  background: #ffebee;
  border-left-color: #c62828;
}

.risk-icon {
  font-size: 48px;
}

.risk-info h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.risk-info p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* 指标卡片网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.risk-metric-card {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all 0.2s;
}

.risk-metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.card-header h4 {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.tooltip-icon {
  font-size: 14px;
  cursor: help;
}

.metric-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-xs);
}

.metric-value.danger {
  color: var(--color-danger);
}

.metric-value.warning {
  color: var(--color-warning);
}

.metric-value.info {
  color: var(--color-info);
}

.metric-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-sm);
}

.metric-description {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-sm) 0;
  line-height: 1.4;
}

.risk-bar {
  height: 6px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.risk-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.risk-fill.var {
  background: linear-gradient(90deg, var(--color-danger), #d32f2f);
}

.risk-fill.cvar {
  background: linear-gradient(90deg, #d32f2f, #b71c1c);
}

.risk-fill.drawdown {
  background: linear-gradient(90deg, var(--color-warning), #f57c00);
}

.risk-fill.volatility {
  background: linear-gradient(90deg, var(--color-info), #1976d2);
}

/* 解读面板 */
.interpretation-panel {
  background: var(--color-bg-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  border-left: 4px solid var(--color-info);
}

.interpretation-panel h3 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.interpretation-panel p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* 压力测试 */
.stress-test-section {
  background: var(--color-bg-base);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.stress-test-section h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.stress-test-buttons {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.stress-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.2s;
}

.stress-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.stress-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 压力测试结果 */
.stress-test-result {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.result-header h4 {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.scenario-impact {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  font-weight: var(--font-weight-semibold);
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.result-item .label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.result-item .value {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.result-item.danger .value {
  color: var(--color-danger);
}

.result-recommendation {
  background: var(--color-warning-bg);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  border-left: 3px solid var(--color-warning);
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
}
</style>
