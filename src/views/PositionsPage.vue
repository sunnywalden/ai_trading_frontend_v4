<template>
  <div class="page-container">
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2>📊 持仓评估</h2>
          <p>技术面、基本面、情绪面三维度综合评分</p>
        </div>
        <button class="refresh-button" @click="onRefreshPositions" :disabled="loading">
          {{ loading ? '刷新中...' : '刷新数据' }}
        </button>
      </div>
    </section>

    <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
    <p v-else-if="loading" class="loading-message">正在加载持仓数据...</p>
    
    <div v-else-if="positionsData">
      <!-- 汇总信息 -->
      <section class="summary-bar">
        <div class="summary-item">
          <span class="summary-label">总持仓</span>
          <span class="summary-value">{{ positionsData.summary.total_positions || 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">总市值</span>
          <span class="summary-value">${{ (positionsData.summary.total_value || 0).toLocaleString() }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">总盈亏</span>
          <span class="summary-value" :class="(positionsData.summary.total_pnl || 0) >= 0 ? 'profit' : 'loss'">
            ${{ (positionsData.summary.total_pnl || 0).toLocaleString() }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">平均评分</span>
          <span class="summary-value">{{ (positionsData.summary.avg_score || 0).toFixed(1) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">高风险</span>
          <span class="summary-value warning">{{ positionsData.summary.high_risk_count || 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">BUY推荐</span>
          <span class="summary-value buy">{{ positionsData.summary.buy_recommendation_count || 0 }}</span>
        </div>
      </section>

      <!-- 持仓列表 -->
      <section class="positions-grid">
        <PositionScoreCard
          v-for="position in positionsData.positions"
          :key="position.symbol"
          :symbol="position.symbol"
          :quantity="position.quantity"
          :avg-cost="position.avg_cost"
          :current-price="position.current_price"
          :unrealized-pnl="position.unrealized_pnl"
          :unrealized-pnl-percent="position.unrealized_pnl_percent"
          :budget-utilization="position.budget_utilization"
          :plan-deviation="position.plan_deviation"
          :overall-score="position.overall_score"
          :technical-score="position.technical_score"
          :fundamental-score="position.fundamental_score"
          :sentiment-score="position.sentiment_score"
          :recommendation="position.recommendation"
          :risk-level="position.risk_level"
          :trend-snapshot="position.trend_snapshot"
          :ai-advice="position.ai_advice"
          @refresh-snapshot="onRefreshSinglePosition"
        />
      </section>

      <!-- 说明指南 -->
      <PositionsGuideline />
    </div>
    <p v-else class="info-message">暂无持仓数据</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PositionScoreCard from '../components/PositionScoreCard.vue';
import PositionsGuideline from '../components/PositionsGuideline.vue';
import { 
  fetchPositionsAssessment, 
  type PositionsAssessmentResponse,
  refreshPositions
} from '../api/client';
import { appConfig } from '../config/global';

const positionsData = ref<PositionsAssessmentResponse | null>(null);
const loading = ref(false);
const errorMsg = ref('');

async function loadPositionsData() {
  loading.value = true;
  errorMsg.value = '';
  try {
    positionsData.value = await fetchPositionsAssessment(appConfig.windowDays);
  } catch (e: any) {
    console.error('加载持仓评估失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = '⏱️ 请求超时，请稍后再试！';
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = '🌐 网络连接失败，请检查网络或后端服务状态';
    } else {
      errorMsg.value = '❌ 获取持仓评估数据失败';
    }
  } finally {
    loading.value = false;
  }
}

async function onRefreshPositions() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const result = await refreshPositions();
    console.log('刷新成功:', result);
    await loadPositionsData();
  } catch (e: any) {
    console.error('刷新持仓数据失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = '⏱️ 刷新请求超时，请稍后再试！';
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = '🌐 网络连接失败，无法刷新数据';
    } else {
      errorMsg.value = '❌ 刷新持仓数据失败';
    }
  } finally {
    loading.value = false;
  }
}

async function onRefreshSinglePosition(symbol: string) {
  console.log('刷新单标的:', symbol);
  errorMsg.value = '';
  try {
    const result = await refreshPositions([symbol]);
    console.log('刷新成功:', result);
    // 重新加载数据以获取更新后的快照
    await loadPositionsData();
  } catch (e: any) {
    console.error('刷新单标的失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = `⏱️ 刷新 ${symbol} 超时，请稍后再试！`;
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = '🌐 网络连接失败，无法刷新数据';
    } else {
      errorMsg.value = `❌ 刷新 ${symbol} 失败`;
    }
  }
}

onMounted(() => {
  loadPositionsData();
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
  margin-bottom: 8px;
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

.refresh-button {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.6);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.summary-bar {
  display: flex;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 10px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
}

.summary-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e5e7eb;
}

.summary-value.profit {
  color: #22c55e;
}

.summary-value.loss {
  color: #ef4444;
}

.summary-value.warning {
  color: #f59e0b;
}

.summary-value.buy {
  color: #22c55e;
}

.positions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.error-message {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.9rem;
}

.loading-message {
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #93c5fd;
  font-size: 0.9rem;
}

.info-message {
  padding: 12px 16px;
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.3);
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  text-align: center;
}
</style>
