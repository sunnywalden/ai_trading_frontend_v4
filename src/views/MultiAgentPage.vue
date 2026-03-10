<template>
  <div class="page-container">
    <section class="section-header">
      <div class="page-header-row">
        <div>
          <h2>🤝 多 Agent 协同研究室</h2>
          <p>五职责 Agent · 并行辩证对话 · AI 合议决策</p>
        </div>
        <button class="refresh-button" @click="refreshRuns">刷新历史</button>
      </div>
    </section>

    <div class="main-grid">
      <!-- 左列：触发面板 + 历史列表 -->
      <div class="left-col">
        <!-- 触发新 Agent Run -->
        <div class="panel trigger-panel">
          <div class="panel-title">🚀 触发新 Agent 运行</div>
          <div class="form-group">
            <label class="form-label">标的代码</label>
            <input v-model="form.symbol" class="form-input" placeholder="如 AAPL, 00700.HK" />
          </div>
          <div class="form-group">
            <label class="form-label">下单规模 ($)</label>
            <input v-model.number="form.size_usd" class="form-input" type="number" placeholder="如 50000" />
          </div>
          <div class="form-group">
            <label class="form-label">市场背景 / 交易逻辑</label>
            <textarea v-model="form.context" class="form-textarea" rows="4" placeholder="描述当前市场情况、你的交易假设..." />
          </div>
          <button class="run-button" :disabled="store.runningAgent || !form.symbol.trim() || !form.context.trim()" @click="triggerRun">
            {{ store.runningAgent ? runningLabel : '▶ 启动 5-Agent 合议' }}
          </button>
          <div v-if="submitError" class="submit-error">{{ submitError }}</div>
        </div>

        <!-- 历史 Run 列表 -->
        <div class="panel" style="margin-top: 16px;">
          <div class="panel-title">📋 历史 Agent 运行</div>
          <div class="run-list">
            <div v-if="store.loadingRuns" class="empty-cell">加载中...</div>
            <div v-else-if="!store.agentRuns.length" class="empty-cell">暂无历史</div>
            <div
              v-else
              v-for="run in store.agentRuns"
              :key="run.run_id"
              class="run-item"
              :class="{ active: selectedRunId === run.run_id }"
              @click="run.status !== 'pending' && run.status !== 'running' && selectRun(run.run_id)"
            >
              <div class="run-symbol">{{ run.symbol }}</div>
              <div class="run-meta">
                <span v-if="run.status === 'pending' || run.status === 'running'" class="run-status-badge">
                  {{ run.status === 'pending' ? '⏳ 排队' : '🤖 运行中' }}
                </span>
                <template v-else>
                  <span :class="recCss(run.final_recommendation)">{{ run.final_recommendation ?? '-' }}</span>
                  <span class="run-conf">{{ run.confidence != null ? (run.confidence * 100).toFixed(0) + '%' : '' }}</span>
                </template>
              </div>
              <div class="run-time">{{ fmtTime(run.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右列：结果展示 -->
      <div class="right-col">
        <!-- 当前 Run 结果 -->
        <div class="panel" v-if="store.currentRunResult">
          <div class="result-header">
            <div class="result-symbol">{{ store.currentRunResult.symbol }}</div>
            <div class="result-badge" :class="recCss(store.currentRunResult.final_recommendation)">
              {{ store.currentRunResult.final_recommendation }}
            </div>
            <div class="result-conf">置信度 {{ ((store.currentRunResult.confidence ?? 0) * 100).toFixed(1) }}%</div>
          </div>

          <!-- 最终推理 -->
          <div class="reasoning-box" v-if="store.currentRunResult.final_reasoning">
            <div class="rb-title">🧩 Orchestrator 最终推理</div>
            <div class="rb-text">{{ store.currentRunResult.final_reasoning }}</div>
          </div>

          <!-- 反驳要点 -->
          <div class="challenge-box" v-if="store.currentRunResult.challenge_points?.length">
            <div class="cb-title">⚔️ Risk Challenger 反驳要点</div>
            <ul class="challenge-list">
              <li v-for="(pt, i) in store.currentRunResult.challenge_points" :key="i">{{ pt }}</li>
            </ul>
          </div>

          <!-- Agent 对话时间线 -->
          <div class="panel-title" style="margin-top:20px;">💬 Agent 对话记录</div>
          <div class="timeline">
            <div
              v-for="(msg, idx) in store.currentRunResult.messages"
              :key="idx"
              class="timeline-item"
              :class="`role-${msg.agent_role ?? msg.role}`"
            >
              <div class="tl-header">
                <span class="tl-role">{{ roleLabel(msg.agent_role ?? msg.role) }}</span>
                <span class="tl-type">{{ msg.message_type }}</span>
                <span v-if="msg.confidence != null" class="tl-conf">{{ (msg.confidence * 100).toFixed(0) }}%</span>
              </div>
              <div class="tl-content">{{ msg.content }}</div>
              <div v-if="msg.structured_output" class="tl-structured">
                <pre>{{ JSON.stringify(msg.structured_output, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="panel empty-panel" v-else>
          <div class="empty-icon">🤖</div>
          <div class="empty-text">从左侧启动 Agent 合议，或点击历史运行查看结果</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAiHubStore } from '@/stores/aiHub'
import { formatClientDateTime } from '@/utils/datetime'
import { computed, onMounted, reactive, ref } from 'vue'

const store = useAiHubStore()
const selectedRunId = ref<string | null>(null)
const submitError = ref('')

const form = reactive({ symbol: '', size_usd: 50000, context: '' })

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ 任务排队中...',
  running: '🤖 Agent 协商中...',
  completed: '✅ 完成',
  failed: '❌ 失败',
}
const runningLabel = computed(() => STATUS_LABELS[store.pollingStatus] ?? '⏳ Agent 协商中...')

function fmtTime(ts: string | null) {
  return formatClientDateTime(ts)
}

function recCss(rec: string | null | undefined) {
  if (!rec) return ''
  if (rec === 'BUY' || rec === 'STRONG_BUY') return 'rec-buy'
  if (rec === 'SELL' || rec === 'STRONG_SELL') return 'rec-sell'
  return 'rec-hold'
}

const ROLE_LABELS: Record<string, string> = {
  MARKET_ANALYST: '📈 市场分析师',
  RISK_CHALLENGER: '⚔️ 风险挑战者',
  EXECUTION_OPTIMIZER: '⚡ 执行优化师',
  RESEARCH: '🔬 研究员',
  ORCHESTRATOR: '🎯 总协调官',
}
function roleLabel(role: string) { return ROLE_LABELS[role] || role }

async function refreshRuns() {
  try {
    await store.fetchAgentRuns()
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : '加载 Agent 历史失败，请稍后重试'
    console.error('[MultiAgent] refreshRuns', e)
  }
}

async function triggerRun() {
  if (!form.symbol.trim() || !form.context.trim()) return
  submitError.value = ''
  try {
    await store.startAgentRun({ symbol: form.symbol.trim(), context: form.context, size_usd: form.size_usd })
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Agent 运行失败，请稍后重试'
  }
}

async function selectRun(runId: string) {
  selectedRunId.value = runId
  try {
    await store.fetchRunSummary(runId)
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : '加载 Agent 运行详情失败，请稍后重试'
    console.error('[MultiAgent] selectRun', e)
  }
}

onMounted(() => {
  void refreshRuns()
})
</script>

<style scoped>
.page-container { padding: 20px; background: #1a1a2e; min-height: 100vh; color: #e0e0e0; }
.section-header { margin-bottom: 20px; }
.page-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.page-header-row h2 { margin: 0 0 4px; color: #00ff88; font-size: 1.4rem; }
.page-header-row p { margin: 0; color: #888; font-size: 0.85rem; }
.refresh-button { padding: 6px 16px; background: rgba(0,255,136,0.15); border: 1px solid #00ff88; color: #00ff88; border-radius: 4px; cursor: pointer; }
.main-grid { display: grid; grid-template-columns: 320px 1fr; gap: 16px; }
.panel { background: #0d1117; border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 16px; }
.panel-title { font-size: 0.9rem; font-weight: 600; color: #00ff88; margin-bottom: 12px; }
.form-group { margin-bottom: 12px; }
.form-label { display: block; font-size: 0.78rem; color: #888; margin-bottom: 4px; }
.form-input, .form-textarea { width: 100%; background: #0d0d1a; border: 1px solid rgba(0,255,136,0.25); color: #e0e0e0; padding: 8px 10px; border-radius: 4px; font-size: 0.85rem; resize: vertical; box-sizing: border-box; }
.run-button { width: 100%; padding: 10px; background: rgba(0,255,136,0.2); border: 1px solid #00ff88; color: #00ff88; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 600; }
.run-button:disabled { opacity: 0.4; cursor: not-allowed; }
.submit-error { margin-top: 10px; color: #ff8080; font-size: 0.8rem; }
.run-list { max-height: 360px; overflow-y: auto; }
.run-item { padding: 10px 12px; border-radius: 6px; cursor: pointer; border: 1px solid transparent; margin-bottom: 4px; background: rgba(255,255,255,0.02); }
.run-item:hover { border-color: rgba(0,255,136,0.3); }
.run-item.active { border-color: #00ff88; background: rgba(0,255,136,0.08); }
.run-symbol { font-weight: 700; color: #e0e0e0; font-size: 0.9rem; }
.run-meta { display: flex; gap: 8px; margin-top: 2px; font-size: 0.78rem; }
.run-conf { color: #888; }
.run-time { font-size: 0.72rem; color: #555; margin-top: 2px; }
.rec-buy { color: #00ff88; font-weight: 700; }
.rec-sell { color: #ff4444; font-weight: 700; }
.rec-hold { color: #ffd700; font-weight: 700; }
.run-status-badge { color: #aaa; font-size: 0.78rem; font-style: italic; }
.result-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.result-symbol { font-size: 1.4rem; font-weight: 700; color: #00ff88; }
.result-badge { padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 1rem; }
.result-badge.rec-buy { background: rgba(0,255,136,0.2); }
.result-badge.rec-sell { background: rgba(255,68,68,0.2); }
.result-badge.rec-hold { background: rgba(255,215,0,0.2); }
.result-conf { color: #888; font-size: 0.85rem; }
.reasoning-box { background: rgba(0,255,136,0.04); border: 1px solid rgba(0,255,136,0.15); border-radius: 6px; padding: 12px 14px; margin-bottom: 14px; }
.rb-title { font-size: 0.82rem; color: #00ff88; margin-bottom: 6px; font-weight: 600; }
.rb-text { font-size: 0.85rem; line-height: 1.6; color: #ccc; white-space: pre-wrap; }
.challenge-box { background: rgba(255,68,68,0.04); border: 1px solid rgba(255,68,68,0.2); border-radius: 6px; padding: 12px 14px; margin-bottom: 14px; }
.cb-title { font-size: 0.82rem; color: #ff6b6b; margin-bottom: 6px; font-weight: 600; }
.challenge-list { margin: 0; padding-left: 18px; }
.challenge-list li { font-size: 0.84rem; color: #ccc; margin-bottom: 4px; line-height: 1.5; }
.timeline { max-height: 500px; overflow-y: auto; }
.timeline-item { padding: 12px 14px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid rgba(255,255,255,0.1); }
.timeline-item.role-MARKET_ANALYST { border-left-color: #00ff88; background: rgba(0,255,136,0.03); }
.timeline-item.role-RISK_CHALLENGER { border-left-color: #ff4444; background: rgba(255,68,68,0.03); }
.timeline-item.role-EXECUTION_OPTIMIZER { border-left-color: #ffd700; background: rgba(255,215,0,0.03); }
.timeline-item.role-RESEARCH { border-left-color: #a8dadc; background: rgba(168,218,220,0.03); }
.timeline-item.role-ORCHESTRATOR { border-left-color: #c77dff; background: rgba(199,125,255,0.05); }
.tl-header { display: flex; gap: 10px; align-items: center; margin-bottom: 6px; }
.tl-role { font-size: 0.82rem; font-weight: 700; }
.tl-type { font-size: 0.72rem; color: #666; background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 3px; }
.tl-conf { font-size: 0.72rem; color: #888; margin-left: auto; }
.tl-content { font-size: 0.84rem; color: #ccc; line-height: 1.55; white-space: pre-wrap; }
.tl-structured { margin-top: 6px; background: #0a0a15; border-radius: 4px; padding: 8px; }
.tl-structured pre { margin: 0; font-size: 0.72rem; color: #00ff88; white-space: pre-wrap; }
.empty-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
.empty-icon { font-size: 3rem; margin-bottom: 12px; }
.empty-text { color: #555; font-size: 0.9rem; }
.empty-cell { text-align: center; color: #666; padding: 20px; }
</style>
