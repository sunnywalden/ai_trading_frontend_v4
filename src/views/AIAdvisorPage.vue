<template>
  <div class="ai-advisor">
    <!-- 页面标题 -->
    <header class="page-header">
      <div class="title-row">
        <h1><span class="icon">🧠</span> AI 交易决策</h1>
        <p class="subtitle">输入标的 → AI 多维评估 → 智能下单</p>
      </div>
    </header>

    <!-- Step 1: 输入标的 -->
    <section class="input-section card">
      <div class="section-header">
        <span class="step-badge">1</span>
        <h2>选择标的</h2>
      </div>
      <div class="input-row">
        <div class="symbol-input-wrap">
          <input
            v-model="symbolInput"
            type="text"
            placeholder="输入股票代码，多个用逗号分隔，如: AAPL, TSLA, NVDA"
            class="symbol-input"
            @keydown.enter="startEvaluation"
          />
        </div>
        <button
          class="btn btn-primary btn-evaluate"
          @click="startEvaluation"
          :disabled="evaluating || !symbolInput.trim()"
        >
          <span v-if="evaluating" class="spinner"></span>
          {{ evaluating ? 'AI 评估中...' : '🔍 AI 评估' }}
        </button>
      </div>
      <div class="quick-tags">
        <span class="tag-label">热门:</span>
        <button v-for="s in hotSymbols" :key="s" class="tag" @click="addSymbol(s)">{{ s }}</button>
      </div>
    </section>

    <!-- Step 2: AI 评估结果 -->
    <section v-if="evaluations.length > 0" class="results-section">
      <div class="section-header">
        <span class="step-badge">2</span>
        <h2>AI 评估结果</h2>
        <div class="header-actions">
          <button
            class="btn btn-sm btn-success"
            @click="executeSelected"
            :disabled="selectedSymbols.length === 0 || executing"
          >
            {{ executing ? '执行中...' : `⚡ 执行选中 (${selectedSymbols.length})` }}
          </button>
        </div>
      </div>

      <div class="eval-grid">
        <div
          v-for="ev in evaluations"
          :key="ev.symbol"
          class="eval-card"
          :class="[
            ev.decision?.action === 'BUY' ? 'card-buy' :
            ev.decision?.action === 'SELL' ? 'card-sell' :
            ev.decision?.action === 'AVOID' ? 'card-avoid' : 'card-hold',
            { selected: isSelected(ev.symbol) }
          ]"
          @click="toggleSelect(ev.symbol)"
        >
          <!-- 卡片头部 -->
          <div class="eval-header">
            <div class="symbol-info">
              <input
                type="checkbox"
                :checked="isSelected(ev.symbol)"
                @click.stop="toggleSelect(ev.symbol)"
                :disabled="ev.decision?.action === 'HOLD' || ev.decision?.action === 'AVOID'"
              />
              <span class="symbol-name">{{ ev.symbol }}</span>
              <span class="price" v-if="ev.current_price">${{ ev.current_price.toFixed(2) }}</span>
            </div>
            <div class="decision-badge" :class="'badge-' + (ev.decision?.action || 'hold').toLowerCase()">
              {{ actionLabel(ev.decision?.action) }}
            </div>
          </div>

          <!-- AI 决策核心 -->
          <div class="decision-core" v-if="ev.decision">
            <div class="confidence-bar">
              <div class="confidence-fill" :style="{ width: ev.decision.confidence + '%' }" :class="confidenceClass(ev.decision.confidence)"></div>
              <span class="confidence-text">置信度 {{ ev.decision.confidence }}%</span>
            </div>
            
            <!-- 专业指标矩阵 (类似 K线分析页) -->
            <div class="metrics-grid">
              <div class="metric-card" v-if="ev.decision.risk_reward_ratio">
                <div class="metric-label">风险收益比</div>
                <div class="metric-value highlight">{{ ev.decision.risk_reward_ratio }}</div>
              </div>
              <div class="metric-card" v-if="ev.decision.entry_price">
                <div class="metric-label">入场价</div>
                <div class="metric-value">${{ Number(ev.decision.entry_price).toFixed(2) }}</div>
              </div>
              <div class="metric-card" v-if="ev.decision.stop_loss">
                <div class="metric-label">止损</div>
                <div class="metric-value text-red">${{ Number(ev.decision.stop_loss).toFixed(2) }}</div>
              </div>
              <div class="metric-card" v-if="ev.decision.take_profit">
                <div class="metric-label">止盈</div>
                <div class="metric-value text-green">${{ Number(ev.decision.take_profit).toFixed(2) }}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">建议仓位</div>
                <div class="metric-value">{{ ((ev.decision.position_pct || 0) * 100).toFixed(0) }}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">风险等级</div>
                <div class="metric-value" :class="'risk-' + (ev.decision.risk_level || 'medium').toLowerCase()">
                  {{ riskLabel(ev.decision.risk_level) }}
                </div>
              </div>
            </div>

            <!-- 方向与持有期 -->
            <div class="direction-info">
              <span class="direction-badge" :class="'dir-' + (ev.decision.direction || '').toLowerCase()">
                {{ dirLabel(ev.decision.direction) }}
              </span>
              <span class="holding-period" v-if="ev.decision.holding_period">
                📅 持有周期: {{ ev.decision.holding_period }}
              </span>
            </div>
          </div>

          <!-- AI 推理 -->
          <div class="reasoning" v-if="ev.decision?.reasoning">
            <p>{{ ev.decision.reasoning }}</p>
          </div>

          <!-- 情景分析 (Scenarios) -->
          <div class="scenarios-section" v-if="ev.decision?.scenarios">
            <h4>📊 情景分析</h4>
            <div class="scenario-grid">
              <div class="scenario-card bullish" v-if="ev.decision.scenarios.bull">
                <div class="scenario-header">
                  <span class="scenario-icon">🐂</span>
                  <span class="scenario-title">牛市情景</span>
                  <span class="scenario-prob">{{ ev.decision.scenarios.bull.probability }}%</span>
                </div>
                <div class="scenario-details">
                  <div v-if="ev.decision.scenarios.bull.target">目标: ${{ Number(ev.decision.scenarios.bull.target).toFixed(2) }}</div>
                  <div v-if="ev.decision.scenarios.bull.upside" class="text-green">上涨空间: {{ ev.decision.scenarios.bull.upside }}</div>
                </div>
              </div>
              <div class="scenario-card bearish" v-if="ev.decision.scenarios.bear">
                <div class="scenario-header">
                  <span class="scenario-icon">🐻</span>
                  <span class="scenario-title">熊市情景</span>
                  <span class="scenario-prob">{{ ev.decision.scenarios.bear.probability }}%</span>
                </div>
                <div class="scenario-details">
                  <div v-if="ev.decision.scenarios.bear.support">支撑: ${{ Number(ev.decision.scenarios.bear.support).toFixed(2) }}</div>
                  <div v-if="ev.decision.scenarios.bear.downside" class="text-red">下跌风险: {{ ev.decision.scenarios.bear.downside }}</div>
                </div>
              </div>
              <div class="scenario-card neutral" v-if="ev.decision.scenarios.neutral">
                <div class="scenario-header">
                  <span class="scenario-icon">⚖️</span>
                  <span class="scenario-title">中性情景</span>
                  <span class="scenario-prob">{{ ev.decision.scenarios.neutral.probability }}%</span>
                </div>
                <div class="scenario-details">
                  <div v-if="ev.decision.scenarios.neutral.range">{{ ev.decision.scenarios.neutral.range }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 催化剂 (Catalysts) -->
          <div class="catalysts-section" v-if="ev.decision?.catalysts">
            <h4>🔥 催化剂与驱动因素</h4>
            <div class="catalyst-item" v-if="ev.decision.catalysts.short_term">
              <span class="catalyst-label">短期 (1-2周)</span>
              <span class="catalyst-content">{{ ev.decision.catalysts.short_term }}</span>
            </div>
            <div class="catalyst-item" v-if="ev.decision.catalysts.mid_term">
              <span class="catalyst-label">中长期 (1-6月)</span>
              <span class="catalyst-content">{{ ev.decision.catalysts.mid_term }}</span>
            </div>
          </div>

          <!-- 关键因子标签 -->
          <div class="key-factors" v-if="ev.decision?.key_factors?.length">
            <span v-for="f in ev.decision.key_factors" :key="f" class="factor-tag">{{ f }}</span>
          </div>

          <!-- 多维评分 -->
          <div class="dimension-scores" v-if="ev.dimensions">
            <div class="dim" v-if="ev.dimensions.technical?.score != null">
              <span class="dim-label">技术面</span>
              <div class="dim-bar">
                <div class="dim-fill" :style="{ width: ev.dimensions.technical.score + '%' }" :class="scoreClass(ev.dimensions.technical.score)"></div>
              </div>
              <span class="dim-val">{{ ev.dimensions.technical.score }}</span>
            </div>
            <div class="dim" v-if="ev.dimensions.fundamental?.score != null">
              <span class="dim-label">基本面</span>
              <div class="dim-bar">
                <div class="dim-fill" :style="{ width: ev.dimensions.fundamental.score + '%' }" :class="scoreClass(ev.dimensions.fundamental.score)"></div>
              </div>
              <span class="dim-val">{{ ev.dimensions.fundamental.score }}</span>
            </div>
            <div class="dim" v-if="ev.dimensions.kline?.direction">
              <span class="dim-label">K线趋势</span>
              <span class="dim-val" :class="'dir-' + (ev.dimensions.kline.direction || '').toLowerCase()">
                {{ dirLabel(ev.dimensions.kline.direction) }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="card-actions">
            <button
              v-if="ev.decision?.action === 'BUY' || ev.decision?.action === 'SELL'"
              class="btn btn-sm btn-execute"
              @click.stop="executeSingle(ev)"
              :disabled="executing"
            >
              ⚡ 立即执行
            </button>
            <button
              v-if="ev.decision?.action !== 'AVOID'"
              class="btn btn-sm btn-plan"
              @click.stop="createPlanFromDecision(ev)"
            >
              📋 存为计划
            </button>
          </div>

          <!-- 错误状态 -->
          <div v-if="ev.status === 'error'" class="eval-error">
            ⚠️ {{ ev.error }}
          </div>
        </div>
      </div>
    </section>

    <!-- Step 3: 交易计划管理 -->
    <section class="plans-section card">
      <div class="section-header">
        <span class="step-badge">3</span>
        <h2>交易计划</h2>
        <div class="header-actions">
          <button class="btn btn-sm btn-outline" @click="loadPlans">🔄 刷新</button>
        </div>
      </div>

      <div v-if="plans.length === 0" class="empty-state">
        <p>暂无交易计划。通过 AI 评估后可一键创建。</p>
      </div>

      <table v-else class="plans-table">
        <thead>
          <tr>
            <th>标的</th>
            <th>入场价</th>
            <th>止损</th>
            <th>止盈</th>
            <th>仓位</th>
            <th>状态</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plan in plans" :key="plan.id" :class="'status-' + (plan.plan_status || '').toLowerCase()">
            <td class="symbol-col">{{ plan.symbol }}</td>
            <td>${{ plan.entry_price?.toFixed(2) }}</td>
            <td class="text-red">${{ plan.stop_loss?.toFixed(2) }}</td>
            <td class="text-green">${{ plan.take_profit?.toFixed(2) }}</td>
            <td>{{ ((plan.target_position || 0) * 100).toFixed(0) }}%</td>
            <td>
              <span class="status-tag" :class="'st-' + (plan.plan_status || '').toLowerCase()">
                {{ statusLabel(plan.plan_status) }}
              </span>
            </td>
            <td class="notes-col">{{ plan.notes || '-' }}</td>
            <td class="actions-col">
              <button
                v-if="plan.plan_status === 'ACTIVE'"
                class="btn btn-xs btn-execute"
                @click="executePlan(plan.id)"
              >执行</button>
              <button
                v-if="plan.plan_status === 'ACTIVE'"
                class="btn btn-xs btn-cancel"
                @click="cancelPlan(plan.id)"
              >取消</button>
              <button
                class="btn btn-xs btn-danger"
                @click="deletePlan(plan.id)"
              >删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Step 4: 评估历史 -->
    <section class="history-section card">
      <div class="section-header">
        <span class="step-badge">4</span>
        <h2>评估历史</h2>
        <div class="header-actions">
          <button class="btn btn-sm btn-outline" @click="loadHistory">🔄 刷新</button>
        </div>
      </div>

      <div v-if="historyLoading" class="loading-placeholder">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else-if="evaluationHistory.length === 0" class="empty-state">
        <p>暂无评估历史。完成 AI 评估后会自动保存。</p>
      </div>

      <div v-else class="history-grid">
        <div
          v-for="record in evaluationHistory"
          :key="record.id"
          class="history-card"
          :class="'action-' + (record.action || 'hold').toLowerCase()"
        >
          <div class="history-header">
            <div class="history-symbol">
              <span class="symbol">{{ record.symbol }}</span>
              <span class="price" v-if="record.current_price">${{ record.current_price.toFixed(2) }}</span>
            </div>
            <div class="history-actions">
              <span class="timestamp">{{ formatTime(record.created_at) }}</span>
              <button class="btn-icon btn-delete" @click="deleteHistoryRecord(record.id)" title="删除">
                🗑️
              </button>
            </div>
          </div>

          <div class="history-decision">
            <span class="action-badge" :class="'badge-' + (record.action || 'hold').toLowerCase()">
              {{ actionLabel(record.action) }}
            </span>
            <span class="confidence-badge" :class="confidenceClass(record.confidence || 0)">
              置信度 {{ record.confidence }}%
            </span>
          </div>

          <div class="history-metrics" v-if="record.entry_price">
            <div class="metric-item">
              <span class="label">入场</span>
              <span class="value">${{ record.entry_price.toFixed(2) }}</span>
            </div>
            <div class="metric-item" v-if="record.stop_loss">
              <span class="label">止损</span>
              <span class="value text-red">${{ record.stop_loss.toFixed(2) }}</span>
            </div>
            <div class="metric-item" v-if="record.take_profit">
              <span class="label">止盈</span>
              <span class="value text-green">${{ record.take_profit.toFixed(2) }}</span>
            </div>
            <div class="metric-item" v-if="record.position_pct">
              <span class="label">仓位</span>
              <span class="value">{{ (record.position_pct * 100).toFixed(0) }}%</span>
            </div>
          </div>

          <div class="history-reasoning" v-if="record.reasoning">
            <p class="reasoning-text">{{ record.reasoning }}</p>
          </div>

          <div class="history-extras" v-if="record.risk_reward_ratio || record.holding_period">
            <span class="extra-tag" v-if="record.risk_reward_ratio">
              R:R {{ record.risk_reward_ratio }}
            </span>
            <span class="extra-tag" v-if="record.holding_period">
              📅 {{ record.holding_period }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { client } from '../api/client';

// === State ===
const symbolInput = ref('');
const evaluating = ref(false);
const executing = ref(false);
const evaluations = ref<any[]>([]);
const selectedSymbols = ref<string[]>([]);
const plans = ref<any[]>([]);
const evaluationHistory = ref<any[]>([]);
const historyLoading = ref(false);

const hotSymbols = ['AAPL', 'TSLA', 'NVDA', 'META', 'AMZN', 'MSFT', 'GOOGL'];

// === Methods ===
function addSymbol(sym: string) {
  const current = symbolInput.value.split(',').map(s => s.trim()).filter(Boolean);
  if (!current.includes(sym)) {
    current.push(sym);
    symbolInput.value = current.join(', ');
  }
}

async function startEvaluation() {
  const symbols = symbolInput.value
    .split(/[,，\s]+/)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) return;

  evaluating.value = true;
  evaluations.value = [];
  selectedSymbols.value = [];

  try {
    const { data } = await client.post('/v1/ai-advisor/evaluate', { symbols }, {
      timeout: Number(import.meta.env.VITE_AI_EVALUATE_TIMEOUT_MS) || 180000
    });
    evaluations.value = data.evaluations || [];

    // 自动选中 AI 建议 BUY/SELL 的标的
    selectedSymbols.value = evaluations.value
      .filter(e => e.decision?.action === 'BUY' || e.decision?.action === 'SELL')
      .map(e => e.symbol);
    
    // 评估成功后刷新历史记录
    await loadHistory();
  } catch (err: any) {
    alert('AI 评估失败: ' + (err.response?.data?.detail || err.message));
  } finally {
    evaluating.value = false;
  }
}

function isSelected(sym: string) {
  return selectedSymbols.value.includes(sym);
}

function toggleSelect(sym: string) {
  const ev = evaluations.value.find(e => e.symbol === sym);
  if (ev?.decision?.action === 'HOLD' || ev?.decision?.action === 'AVOID') return;

  const idx = selectedSymbols.value.indexOf(sym);
  if (idx > -1) {
    selectedSymbols.value.splice(idx, 1);
  } else {
    selectedSymbols.value.push(sym);
  }
}

async function executeSingle(ev: any) {
  if (!confirm(`确认执行 ${ev.symbol} 的 AI 交易决策？\n方向: ${ev.decision.direction}\n仓位: ${((ev.decision.position_pct || 0) * 100).toFixed(0)}%`)) return;

  executing.value = true;
  try {
    const { data } = await client.post('/v1/ai-advisor/execute', {
      items: [{ symbol: ev.symbol, decision: ev.decision }],
      execution_mode: 'LIMIT',
    });
    const r = data.results?.[0];
    alert(r?.message || '执行完成');
    await loadPlans();
  } catch (err: any) {
    alert('执行失败: ' + (err.response?.data?.detail || err.message));
  } finally {
    executing.value = false;
  }
}

async function executeSelected() {
  if (selectedSymbols.value.length === 0) return;
  if (!confirm(`确认执行 ${selectedSymbols.value.length} 个标的的 AI 决策？`)) return;

  executing.value = true;
  try {
    const items = selectedSymbols.value.map(sym => {
      const ev = evaluations.value.find(e => e.symbol === sym);
      return { symbol: sym, decision: ev?.decision };
    }).filter(i => i.decision);

    const { data } = await client.post('/v1/ai-advisor/execute', {
      items,
      execution_mode: 'LIMIT',
    });
    alert(`执行完成！成功: ${data.success}, 失败: ${data.failed}, 跳过: ${data.skipped}`);
    selectedSymbols.value = [];
    await loadPlans();
  } catch (err: any) {
    alert('批量执行失败: ' + (err.response?.data?.detail || err.message));
  } finally {
    executing.value = false;
  }
}

async function createPlanFromDecision(ev: any) {
  if (!ev.decision) return;
  executing.value = true;
  try {
    const { data } = await client.post('/v1/ai-advisor/execute', {
      items: [{ symbol: ev.symbol, decision: ev.decision }],
      execution_mode: 'PLAN',
    });
    const r = data.results?.[0];
    alert(r?.message || '计划已创建');
    await loadPlans();
  } catch (err: any) {
    alert('创建计划失败: ' + (err.response?.data?.detail || err.message));
  } finally {
    executing.value = false;
  }
}

async function loadPlans() {
  try {
    const { data } = await client.get('/v1/ai-advisor/plans', { params: { page: 1, page_size: 100 } });
    plans.value = data.plans || data.items || [];
  } catch (err) {
    console.error('加载计划失败:', err);
  }
}

async function executePlan(planId: number) {
  if (!confirm('确认执行该交易计划？')) return;
  try {
    await client.post(`/v1/ai-advisor/plans/${planId}/execute`);
    alert('计划执行成功');
    await loadPlans();
  } catch (err: any) {
    alert('执行失败: ' + (err.response?.data?.detail || err.message));
  }
}

async function cancelPlan(planId: number) {
  if (!confirm('确认取消该交易计划？')) return;
  try {
    await client.post(`/v1/ai-advisor/plans/${planId}/cancel`);
    alert('计划已取消');
    await loadPlans();
  } catch (err: any) {
    alert('取消失败: ' + (err.response?.data?.detail || err.message));
  }
}

async function deletePlan(planId: number) {
  if (!confirm('确认删除？不可恢复。')) return;
  try {
    await client.delete(`/v1/ai-advisor/plans/${planId}`);
    await loadPlans();
  } catch (err: any) {
    alert('删除失败: ' + (err.response?.data?.detail || err.message));
  }
}

// === Label Helpers ===
function actionLabel(action?: string) {
  return { BUY: '🟢 买入', SELL: '🔴 卖出', HOLD: '⏸ 观望', AVOID: '🚫 回避' }[action || 'HOLD'] || action;
}
function dirLabel(dir?: string) {
  return { LONG: '做多 ↑', SHORT: '做空 ↓', NEUTRAL: '中性 —' }[dir || 'NEUTRAL'] || dir;
}
function riskLabel(level?: string) {
  return { LOW: '低风险', MEDIUM: '中风险', HIGH: '高风险' }[level || 'MEDIUM'] || level;
}
function statusLabel(status?: string) {
  return { ACTIVE: '待执行', EXECUTED: '已执行', CANCELLED: '已取消', FAILED: '失败', EXPIRED: '已过期' }[status || 'ACTIVE'] || status;
}
function confidenceClass(c: number) {
  if (c >= 70) return 'conf-high';
  if (c >= 50) return 'conf-mid';
  return 'conf-low';
}
function scoreClass(s: number) {
  if (s >= 70) return 'score-high';
  if (s >= 50) return 'score-mid';
  return 'score-low';
}

// === 历史记录管理 ===
async function loadHistory() {
  historyLoading.value = true;
  try {
    const { data } = await client.get('/v1/ai-advisor/history', {
      params: { limit: 50 }
    });
    evaluationHistory.value = data.history || [];
  } catch (err) {
    console.error('加载评估历史失败:', err);
  } finally {
    historyLoading.value = false;
  }
}

async function deleteHistoryRecord(recordId: number) {
  if (!confirm('确认删除该评估记录？')) return;
  
  try {
    await client.delete(`/v1/ai-advisor/history/${recordId}`);
    // 从列表中移除
    evaluationHistory.value = evaluationHistory.value.filter(r => r.id !== recordId);
  } catch (err: any) {
    alert('删除失败: ' + (err.response?.data?.detail || err.message));
  }
}

function formatTime(timestamp?: string) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 小于1分钟
  if (diff < 60000) return '刚刚';
  // 小于1小时
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  // 小于1天
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  // 小于7天
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

onMounted(() => { 
  loadPlans(); 
  loadHistory(); 
});
</script>

<style scoped>
.ai-advisor {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  color: #e0e0e0;
}

.page-header {
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 1.6rem;
  margin: 0;
}
.page-header .icon { font-size: 1.4rem; }
.page-header .subtitle {
  color: #888;
  font-size: 0.85rem;
  margin-top: 4px;
}

.card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.section-header h2 {
  font-size: 1.1rem;
  margin: 0;
  flex: 1;
}
.step-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 0.75rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Input Section */
.input-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.symbol-input-wrap {
  flex: 1;
}
.symbol-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}
.symbol-input:focus {
  border-color: #667eea;
}
.symbol-input::placeholder { color: #666; }

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102,126,234,0.4);
}
.btn-evaluate {
  padding: 12px 24px;
  font-size: 0.95rem;
}
.btn-success {
  background: linear-gradient(135deg, #11998e, #38ef7d);
  color: #000;
}
.btn-sm { padding: 6px 12px; font-size: 0.8rem; }
.btn-xs { padding: 4px 8px; font-size: 0.75rem; }
.btn-outline {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  color: #ccc;
}
.btn-outline:hover { border-color: #667eea; color: #667eea; }
.btn-execute { background: #11998e; color: #fff; }
.btn-plan { background: rgba(102,126,234,0.2); color: #a0b4ff; border: 1px solid rgba(102,126,234,0.3); }
.btn-cancel { background: rgba(255,165,0,0.2); color: #ffa500; border: 1px solid rgba(255,165,0,0.3); }
.btn-danger { background: rgba(255,50,50,0.2); color: #ff5555; border: 1px solid rgba(255,50,50,0.3); }

.quick-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tag-label { color: #888; font-size: 0.8rem; }
.tag {
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #aaa;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tag:hover {
  background: rgba(102,126,234,0.15);
  border-color: #667eea;
  color: #a0b4ff;
}

/* Evaluation Grid */
.eval-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}

.eval-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.eval-card:hover { border-color: rgba(255,255,255,0.2); }
.eval-card.selected { border-color: #667eea; box-shadow: 0 0 0 1px #667eea; }

.card-buy { border-left: 3px solid #38ef7d; }
.card-sell { border-left: 3px solid #ff5555; }
.card-hold { border-left: 3px solid #888; }
.card-avoid { border-left: 3px solid #ff8800; opacity: 0.7; }

.eval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.symbol-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.symbol-info input[type="checkbox"] {
  accent-color: #667eea;
}
.symbol-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}
.price {
  color: #aaa;
  font-size: 0.9rem;
}

.decision-badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}
.badge-buy { background: rgba(56,239,125,0.15); color: #38ef7d; }
.badge-sell { background: rgba(255,85,85,0.15); color: #ff5555; }
.badge-hold { background: rgba(136,136,136,0.15); color: #888; }
.badge-avoid { background: rgba(255,136,0,0.15); color: #ff8800; }

/* Confidence Bar */
.confidence-bar {
  height: 20px;
  background: rgba(255,255,255,0.06);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  margin-bottom: 16px;
}
.confidence-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease-out;
}
.conf-high { background: linear-gradient(90deg, #38ef7d, #11998e); }
.conf-mid { background: linear-gradient(90deg, #f7971e, #ffd200); }
.conf-low { background: linear-gradient(90deg, #ff5555, #ff8800); }
.confidence-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 0 4px rgba(0,0,0,0.5);
}

/* 专业指标矩阵 (类似 K线分析页) */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}
.metric-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}
.metric-label {
  font-size: 0.7rem;
  color: #888;
  margin-bottom: 4px;
}
.metric-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e0e0e0;
}
.metric-value.highlight {
  color: #38ef7d;
  font-size: 1rem;
}

/* 方向与持有期 */
.direction-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
}
.direction-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}
.direction-badge.dir-long {
  background: rgba(56,239,125,0.15);
  color: #38ef7d;
}
.direction-badge.dir-short {
  background: rgba(255,85,85,0.15);
  color: #ff5555;
}
.direction-badge.dir-neutral {
  background: rgba(136,136,136,0.15);
  color: #888;
}
.holding-period {
  font-size: 0.75rem;
  color: #aaa;
}

/* 情景分析 */
.scenarios-section {
  margin: 12px 0;
  padding: 12px;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
}
.scenarios-section h4 {
  font-size: 0.85rem;
  margin: 0 0 10px 0;
  color: #ccc;
}
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}
.scenario-card {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
}
.scenario-card.bullish {
  background: rgba(56,239,125,0.05);
  border-color: rgba(56,239,125,0.2);
}
.scenario-card.bearish {
  background: rgba(255,85,85,0.05);
  border-color: rgba(255,85,85,0.2);
}
.scenario-card.neutral {
  background: rgba(136,136,136,0.05);
  border-color: rgba(136,136,136,0.2);
}
.scenario-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.scenario-icon {
  font-size: 1rem;
}
.scenario-title {
  font-size: 0.75rem;
  font-weight: 600;
  flex: 1;
}
.scenario-prob {
  font-size: 0.8rem;
  font-weight: 600;
  color: #ffd200;
}
.scenario-details {
  font-size: 0.7rem;
  color: #aaa;
  line-height: 1.4;
}

/* 催化剂 */
.catalysts-section {
  margin: 12px 0;
  padding: 12px;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
}
.catalysts-section h4 {
  font-size: 0.85rem;
  margin: 0 0 8px 0;
  color: #ccc;
}
.catalyst-item {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.75rem;
}
.catalyst-item:last-child {
  margin-bottom: 0;
}
.catalyst-label {
  font-weight: 600;
  color: #ffd200;
  min-width: 80px;
  flex-shrink: 0;
}
.catalyst-content {
  color: #aaa;
  line-height: 1.4;
}

/* Decision Params (旧版保留，以防回退) */
.decision-params {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}
.param {
  text-align: center;
}
.param label {
  display: block;
  font-size: 0.7rem;
  color: #888;
  margin-bottom: 2px;
}
.param span { font-size: 0.85rem; font-weight: 600; }

.dir-long { color: #38ef7d; }
.dir-short { color: #ff5555; }
.dir-neutral { color: #888; }
.text-red { color: #ff5555; }
.text-green { color: #38ef7d; }
.risk-low { color: #38ef7d; }
.risk-medium { color: #ffd200; }
.risk-high { color: #ff5555; }

/* Reasoning */
.reasoning {
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
}
.reasoning p {
  margin: 0;
  font-size: 0.8rem;
  color: #aaa;
  line-height: 1.4;
}

/* Key Factors */
.key-factors {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.factor-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  background: rgba(102,126,234,0.1);
  color: #a0b4ff;
  border: 1px solid rgba(102,126,234,0.2);
}

/* Dimension Scores */
.dimension-scores {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}
.dim {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dim-label {
  font-size: 0.72rem;
  color: #888;
  width: 50px;
  flex-shrink: 0;
}
.dim-bar {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  overflow: hidden;
}
.dim-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
.score-high { background: #38ef7d; }
.score-mid { background: #ffd200; }
.score-low { background: #ff5555; }
.dim-val { font-size: 0.75rem; width: 32px; text-align: right; }

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.eval-error {
  color: #ff8800;
  font-size: 0.8rem;
  padding: 8px;
  background: rgba(255,136,0,0.1);
  border-radius: 6px;
}

/* Plans Table */
.plans-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.plans-table th {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  color: #888;
  font-weight: 500;
  font-size: 0.78rem;
}
.plans-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.plans-table tr:hover {
  background: rgba(255,255,255,0.02);
}
.symbol-col {
  font-weight: 700;
  color: #fff;
}
.notes-col {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #888;
  font-size: 0.78rem;
}

/* 历史记录Section */
.history-section {
  margin-top: 24px;
}

.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #888;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.history-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 14px;
  transition: all 0.2s;
}

.history-card:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.15);
  transform: translateY(-2px);
}

.history-card.action-buy {
  border-left: 3px solid #38ef7d;
}

.history-card.action-sell {
  border-left: 3px solid #ff5555;
}

.history-card.action-hold {
  border-left: 3px solid #888;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.history-symbol {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-symbol .symbol {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.history-symbol .price {
  font-size: 0.85rem;
  color: #fbbf24;
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timestamp {
  font-size: 0.7rem;
  color: #666;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.6;
  transition: opacity 0.2s;
  padding: 4px;
}

.btn-icon:hover {
  opacity: 1;
}

.btn-delete:hover {
  opacity: 1;
  filter: brightness(1.2);
}

.history-decision {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.action-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.confidence-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.conf-high {
  background: rgba(56,239,125,0.15);
  color: #38ef7d;
}

.conf-mid {
  background: rgba(255,210,0,0.15);
  color: #ffd200;
}

.conf-low {
  background: rgba(255,85,85,0.15);
  color: #ff5555;
}

.history-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-item .label {
  font-size: 0.7rem;
  color: #888;
}

.metric-item .value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e0e0e0;
}

.history-reasoning {
  margin-bottom: 8px;
}

.reasoning-text {
  font-size: 0.75rem;
  color: #aaa;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.history-extras {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.extra-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  background: rgba(102,126,234,0.1);
  color: #a0b4ff;
  border: 1px solid rgba(102,126,234,0.2);
}
.actions-col {
  display: flex;
  gap: 6px;
}
.status-tag {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
}
.st-active { background: rgba(56,239,125,0.12); color: #38ef7d; }
.st-executed { background: rgba(102,126,234,0.12); color: #a0b4ff; }
.st-cancelled { background: rgba(136,136,136,0.12); color: #888; }
.st-failed { background: rgba(255,85,85,0.12); color: #ff5555; }
.st-expired { background: rgba(255,165,0,0.12); color: #ffa500; }

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 6px;
  vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }

.header-actions {
  display: flex;
  gap: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .eval-grid { grid-template-columns: 1fr; }
  .input-row { flex-direction: column; }
  .decision-params { grid-template-columns: repeat(2, 1fr); }
}
</style>
