<template>
  <div class="page-container">
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2>📊 {{ $t('positions.title') }}</h2>
          <p>{{ $t('positions.subtitle') }}</p>
        </div>
        <button class="refresh-button" @click="onRefreshPositions" :disabled="loading">
          {{ loading ? $t('positions.refreshing') : $t('positions.refresh') }}
        </button>
      </div>
    </section>

    <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
    <p v-else-if="loading" class="loading-message">{{ $t('positions.loading') }}</p>
    
    <div v-else-if="positionsData">
      <!-- V10.1: US/HK 市场过滤标签 -->
      <div class="market-filter-bar" v-if="hasHkPositions">
        <button
          v-for="tab in marketTabs"
          :key="tab.key"
          class="market-tab"
          :class="{ active: marketFilter === tab.key }"
          @click="marketFilter = tab.key"
        >
          {{ tab.label }}
          <span class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- 汇总信息 -->
      <section class="summary-bar">
        <div class="summary-item">
          <span class="summary-label">{{ $t('positions.summary.total_positions') }}</span>
          <span class="summary-value">{{ positionsData.summary.total_positions || 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ $t('positions.summary.total_value') }}</span>
          <span class="summary-value">${{ (positionsData.summary.total_value || 0).toLocaleString() }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ $t('positions.summary.total_pnl') }}</span>
          <span class="summary-value" :class="(positionsData.summary.total_pnl || 0) >= 0 ? 'profit' : 'loss'">
            ${{ (positionsData.summary.total_pnl || 0).toLocaleString() }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ $t('positions.summary.avg_score') }}</span>
          <span class="summary-value">{{ (positionsData.summary.avg_score || 0).toFixed(1) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ $t('positions.summary.high_risk') }}</span>
          <span class="summary-value warning">{{ positionsData.summary.high_risk_count || 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ $t('positions.summary.buy_recommendation') }}</span>
          <span class="summary-value buy">{{ positionsData.summary.buy_recommendation_count || 0 }}</span>
        </div>
      </section>

      <!-- 组合分析仪表盘 -->
      <PortfolioDashboard 
        v-if="positionsData.portfolio_analysis"
        :analysis="positionsData.portfolio_analysis"
        :recommendations="positionsData.ai_recommendations || []"
      />

      <!-- 持仓列表 -->
      <section class="positions-grid">
        <PositionScoreCard
          v-for="position in filteredPositions"
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
    <p v-else class="info-message">{{ $t('positions.empty') }}</p>

    <!-- V10.4.4 DB Positions section -->
    <section v-if="dbPositions.length > 0 || dbLoading" class="db-positions-section">
      <div class="db-section-header">
        <span>🗄️ 生命周期仓位 (V10.4.4)</span>
        <span class="db-badge">{{ dbPositions.length }} 活跃</span>
      </div>
      <div v-if="dbLoading" class="loading-message">加载中…</div>
      <div v-else class="db-positions-grid">
        <div
          v-for="pos in dbPositions"
          :key="pos.id"
          class="db-position-card"
          @click="openDetail(pos.id)"
        >
          <div class="db-pos-sym">{{ pos.symbol }}</div>
          <div class="db-pos-status" :class="`status-${pos.status.toLowerCase()}`">{{ pos.status }}</div>
          <div class="db-pos-qty">数量: {{ pos.open_qty }}</div>
          <div class="db-pos-pnl" v-if="pos.unrealized_pnl_pct != null">
            {{ pos.unrealized_pnl_pct >= 0 ? '+' : '' }}{{ (pos.unrealized_pnl_pct * 100).toFixed(2) }}%
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
    fetchPositionsAssessment,
    type PositionsAssessmentResponse,
    refreshPositions
} from '../api/client';
import PortfolioDashboard from '../components/PortfolioDashboard.vue';
import PositionScoreCard from '../components/PositionScoreCard.vue';
import PositionsGuideline from '../components/PositionsGuideline.vue';
import { appConfig } from '../config/global';

const { t } = useI18n();
const positionsData = ref<PositionsAssessmentResponse | null>(null);
const loading = ref(false);
const errorMsg = ref('');

// V10.1: US/HK 市场过滤
type MarketFilter = 'all' | 'us' | 'hk'
const marketFilter = ref<MarketFilter>('all')

function isHkSymbol(symbol: string): boolean {
  const s = symbol.trim().toUpperCase()
  if (s.endsWith('.HK')) return true
  if (s.endsWith('HK')) {
    const core = s.slice(0, -2)
    return /^\d{1,5}$/.test(core)
  }
  return /^\d{1,5}$/.test(s)
}

const hasHkPositions = computed(() =>
  (positionsData.value?.positions ?? []).some(p => isHkSymbol(p.symbol))
)

const filteredPositions = computed(() => {
  const all = positionsData.value?.positions ?? []
  if (marketFilter.value === 'hk') return all.filter(p => isHkSymbol(p.symbol))
  if (marketFilter.value === 'us') return all.filter(p => !isHkSymbol(p.symbol))
  return all
})

const marketTabs = computed(() => {
  const all = positionsData.value?.positions ?? []
  const hkCount = all.filter(p => isHkSymbol(p.symbol)).length
  const usCount = all.length - hkCount
  return [
    { key: 'all' as MarketFilter, label: '全部', count: all.length },
    { key: 'us' as MarketFilter, label: '🇺🇸 美股', count: usCount },
    { key: 'hk' as MarketFilter, label: '🇭🇰 港股', count: hkCount },
  ]
})

async function loadPositionsData() {
  loading.value = true;
  errorMsg.value = '';
  try {
    positionsData.value = await fetchPositionsAssessment(appConfig.windowDays);
  } catch (e: any) {
    console.error('加载持仓评估失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = t('positions.error_timeout');
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = t('positions.error_network');
    } else {
      errorMsg.value = t('positions.error_generic');
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
      errorMsg.value = t('positions.refresh_error_timeout');
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = t('positions.refresh_error_network');
    } else {
      errorMsg.value = t('positions.refresh_error_generic');
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
      errorMsg.value = t('positions.single_refresh_timeout', { symbol });
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = t('positions.refresh_error_network');
    } else {
      errorMsg.value = t('positions.single_refresh_error', { symbol });
    }
  }
}

onMounted(() => {
  loadPositionsData();
  loadDbPositions();
});

// ── V10.4.4 DB Positions ─────────────────────────────────────────────────────
import { useLifecycleStore } from '@/stores/lifecycle';
import { useQuantLoopStore } from '@/stores/quantLoop';
import type { Position } from '@/types/position';

const lifecycleStore = useLifecycleStore()
const quantLoopStore = useQuantLoopStore()
const dbPositions = ref<Position[]>([])
const dbLoading   = ref(false)

async function loadDbPositions() {
  const accountId = quantLoopStore.systemStatus?.account_id
  if (!accountId) return
  dbLoading.value = true
  try {
    await lifecycleStore.fetchPositions(accountId)
    dbPositions.value = lifecycleStore.positions
  } finally {
    dbLoading.value = false
  }
}

function openDetail(positionId: number) {
  lifecycleStore.openPositionDetail(positionId)
}
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

.market-filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}
.market-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--border-color, #2d2d4e);
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.market-tab.active {
  background: rgba(56, 189, 248, 0.1);
  border-color: #38bdf8;
  color: #38bdf8;
}
.tab-count {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 11px;
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

/* V10.4.4 DB positions section */
.db-positions-section {
  padding: 16px 20px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 10px;
}

.db-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #a5b4fc;
  margin-bottom: 12px;
}

.db-badge {
  font-size: 10px;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  padding: 1px 8px;
  border-radius: 10px;
  border: 1px solid rgba(99, 102, 241, 0.35);
}

.db-positions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

.db-position-card {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.db-position-card:hover {
  border-color: rgba(99, 102, 241, 0.5);
}

.db-pos-sym {
  font-size: 14px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.db-pos-status {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.status-active     { color: #34d399; }
.status-exception  { color: #f87171; }
.status-closing    { color: #fb923c; }
.status-pending    { color: #94a3b8; }
.status-closed     { color: #6b7280; }
.status-liquidated { color: #ef4444; }

.db-pos-qty {
  font-size: 11px;
  color: #9ca3af;
}

.db-pos-pnl {
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
  color: #34d399;
}
</style>
