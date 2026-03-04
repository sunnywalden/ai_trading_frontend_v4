<template>
  <div class="evolution-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('evolution.title') }}</h1>
      <p class="page-subtitle">{{ t('evolution.subtitle') }}</p>
    </div>

    <!-- 标签页 -->
    <div class="tab-row">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- ── 洞察库标签页 ─────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'insights'">
      <div class="section-actions">
        <div class="filter-row">
          <select class="filter-select" v-model="insightFilter.type" @change="loadInsights">
            <option value="">{{ t('common.all') }} {{ t('evolution.insight_type') }}</option>
            <option v-for="it in insightTypes" :key="it" :value="it">{{ it }}</option>
          </select>
          <select class="filter-select" v-model="insightFilter.active" @change="loadInsights">
            <option value="">{{ t('common.all') }}</option>
            <option value="true">{{ t('evolution.active_only') }}</option>
            <option value="false">{{ t('evolution.inactive_only') }}</option>
          </select>
        </div>
        <button class="btn-generate" @click="generateInsights" :disabled="generating">
          {{ generating ? t('evolution.generating') : t('evolution.generate_weekly') }}
        </button>
      </div>

      <div class="insights-grid" v-if="!insightsLoading">
        <div
          v-for="ins in insights"
          :key="ins.id"
          class="insight-card"
          :class="{ inactive: !ins.active }"
        >
          <div class="ic-header">
            <span class="ic-type-badge" :style="{ background: insightTypeColor(ins.insight_type) + '22', color: insightTypeColor(ins.insight_type) }">
              {{ ins.insight_type }}
            </span>
            <div class="ic-meta">
              <span class="ic-confidence">{{ (ins.confidence * 100).toFixed(0) }}%</span>
              <span class="ic-applied">×{{ ins.applied_count }}</span>
            </div>
          </div>
          <div class="ic-title">{{ ins.title }}</div>
          <div class="ic-body">{{ ins.summary }}</div>
          <div v-if="ins.actionable_rule" class="ic-rule">
            <div class="ic-rule-label">{{ t('evolution.rule') }}</div>
            <pre class="ic-rule-json">{{ JSON.stringify(ins.actionable_rule, null, 2) }}</pre>
          </div>
          <div class="ic-footer">
            <span class="ic-period">{{ ins.created_at?.slice(0,10) }}</span>
            <button
              class="btn-toggle"
              @click="toggleInsight(ins)"
            >{{ ins.active ? t('evolution.deactivate') : t('evolution.activate') }}</button>
          </div>
        </div>
        <div v-if="insights.length === 0" class="empty-state">
          <div>{{ t('evolution.no_insights') }}</div>
          <div v-if="repositoryStatus" class="empty-hint-card">
            <div class="eh-title">数据状态诊断</div>
            <div class="eh-line">洞察库：{{ repositoryStatus.insight_count }} 条</div>
            <div class="eh-line">近30天归因样本：{{ repositoryStatus.attribution_count_30d }} 条</div>
            <div class="eh-line">近30天交易日志样本：{{ repositoryStatus.journal_count_30d }} 条</div>
            <div class="eh-hint">{{ repositoryStatus.hint }}</div>
          </div>
        </div>
      </div>
      <div v-else class="loading-state">{{ t('common.loading') }}...</div>
    </div>

    <!-- ── A/B 实验标签页 ──────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'experiments'">
      <div class="section-actions">
        <button class="btn-generate" @click="showCreateModal = true">
          + {{ t('evolution.new_experiment') }}
        </button>
      </div>

      <div class="experiments-list" v-if="!experimentsLoading">
        <div
          v-for="exp in experiments"
          :key="exp.id"
          class="exp-card"
        >
          <div class="exp-header">
            <div class="exp-name">{{ exp.experiment_name }}</div>
            <span class="exp-status-badge" :class="`status-${exp.status.toLowerCase()}`">
              {{ exp.status }}
            </span>
          </div>
          <div class="exp-param">{{ t('evolution.param') }}: <code>{{ exp.param_key }}</code></div>
          <div class="exp-values">
            <div class="exp-val-box">
              <div class="evb-label">{{ t('evolution.control') }}</div>
              <div class="evb-wr" v-if="exp.control_win_rate !== null">
                WR: {{ (exp.control_win_rate! * 100).toFixed(1) }}% (n={{ exp.control_trades }})
              </div>
            </div>
            <div class="exp-arrow">→</div>
            <div class="exp-val-box treatment">
              <div class="evb-label">{{ t('evolution.treatment') }}</div>
              <div class="evb-wr" v-if="exp.treatment_win_rate !== null">
                WR: {{ (exp.treatment_win_rate! * 100).toFixed(1) }}% (n={{ exp.treatment_trades }})
              </div>
            </div>
          </div>
          <div class="exp-stats" v-if="exp.p_value !== null">
            <span class="exp-pval">p = {{ exp.p_value?.toFixed(4) }}</span>
            <span
              class="exp-sig"
              :class="exp.passed_significance ? 'sig-pass' : 'sig-fail'"
            >{{ exp.passed_significance ? t('evolution.sig_passed') : t('evolution.sig_failed') }}</span>
            <span v-if="exp.auto_applied" class="exp-applied">✓ {{ t('evolution.auto_applied') }}</span>
          </div>
          <div class="exp-footer">
            <span class="exp-date">{{ exp.start_date?.slice(0,10) }} → {{ exp.end_date?.slice(0,10) ?? t('evolution.ongoing') }}</span>
          </div>
        </div>
        <div v-if="experiments.length === 0" class="empty-state">{{ t('evolution.no_experiments') }}</div>
      </div>
      <div v-else class="loading-state">{{ t('common.loading') }}...</div>
    </div>

    <!-- 新建实验 Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-box">
        <h3 class="modal-title">{{ t('evolution.new_experiment') }}</h3>
        <div class="form-group">
          <label class="form-label">{{ t('evolution.exp_name') }}</label>
          <input class="form-input" v-model="newExp.experiment_name" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('evolution.param_key') }}</label>
          <input class="form-input" v-model="newExp.param_key" placeholder="e.g. PREEARNING_DAYS" />
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label class="form-label">{{ t('evolution.control_value') }}</label>
            <input class="form-input" v-model="newExp.control_value_raw" placeholder="1" />
          </div>
          <div class="form-group half">
            <label class="form-label">{{ t('evolution.treatment_value') }}</label>
            <input class="form-input" v-model="newExp.treatment_value_raw" placeholder="2" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('evolution.duration_days') }}</label>
          <input class="form-input" type="number" v-model.number="newExp.duration_days" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateModal = false">{{ t('common.cancel') }}</button>
          <button class="btn-confirm" @click="createExperiment">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  insightApi,
  INSIGHT_TYPE_COLORS,
  type AIInsightItem,
  type ABExperimentItem,
  type InsightRepositoryStatus,
} from '@/api/insightService'
import { logger } from '@/utils/logger'

const { t } = useI18n()

type TabKey = 'insights' | 'experiments'

// ── 标签页 ────────────────────────────────────────────────────────────────────
const activeTab = ref<TabKey>('insights')
const tabs = computed<{ key: TabKey; label: string }[]>(() => [
  { key: 'insights',    label: t('evolution.insights_tab') },
  { key: 'experiments', label: t('evolution.experiments_tab') },
])

// ── 洞察库 ────────────────────────────────────────────────────────────────────
const insightsLoading = ref(false)
const generating      = ref(false)
const insights        = ref<AIInsightItem[]>([])
const repositoryStatus = ref<InsightRepositoryStatus | null>(null)
const insightTypes    = ['PATTERN', 'TRAP', 'EXECUTION', 'PARAM_SUGGESTION']
const insightFilter   = ref({ type: '', active: '' })

async function loadInsights() {
  insightsLoading.value = true
  try {
    const active_only = insightFilter.value.active === '' ? undefined
      : insightFilter.value.active === 'true'
    const res = await insightApi.listInsights({
      insight_type: (insightFilter.value.type || undefined) as any,
      active_only
    })
    insights.value = res.data.items
    if (insights.value.length === 0) {
      try {
        const statusRes = await insightApi.getRepositoryStatus()
        repositoryStatus.value = statusRes.data
      } catch {
        repositoryStatus.value = null
      }
    } else {
      repositoryStatus.value = null
    }
  } catch (e) {
    logger.warn('[Evolution] loadInsights failed', e)
  } finally {
    insightsLoading.value = false
  }
}

async function generateInsights() {
  generating.value = true
  try {
    await insightApi.triggerWeeklyGeneration()
    await new Promise(r => setTimeout(r, 1500))
    await loadInsights()
  } catch (e) {
    logger.warn('[Evolution] generate failed', e)
  } finally {
    generating.value = false
  }
}

async function toggleInsight(ins: AIInsightItem) {
  try {
    await insightApi.toggleActive(ins.id, !ins.active)
    ins.active = !ins.active
  } catch (e) {
    logger.warn('[Evolution] toggleInsight failed', e)
  }
}

function insightTypeColor(type: string) {
  return (INSIGHT_TYPE_COLORS as Record<string,string>)[type] ?? '#888'
}

// ── A/B 实验 ──────────────────────────────────────────────────────────────────
const experimentsLoading = ref(false)
const experiments        = ref<ABExperimentItem[]>([])
const showCreateModal    = ref(false)
const newExp = ref({
  experiment_name: '',
  param_key: '',
  control_value_raw: '',
  treatment_value_raw: '',
  duration_days: 14,
})

async function loadExperiments() {
  experimentsLoading.value = true
  try {
    const res = await insightApi.listExperiments()
    experiments.value = res.data.items
  } catch (e) {
    logger.warn('[Evolution] loadExperiments failed', e)
  } finally {
    experimentsLoading.value = false
  }
}

async function createExperiment() {
  try {
    const parseVal = (v: string) => {
      try { return JSON.parse(v) } catch { return v }
    }
    await insightApi.createExperiment({
      experiment_name:  newExp.value.experiment_name,
      param_key:       newExp.value.param_key,
      control_value:    parseVal(newExp.value.control_value_raw),
      treatment_value:  parseVal(newExp.value.treatment_value_raw),
      duration_days:    newExp.value.duration_days,
    })
    showCreateModal.value = false
    await loadExperiments()
  } catch (e) {
    logger.warn('[Evolution] createExperiment failed', e)
  }
}

// ── 初始化 ────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadInsights(), loadExperiments()])
})
</script>

<style scoped>
.evolution-page { padding: 24px; max-width: 1400px; margin: 0 auto; color: #e0e0e0; }
.page-header { margin-bottom: 24px; }
.page-title  { font-size: 1.8rem; font-weight: 700; color: #fff; margin: 0 0 4px; }
.page-subtitle { color: #888; font-size: 0.9rem; }

.tab-row { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 1px solid #1e293b; }
.tab-btn { background: transparent; border: none; border-bottom: 2px solid transparent; color: #666; padding: 8px 20px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; }
.tab-btn.active { color: #fff; border-bottom-color: #00ff88; }
.tab-btn:hover { color: #ccc; }

.section-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.filter-row { display: flex; gap: 10px; flex-wrap: wrap; }
.filter-select { background: #16213e; color: #e0e0e0; border: 1px solid #333; border-radius: 6px; padding: 6px 12px; font-size: 0.85rem; }
.btn-generate { background: #00ff88; color: #001; border: none; border-radius: 6px; padding: 7px 18px; font-weight: 600; cursor: pointer; }
.btn-generate:disabled { opacity: 0.5; cursor: not-allowed; }

/* 洞察卡片 */
.insights-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.insight-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; transition: border-color 0.2s; }
.insight-card.inactive { opacity: 0.5; }
.insight-card:hover { border-color: #334155; }
.ic-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ic-type-badge { font-size: 0.7rem; padding: 3px 10px; border-radius: 10px; font-weight: 600; }
.ic-meta { display: flex; align-items: center; gap: 8px; }
.ic-confidence { font-size: 0.85rem; font-weight: 700; color: #00ff88; }
.ic-applied { font-size: 0.75rem; color: #666; }
.ic-title { font-weight: 600; margin-bottom: 6px; color: #e0e0e0; }
.ic-body  { font-size: 0.85rem; color: #888; line-height: 1.5; }
.ic-rule  { margin-top: 10px; }
.ic-rule-label { font-size: 0.7rem; color: #555; text-transform: uppercase; margin-bottom: 4px; }
.ic-rule-json { background: #111827; border: 1px solid #1e293b; border-radius: 6px; padding: 8px; font-size: 0.75rem; color: #93c5fd; max-height: 120px; overflow-y: auto; margin: 0; }
.ic-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid #1e293b; }
.ic-period { font-size: 0.75rem; color: #555; }
.btn-toggle { background: transparent; border: 1px solid #334155; color: #888; border-radius: 6px; padding: 3px 10px; font-size: 0.75rem; cursor: pointer; }
.btn-toggle:hover { border-color: #00ff88; color: #00ff88; }

/* A/B 实验 */
.experiments-list { display: flex; flex-direction: column; gap: 14px; }
.exp-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; }
.exp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.exp-name   { font-weight: 600; color: #fff; }
.exp-status-badge { font-size: 0.72rem; padding: 2px 9px; border-radius: 10px; }
.status-running   { background: rgba(0,255,136,0.15); color: #00ff88; }
.status-completed { background: rgba(100,100,255,0.15); color: #a0a8ff; }
.status-stopped   { background: rgba(100,100,100,0.15); color: #888; }
.exp-param { font-size: 0.8rem; color: #666; margin-bottom: 10px; }
.exp-param code { font-size: 0.8rem; color: #60a5fa; background: #111827; padding: 1px 6px; border-radius: 4px; }
.exp-values { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.exp-val-box { background: #111827; border: 1px solid #1e293b; border-radius: 8px; padding: 10px 14px; flex: 1; }
.exp-val-box.treatment { border-color: rgba(0,255,136,0.3); }
.evb-label { font-size: 0.7rem; color: #555; margin-bottom: 4px; }
.evb-value { font-size: 0.95rem; font-weight: 700; color: #e0e0e0; }
.evb-wr    { font-size: 0.8rem; color: #aaa; margin-top: 4px; }
.exp-arrow { font-size: 1.4rem; color: #334155; }
.exp-stats { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; font-size: 0.82rem; }
.exp-pval  { color: #888; }
.sig-pass  { color: #00ff88; }
.sig-fail  { color: #ff4d4d; }
.exp-applied { color: #60a5fa; }
.exp-footer { display: flex; justify-content: space-between; font-size: 0.75rem; color: #555; padding-top: 8px; border-top: 1px solid #111827; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; }
.modal-box  { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 28px; width: min(480px, 90vw); }
.modal-title { color: #fff; font-size: 1.1rem; font-weight: 600; margin: 0 0 20px; }
.form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
.form-row   { display: flex; gap: 12px; }
.form-group.half { flex: 1; }
.form-label { font-size: 0.8rem; color: #666; }
.form-input { background: #1e293b; color: #e0e0e0; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; font-size: 0.9rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
.btn-cancel  { background: transparent; border: 1px solid #334155; color: #888; border-radius: 6px; padding: 6px 16px; cursor: pointer; }
.btn-confirm { background: #00ff88; color: #001; border: none; border-radius: 6px; padding: 6px 16px; font-weight: 600; cursor: pointer; }
.empty-state, .loading-state { padding: 40px; text-align: center; color: #444; }

.empty-hint-card {
  margin: 12px auto 0;
  max-width: 520px;
  text-align: left;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 12px 14px;
}

.eh-title {
  color: #cbd5e1;
  font-size: 0.86rem;
  margin-bottom: 6px;
  font-weight: 600;
}

.eh-line {
  color: #94a3b8;
  font-size: 0.82rem;
  line-height: 1.5;
}

.eh-hint {
  color: #e2e8f0;
  font-size: 0.82rem;
  margin-top: 8px;
  line-height: 1.55;
}
</style>
