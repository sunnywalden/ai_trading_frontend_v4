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
          <!-- 标题卡片 -->
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

          <!-- 核心摘要 -->
          <div class="executive-summary">
            <div class="summary-block">
              <div class="block-icon">📊</div>
              <div class="block-content">
                <label>走势预测 (Investment Thesis)</label>
                <p>{{ analysisResult.prediction }}</p>
              </div>
            </div>
            <div class="summary-block">
              <div class="block-icon">💡</div>
              <div class="block-content">
                <label>操作建议 (Trade Recommendation)</label>
                <p>{{ analysisResult.suggestion }}</p>
              </div>
            </div>
          </div>

          <!-- 关键指标卡片 -->
          <div class="metrics-grid" v-if="parsedMetrics">
            <div class="metric-card" v-if="parsedMetrics.riskReward">
              <div class="metric-label">风险收益比</div>
              <div class="metric-value" :class="{ 'metric-good': parsedMetrics.riskReward >= 2 }">
                1:{{ parsedMetrics.riskReward.toFixed(2) }}
              </div>
              <div class="metric-sub">{{ parsedMetrics.riskReward >= 2 ? '✓ 符合标准' : '⚠️ 偏低' }}</div>
            </div>
            
            <div class="metric-card" v-if="parsedMetrics.entry">
              <div class="metric-label">入场点 (Entry)</div>
              <div class="metric-value">${{ parsedMetrics.entry.toFixed(2) }}</div>
              <div class="metric-sub">建议买入价位</div>
            </div>
            
            <div class="metric-card" v-if="parsedMetrics.stopLoss">
              <div class="metric-label">止损 (Stop Loss)</div>
              <div class="metric-value risk">${{ parsedMetrics.stopLoss.toFixed(2) }}</div>
              <div class="metric-sub">{{ parsedMetrics.stopLossPercent }}%</div>
            </div>
            
            <div class="metric-card" v-if="parsedMetrics.takeProfit">
              <div class="metric-label">止盈 (Take Profit)</div>
              <div class="metric-value reward">${{ parsedMetrics.takeProfit.toFixed(2) }}</div>
              <div class="metric-sub">+{{ parsedMetrics.takeProfitPercent }}%</div>
            </div>
            
            <div class="metric-card" v-if="parsedMetrics.position">
              <div class="metric-label">建议仓位</div>
              <div class="metric-value">{{ parsedMetrics.position }}</div>
              <div class="metric-sub">Position Size</div>
            </div>
            
            <div class="metric-card" v-if="parsedMetrics.momentum">
              <div class="metric-label">动量评分</div>
              <div class="metric-value">{{ parsedMetrics.momentum }}/100</div>
              <div class="metric-sub">Momentum Score</div>
            </div>
          </div>

          <!-- 详细分析报告 -->
          <div class="details-section">
            <div class="details-header" @click="detailsExpanded = !detailsExpanded">
              <label>📋 深度分析报告 (Detailed Analysis)</label>
              <span class="expand-icon" :class="{ expanded: detailsExpanded }">
                {{ detailsExpanded ? '▼' : '▶' }}
              </span>
            </div>
            <transition name="slide-fade">
              <div v-show="detailsExpanded" class="details-content" v-html="formattedDetails"></div>
            </transition>
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
const detailsExpanded = ref(true); // 默认展开详细分析

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

// 解析关键指标（从details或suggestion中提取）
const parsedMetrics = computed(() => {
  if (!analysisResult.value) return null;
  
  const details = analysisResult.value.details || '';
  const suggestion = analysisResult.value.suggestion || '';
  const combinedText = details + ' ' + suggestion;
  
  const metrics: any = {};
  
  // 提取 Entry 价格
  const entryMatch = combinedText.match(/Entry[：:]\s*\$?([\d,.]+)/i);
  if (entryMatch) {
    metrics.entry = parseFloat(entryMatch[1].replace(/,/g, ''));
  }
  
  // 提取 Stop Loss 价格和百分比
  const slMatch = combinedText.match(/(?:Stop Loss|SL)[：:]\s*\$?([\d,.]+)(?:\s*\(([+-]?[\d.]+)%\))?/i);
  if (slMatch) {
    metrics.stopLoss = parseFloat(slMatch[1].replace(/,/g, ''));
    if (slMatch[2]) {
      metrics.stopLossPercent = slMatch[2];
    } else if (metrics.entry) {
      metrics.stopLossPercent = (((metrics.stopLoss - metrics.entry) / metrics.entry) * 100).toFixed(1);
    }
  }
  
  // 提取 Take Profit 价格和百分比
  const tpMatch = combinedText.match(/(?:Take Profit|TP)[：:]\s*\$?([\d,.]+)(?:\s*\(([+-]?[\d.]+)%\))?/i);
  if (tpMatch) {
    metrics.takeProfit = parseFloat(tpMatch[1].replace(/,/g, ''));
    if (tpMatch[2]) {
      metrics.takeProfitPercent = tpMatch[2].replace('+', '');
    } else if (metrics.entry) {
      metrics.takeProfitPercent = (((metrics.takeProfit - metrics.entry) / metrics.entry) * 100).toFixed(1);
    }
  }
  
  // 提取 R:R 比率
  const rrMatch = combinedText.match(/[Rr]:?[Rr]\s*(?:比率|Ratio)?[：:]?\s*1[：:]?([\d.]+)/);
  if (rrMatch) {
    metrics.riskReward = parseFloat(rrMatch[1]);
  }
  
  // 提取仓位建议
  const positionMatch = combinedText.match(/(?:建议仓位|Position Size)[：:]?\s*([^\n]+?)(?:\n|$)/i);
  if (positionMatch) {
    metrics.position = positionMatch[1].trim();
  } else {
    // 尝试提取百分比格式
    const pctMatch = suggestion.match(/([\d]+-?[\d]*%)/);
    if (pctMatch) {
      metrics.position = pctMatch[1];
    }
  }
  
  // 提取动量评分
  const momentumMatch = combinedText.match(/(?:动量评分|Momentum)[：:]?\s*([\d]+)\/100/i);
  if (momentumMatch) {
    metrics.momentum = parseInt(momentumMatch[1]);
  }
  
  return Object.keys(metrics).length > 0 ? metrics : null;
});

const formattedDetails = computed(() => {
  if (!analysisResult.value?.details) return '';
  
  let html = analysisResult.value.details;
  
  // 将换行符转换为 <br>
  html = html.replace(/\n/g, '<br>');
  
  // 高亮标题（以 ** 或数字开头的行）
  html = html.replace(/\*\*\s*([^*]+?)\s*\*\*/g, '<strong class="section-title">$1</strong>');
  
  // 高亮小节标题（数字. 开头）
  html = html.replace(/(\d+\.[\s]*[^<br>]+)/g, '<div class="subsection-title">$1</div>');
  
  // 高亮警告符号
  html = html.replace(/(⚠️|✓|❌)/g, '<span class="icon">$1</span>');
  
  // 高亮价格
  html = html.replace(/\$[\d,.]+/g, '<span class="price">$&</span>');
  
  // 高亮百分比
  html = html.replace(/([+-]?[\d.]+%)/g, '<span class="percentage">$1</span>');
  
  return html;
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
  min-width: 600px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.1);
}

.symbol-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.symbol-title h3 {
  margin: 0;
  font-size: 1.5rem;
}

.direction-tag {
  display: inline-block;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
  text-transform: uppercase;
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

/* 核心摘要块 */
.executive-summary {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.1);
}

.summary-block {
  display: flex;
  gap: 16px;
  background: rgba(15, 23, 42, 0.5);
  padding: 14px;
  border-radius: 10px;
  border-left: 3px solid #38bdf8;
  transition: all 0.2s ease;
}

.summary-block:hover {
  background: rgba(15, 23, 42, 0.7);
  border-left-color: #7dd3fc;
}

.block-icon {
  font-size: 1.6rem;
  flex-shrink: 0;
  opacity: 0.9;
}

.block-content {
  flex: 1;
}

.block-content label {
  display: block;
  font-size: 0.75rem;
  color: #38bdf8;
  margin-bottom: 6px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.block-content p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #e2e8f0;
}

/* 关键指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, rgba(30, 41, 59, 0.5) 100%);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 6px 16px rgba(56, 189, 248, 0.2);
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(30, 41, 59, 0.6) 100%);
}

.metric-label {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-bottom: 6px;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.metric-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 3px;
  line-height: 1.2;
}

.metric-value.metric-good {
  color: #4ade80;
}

.metric-value.risk {
  color: #f87171;
}

.metric-value.reward {
  color: #4ade80;
}

.metric-sub {
  font-size: 0.68rem;
  color: #64748b;
  line-height: 1.3;
}

/* 详细分析报告 */
.details-section {
  margin-top: 24px;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 8px 0;
  user-select: none;
  transition: all 0.2s ease;
}

.details-header:hover {
  opacity: 0.8;
}

.details-section label {
  display: block;
  font-size: 0.85rem;
  color: #38bdf8;
  font-weight: 600;
  margin: 0;
}

.expand-icon {
  font-size: 0.7rem;
  color: #38bdf8;
  transition: transform 0.3s ease;
}

.expand-icon.expanded {
  transform: rotate(0deg);
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.details-content {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.1);
  border-radius: 8px;
  padding: 18px;
  line-height: 1.65;
  color: #cbd5e1;
  font-size: 0.82rem;
  max-height: 500px;
  overflow-y: auto;
  margin-top: 12px;
}

.details-content::-webkit-scrollbar {
  width: 6px;
}

.details-content::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.4);
  border-radius: 3px;
}

.details-content::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.3);
  border-radius: 3px;
}

.details-content::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.5);
}

/* 详细内容中的样式 */
.details-content :deep(.section-title) {
  display: block;
  color: #38bdf8;
  font-size: 0.92rem;
  margin: 14px 0 8px 0;
  font-weight: 700;
  padding-top: 8px;
  border-top: 1px solid rgba(56, 189, 248, 0.1);
}

.details-content :deep(.section-title:first-child) {
  border-top: none;
  padding-top: 0;
  margin-top: 0;
}

.details-content :deep(.subsection-title) {
  color: #7dd3fc;
  font-weight: 600;
  font-size: 0.84rem;
  margin: 10px 0 6px 0;
  display: block;
}

.details-content :deep(.icon) {
  font-size: 1em;
  margin-right: 3px;
}

.details-content :deep(.price) {
  color: #fbbf24;
  font-weight: 600;
  font-size: 0.85rem;
}

.details-content :deep(.percentage) {
  color: #a78bfa;
  font-weight: 600;
  font-size: 0.85rem;
}

.details-content :deep(br) {
  display: block;
  content: '';
  margin: 4px 0;
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

@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
  }
  
  .control-panel {
    width: 100%;
  }
  
  .analysis-results {
    min-width: 100%;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}
</style>
