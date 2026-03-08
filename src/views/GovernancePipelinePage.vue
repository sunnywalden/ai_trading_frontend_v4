<template>
  <div class="page-container governance-page">
    <section class="hero-card">
      <div>
        <p class="eyebrow">Research-to-Live Governance</p>
        <h2>Promotion Pipeline</h2>
        <p class="hero-copy">把 discovery、paper、challenger、production 变成可审计的晋升链路，避免策略凭感觉上线。</p>
      </div>
      <button class="action-button" @click="loadSnapshot" :disabled="loading">{{ loading ? '刷新中...' : '刷新数据' }}</button>
    </section>

    <p v-if="error" class="error-message">{{ error }}</p>

    <section v-if="snapshot" class="funnel-grid">
      <article class="funnel-card">
        <span>Discovery</span>
        <strong>{{ snapshot.funnel.discovery }}</strong>
      </article>
      <article class="funnel-card">
        <span>Paper</span>
        <strong>{{ snapshot.funnel.paper }}</strong>
      </article>
      <article class="funnel-card">
        <span>Challenger</span>
        <strong>{{ snapshot.funnel.challenger }}</strong>
      </article>
      <article class="funnel-card accent">
        <span>Production</span>
        <strong>{{ snapshot.funnel.production }}</strong>
      </article>
    </section>

    <section v-if="snapshot" class="content-grid">
      <article class="panel-card wide">
        <div class="panel-header">
          <h3>策略晋升列表</h3>
          <span>按 stage 与运行样本排序</span>
        </div>
        <table class="compact-table">
          <thead>
            <tr>
              <th>策略</th>
              <th>阶段</th>
              <th>状态</th>
              <th>运行次数</th>
              <th>命中率</th>
              <th>平均强度</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in snapshot.pipeline" :key="item.strategy_id">
              <td>
                <strong>{{ item.name }}</strong>
                <div class="subline">{{ item.style || 'N/A' }} · v{{ item.version }}</div>
              </td>
              <td><span class="stage-pill" :class="item.stage.toLowerCase()">{{ item.stage }}</span></td>
              <td>{{ item.last_run_status || 'N/A' }}</td>
              <td>{{ item.run_count }}</td>
              <td>{{ pct(item.hit_rate) }}</td>
              <td>{{ item.avg_signal_strength.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <h3>洞察库存</h3>
          <span>验证后才能升级到执行规则</span>
        </div>
        <div class="insight-metrics">
          <div>
            <strong>{{ snapshot.insight_summary.total }}</strong>
            <span>总数</span>
          </div>
          <div>
            <strong>{{ snapshot.insight_summary.validated }}</strong>
            <span>已验证</span>
          </div>
          <div>
            <strong>{{ snapshot.insight_summary.active }}</strong>
            <span>已激活</span>
          </div>
        </div>
        <ul class="insight-list">
          <li v-for="item in snapshot.recent_insights.slice(0, 6)" :key="item.id">
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.summary }}</p>
            </div>
            <span class="confidence-tag">{{ pct(item.confidence) }}</span>
          </li>
        </ul>
      </article>
    </section>

    <section v-if="snapshot" class="content-grid">
      <article class="panel-card">
        <div class="panel-header">
          <h3>实验账本</h3>
          <span>近 10 条</span>
        </div>
        <ul class="experiment-list">
          <li v-for="item in snapshot.experiments" :key="item.id">
            <div>
              <strong>{{ item.experiment_name }}</strong>
              <p>{{ item.param_key }}</p>
            </div>
            <div class="experiment-meta">
              <span>{{ item.status }}</span>
              <small>{{ item.p_value == null ? 'p=N/A' : `p=${item.p_value.toFixed(3)}` }}</small>
            </div>
          </li>
        </ul>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <h3>最近运行</h3>
          <span>用于复核 promotion 依据</span>
        </div>
        <table class="compact-table">
          <thead>
            <tr>
              <th>策略</th>
              <th>状态</th>
              <th>命中率</th>
              <th>Hits</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in snapshot.recent_runs" :key="run.run_id">
              <td>{{ run.strategy_name }}</td>
              <td>{{ run.status }}</td>
              <td>{{ pct(run.hit_rate) }}</td>
              <td>{{ run.hits }}</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { v1051Api, type GovernanceSnapshot } from '@/api/v1051Service'
import { onMounted, ref } from 'vue'

const snapshot = ref<GovernanceSnapshot | null>(null)
const loading = ref(false)
const error = ref('')

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

async function loadSnapshot() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await v1051Api.getGovernancePipeline()
    snapshot.value = data
  } catch (err: any) {
    error.value = err?.message || 'Promotion Pipeline 数据加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadSnapshot)
</script>

<style scoped>
.governance-page { display: grid; gap: 20px; }
.hero-card, .panel-card, .funnel-card {
  background: linear-gradient(145deg, rgba(24, 18, 31, 0.94), rgba(24, 44, 62, 0.88));
  border: 1px solid rgba(255, 183, 77, 0.16);
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
}
.hero-card { padding: 24px 28px; display: flex; justify-content: space-between; gap: 16px; align-items: end; }
.eyebrow { margin: 0 0 8px; color: #ffbe76; text-transform: uppercase; letter-spacing: 0.18em; font-size: 11px; }
.hero-card h2 { margin: 0 0 8px; font-size: 32px; }
.hero-copy { margin: 0; color: rgba(246, 232, 216, 0.78); line-height: 1.6; max-width: 720px; }
.action-button {
  min-height: 42px;
  border: none;
  border-radius: 12px;
  padding: 0 16px;
  font-weight: 700;
  color: #1a1f2d;
  background: linear-gradient(135deg, #f6b93b, #fa983a);
  cursor: pointer;
}
.funnel-grid, .content-grid { display: grid; gap: 16px; }
.funnel-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.funnel-card { padding: 18px; display: grid; gap: 8px; }
.funnel-card span { color: rgba(246, 232, 216, 0.7); }
.funnel-card strong { font-size: 28px; }
.funnel-card.accent { background: linear-gradient(145deg, rgba(41, 51, 29, 0.94), rgba(20, 56, 57, 0.9)); }
.content-grid { grid-template-columns: 1.4fr 1fr; }
.panel-card { padding: 20px; }
.panel-card.wide { grid-column: span 1; }
.panel-header { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 14px; }
.panel-header h3 { margin: 0; }
.panel-header span { color: rgba(246, 232, 216, 0.62); font-size: 12px; }
.compact-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.compact-table th, .compact-table td { padding: 10px 8px; border-bottom: 1px solid rgba(255, 183, 77, 0.08); text-align: left; vertical-align: top; }
.compact-table th { color: rgba(246, 232, 216, 0.58); font-weight: 500; }
.subline { color: rgba(246, 232, 216, 0.54); font-size: 12px; margin-top: 4px; }
.stage-pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.1);
}
.stage-pill.production { background: rgba(72, 219, 180, 0.18); color: #48dbb4; }
.stage-pill.challenger { background: rgba(255, 190, 118, 0.18); color: #ffbe76; }
.stage-pill.paper { background: rgba(84, 160, 255, 0.18); color: #74b9ff; }
.stage-pill.discovery { background: rgba(199, 236, 238, 0.12); color: #dff9fb; }
.insight-metrics { display: flex; gap: 18px; margin-bottom: 16px; }
.insight-metrics div { display: grid; gap: 4px; }
.insight-metrics strong { font-size: 22px; }
.insight-list, .experiment-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.insight-list li, .experiment-list li {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 183, 77, 0.08);
}
.insight-list p, .experiment-list p { margin: 6px 0 0; color: rgba(246, 232, 216, 0.7); line-height: 1.5; }
.confidence-tag {
  align-self: start;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(246, 185, 59, 0.12);
}
.experiment-meta { display: grid; gap: 4px; justify-items: end; }
.error-message { margin: 0; color: #ff7675; }

@media (max-width: 1024px) {
  .hero-card, .content-grid { grid-template-columns: 1fr; display: grid; }
  .hero-card { align-items: start; }
}
</style>