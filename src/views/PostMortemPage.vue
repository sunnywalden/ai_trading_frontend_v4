<template>
  <div class="page-container">
    <section class="section-header">
      <div class="page-header-row">
        <div>
          <h2>🔭 决策事后剖析</h2>
          <p>AI 反事实分析 · 错误模式识别 · 认知偏差归因</p>
        </div>
        <div class="header-actions">
          <button class="refresh-button" :disabled="store.loadingPostMortems" @click="store.fetchPostMortems()">
            {{ store.loadingPostMortems ? '加载中...' : '刷新' }}
          </button>
          <button class="trigger-button" @click="openTriggerModal">+ 生成剖析</button>
        </div>
      </div>
    </section>

    <!-- 错误模式汇总 -->
    <div class="patterns-row" v-if="store.postMortemPatterns">
      <div class="pattern-card" v-for="([bias, count]) in store.postMortemPatterns.cognitive_biases" :key="bias">
        <div class="pc-label">{{ biasLabel(String(bias)) }}</div>
        <div class="pc-value">{{ count }}</div>
        <div class="pc-sub">认知偏差</div>
      </div>
    </div>

    <div class="main-grid">
      <!-- 左列：剖析列表 -->
      <div class="left-col">
        <div class="panel">
          <div class="panel-title">📋 剖析记录（{{ store.postMortems.length }} 条）</div>
          <div class="pm-list">
            <div v-if="store.loadingPostMortems" class="empty-cell">加载中...</div>
            <div v-else-if="!store.postMortems.length" class="empty-cell">暂无剖析记录</div>
            <div
              v-else
              v-for="pm in store.postMortems"
              :key="pm.trade_id"
              class="pm-item"
              :class="{ active: store.currentPostMortem?.trade_id === pm.trade_id }"
              @click="selectPM(pm.trade_id)"
            >
              <div class="pm-header">
                <span class="pm-symbol">{{ pm.symbol }}</span>
                <span class="pm-dir" :class="pm.direction === 'long' ? 'long' : 'short'">{{ pm.direction === 'long' ? '多' : '空' }}</span>
                <span class="pm-pnl" :class="(pm.realized_pnl ?? 0) >= 0 ? 'good' : 'danger'">
                  {{ (pm.realized_pnl ?? 0) >= 0 ? '+' : '' }}{{ pm.realized_pnl?.toFixed(0) }}
                </span>
              </div>
              <div class="pm-tags">
                <span v-for="tag in (pm.pattern_tags || []).slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
              </div>
              <div class="pm-meta">{{ pm.error_category }} · {{ fmtDate(pm.created_at) }}</div>
              <div class="pm-status" :class="`status-${pm.status}`">{{ statusLabel(pm.status) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右列：详情展示 -->
      <div class="right-col">
        <div class="panel" v-if="store.currentPostMortem && store.currentPostMortem.status === 'completed'">
          <!-- 标题行 -->
          <div class="pm-detail-header">
            <div class="pmh-symbol">{{ store.currentPostMortem.symbol }}</div>
            <div class="pmh-pnl" :class="(store.currentPostMortem.realized_pnl ?? 0) >= 0 ? 'good' : 'danger'">
              {{ (store.currentPostMortem.realized_pnl ?? 0) >= 0 ? '盈利' : '亏损' }}
              {{ Math.abs(store.currentPostMortem.realized_pnl ?? 0).toFixed(0) }}
            </div>
            <span class="pmh-bias">{{ store.currentPostMortem.cognitive_bias }}</span>
          </div>

          <!-- 事实摘要 -->
          <div class="analysis-block">
            <div class="ab-title">📝 事实摘要</div>
            <div class="ab-text">{{ store.currentPostMortem.factual_summary }}</div>
          </div>

          <!-- 三路径反事实 -->
          <div class="counterfactual-grid">
            <div class="cf-card buy">
              <div class="cf-title">📈 如果更早买入</div>
              <div class="cf-text">{{ store.currentPostMortem.counterfactual_buy }}</div>
            </div>
            <div class="cf-card hold">
              <div class="cf-title">⏸️ 如果继续持有</div>
              <div class="cf-text">{{ store.currentPostMortem.counterfactual_hold }}</div>
            </div>
            <div class="cf-card sell">
              <div class="cf-title">📉 如果更早卖出</div>
              <div class="cf-text">{{ store.currentPostMortem.counterfactual_sell }}</div>
            </div>
          </div>

          <!-- 关键教训 -->
          <div class="analysis-block" v-if="store.currentPostMortem.key_lessons">
            <div class="ab-title">💡 关键教训</div>
            <div class="ab-text">{{ store.currentPostMortem.key_lessons }}</div>
          </div>

          <!-- 改进建议 -->
          <div class="analysis-block" v-if="store.currentPostMortem.improvement_suggestions">
            <div class="ab-title">🔧 改进建议</div>
            <div class="ab-text">{{ store.currentPostMortem.improvement_suggestions }}</div>
          </div>

          <!-- 错误分类 + 标签 -->
          <div class="tags-footer">
            <span class="error-cat">{{ store.currentPostMortem.error_category }}</span>
            <span v-for="tag in store.currentPostMortem.pattern_tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>

        <!-- 生成中状态 -->
        <div class="panel loading-panel" v-else-if="store.currentPostMortem?.status === 'running'">
          <div class="loading-icon">⏳</div>
          <div class="loading-text">AI 正在进行深度反事实推理...</div>
        </div>

        <!-- 空状态 -->
        <div class="panel empty-panel" v-else>
          <div class="empty-icon">🔭</div>
          <div class="empty-text">从左侧选择交易，或点击"生成剖析"触发新分析</div>
        </div>
      </div>
    </div>

    <!-- 触发生成弹窗 -->
    <div v-if="showTriggerForm" class="modal-overlay" @click.self="showTriggerForm = false">
      <div class="modal-box">
        <div class="modal-title">🔭 生成事后剖析</div>

        <div class="form-group">
          <label class="form-label">选择交易（自动填充）</label>
          <div class="candidate-row">
            <input
              v-model="candidateQuery"
              class="form-input"
              placeholder="按标的搜索，如 AAPL"
              @keyup.enter="loadCandidates"
            />
            <button class="refresh-button" :disabled="store.loadingPostMortemCandidates" @click="loadCandidates">
              {{ store.loadingPostMortemCandidates ? '加载中...' : '查询' }}
            </button>
          </div>
          <select v-model="selectedTradeId" class="form-input" @change="onSelectTrade">
            <option value="">请选择一笔已平仓交易</option>
            <option v-for="c in store.postMortemCandidates" :key="c.trade_id" :value="c.trade_id">
              {{ c.display }}
            </option>
          </select>
          <div class="form-help">选择后将自动带出方向、价格、盈亏和持仓天数。</div>
        </div>

        <div class="form-group"><label class="form-label">交易 ID</label><input v-model="trigForm.trade_id" class="form-input" readonly /></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">标的</label><input v-model="trigForm.symbol" class="form-input" readonly /></div>
          <div class="form-group">
            <label class="form-label">方向</label>
            <select v-model="trigForm.direction" class="form-input" disabled>
              <option value="long">多</option><option value="short">空</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">入场价</label><input v-model.number="trigForm.entry_price" class="form-input" type="number" readonly /></div>
          <div class="form-group"><label class="form-label">出场价</label><input v-model.number="trigForm.exit_price" class="form-input" type="number" readonly /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">实现盈亏</label><input v-model.number="trigForm.realized_pnl" class="form-input" type="number" readonly /></div>
          <div class="form-group"><label class="form-label">持仓天数</label><input v-model.number="trigForm.hold_days" class="form-input" type="number" readonly /></div>
        </div>
        <div class="form-group"><label class="form-label">交易背景（可选，可补充）</label><textarea v-model="trigForm.trade_context" class="form-textarea" rows="3" /></div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showTriggerForm = false">取消</button>
          <button class="submit-btn" :disabled="store.generatingPostMortem || !trigForm.trade_id || !trigForm.symbol" @click="submitTrigger">
            {{ store.generatingPostMortem ? '推理中...' : '生成剖析' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAiHubStore } from '@/stores/aiHub'

const store = useAiHubStore()
const showTriggerForm = ref(false)
const selectedTradeId = ref('')
const candidateQuery = ref('')

const trigForm = reactive({ trade_id: '', symbol: '', direction: 'long' as 'long' | 'short', entry_price: 0, exit_price: 0, realized_pnl: 0, hold_days: 1, trade_context: '' })

const BIAS_LABELS: Record<string, string> = { OVERCONFIDENCE: '过度自信', LOSS_AVERSION: '损失厌恶', ANCHORING: '锚定效应', RECENCY_BIAS: '近近效应', CONFIRMATION_BIAS: '确认偏差', FOMO: '追涨杀跌', UNKNOWN: '未知' }
function biasLabel(b: string) { return BIAS_LABELS[b] || b }
function statusLabel(s: string | null) {
  return { pending: '⏳ 等待', running: '🔄 生成中', completed: '✅ 完成', failed: '❌ 失败' }[s || ''] || s
}
function fmtDate(ts: string | null) { return ts ? new Date(ts).toLocaleDateString('zh-CN') : '' }

async function selectPM(tradeId: string) { await store.fetchPostMortem(tradeId) }

async function submitTrigger() {
  await store.generatePostMortem({ ...trigForm })
  showTriggerForm.value = false
}

async function loadCandidates() {
  await store.fetchPostMortemCandidates(120, candidateQuery.value)
}

async function onSelectTrade() {
  if (!selectedTradeId.value) return
  const prefill = await store.fetchPostMortemPrefill(selectedTradeId.value)
  trigForm.trade_id = prefill.trade_id
  trigForm.symbol = prefill.symbol
  trigForm.direction = prefill.direction
  trigForm.entry_price = prefill.entry_price
  trigForm.exit_price = prefill.exit_price
  trigForm.realized_pnl = prefill.realized_pnl
  trigForm.hold_days = prefill.hold_days
  if (!trigForm.trade_context) {
    trigForm.trade_context = prefill.trade_context || ''
  }
}

onMounted(() => {
  store.fetchPostMortems()
})

function resetTriggerForm() {
  selectedTradeId.value = ''
  trigForm.trade_id = ''
  trigForm.symbol = ''
  trigForm.direction = 'long'
  trigForm.entry_price = 0
  trigForm.exit_price = 0
  trigForm.realized_pnl = 0
  trigForm.hold_days = 1
  trigForm.trade_context = ''
}

// 打开弹窗前加载候选交易
async function openTriggerModal() {
  resetTriggerForm()
  showTriggerForm.value = true
  await loadCandidates()
}
</script>

<style scoped>
.page-container { padding: 20px; background: #1a1a2e; min-height: 100vh; color: #e0e0e0; }
.section-header { margin-bottom: 20px; }
.page-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.page-header-row h2 { margin: 0 0 4px; color: #00ff88; font-size: 1.4rem; }
.page-header-row p { margin: 0; color: #888; font-size: 0.85rem; }
.header-actions { display: flex; gap: 8px; }
.refresh-button { padding: 6px 14px; background: rgba(0,255,136,0.15); border: 1px solid #00ff88; color: #00ff88; border-radius: 4px; cursor: pointer; }
.refresh-button:disabled { opacity: 0.5; }
.trigger-button { padding: 6px 14px; background: rgba(0,255,136,0.3); border: 1px solid #00ff88; color: #00ff88; border-radius: 4px; cursor: pointer; font-weight: 600; }
.patterns-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.pattern-card { flex: 1; min-width: 100px; background: rgba(199,125,255,0.08); border: 1px solid rgba(199,125,255,0.3); border-radius: 8px; padding: 10px 12px; text-align: center; }
.pc-label { font-size: 0.7rem; color: #c77dff; margin-bottom: 2px; }
.pc-value { font-size: 1.4rem; font-weight: 700; color: #c77dff; }
.pc-sub { font-size: 0.65rem; color: #888; }
.main-grid { display: grid; grid-template-columns: 300px 1fr; gap: 16px; }
.panel { background: #0d1117; border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 16px; }
.panel-title { font-size: 0.9rem; font-weight: 600; color: #00ff88; margin-bottom: 12px; }
.pm-list { max-height: 65vh; overflow-y: auto; }
.pm-item { padding: 10px 12px; border-radius: 6px; cursor: pointer; border: 1px solid transparent; margin-bottom: 6px; background: rgba(255,255,255,0.02); }
.pm-item:hover, .pm-item.active { border-color: rgba(0,255,136,0.4); background: rgba(0,255,136,0.05); }
.pm-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.pm-symbol { font-weight: 700; color: #e0e0e0; }
.pm-dir { font-size: 0.75rem; padding: 1px 6px; border-radius: 3px; }
.pm-dir.long { background: rgba(0,255,136,0.2); color: #00ff88; }
.pm-dir.short { background: rgba(255,68,68,0.2); color: #ff4444; }
.pm-pnl { margin-left: auto; font-weight: 700; font-size: 0.9rem; }
.pm-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px; }
.tag { font-size: 0.68rem; background: rgba(199,125,255,0.15); color: #c77dff; padding: 1px 6px; border-radius: 3px; }
.pm-meta { font-size: 0.72rem; color: #666; }
.pm-status { font-size: 0.72rem; color: #888; margin-top: 2px; }
.status-completed { color: #00ff88; } .status-running { color: #ffd700; } .status-failed { color: #ff4444; }
.good { color: #00ff88; } .danger { color: #ff4444; } .long { color: #00ff88; } .short { color: #ff4444; }
.pm-detail-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.pmh-symbol { font-size: 1.3rem; font-weight: 700; color: #00ff88; }
.pmh-pnl { font-size: 1rem; font-weight: 700; }
.pmh-bias { font-size: 0.78rem; background: rgba(199,125,255,0.15); color: #c77dff; padding: 3px 10px; border-radius: 20px; }
.analysis-block { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 12px 14px; margin-bottom: 14px; }
.ab-title { font-size: 0.82rem; color: #00ff88; font-weight: 600; margin-bottom: 6px; }
.ab-text { font-size: 0.84rem; color: #ccc; line-height: 1.6; white-space: pre-wrap; }
.counterfactual-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.cf-card { border-radius: 6px; padding: 12px 14px; }
.cf-card.buy { background: rgba(0,255,136,0.05); border: 1px solid rgba(0,255,136,0.2); }
.cf-card.hold { background: rgba(255,215,0,0.05); border: 1px solid rgba(255,215,0,0.2); }
.cf-card.sell { background: rgba(255,68,68,0.05); border: 1px solid rgba(255,68,68,0.2); }
.cf-title { font-size: 0.78rem; font-weight: 600; margin-bottom: 6px; }
.cf-card.buy .cf-title { color: #00ff88; }
.cf-card.hold .cf-title { color: #ffd700; }
.cf-card.sell .cf-title { color: #ff4444; }
.cf-text { font-size: 0.8rem; color: #ccc; line-height: 1.55; }
.tags-footer { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
.error-cat { font-size: 0.78rem; background: rgba(255,107,53,0.15); color: #ff6b35; padding: 3px 10px; border-radius: 20px; }
.loading-panel, .empty-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
.loading-icon, .empty-icon { font-size: 3rem; margin-bottom: 12px; }
.loading-text, .empty-text { color: #555; font-size: 0.9rem; }
.empty-cell { text-align: center; color: #666; padding: 20px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-box { background: #0d1117; border: 1px solid rgba(0,255,136,0.3); border-radius: 12px; padding: 24px; width: 520px; max-height: 90vh; overflow-y: auto; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #00ff88; margin-bottom: 16px; }
.form-group { margin-bottom: 12px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-label { display: block; font-size: 0.78rem; color: #888; margin-bottom: 4px; }
.form-input, .form-textarea { width: 100%; background: #0d0d1a; border: 1px solid rgba(0,255,136,0.25); color: #e0e0e0; padding: 7px 10px; border-radius: 4px; font-size: 0.84rem; resize: vertical; box-sizing: border-box; }
.form-input[readonly] { opacity: 0.9; }
.form-input:disabled { opacity: 0.75; }
.candidate-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 8px; }
.form-help { margin-top: 6px; color: #6f7685; font-size: 0.74rem; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
.cancel-btn { padding: 7px 18px; background: transparent; border: 1px solid #555; color: #999; border-radius: 4px; cursor: pointer; }
.submit-btn { padding: 7px 18px; background: rgba(0,255,136,0.2); border: 1px solid #00ff88; color: #00ff88; border-radius: 4px; cursor: pointer; font-weight: 600; }
.submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
