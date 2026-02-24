<template>
  <div class="pe-page">

    <!-- ═══ 页头 ═══ -->
    <div class="pe-header">
      <div class="header-left">
        <h2 class="page-title"><span class="icon">🔬</span> {{ $t('position_eval.title') }}</h2>
        <p class="page-subtitle">{{ $t('position_eval.subtitle') }}</p>
      </div>
      <div class="header-right">
        <button class="btn-trigger" @click="openTriggerDialog()">
          <span>▶</span> {{ $t('position_eval.trigger_task') }}
        </button>
      </div>
    </div>

    <!-- ═══ Tab 导航 ═══ -->
    <div class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = (tab.key as 'pending' | 'history')"
      >
        {{ tab.label }}
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
      <router-link to="/task-management" class="tab-link-secondary">
        ⚙️ {{ $t('nav.task_management') }}
      </router-link>
    </div>

    <!-- ═══════════════════════════════════════
         Tab 1: 待执行任务
    ═══════════════════════════════════════ -->
    <div v-show="activeTab === 'pending'" class="tab-content">
      <div class="toolbar">
        <button class="btn-primary" @click="openTriggerDialog()">
          ▶ {{ $t('position_eval.trigger_task') }}
        </button>
        <button
          class="btn-danger-sm"
          :disabled="selectedPending.length === 0"
          @click="batchDeletePending"
        >
          🗑 {{ $t('position_eval.pending.batch_delete') }}
          <span v-if="selectedPending.length > 0">({{ selectedPending.length }})</span>
        </button>
        <button class="btn-icon-sm" @click="loadPending" :class="{ spinning: loadingPending }">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
        </button>
      </div>

      <div v-if="loadingPending" class="state-loading">{{ $t('common.loading') }}</div>
      <div v-else-if="pendingTasks.length === 0" class="state-empty">{{ $t('position_eval.pending.empty') }}</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" :checked="allPendingSelected" @change="toggleSelectAllPending" />
            </th>
            <th>ID</th>
            <th>{{ $t('position_eval.task.config') }}</th>
            <th>{{ $t('position_eval.task.scope') }}</th>
            <th>{{ $t('position_eval.task.dimensions') }}</th>
            <th>{{ $t('position_eval.task.triggered') }}</th>
            <th>{{ $t('position_eval.task.created_at') }}</th>
            <th>{{ $t('common.execute') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in pendingTasks" :key="task.id">
            <td class="col-check">
              <input
                type="checkbox"
                :value="task.id"
                v-model="selectedPending"
              />
            </td>
            <td class="text-mono text-dim">#{{ task.id }}</td>
            <td>{{ task.config_name || '-' }}</td>
            <td>
              <span class="chip">{{ task.scope === 'ALL_POSITIONS' ? $t('position_eval.scope.all') : $t('position_eval.scope.list') }}</span>
            </td>
            <td>
              <span v-for="d in task.eval_dimensions" :key="d" class="chip chip-dim">{{ d }}</span>
            </td>
            <td class="text-dim">{{ task.triggered_by }}</td>
            <td class="text-dim text-mono">{{ formatDt(task.created_at) }}</td>
            <td>
              <span class="status-tag status-pending">PENDING</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══════════════════════════════════════
         Tab 2: 执行历史
    ═══════════════════════════════════════ -->
    <div v-show="activeTab === 'history'" class="tab-content">
      <div class="toolbar">
        <select class="select-sm" v-model="historyStatusFilter" @change="loadHistory(1)">
          <option value="">{{ $t('position_eval.history.all_status') }}</option>
          <option value="DONE">DONE</option>
          <option value="FAILED">FAILED</option>
          <option value="RUNNING">RUNNING</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <button class="btn-icon-sm" @click="loadHistory(1)" :class="{ spinning: loadingHistory }">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
        </button>
      </div>

      <div v-if="loadingHistory" class="state-loading">{{ $t('common.loading') }}</div>
      <div v-else-if="historyTasks.length === 0" class="state-empty">{{ $t('position_eval.history.empty') }}</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ $t('position_eval.task.config') }}</th>
            <th>{{ $t('position_eval.task.scope') }}</th>
            <th>{{ $t('common.status') }}</th>
            <th>{{ $t('position_eval.history.evaluated') }}</th>
            <th>{{ $t('position_eval.history.avg_score') }}</th>
            <th>{{ $t('position_eval.task.started_at') }}</th>
            <th>{{ $t('position_eval.task.completed_at') }}</th>
            <th>{{ $t('position_eval.history.result') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in historyTasks" :key="task.id">
            <td class="text-mono text-dim">#{{ task.id }}</td>
            <td>{{ task.config_name || '-' }}</td>
            <td>
              <span class="chip">{{ task.scope === 'ALL_POSITIONS' ? $t('position_eval.scope.all') : $t('position_eval.scope.list') }}</span>
            </td>
            <td>
              <span class="status-tag" :class="`status-${task.status.toLowerCase()}`">{{ task.status }}</span>
            </td>
            <td class="text-mono">
              <span v-if="task.result_summary">{{ task.result_summary.total_evaluated }}</span>
              <span v-else-if="task.total_symbols">0 / {{ task.total_symbols }}</span>
              <span v-else>-</span>
            </td>
            <td class="text-mono">
              <span v-if="task.result_summary" :class="scoreClass(task.result_summary.avg_score)">
                {{ task.result_summary.avg_score }}
              </span>
              <span v-else>-</span>
            </td>
            <td class="text-dim text-mono">{{ formatDt(task.started_at) }}</td>
            <td class="text-dim text-mono">{{ formatDt(task.completed_at) }}</td>
            <td>
              <button class="btn-link" @click="viewTaskDetail(task.id)">
                {{ $t('position_eval.history.detail') }} →
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination" v-if="historyTotal > historyPageSize">
        <button class="btn-page" :disabled="historyPage <= 1" @click="loadHistory(historyPage - 1)">‹</button>
        <span class="page-info">{{ historyPage }} / {{ Math.ceil(historyTotal / historyPageSize) }}</span>
        <button class="btn-page" :disabled="historyPage >= Math.ceil(historyTotal / historyPageSize)" @click="loadHistory(historyPage + 1)">›</button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         Dialog: 新建 / 编辑配置
    ═══════════════════════════════════════ -->
    <div v-if="showConfigDialog" class="modal-overlay" @click.self="showConfigDialog = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingConfig ? $t('position_eval.config.edit') : $t('position_eval.config.new') }}</h3>
          <button class="modal-close" @click="showConfigDialog = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>{{ $t('position_eval.config.name') }} *</label>
            <input v-model="configForm.name" class="input-text" :placeholder="$t('position_eval.config.name_placeholder')" />
          </div>
          <div class="form-row">
            <label>{{ $t('position_eval.config.description') }}</label>
            <textarea v-model="configForm.description" class="input-textarea" rows="2"></textarea>
          </div>
          <div class="form-row">
            <label>{{ $t('position_eval.config.scope') }}</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="configForm.scope" value="ALL_POSITIONS" />
                {{ $t('position_eval.scope.all') }}
              </label>
              <label class="radio-label">
                <input type="radio" v-model="configForm.scope" value="SYMBOL_LIST" />
                {{ $t('position_eval.scope.list') }}
              </label>
            </div>
          </div>
          <div v-if="configForm.scope === 'SYMBOL_LIST'" class="form-row">
            <label>{{ $t('position_eval.config.symbols') }} <span class="text-dim">(逗号分隔)</span></label>
            <input v-model="configFormSymbolsStr" class="input-text" placeholder="AAPL,TSLA,NVDA" />
          </div>
          <div class="form-row">
            <label>{{ $t('position_eval.config.dimensions') }}</label>
            <div class="check-group">
              <label v-for="dim in availableDimensions" :key="dim" class="check-label">
                <input type="checkbox" :value="dim" v-model="configForm.eval_dimensions" />
                {{ dim }}
              </label>
            </div>
          </div>
          <div class="form-row-two">
            <div class="form-row">
              <label>{{ $t('position_eval.config.trigger_mode') }}</label>
              <select v-model="configForm.trigger_mode" class="select-text">
                <option value="MANUAL">{{ $t('position_eval.trigger.manual') }}</option>
                <option value="DAILY">{{ $t('position_eval.trigger.daily') }}</option>
                <option value="WEEKLY">{{ $t('position_eval.trigger.weekly') }}</option>
              </select>
            </div>
            <div class="form-row" v-if="configForm.trigger_mode !== 'MANUAL'">
              <label>{{ $t('position_eval.config.trigger_time') }} <span class="tz-label">{{ $t('position_eval.config.trigger_time_tz') }}</span></label>
              <input v-model="configForm.trigger_time" class="input-text" placeholder="09:30" />
              <span class="form-hint">{{ $t('position_eval.config.trigger_time_hint') }}</span>
            </div>
          </div>
          <div class="form-row">
            <label class="check-label">
              <input type="checkbox" v-model="configForm.enabled" />
              {{ $t('position_eval.config.enabled') }}
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="showConfigDialog = false">{{ $t('common.cancel') }}</button>
          <button class="btn-primary" :disabled="savingConfig" @click="saveConfig">
            {{ savingConfig ? $t('common.loading') : $t('common.save') }}
          </button>
        </div>
        <div v-if="configError" class="form-error">{{ configError }}</div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         Dialog: 触发任务
    ═══════════════════════════════════════ -->
    <div v-if="showTriggerDialog" class="modal-overlay" @click.self="showTriggerDialog = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ $t('position_eval.trigger_task') }}</h3>
          <button class="modal-close" @click="showTriggerDialog = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>{{ $t('position_eval.trigger.use_config') }}</label>
            <select v-model="triggerForm.config_id" class="select-text">
              <option :value="undefined">— {{ $t('position_eval.trigger.no_config') }} —</option>
              <option v-for="cfg in configs" :key="cfg.id" :value="cfg.id">{{ cfg.name }}</option>
            </select>
          </div>
          <template v-if="!triggerForm.config_id">
            <div class="form-row">
              <label>{{ $t('position_eval.config.scope') }}</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="triggerForm.scope" value="ALL_POSITIONS" />
                  {{ $t('position_eval.scope.all') }}
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="triggerForm.scope" value="SYMBOL_LIST" />
                  {{ $t('position_eval.scope.list') }}
                </label>
              </div>
            </div>
            <div v-if="triggerForm.scope === 'SYMBOL_LIST'" class="form-row">
              <label>{{ $t('position_eval.config.symbols') }}</label>
              <input v-model="triggerSymbolsStr" class="input-text" placeholder="AAPL,TSLA" />
            </div>
            <div class="form-row">
              <label>{{ $t('position_eval.config.dimensions') }}</label>
              <div class="check-group">
                <label v-for="dim in availableDimensions" :key="dim" class="check-label">
                  <input type="checkbox" :value="dim" v-model="triggerForm.eval_dimensions" />
                  {{ dim }}
                </label>
              </div>
            </div>
          </template>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="showTriggerDialog = false">{{ $t('common.cancel') }}</button>
          <button class="btn-accent" :disabled="triggering" @click="doTriggerTask">
            {{ triggering ? $t('common.loading') : ('▶ ' + $t('position_eval.trigger.confirm')) }}
          </button>
        </div>
        <div v-if="triggerError" class="form-error">{{ triggerError }}</div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         Drawer: 任务执行结果详情
    ═══════════════════════════════════════ -->
    <div v-if="showDetailDrawer" class="drawer-overlay" @click.self="showDetailDrawer = false">
      <div class="drawer">
        <div class="drawer-header">
          <h3>{{ $t('position_eval.detail.title') }} #{{ detailTask?.id }}</h3>
          <button class="modal-close" @click="showDetailDrawer = false">✕</button>
        </div>
        <div class="drawer-body" v-if="detailTask">

          <!-- 摘要信息 -->
          <div class="detail-summary">
            <div class="ds-item">
              <div class="ds-label">{{ $t('common.status') }}</div>
              <div class="ds-value">
                <span class="status-tag" :class="`status-${detailTask.status.toLowerCase()}`">{{ detailTask.status }}</span>
              </div>
            </div>
            <div class="ds-item" v-if="detailTask.config_name">
              <div class="ds-label">{{ $t('position_eval.task.config') }}</div>
              <div class="ds-value">{{ detailTask.config_name }}</div>
            </div>
            <div class="ds-item" v-if="detailTask.result_summary">
              <div class="ds-label">{{ $t('position_eval.history.evaluated') }}</div>
              <div class="ds-value text-mono">{{ detailTask.result_summary.total_evaluated }}</div>
            </div>
            <div class="ds-item" v-if="detailTask.result_summary">
              <div class="ds-label">{{ $t('position_eval.history.avg_score') }}</div>
              <div class="ds-value text-mono" :class="scoreClass(detailTask.result_summary.avg_score)">
                {{ detailTask.result_summary.avg_score }}
              </div>
            </div>
            <div class="ds-item" v-if="detailTask.started_at">
              <div class="ds-label">{{ $t('position_eval.task.started_at') }}</div>
              <div class="ds-value text-mono text-dim">{{ formatDt(detailTask.started_at) }}</div>
            </div>
            <div class="ds-item" v-if="detailTask.completed_at">
              <div class="ds-label">{{ $t('position_eval.task.completed_at') }}</div>
              <div class="ds-value text-mono text-dim">{{ formatDt(detailTask.completed_at) }}</div>
            </div>
            <div class="ds-item" v-if="detailTask.error_message">
              <div class="ds-label">{{ $t('position_eval.detail.error') }}</div>
              <div class="ds-value text-danger">{{ detailTask.error_message }}</div>
            </div>
          </div>

          <!-- 推荐统计 -->
          <div v-if="detailTask.result_summary?.recommendation_counts" class="rec-summary">
            <div class="rs-title">{{ $t('position_eval.detail.rec_distribution') }}</div>
            <div class="rec-chips">
              <div
                v-for="(count, rec) in detailTask.result_summary.recommendation_counts"
                :key="rec"
                class="rec-chip"
                :class="`rec-${String(rec).toLowerCase()}`"
              >
                <span class="rc-label">{{ rec }}</span>
                <span class="rc-count">{{ count }}</span>
              </div>
            </div>
          </div>

          <!-- 逐标的结果表格 -->
          <div v-if="detailTask.result_detail && detailTask.result_detail.length > 0">
            <div class="section-title">{{ $t('position_eval.detail.per_symbol') }}</div>
            <table class="data-table detail-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>{{ $t('position_eval.detail.overall') }}</th>
                  <th>Tech</th>
                  <th>Fund</th>
                  <th>Sent</th>
                  <th>{{ $t('position_eval.detail.recommendation') }}</th>
                  <th>{{ $t('position_eval.detail.risk') }}</th>
                  <th>{{ $t('position_eval.detail.stop_loss') }}</th>
                  <th>{{ $t('position_eval.detail.take_profit') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in detailTask.result_detail" :key="row.symbol"
                    :class="row.status !== 'ok' ? 'row-muted' : ''">
                  <td class="text-mono font-bold">{{ row.symbol }}</td>
                  <td class="text-mono" :class="scoreClass(row.overall_score)">
                    {{ row.overall_score ?? '-' }}
                  </td>
                  <td class="text-mono text-dim">{{ row.technical_score ?? '-' }}</td>
                  <td class="text-mono text-dim">{{ row.fundamental_score ?? '-' }}</td>
                  <td class="text-mono text-dim">{{ row.sentiment_score ?? '-' }}</td>
                  <td>
                    <span v-if="row.recommendation" class="chip" :class="`rec-${row.recommendation.toLowerCase()}`">
                      {{ row.recommendation }}
                    </span>
                    <span v-else class="text-dim">{{ row.status }}</span>
                  </td>
                  <td>
                    <span v-if="row.risk_level" class="chip" :class="`risk-${row.risk_level.toLowerCase()}`">
                      {{ row.risk_level }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="text-mono text-dim">{{ row.stop_loss ? row.stop_loss.toFixed(2) : '-' }}</td>
                  <td class="text-mono text-dim">{{ row.take_profit ? row.take_profit.toFixed(2) : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="detailTask.status === 'DONE'" class="state-empty">
            {{ $t('position_eval.detail.no_result') }}
          </div>
        </div>
        <div v-else class="state-loading">{{ $t('common.loading') }}</div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  type PositionEvalTask,
  type PositionEvalTaskDetail,
  type TaskTriggerConfig,
  type TaskType,
  listPendingEvalTasks,
  listEvalTaskHistory,
  triggerEvalTask,
  batchDeletePendingTasks,
  getEvalTaskDetail,
  listTaskTriggerConfigs,
  createTaskTriggerConfig,
  updateTaskTriggerConfig,
  toggleTaskTriggerConfig,
} from '../api/client'

const { t } = useI18n()

// ─── Tabs ─────────────────────────────
const activeTab = ref<'pending' | 'history'>('pending')
const tabs = computed(() => [
  { key: 'pending', label: t('position_eval.tab.pending'), badge: pendingTasks.value.length || undefined },
  { key: 'history', label: t('position_eval.tab.history'), badge: undefined },
])

// ─── Available options ─────────────────
const availableDimensions = ['technical', 'fundamental', 'composite']

// ─── Pending tasks state ───────────────
const pendingTasks = ref<PositionEvalTask[]>([])
const loadingPending = ref(false)
const selectedPending = ref<number[]>([])

const allPendingSelected = computed(
  () => pendingTasks.value.length > 0 && selectedPending.value.length === pendingTasks.value.length
)
function toggleSelectAllPending(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  selectedPending.value = checked ? pendingTasks.value.map(t => t.id) : []
}

async function loadPending() {
  loadingPending.value = true
  selectedPending.value = []
  try {
    const res = await listPendingEvalTasks()
    pendingTasks.value = res.items
  } catch (e) { console.error(e) }
  finally { loadingPending.value = false }
}

async function batchDeletePending() {
  if (selectedPending.value.length === 0) return
  if (!confirm(t('position_eval.pending.delete_confirm', { n: selectedPending.value.length }))) return
  try {
    await batchDeletePendingTasks(selectedPending.value)
    await loadPending()
  } catch (e) { console.error(e) }
}

// ─── Trigger task state ────────────────
const showTriggerDialog = ref(false)
const triggering = ref(false)
const triggerError = ref('')
const defaultTriggerForm = () => ({
  config_id: undefined as number | undefined,
  scope: 'ALL_POSITIONS' as 'ALL_POSITIONS' | 'SYMBOL_LIST',
  eval_dimensions: ['composite'] as string[],
})
const triggerForm = ref(defaultTriggerForm())
const triggerSymbolsStr = ref('')

// ─── Config state ──────────────────────
const configs = ref<TaskTriggerConfig[]>([])
const showConfigDialog = ref(false)
const editingConfig = ref(false)
const savingConfig = ref(false)
const configError = ref('')
const configForm = ref({
  id: undefined as number | undefined,
  name: '',
  description: '',
  scope: 'ALL_POSITIONS' as 'ALL_POSITIONS' | 'SYMBOL_LIST',
  eval_dimensions: ['composite'] as string[],
  trigger_mode: 'MANUAL' as 'MANUAL' | 'DAILY' | 'WEEKLY' | 'CRON',
  trigger_time: '',
  enabled: true,
})
const configFormSymbolsStr = ref('')

async function loadConfigs() {
  try {
    const res = await listTaskTriggerConfigs('POSITION_EVAL')
    configs.value = res.configs
  } catch (e) { console.error(e) }
}

function openConfigDialog(cfg?: TaskTriggerConfig) {
  configError.value = ''
  editingConfig.value = !!cfg
  if (cfg) {
    configForm.value = {
      id: cfg.id,
      name: cfg.name,
      description: cfg.description || '',
      scope: (cfg.params?.scope || 'ALL_POSITIONS') as any,
      eval_dimensions: cfg.params?.eval_dimensions || ['composite'],
      trigger_mode: cfg.trigger_mode,
      trigger_time: cfg.trigger_time || '',
      enabled: cfg.enabled,
    }
    configFormSymbolsStr.value = (cfg.params?.symbols || []).join(',')
  } else {
    configForm.value = {
      id: undefined,
      name: '',
      description: '',
      scope: 'ALL_POSITIONS',
      eval_dimensions: ['composite'],
      trigger_mode: 'MANUAL',
      trigger_time: '',
      enabled: true,
    }
    configFormSymbolsStr.value = ''
  }
  showConfigDialog.value = true
}

async function saveConfig() {
  configError.value = ''
  savingConfig.value = true
  try {
    const symbols = configFormSymbolsStr.value.split(',').map(s => s.trim()).filter(Boolean)
    const payload = {
      task_type: 'POSITION_EVAL' as TaskType,
      name: configForm.value.name,
      description: configForm.value.description,
      trigger_mode: configForm.value.trigger_mode,
      trigger_time: configForm.value.trigger_time || undefined,
      enabled: configForm.value.enabled,
      params: {
        scope: configForm.value.scope,
        symbols: configForm.value.scope === 'SYMBOL_LIST' ? symbols : undefined,
        eval_dimensions: configForm.value.eval_dimensions,
      }
    }

    if (editingConfig.value && configForm.value.id) {
      await updateTaskTriggerConfig(configForm.value.id, payload)
    } else {
      await createTaskTriggerConfig(payload)
    }
    showConfigDialog.value = false
    await loadConfigs()
  } catch (e: any) {
    configError.value = e?.response?.data?.detail || t('common.unknown_error')
  } finally {
    savingConfig.value = false
  }
}

function openTriggerDialog(configId?: number) {
  triggerError.value = ''
  triggerForm.value = defaultTriggerForm()
  triggerSymbolsStr.value = ''
  if (configId !== undefined) triggerForm.value.config_id = configId
  loadConfigs()
  showTriggerDialog.value = true
}

async function doTriggerTask() {
  triggerError.value = ''
  triggering.value = true
  try {
    const symbols = triggerSymbolsStr.value.split(',').map(s => s.trim()).filter(Boolean)
    await triggerEvalTask({
      config_id: triggerForm.value.config_id,
      scope: triggerForm.value.scope,
      symbols: triggerForm.value.scope === 'SYMBOL_LIST' ? symbols : undefined,
      eval_dimensions: triggerForm.value.eval_dimensions,
    })
    showTriggerDialog.value = false
    activeTab.value = 'pending'
    await loadPending()
  } catch (e: any) {
    triggerError.value = e?.response?.data?.detail || t('common.unknown_error')
  } finally {
    triggering.value = false
  }
}

// ─── History state ─────────────────────
const historyTasks = ref<PositionEvalTask[]>([])
const historyTotal = ref(0)
const historyPage = ref(1)
const historyPageSize = 20
const historyStatusFilter = ref('')
const loadingHistory = ref(false)

async function loadHistory(page = 1) {
  loadingHistory.value = true
  historyPage.value = page
  try {
    const res = await listEvalTaskHistory({
      page,
      page_size: historyPageSize,
      status: historyStatusFilter.value || undefined,
    })
    historyTasks.value = res.items
    historyTotal.value = res.total
  } catch (e) { console.error(e) }
  finally { loadingHistory.value = false }
}

// ─── Detail drawer ─────────────────────
const showDetailDrawer = ref(false)
const detailTask = ref<PositionEvalTaskDetail | null>(null)

async function viewTaskDetail(taskId: number) {
  detailTask.value = null
  showDetailDrawer.value = true
  try {
    detailTask.value = await getEvalTaskDetail(taskId)
  } catch (e) { console.error(e) }
}

// ─── Helpers ───────────────────────────
function formatDt(dt?: string | null): string {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

function scoreClass(score?: number | null): string {
  if (score == null) return ''
  if (score >= 75) return 'score-high'
  if (score >= 55) return 'score-mid'
  return 'score-low'
}

onMounted(() => {
  loadPending()
  loadHistory()
  loadConfigs()
})
</script>

<style scoped>
/* ════════════════════════════════════════
   Design tokens（Bloomberg Terminal）
   ════════════════════════════════════════ */
.pe-page {
  --bg:           #0b1120;
  --bg-card:      #0f1624;
  --bg-hover:     #151f30;
  --border:       rgba(56,189,248,0.12);
  --border-hover: rgba(56,189,248,0.28);
  --accent:       #38bdf8;
  --profit:       #10b981;
  --loss:         #ef4444;
  --warn:         #f59e0b;
  --text:         #e2e8f0;
  --text-dim:     #64748b;
  --text-bright:  #f8fafc;
  --radius:       8px;

  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding: 24px;
  font-family: -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif;
}

/* ─── Header ──────────────────────────── */
.pe-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-bright);
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-subtitle {
  font-size: 0.8rem;
  color: var(--text-dim);
  margin: 0;
}

/* ─── Tabs ────────────────────────────── */
.tab-nav {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 18px;
}
.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 18px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-dim);
  cursor: pointer;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.18s;
  margin-bottom: -1px;
}
.tab-btn:hover { color: var(--text); }
.tab-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}
.tab-badge {
  background: rgba(56,189,248,0.15);
  color: var(--accent);
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: 'SF Mono', monospace;
}

/* ─── Toolbar ─────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

/* ─── Buttons ─────────────────────────── */
.btn-primary {
  padding: 7px 16px;
  background: rgba(56,189,248,0.12);
  color: var(--accent);
  border: 1px solid rgba(56,189,248,0.3);
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.btn-primary:hover { background: rgba(56,189,248,0.2); }

.btn-accent {
  padding: 7px 18px;
  background: rgba(56,189,248,0.18);
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-accent:hover { background: rgba(56,189,248,0.3); }

.btn-ghost {
  padding: 7px 16px;
  background: none;
  color: var(--text-dim);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.18s;
}
.btn-ghost:hover { border-color: var(--border-hover); color: var(--text); }

.btn-trigger {
  padding: 8px 18px;
  background: linear-gradient(135deg, rgba(56,189,248,0.22), rgba(56,189,248,0.08));
  color: var(--accent);
  border: 1px solid rgba(56,189,248,0.4);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.btn-trigger:hover { background: linear-gradient(135deg, rgba(56,189,248,0.35), rgba(56,189,248,0.15)); }

.btn-danger-sm {
  padding: 7px 14px;
  background: rgba(239,68,68,0.08);
  color: var(--loss);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.btn-danger-sm:hover:not(:disabled) { background: rgba(239,68,68,0.18); }
.btn-danger-sm:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-icon-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-dim);
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.18s;
}
.btn-icon-sm:hover { color: var(--accent); border-color: var(--border-hover); }

.btn-link {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.78rem;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}
.btn-link:hover { background: rgba(56,189,248,0.08); }
.btn-link.btn-danger { color: var(--loss); }
.btn-link.btn-danger:hover { background: rgba(239,68,68,0.1); }

/* ─── Table ───────────────────────────── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.data-table th {
  text-align: left;
  padding: 9px 12px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-dim);
  border-bottom: 1px solid var(--border);
  font-family: 'SF Mono', monospace;
  white-space: nowrap;
}
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  vertical-align: middle;
}
.data-table tr:hover td { background: var(--bg-hover); }
.data-table .col-check { width: 36px; }

.row-muted td { opacity: 0.5; }

/* ─── Form ────────────────────────────── */
.form-row { margin-bottom: 14px; }
.form-row label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-dim); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.05em; }
.tz-label { font-size: 0.7rem; font-weight: 400; color: var(--accent); text-transform: none; letter-spacing: 0; margin-left: 4px; }
.form-hint { display: block; font-size: 0.7rem; color: var(--text-dim); margin-top: 4px; opacity: 0.75; }
.form-row-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.input-text, .input-textarea, .select-text {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 0.82rem;
  box-sizing: border-box;
  transition: border-color 0.18s;
  font-family: inherit;
}
.input-text:focus, .input-textarea:focus, .select-text:focus {
  outline: none;
  border-color: var(--accent);
}
.select-text option { background: #1e293b; }
.select-sm {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  cursor: pointer;
}
.select-sm option { background: #1e293b; }

.radio-group, .check-group { display: flex; gap: 14px; flex-wrap: wrap; }
.radio-label, .check-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text);
  cursor: pointer;
  text-transform: none;
  font-weight: normal;
  letter-spacing: normal;
}
.form-error {
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 6px;
  color: var(--loss);
  font-size: 0.8rem;
}

/* ─── Chips ───────────────────────────── */
.chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(255,255,255,0.07);
  color: var(--text);
  font-family: 'SF Mono', monospace;
}
.chip-sm { font-size: 0.65rem; opacity: 0.75; margin-left: 4px; }
.chip-dim { background: rgba(56,189,248,0.08); color: var(--accent); }

.mode-manual  { background: rgba(100,116,139,0.15); color: #94a3b8; }
.mode-daily   { background: rgba(56,189,248,0.12);  color: var(--accent); }
.mode-weekly  { background: rgba(245,158,11,0.12);  color: var(--warn); }

/* ─── Status ──────────────────────────── */
.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
}
.status-dot.active  { background: var(--profit); box-shadow: 0 0 5px var(--profit); }
.status-dot.inactive { background: var(--text-dim); }

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  font-family: 'SF Mono', monospace;
  letter-spacing: 0.05em;
}
.status-pending  { background: rgba(245,158,11,0.15);  color: var(--warn);   border: 1px solid rgba(245,158,11,0.3); }
.status-running  { background: rgba(56,189,248,0.15);  color: var(--accent); border: 1px solid rgba(56,189,248,0.3); animation: blink 1.5s ease-in-out infinite; }
.status-done     { background: rgba(16,185,129,0.12);  color: var(--profit); border: 1px solid rgba(16,185,129,0.3); }
.status-failed   { background: rgba(239,68,68,0.12);   color: var(--loss);   border: 1px solid rgba(239,68,68,0.3); }
.status-cancelled{ background: rgba(100,116,139,0.15); color: var(--text-dim); border: 1px solid rgba(100,116,139,0.3); }
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ─── Score colors ───────────────────── */
.score-high { color: var(--profit); font-weight: 700; }
.score-mid  { color: var(--warn);   font-weight: 600; }
.score-low  { color: var(--loss);   font-weight: 600; }

/* ─── Recommendation chips ────────────── */
.rec-strong_buy, .rec-strong_sell { font-weight: 800; }
.rec-strong_buy { background: rgba(16,185,129,0.22); color: #10b981; }
.rec-buy        { background: rgba(16,185,129,0.12); color: #34d399; }
.rec-hold       { background: rgba(245,158,11,0.12); color: var(--warn); }
.rec-reduce     { background: rgba(239,68,68,0.10); color: #fb923c; }
.rec-sell, .rec-strong_sell { background: rgba(239,68,68,0.15); color: var(--loss); }

/* ─── Risk chips ──────────────────────── */
.risk-low     { background: rgba(16,185,129,0.12); color: #10b981; }
.risk-medium  { background: rgba(245,158,11,0.12); color: var(--warn); }
.risk-high    { background: rgba(239,68,68,0.12);  color: var(--loss); }
.risk-extreme { background: rgba(220,38,38,0.18);  color: #dc2626; }

/* ─── Cfg table ───────────────────────── */
.cfg-name { font-weight: 600; color: var(--text-bright); }
.cfg-desc { display: block; font-size: 0.7rem; color: var(--text-dim); margin-top: 2px; }
.actions { white-space: nowrap; display: flex; gap: 4px; }

/* ─── Pagination ──────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}
.btn-page {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 5px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}
.btn-page:disabled { opacity: 0.35; cursor: not-allowed; }
.page-info { font-size: 0.78rem; color: var(--text-dim); font-family: 'SF Mono', monospace; }

/* ─── States ──────────────────────────── */
.state-loading, .state-empty {
  text-align: center;
  padding: 40px;
  color: var(--text-dim);
  font-size: 0.85rem;
}

/* ─── Modal ───────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}
.modal {
  background: #111827;
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 520px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-header h3 { font-size: 0.95rem; font-weight: 700; color: var(--text-bright); margin: 0; }
.modal-close {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 4px;
}
.modal-close:hover { color: var(--text); background: rgba(255,255,255,0.06); }
.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ─── Drawer ──────────────────────────── */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}
.drawer {
  background: #111827;
  border-left: 1px solid var(--border);
  width: 760px;
  max-width: 95vw;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -12px 0 40px rgba(0,0,0,0.45);
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.drawer-header h3 { font-size: 0.95rem; font-weight: 700; color: var(--text-bright); margin: 0; }
.drawer-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* ─── Detail drawer internals ─────────── */
.detail-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
}
.ds-item { flex: 1 1 auto; }
.ds-label { font-size: 0.65rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 3px; }
.ds-value { font-size: 0.85rem; color: var(--text-bright); }

.rec-summary { margin-bottom: 18px; }
.rs-title { font-size: 0.72rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
.rec-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.rec-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid transparent;
}
.rc-count { font-family: 'SF Mono', monospace; font-size: 0.85rem; }

.section-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 10px;
}

.detail-table { font-size: 0.75rem; }
.detail-table th, .detail-table td { padding: 7px 8px; }

/* ─── Misc helpers ────────────────────── */
.text-dim   { color: var(--text-dim); }
.text-mono  { font-family: 'SF Mono', 'Fira Code', monospace; }
.text-danger{ color: var(--loss); }
.font-bold  { font-weight: 700; }

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
