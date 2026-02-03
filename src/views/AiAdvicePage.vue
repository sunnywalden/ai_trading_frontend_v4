<template>
  <div class="page-container">
    <section class="section-header">
      <div>
        <h2>🤖 AI 分析</h2>
        <p>输入港美股标的，获取多周期 K 线深度走势预测与操作建议</p>
      </div>
    </section>

    <div class="main-layout">
      <!-- 左侧控制面板 -->
      <section class="panel control-panel">
        <div class="search-section">
          <label>选择标的 (港股/美股)</label>
          <div class="search-box-wrap">
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="输入代码或名称搜索，如 AAPL, 00700"
              @input="onSearchInput"
              @focus="showDropdown = true"
            />
            <div v-if="showDropdown && searchResults.length" class="search-dropdown">
              <div
                v-for="item in searchResults"
                :key="item.symbol"
                class="dropdown-item"
                @click="selectSymbol(item)"
              >
                <span class="symbol">{{ item.symbol }}</span>
                <span class="name">{{ item.name }}</span>
                <span class="market-tag">{{ item.market }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="selected-info" v-if="selectedSymbol">
          <p>当前选择：<strong>{{ selectedSymbol.symbol }}</strong> - {{ selectedSymbol.name }}</p>
          <button class="analyze-button" @click="onAnalyze" :disabled="loading">
            {{ loading ? '华尔街分析员研究中...' : '开始深度分析' }}
          </button>
        </div>
      </section>

      <!-- 右侧结果展示 -->
      <section class="analysis-results" v-if="analysisResult || loading">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>正在分析 {{ selectedSymbol?.symbol }} 的多周期 K 线趋势...</p>
        </div>

        <div v-else-if="analysisResult" class="results-card">
          <div class="card-header">
            <div class="symbol-title">
              <h3>{{ analysisResult.symbol }} 趋势预测</h3>
              <div :class="['direction-tag', (analysisResult.direction || 'NEUTRAL').toLowerCase()]">
                {{ translateDirection(analysisResult.direction) }}
              </div>
            </div>
            <div :class="['action-pill', (analysisResult.action || 'HOLD').toLowerCase()]">
              {{ translateAction(analysisResult.action) }}
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-item">
              <label>走势预测</label>
              <p>{{ analysisResult.prediction }}</p>
            </div>
            <div class="summary-item">
              <label>操作建议</label>
              <p>{{ analysisResult.suggestion }}</p>
            </div>
          </div>

          <div class="details-section">
            <label>深度逻辑分析</label>
            <div class="details-content" v-html="formattedDetails"></div>
          </div>
        </div>
      </section>
    </div>

    <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  fetchAiSymbols, 
  analyzeStockKline, 
  type StockSymbol, 
  type KlineAnalysisResponse 
} from '../api/client';

const searchQuery = ref('');
const searchResults = ref<StockSymbol[]>([]);
const selectedSymbol = ref<StockSymbol | null>(null);
const showDropdown = ref(false);
const loading = ref(false);
const analysisResult = ref<KlineAnalysisResponse | null>(null);
const errorMsg = ref('');

// 搜索防抖
let searchTimer: any = null;
function onSearchInput() {
  clearTimeout(searchTimer);
  showDropdown.value = true;
  searchTimer = setTimeout(async () => {
    try {
      const res = await fetchAiSymbols(searchQuery.value);
      searchResults.value = res.items;
    } catch (e) {
      console.error('Search failed', e);
    }
  }, 300);
}

function selectSymbol(item: StockSymbol) {
  selectedSymbol.value = item;
  searchQuery.value = item.symbol;
  showDropdown.value = false;
  searchResults.value = [];
}

async function onAnalyze() {
  if (!selectedSymbol.value) return;
  
  errorMsg.value = '';
  analysisResult.value = null;
  loading.value = true;
  
  try {
    const data = await analyzeStockKline(selectedSymbol.value.symbol);
    analysisResult.value = data;
  } catch (e: any) {
    console.error(e);
    errorMsg.value = '❌ 获取 AI 分析建议失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

const formattedDetails = computed(() => {
  if (!analysisResult.value?.details) return '';
  return analysisResult.value.details.replace(/\n/g, '<br>');
});

function translateDirection(d: string) {
  const map: any = { LONG: '看多', SHORT: '看空', NEUTRAL: '中性' };
  return map[d] || d;
}

function translateAction(a: string) {
  const map: any = { BUY: '建议买入', SELL: '建议卖出', HOLD: '维持持有', EMPTY: '建议空仓', INCREASE: '建议加仓' };
  return map[a] || a;
}

onMounted(async () => {
  // 初始加载一些热门股票
  try {
    const res = await fetchAiSymbols('');
    searchResults.value = res.items;
  } catch (e) {
    console.warn('Initial symbols fetch failed', e);
  }
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  color: #e2e8f0;
}

.section-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: #f8fafc;
}

.section-header p {
  color: #94a3b8;
  font-size: 0.95rem;
}

.main-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.control-panel {
  width: 350px;
  flex-shrink: 0;
}

.panel {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.search-section label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #38bdf8;
}

.search-box-wrap {
  position: relative;
}

.search-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 12px;
  color: #f1f5f9;
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #1e293b;
  border: 1px solid #334155;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 50;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}

.dropdown-item {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: rgba(56, 189, 248, 0.1);
}

.dropdown-item .symbol {
  font-weight: 700;
  color: #38bdf8;
  width: 70px;
}

.dropdown-item .name {
  flex: 1;
  font-size: 0.85rem;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.market-tag {
  font-size: 0.7rem;
  padding: 2px 4px;
  background: #334155;
  border-radius: 4px;
  color: #94a3b8;
}

.selected-info {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 16px;
}

.analyze-button {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  background: #38bdf8;
  color: #0f172a;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.analyze-button:hover:not(:disabled) {
  background: #7dd3fc;
  transform: translateY(-1px);
}

.analyze-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.analysis-results {
  flex: 1;
  min-width: 500px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  items-center: center;
  justify-content: center;
  padding: 60px;
  color: #94a3b8;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(56, 189, 248, 0.1);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-card {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.symbol-title h3 {
  margin: 0 0 8px 0;
  font-size: 1.4rem;
}

.direction-tag {
  display: inline-block;
  font-size: 0.8rem;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.direction-tag.long { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.direction-tag.short { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.direction-tag.neutral { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; }

.action-pill {
  padding: 10px 20px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 1rem;
}

.action-pill.buy { background: #16a34a; color: white; }
.action-pill.sell { background: #dc2626; color: white; }
.action-pill.hold { background: #4b5563; color: white; }
.action-pill.empty { background: #1e293b; color: #94a3b8; border: 1px solid #4b5563; }
.action-pill.increase { background: #059669; color: white; }

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.summary-item label {
  display: block;
  font-size: 0.75rem;
  color: #38bdf8;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.summary-item p {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.5;
}

.details-section label {
  display: block;
  font-size: 0.75rem;
  color: #38bdf8;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.details-content {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  padding: 16px;
  line-height: 1.7;
  color: #cbd5e1;
  font-size: 0.95rem;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  text-align: center;
}
</style>
