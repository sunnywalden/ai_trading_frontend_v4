<template>
  <div class="page-container">
    <section class="section-header">
      <h2>{{ $t('nav.etf_pool') }}</h2>
      <p>ETF 标的池管理、实时行情监控与机会筛选</p>
    </section>

    <!-- 过滤器与统计 -->
    <div class="etf-dashboard-grid">
      <div class="card stat-card glow">
        <div class="stat-label">总监控数量</div>
        <div class="stat-value">32</div>
        <div class="stat-change up">+3 本周</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">今日平均涨幅</div>
        <div class="stat-value text-up">+0.82%</div>
        <div class="stat-change">市场情绪：看多</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">异常放量 ETF</div>
        <div class="stat-value text-warning">5</div>
        <div class="stat-change">建议关注：XLV, XLP</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">主要板块</div>
        <div class="stat-value">12</div>
        <div class="stat-change">覆盖率：100%</div>
      </div>
    </div>

    <!-- 主面板 -->
    <div class="main-layout">
      <div class="watchlist-section">
        <ETFWatchlistPanel @select="handleEtfSelect" />
      </div>

      <div class="analysis-section card">
        <h3>{{ selectedEtf ? selectedEtf.symbol + ' 快速分析' : '选择一个 ETF 查看详情' }}</h3>
        
        <div v-if="selectedEtf" class="etf-detail">
          <div class="detail-row">
            <span class="label">名称</span>
            <span class="value">{{ selectedEtf.name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">当前价格</span>
            <span class="value">{{ selectedEtf.price }} ({{ (selectedEtf.change_pct || 0).toFixed(2) }}%)</span>
          </div>
          <div class="detail-row">
            <span class="label">行业/分类</span>
            <span class="value badge">{{ selectedEtf.category }}</span>
          </div>
          
          <div class="chart-placeholder">
            <!-- 实际项目中应在此接入 ECharts 或 Lightweight Charts -->
            <div class="mock-chart">
               <div v-for="h in [40, 60, 45, 80, 70, 90, 85]" :key="h" 
                    class="bar" :style="{ height: h + '%' }"></div>
            </div>
          </div>

          <div class="etf-actions">
            <button class="primary-button" @click="goToOpportunities">查看扫描机会</button>
            <button class="secondary-button" @click="goToBacktest">立即回测</button>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <p>从左侧列表中选择标的以开启 AI 深度分析</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ETFWatchlistPanel from '@/components/ETFWatchlistPanel.vue'

const router = useRouter()
const selectedEtf = ref<any>(null)

function handleEtfSelect(etf: any) {
  selectedEtf.value = etf
}

function goToOpportunities() {
  router.push('/opportunities')
}

function goToBacktest() {
  router.push('/backtest')
}
</script>

<style scoped>
.page-container {
  padding: 24px;
}

.etf-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.stat-card.glow {
  border-color: var(--accent1);
  box-shadow: 0 0 15px rgba(0, 150, 255, 0.1);
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-change {
  font-size: 11px;
  color: var(--text-muted);
}

.stat-change.up { color: var(--text-up); }
.stat-change.down { color: var(--text-down); }

.main-layout {
  display: grid;
  grid-template-columns: 460px 1fr;
  gap: 24px;
  align-items: start;
}

.analysis-section {
  padding: 24px;
  min-height: 500px;
}

.etf-detail {
  margin-top: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.badge {
  background: rgba(var(--accent1-rgb), 0.1);
  color: var(--accent1);
  padding: 2px 8px;
  border-radius: 4px;
}

.chart-placeholder {
  margin: 24px 0;
  background: rgba(0,0,0,0.1);
  border-radius: 8px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mock-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 80%;
  height: 100px;
}

.mock-chart .bar {
  flex: 1;
  background: var(--accent1);
  opacity: 0.6;
  border-radius: 2px 2px 0 0;
}

.etf-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-muted);
}
</style>
