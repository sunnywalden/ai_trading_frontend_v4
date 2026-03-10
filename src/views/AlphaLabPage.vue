<template>
  <div class="page-container alpha-lab-page">
    <section class="hero-card">
      <div>
        <p class="eyebrow">V10.5.3 Alpha Truth Engine 2.0</p>
        <h2>Alpha Lab</h2>
        <p class="hero-copy">把策略命中率、预期偏差、体制切换和 Shadow Book 放在同一张台面上，先判断 alpha 是否真实，再决定是否放量。</p>
      </div>
      <div class="hero-actions">
        <label>
          观察窗口
          <select v-model.number="lookbackDays" @change="loadSnapshot">
            <option :value="30">30 天</option>
            <option :value="90">90 天</option>
            <option :value="180">180 天</option>
          </select>
        </label>
        <button class="action-button" @click="loadSnapshot" :disabled="loading">{{ loading ? '刷新中...' : '刷新' }}</button>
      </div>
    </section>

    <p v-if="error" class="error-message">{{ error }}</p>

    <section v-if="snapshot" class="metric-grid">
      <article class="metric-card">
        <span>信号产生</span>
        <strong>{{ snapshot.summary.generated }}</strong>
        <small>执行 {{ snapshot.summary.executed }}，评估 {{ snapshot.summary.evaluated }}</small>
      </article>
      <article class="metric-card">
        <span>策略胜率</span>
        <strong>{{ pct(snapshot.summary.win_rate) }}</strong>
        <small>平均置信度 {{ pct(snapshot.summary.avg_confidence) }}</small>
      </article>
      <article class="metric-card">
        <span>Gross / Net</span>
        <strong>{{ pct(snapshot.summary.gross_return) }}</strong>
        <small>净口径 {{ pct(snapshot.summary.net_return) }}</small>
      </article>
      <article class="metric-card">
        <span>After Cost / Turnover</span>
        <strong>{{ pct(snapshot.summary.after_cost_return) }}</strong>
        <small>换手后 {{ pct(snapshot.summary.after_turnover_return) }}</small>
      </article>
      <article class="metric-card accent">
        <span>Shadow Book</span>
        <strong>{{ pct(snapshot.shadow_book.false_reject_rate) }}</strong>
        <small>保护收益 {{ signedPct(snapshot.shadow_book.protection_benefit_pct) }}</small>
      </article>
      <article class="metric-card">
        <span>Data Quality</span>
        <strong><span class="quality-pill" :class="dqClass(snapshot.summary.data_quality)">{{ snapshot.summary.data_quality }}</span></strong>
        <small>平均滑点 {{ pct(snapshot.summary.avg_execution_slippage) }}</small>
      </article>
    </section>

    <section v-if="snapshot" class="content-grid">
      <article class="panel-card">
        <div class="panel-header">
          <h3>当前体制</h3>
          <span v-if="snapshot.current_regime" class="regime-pill">{{ snapshot.current_regime.regime }}</span>
        </div>
        <div v-if="snapshot.current_regime" class="regime-box">
          <strong>{{ pct(snapshot.current_regime.confidence) }}</strong>
          <p>{{ snapshot.current_regime.reasoning || '当前体制由系统规则分类得出，可用于解释策略失效阶段。' }}</p>
        </div>
        <div class="tape-row">
          <span v-for="item in snapshot.regime_tape" :key="item.id" class="tape-pill">{{ item.regime }}</span>
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <h3>Decay Monitor</h3>
          <span>近 30d vs 前 30d</span>
        </div>
        <table class="compact-table">
          <thead>
            <tr>
              <th>策略</th>
              <th>最近胜率</th>
              <th>变化</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in snapshot.decay_monitor.slice(0, 6)" :key="item.strategy_id">
              <td>{{ item.strategy_name }}</td>
              <td>{{ pct(item.recent_win_rate) }}</td>
              <td :class="item.win_rate_delta < 0 ? 'negative' : 'positive'">{{ signedPct(item.win_rate_delta) }}</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>

    <section v-if="snapshot" class="content-grid">
      <article class="panel-card wide">
        <div class="panel-header">
          <h3>Strategy Scorecards</h3>
          <span>按评估样本排序</span>
        </div>
        <table class="compact-table">
          <thead>
            <tr>
              <th>策略</th>
              <th>风格</th>
              <th>样本</th>
              <th>DQ</th>
              <th>胜率</th>
              <th>Gross</th>
              <th>Net</th>
              <th>After Cost</th>
              <th>After Turnover</th>
              <th>Alpha Gap</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in snapshot.strategy_scorecards" :key="item.strategy_id">
              <td>{{ item.strategy_name }}</td>
              <td>{{ item.style || 'N/A' }}</td>
              <td>{{ item.evaluated }}</td>
              <td><span class="quality-pill" :class="dqClass(item.data_quality)">{{ item.data_quality }}</span></td>
              <td>{{ pct(item.win_rate) }}</td>
              <td>{{ pct(item.gross_return) }}</td>
              <td>{{ pct(item.net_return) }}</td>
              <td>{{ pct(item.after_cost_return) }}</td>
              <td>{{ pct(item.after_turnover_return) }}</td>
              <td :class="item.alpha_gap < 0 ? 'negative' : 'positive'">{{ signedPct(item.alpha_gap) }}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <h3>Shadow Book</h3>
          <span>拒绝原因拆解</span>
        </div>
        <div class="shadow-metrics">
          <div>
            <strong>{{ snapshot.shadow_book.total }}</strong>
            <span>总样本</span>
          </div>
          <div>
            <strong>{{ pct(snapshot.shadow_book.missed_alpha_pct) }}</strong>
            <span>错过 Alpha</span>
          </div>
          <div>
            <strong>{{ pct(snapshot.shadow_book.avoided_loss_pct) }}</strong>
            <span>规避损失</span>
          </div>
        </div>
        <ul class="breakdown-list">
          <li v-for="item in snapshot.shadow_book.rejection_breakdown" :key="item.reason">
            <span>{{ item.reason }}</span>
            <strong>{{ item.count }}</strong>
            <small>{{ pct(item.avg_pnl_pct) }}</small>
          </li>
        </ul>
      </article>
    </section>

    <section v-if="snapshot" class="panel-card">
      <div class="panel-header">
        <h3>Recent Signals</h3>
        <span>最近 20 条</span>
      </div>
      <table class="compact-table">
        <thead>
          <tr>
            <th>标的</th>
            <th>方向</th>
            <th>策略</th>
            <th>状态</th>
            <th>DQ</th>
            <th>置信度</th>
            <th>预期</th>
            <th>实际</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="signal in snapshot.recent_signals" :key="signal.signal_id">
            <td>{{ signal.symbol }}</td>
            <td>{{ signal.direction }}</td>
            <td>{{ signal.strategy_name || 'N/A' }}</td>
            <td>{{ signal.status }}</td>
            <td><span class="quality-pill" :class="dqClass(signal.data_quality)">{{ signal.data_quality }}</span></td>
            <td>{{ pct(signal.confidence) }}</td>
            <td>{{ pct(signal.expected_return) }}</td>
            <td>{{ signal.actual_return == null ? 'N/A' : pct(signal.actual_return) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { v1051Api, type AlphaLabSnapshot } from '@/api/v1051Service'
import { onMounted, ref } from 'vue'

const lookbackDays = ref(90)
const snapshot = ref<AlphaLabSnapshot | null>(null)
const loading = ref(false)
const error = ref('')

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function signedPct(value: number) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${(value * 100).toFixed(1)}%`
}

function dqClass(value: string) {
  return `dq-${value.toLowerCase()}`
}

async function loadSnapshot() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await v1051Api.getAlphaLabSnapshot(lookbackDays.value)
    snapshot.value = data
  } catch (err: any) {
    error.value = err?.message || 'Alpha Lab 数据加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadSnapshot)
</script>

<style scoped>
.alpha-lab-page { display: grid; gap: 20px; }
.hero-card, .panel-card, .metric-card {
  background: linear-gradient(145deg, rgba(9, 20, 40, 0.92), rgba(18, 39, 60, 0.88));
  border: 1px solid rgba(125, 184, 255, 0.16);
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
}
.hero-card {
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
}
.eyebrow { margin: 0 0 8px; color: #8bc3ff; text-transform: uppercase; letter-spacing: 0.18em; font-size: 11px; }
.hero-card h2 { margin: 0 0 8px; font-size: 32px; }
.hero-copy { margin: 0; max-width: 720px; color: rgba(220, 232, 255, 0.72); line-height: 1.6; }
.hero-actions { display: flex; gap: 12px; align-items: end; }
.hero-actions label { display: grid; gap: 6px; font-size: 12px; color: rgba(220, 232, 255, 0.72); }
.hero-actions select, .action-button {
  min-height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(125, 184, 255, 0.2);
  background: rgba(6, 13, 25, 0.7);
  color: #f3f7ff;
  padding: 0 14px;
}
.action-button { cursor: pointer; background: linear-gradient(135deg, #45aaf2, #2bcbba); font-weight: 700; }
.metric-grid, .content-grid { display: grid; gap: 16px; }
.metric-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.metric-card { padding: 18px; display: grid; gap: 8px; }
.metric-card span, .metric-card small { color: rgba(220, 232, 255, 0.68); }
.metric-card strong { font-size: 28px; }
.metric-card.accent { background: linear-gradient(145deg, rgba(22, 44, 34, 0.92), rgba(12, 61, 80, 0.88)); }
.content-grid { grid-template-columns: 1.4fr 1fr; }
.panel-card { padding: 20px; }
.panel-card.wide { grid-column: span 1; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 12px; }
.panel-header h3 { margin: 0; }
.panel-header span { color: rgba(220, 232, 255, 0.6); font-size: 12px; }
.regime-pill, .tape-pill {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  background: rgba(125, 184, 255, 0.16);
}
.quality-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
}
.dq-real { background: rgba(18, 98, 78, 0.9); color: #f5fbff; }
.dq-insufficient { background: rgba(133, 84, 18, 0.9); color: #fff8ea; }
.dq-stale { background: rgba(120, 43, 42, 0.92); color: #fff1f1; }
.dq-proxy { background: rgba(35, 82, 131, 0.92); color: #f0f7ff; }
.regime-box { display: grid; gap: 8px; margin-bottom: 16px; }
.regime-box strong { font-size: 24px; }
.regime-box p { margin: 0; color: rgba(220, 232, 255, 0.72); line-height: 1.6; }
.tape-row { display: flex; flex-wrap: wrap; gap: 8px; }
.compact-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.compact-table th, .compact-table td { padding: 10px 8px; border-bottom: 1px solid rgba(125, 184, 255, 0.08); text-align: left; }
.compact-table th { color: rgba(220, 232, 255, 0.58); font-weight: 500; }
.shadow-metrics { display: flex; gap: 24px; margin-bottom: 16px; }
.shadow-metrics div { display: grid; gap: 4px; }
.shadow-metrics strong { font-size: 24px; }
.breakdown-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.breakdown-list li { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; }
.positive { color: #48dbb4; }
.negative { color: #ff7675; }
.error-message { margin: 0; color: #ff7675; }

@media (max-width: 1024px) {
  .hero-card, .content-grid { grid-template-columns: 1fr; display: grid; }
  .hero-card { align-items: start; }
}
</style>