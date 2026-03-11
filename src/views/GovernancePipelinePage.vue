<template>
  <div class="page-container governance-page">
    <section class="hero-card">
      <div>
        <p class="eyebrow">Research-to-Live Governance</p>
        <h2>Promotion Pipeline</h2>
        <p class="hero-copy">把 discovery、paper、shadow live、challenger、production 变成可审计的晋升链路，并明确 blocker 与 rollback 建议。</p>
        <div v-if="snapshot?.rollout" class="hero-rollout">
          <span class="stage-pill production">{{ snapshot.rollout.stage }}</span>
          <small>{{ snapshot.rollout.recommended_next_step }}</small>
        </div>
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
        <span>Shadow Live</span>
        <strong>{{ snapshot.funnel.shadow_live }}</strong>
      </article>
      <article class="funnel-card">
        <span>Challenger</span>
        <strong>{{ snapshot.funnel.challenger }}</strong>
      </article>
      <article class="funnel-card accent">
        <span>Production</span>
        <strong>{{ snapshot.funnel.production }}</strong>
      </article>
      <article class="funnel-card">
        <span>Hard Gate Ready</span>
        <strong>{{ snapshot.hard_gate_candidates || 0 }}</strong>
      </article>
    </section>

    <section v-if="snapshot?.rollout" class="content-grid">
      <article class="panel-card">
        <div class="panel-header">
          <h3>Rollout Flags</h3>
          <span>{{ snapshot.rollout.stage }}</span>
        </div>
        <div class="chip-group">
          <span
            v-for="(enabled, key) in snapshot.rollout.flags"
            :key="key"
            class="stage-pill"
            :class="enabled ? 'production' : 'discovery'"
          >
            {{ key }} · {{ enabled ? 'ON' : 'OFF' }}
          </span>
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <h3>晋升节奏</h3>
          <span>Hard gate candidates</span>
        </div>
        <div class="insight-metrics">
          <div>
            <strong>{{ snapshot.hard_gate_candidates || 0 }}</strong>
            <span>可进硬门</span>
          </div>
          <div>
            <strong>{{ snapshot.pipeline.filter((item) => item.hard_gate_ready).length }}</strong>
            <span>当前列表命中</span>
          </div>
        </div>
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
              <th>Evidence</th>
              <th>Gate</th>
              <th>Blockers</th>
              <th>Rollback</th>
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
              <td>
                <div class="chip-group">
                  <span v-for="(enabled, key) in item.evidence_chain" :key="`${item.strategy_id}-${key}`" class="stage-pill" :class="enabled ? 'production' : 'discovery'">
                    {{ key }}
                  </span>
                </div>
              </td>
              <td>
                <span class="stage-pill" :class="item.hard_gate_ready ? 'production' : 'paper'">
                  {{ item.hard_gate_ready ? 'READY' : 'PENDING' }}
                </span>
              </td>
              <td>
                <div class="chip-group">
                  <span v-for="blocker in item.promotion_blockers" :key="blocker" class="stage-pill paper">{{ blocker }}</span>
                  <span v-if="!item.promotion_blockers.length" class="stage-pill production">CLEAR</span>
                </div>
              </td>
              <td>{{ item.rollback_suggestion }}</td>
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
.hero-rollout { display: flex; align-items: center; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
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
.stage-pill.production { background: rgba(17, 96, 76, 0.92); color: #f4fbff; }
.stage-pill.challenger { background: rgba(122, 78, 17, 0.92); color: #fff8ea; }
.stage-pill.paper { background: rgba(26, 85, 133, 0.92); color: #eef6ff; }
.stage-pill.shadow_live { background: rgba(34, 96, 146, 0.92); color: #eef6ff; }
.stage-pill.discovery { background: rgba(58, 77, 93, 0.92); color: #f4f7fb; }
.chip-group { display: flex; flex-wrap: wrap; gap: 6px; }
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