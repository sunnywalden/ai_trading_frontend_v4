<template>
  <div class="pe-page">
    <div class="pe-header">
      <div class="header-left">
        <h2 class="page-title"><span class="icon">⚙️</span> {{ $t('nav.task_management') }}</h2>
        <p class="page-subtitle">统一查看 APScheduler 真实任务，并管理可配置的业务自动触发任务</p>
      </div>
      <div class="header-right">
        <button
          v-if="panelMode === 'configs'"
          class="btn-primary"
          @click="openConfigDialog()"
        >
          + 新增配置
        </button>
        <button
          v-else
          class="btn-primary"
          @click="loadSchedulerJobs"
          :disabled="schedulerLoading"
        >
          {{ schedulerLoading ? '刷新中...' : '刷新调度器' }}
        </button>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">调度器任务</div>
        <div class="summary-value">{{ schedulerJobs.length }}</div>
        <div class="summary-sub">运行中的 APScheduler 全量任务</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">动态配置</div>
        <div class="summary-value">{{ configs.length }}</div>
        <div class="summary-sub">TaskTriggerConfig 业务任务</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">动态已启用</div>
        <div class="summary-value">{{ enabledConfigCount }}</div>
        <div class="summary-sub">当前启用的业务自动化配置</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">配置内置缺口</div>
        <div class="summary-value">{{ schedulerJobs.length - dynamicSchedulerJobs.length }}</div>
        <div class="summary-sub">尚未纳入配置中心的内置任务</div>
      </div>
    </div>

    <div class="view-switch">
      <button
        class="view-chip"
        :class="{ active: panelMode === 'scheduler' }"
        @click="panelMode = 'scheduler'"
      >
        调度器总览
      </button>
      <button
        class="view-chip"
        :class="{ active: panelMode === 'configs' }"
        @click="panelMode = 'configs'"
      >
        动态任务配置
      </button>
    </div>

    <div v-if="panelMode === 'scheduler'" class="scheduler-panel">
      <div class="toolbar">
        <div class="filter-group">
          <button
            v-for="group in schedulerGroups"
            :key="group.value"
            class="filter-chip"
            :class="{ active: selectedSchedulerGroup === group.value }"
            @click="selectedSchedulerGroup = group.value"
          >
            {{ group.label }}
          </button>
        </div>
        <button
          class="btn-icon-sm"
          @click="loadSchedulerJobs"
          :class="{ spinning: schedulerLoading }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
        </button>
      </div>

      <div v-if="schedulerLoading" class="state-loading">{{ $t('common.loading') }}</div>
      <div v-else-if="schedulerError" class="state-empty">{{ schedulerError }}</div>
      <div v-else class="table-wrap">
        <table class="scheduler-table">
          <thead>
            <tr>
              <th>任务</th>
              <th>分组</th>
              <th>触发器</th>
              <th>下次执行</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="job in filteredSchedulerJobs" :key="job.id">
              <td>
                <div class="primary-cell">{{ job.name }}</div>
                <div class="secondary-cell mono">{{ job.id }}</div>
              </td>
              <td>
                <span class="scheduler-group-tag">{{ getSchedulerGroupLabel(job.id) }}</span>
              </td>
              <td class="mono">{{ job.trigger }}</td>
              <td class="mono">{{ job.next_run_time || '-' }}</td>
              <td>
                <span class="scheduler-status" :class="job.status === 'active' ? 'is-active' : 'is-paused'">
                  {{ job.status === 'active' ? '运行中' : '已暂停' }}
                </span>
              </td>
              <td>
                <button
                  class="btn-link"
                  :disabled="schedulerActionJobId === job.id"
                  @click="toggleSchedulerState(job)"
                >
                  {{ schedulerActionJobId === job.id ? '处理中...' : (job.status === 'active' ? '暂停' : '恢复') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template v-else>
    <div class="toolbar">
      <div class="filter-group">
        <button 
          v-for="tInfo in taskTypes" 
          :key="tInfo.value"
          class="filter-chip"
          :class="{ active: selectedType === tInfo.value }"
          @click="selectedType = tInfo.value; loadConfigs()"
        >
          {{ tInfo.label }}
        </button>
      </div>
      <button class="btn-icon-sm" @click="loadConfigs" :class="{ spinning: loading }">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
      </button>
    </div>

    <!-- 列表 -->
    <div v-if="loading" class="state-loading">{{ $t('common.loading') }}</div>
    <div v-else-if="configs.length === 0" class="state-empty">暂无任务配置记录</div>
    <div v-else class="config-grid">
      <div v-for="cfg in configs" :key="cfg.id" class="config-card" :class="{ disabled: !cfg.enabled }">
        <div class="card-header">
          <div class="type-tag" :class="cfg.task_type.toLowerCase()">{{ getTaskTypeLabel(cfg.task_type) }}</div>
          <div class="status-toggle">
            <span class="status-text">{{ cfg.enabled ? '已启用' : '已禁用' }}</span>
            <input type="checkbox" :checked="cfg.enabled" @change="toggleConfig(cfg)" />
          </div>
        </div>
        <h4 class="cfg-name">{{ cfg.name }}</h4>
        <p class="cfg-desc">{{ cfg.description || '暂无描述' }}</p>
        
        <div class="cfg-details">
          <div class="detail-item">
            <span class="label">触发方式:</span>
            <span class="value">{{ $t(`position_eval.trigger.${cfg.trigger_mode.toLowerCase()}`) }}</span>
          </div>
          <div class="detail-item" v-if="cfg.trigger_time">
            <span class="label">执行时间:</span>
            <span class="value text-mono">{{ cfg.trigger_time }}</span>
          </div>
        </div>

        <div class="card-footer">
          <div class="time">{{ formatDt(cfg.updated_at) }}</div>
          <div class="actions">
            <button class="btn-link" @click="openConfigDialog(cfg)">编辑</button>
            <button class="btn-link btn-danger" @click="confirmDelete(cfg)">删除</button>
          </div>
        </div>
      </div>
    </div>
    </template>

    <!-- 编辑弹窗 -->
    <div v-if="showDialog" class="modal-overlay" @click.self="showDialog = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingId ? '编辑任务配置' : '新建任务配置' }}</h3>
          <button class="btn-close" @click="showDialog = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>任务类型 *</label>
            <select v-model="form.task_type" class="input-text" :disabled="!!editingId">
              <option value="POSITION_EVAL">持仓评估 (POSITION_EVAL)</option>
              <option value="OPPORTUNITY_SCAN">机会扫描 (OPPORTUNITY_SCAN)</option>
              <option value="DATA_WARMUP">数据预热 (DATA_WARMUP)</option>
              <option value="SYSTEM_HEALTH">系统健康 (SYSTEM_HEALTH)</option>
            </select>
          </div>
          <div class="form-row">
            <label>配置名称 *</label>
            <input v-model="form.name" class="input-text" placeholder="例如：美股全量持仓每日评估" />
          </div>
          <div class="form-row">
            <label>触发模式 *</label>
            <div class="radio-group">
              <label><input type="radio" value="MANUAL" v-model="form.trigger_mode" /> 手动</label>
              <label><input type="radio" value="DAILY" v-model="form.trigger_mode" /> 每日</label>
              <label><input type="radio" value="WEEKLY" v-model="form.trigger_mode" /> 每周</label>
              <label><input type="radio" value="CRON" v-model="form.trigger_mode" /> Cron</label>
            </div>
          </div>
          <div class="form-row" v-if="form.trigger_mode !== 'MANUAL'">
            <label>定时时间 (UTC+8) *</label>
            <input v-model="form.trigger_time" class="input-text" placeholder="09:30" />
          </div>

          <!-- 特定参数部分 -->
          <div class="params-section">
            <h5 class="section-title">执行参数</h5>
            
            <template v-if="form.task_type === 'POSITION_EVAL'">
              <div class="form-row">
                <label>评估范围</label>
                <select v-model="form.params.scope" class="input-text">
                  <option value="ALL_POSITIONS">当前所有持仓</option>
                  <option value="SYMBOL_LIST">指定代码列表</option>
                </select>
              </div>
              <div class="form-row" v-if="form.params.scope === 'SYMBOL_LIST'">
                <label>代码列表 (逗号分隔)</label>
                <textarea v-model="symbolsText" class="input-text" rows="2" placeholder="AAPL,TSLA,NVDA"></textarea>
              </div>
            </template>

            <template v-if="form.task_type === 'OPPORTUNITY_SCAN'">
              <div class="form-row">
                <label>股票池 (Universe)</label>
                <input v-model="form.params.universe" class="input-text" placeholder="例如: US_TECH" />
              </div>
              <div class="form-row">
                <label>策略 IDs (逗号分隔)</label>
                <input v-model="form.params.strategies" class="input-text" placeholder="strat_1, strat_2" />
              </div>
            </template>
          </div>

          <div class="form-row">
            <label class="check-label">
              <input type="checkbox" v-model="form.enabled" /> 启用此配置
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="saveConfig" :disabled="saving">
            {{ saving ? '保存中...' : '保存配置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { formatClientDateTime } from '@/utils/datetime'
import {
  createTaskTriggerConfig,
  deleteTaskTriggerConfig,
  fetchSchedulerJobsList,
  listTaskTriggerConfigs,
  pauseSchedulerJob,
  resumeSchedulerJob,
  toggleTaskTriggerConfig,
  updateTaskTriggerConfig,
  type SchedulerJobDetail,
  type TaskTriggerConfig,
  type TaskType,
  type TriggerMode
} from '../api/client'

const configs = ref<TaskTriggerConfig[]>([])
const loading = ref(false)
const panelMode = ref<'scheduler' | 'configs'>('scheduler')
const selectedType = ref<TaskType | ''>('')
const schedulerJobs = ref<SchedulerJobDetail[]>([])
const schedulerLoading = ref(false)
const schedulerError = ref('')
const schedulerActionJobId = ref('')
const selectedSchedulerGroup = ref('ALL')
const taskTypes = [
  { value: '' as const, label: '全部' },
  { value: 'POSITION_EVAL' as const, label: '持仓评估' },
  { value: 'OPPORTUNITY_SCAN' as const, label: '机会扫描' },
  { value: 'DATA_WARMUP' as const, label: '数据预热' },
  { value: 'SYSTEM_HEALTH' as const, label: '系统健康' },
] as const

const schedulerGroups = [
  { value: 'ALL', label: '全部' },
  { value: 'DYNAMIC', label: '动态配置' },
  { value: 'QUANT', label: '量化闭环' },
  { value: 'DATA', label: '数据同步/刷新' },
  { value: 'OBS', label: '观测/健康' },
  { value: 'RESEARCH', label: '研究分析' },
  { value: 'OTHER', label: '其他' },
] as const

const enabledConfigCount = computed(() => configs.value.filter(cfg => cfg.enabled).length)
const dynamicSchedulerJobs = computed(() => schedulerJobs.value.filter(job => job.id.startsWith('dyn_task_')))
const filteredSchedulerJobs = computed(() => {
  if (selectedSchedulerGroup.value === 'ALL') {
    return schedulerJobs.value
  }
  return schedulerJobs.value.filter(
    job => getSchedulerGroup(job.id) === selectedSchedulerGroup.value
  )
})

async function loadConfigs() {
  loading.value = true
  try {
    const res = await listTaskTriggerConfigs(selectedType.value as TaskType || undefined)
    configs.value = res.configs
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadSchedulerJobs() {
  schedulerLoading.value = true
  schedulerError.value = ''
  try {
    const res = await fetchSchedulerJobsList()
    schedulerJobs.value = (res.jobs || []).slice().sort((left, right) => {
      return String(left.next_run_time || '').localeCompare(String(right.next_run_time || ''))
    })
  } catch (e: any) {
    schedulerError.value = e?.message || '加载调度器任务失败'
  } finally {
    schedulerLoading.value = false
  }
}

function getSchedulerGroup(jobId: string) {
  if (jobId.startsWith('dyn_task_')) return 'DYNAMIC'
  if (
    jobId.includes('trading_cycle')
    || jobId.includes('decision_cycle')
    || jobId.includes('position_')
    || jobId.includes('post_trade')
    || jobId.includes('broker_order_reconcile')
    || jobId.includes('adaptive_optimization')
    || jobId.includes('performance_eval')
  ) return 'QUANT'
  if (
    jobId.includes('refresh_')
    || jobId.includes('data_sync')
    || jobId.includes('journal_auto_close')
    || jobId.includes('signal_return_backfill')
    || jobId.includes('attribution_')
    || jobId.includes('broker_order_sync')
    || jobId.includes('cleanup_old_data')
    || jobId.includes('plan_expiration')
    || jobId.includes('market_universe')
  ) return 'DATA'
  if (
    jobId.includes('observability_')
    || jobId.includes('health')
    || jobId.includes('equity_')
    || jobId.includes('paper_graduation')
    || jobId.includes('ghost_trade')
    || jobId.includes('sync_task_trigger_configs')
  ) return 'OBS'
  if (
    jobId.includes('regime_')
    || jobId.includes('event_')
    || jobId.includes('insight_')
    || jobId.includes('ab_experiment')
    || jobId.includes('ai_hub_')
    || jobId.includes('m1_return_backfill')
  ) return 'RESEARCH'
  return 'OTHER'
}

function getSchedulerGroupLabel(jobId: string) {
  const key = getSchedulerGroup(jobId)
  return schedulerGroups.find(group => group.value === key)?.label || '其他'
}

async function toggleSchedulerState(job: SchedulerJobDetail) {
  schedulerActionJobId.value = job.id
  try {
    if (job.status === 'active') {
      await pauseSchedulerJob(job.id)
    } else {
      await resumeSchedulerJob(job.id)
    }
    await loadSchedulerJobs()
  } catch (e) {
    console.error(e)
  } finally {
    schedulerActionJobId.value = ''
  }
}

function getTaskTypeLabel(type: string) {
  return taskTypes.find(t => t.value === type)?.label || type
}

async function toggleConfig(cfg: TaskTriggerConfig) {
  try {
    const updated = await toggleTaskTriggerConfig(cfg.id, !cfg.enabled)
    Object.assign(cfg, updated)
  } catch (e) {
    console.error(e)
  }
}

// --- 编辑弹窗 ---
const showDialog = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const form = ref({
  task_type: 'POSITION_EVAL' as TaskType,
  name: '',
  description: '',
  trigger_mode: 'MANUAL' as TriggerMode,
  trigger_time: '09:00',
  enabled: true,
  params: {} as any
})

const symbolsText = ref('')
watch(symbolsText, (val) => {
  if (form.value.task_type === 'POSITION_EVAL' && form.value.params.scope === 'SYMBOL_LIST') {
    form.value.params.symbols = val.split(',').map(s => s.trim()).filter(s => !!s)
  }
})

function openConfigDialog(cfg?: TaskTriggerConfig) {
  if (cfg) {
    editingId.value = cfg.id
    form.value = {
      task_type: cfg.task_type as TaskType,
      name: cfg.name,
      description: cfg.description || '',
      trigger_mode: cfg.trigger_mode as TriggerMode,
      trigger_time: cfg.trigger_time || '',
      enabled: cfg.enabled,
      params: JSON.parse(JSON.stringify(cfg.params || {}))
    }
    if (cfg.task_type === 'POSITION_EVAL' && cfg.params?.symbols) {
      symbolsText.value = cfg.params.symbols.join(', ')
    } else {
      symbolsText.value = ''
    }
  } else {
    editingId.value = null
    form.value = {
      task_type: 'POSITION_EVAL' as TaskType,
      name: '',
      description: '',
      trigger_mode: 'MANUAL' as TriggerMode,
      trigger_time: '09:00',
      enabled: true,
      params: { scope: 'ALL_POSITIONS' }
    }
    symbolsText.value = ''
  }
  showDialog.value = true
}

async function saveConfig() {
  saving.value = true
  try {
    if (editingId.value) {
      await updateTaskTriggerConfig(editingId.value, form.value)
    } else {
      await createTaskTriggerConfig(form.value)
    }
    showDialog.value = false
    await loadConfigs()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function confirmDelete(cfg: TaskTriggerConfig) {
  if (confirm(`确定要删除任务配置 "${cfg.name}" 吗?`)) {
    try {
      await deleteTaskTriggerConfig(cfg.id)
      await loadConfigs()
    } catch (e) {
      console.error(e)
    }
  }
}

function formatDt(s: string) {
  return formatClientDateTime(s)
}

onMounted(() => {
  loadConfigs()
  loadSchedulerJobs()
})
</script>

<style scoped>
.pe-page { padding: 24px; max-width: 1400px; margin: 0 auto; color: #e5e7eb; }
.pe-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
.page-title { margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 10px; }
.page-subtitle { margin: 4px 0 0; color: #9ca3af; font-size: 0.95rem; }

.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
.summary-card { background: #111827; border: 1px solid #263246; border-radius: 12px; padding: 16px; }
.summary-label { color: #9ca3af; font-size: 0.78rem; }
.summary-value { margin-top: 10px; font-size: 1.6rem; font-weight: 700; color: #f3f4f6; }
.summary-sub { margin-top: 6px; color: #6b7280; font-size: 0.78rem; }

.view-switch { display: inline-flex; gap: 8px; background: #0f172a; border: 1px solid #263246; border-radius: 999px; padding: 6px; margin-bottom: 20px; }
.view-chip { border: none; background: transparent; color: #9ca3af; border-radius: 999px; padding: 8px 14px; cursor: pointer; font-weight: 600; }
.view-chip.active { background: #2563eb; color: #fff; }
.scheduler-panel { margin-bottom: 16px; }
.table-wrap { overflow-x: auto; border: 1px solid #263246; border-radius: 12px; background: #111827; }
.scheduler-table { width: 100%; border-collapse: collapse; }
.scheduler-table th,
.scheduler-table td { padding: 14px 16px; border-bottom: 1px solid #1f2937; text-align: left; font-size: 0.86rem; }
.scheduler-table th { color: #9ca3af; font-weight: 600; background: #0f172a; }
.primary-cell { color: #f3f4f6; font-weight: 600; }
.secondary-cell { color: #6b7280; margin-top: 4px; font-size: 0.75rem; }
.mono { font-family: Consolas, Monaco, monospace; }
.scheduler-group-tag { display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 999px; background: rgba(59, 130, 246, 0.12); color: #93c5fd; font-size: 0.75rem; }
.scheduler-status { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
.scheduler-status.is-active { background: rgba(16, 185, 129, 0.14); color: #6ee7b7; }
.scheduler-status.is-paused { background: rgba(245, 158, 11, 0.14); color: #fbbf24; }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.filter-group { display: flex; gap: 8px; }
.filter-chip {
  padding: 6px 16px; border-radius: 20px; border: 1px solid #374151;
  background: #1f2937; color: #9ca3af; cursor: pointer; font-size: 0.85rem; transition: all .2s;
}
.filter-chip:hover { border-color: #4b5563; color: #d1d5db; }
.filter-chip.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }

.config-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.config-card {
  background: #111827; border: 1px solid #374151; border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 12px; transition: border-color .2s;
}
.config-card:hover { border-color: #3b82f6; }
.config-card.disabled { opacity: 0.6; border-style: dashed; }

.card-header { display: flex; justify-content: space-between; align-items: center; }
.type-tag { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
.type-tag.position_eval { background: #1e3a8a; color: #93c5fd; }
.type-tag.opportunity_scan { background: #064e3b; color: #6ee7b7; }
.type-tag.data_warmup { background: #4c1d95; color: #ddd6fe; }
.type-tag.system_health { background: #374151; color: #d1d5db; }

.status-toggle { display: flex; align-items: center; gap: 8px; }
.status-text { font-size: 0.75rem; color: #9ca3af; }

.cfg-name { margin: 0; font-size: 1.1rem; color: #f3f4f6; }
.cfg-desc { margin: 0; font-size: 0.85rem; color: #9ca3af; line-height: 1.4; height: 1.4em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.cfg-details { background: #1f2937; padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 6px; }
.detail-item { display: flex; justify-content: space-between; font-size: 0.8rem; }
.detail-item .label { color: #9ca3af; }
.detail-item .value { color: #e5e7eb; font-weight: 500; }

.card-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #1f2937; padding-top: 12px; }
.time { font-size: 0.7rem; color: #6b7280; font-family: monospace; }
.actions { display: flex; gap: 12px; }

/* Modal Styles */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: #111827; border: 1px solid #374151; border-radius: 16px; width: 500px; max-width: 95vw; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
.modal-header { padding: 20px; border-bottom: 1px solid #1f2937; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 1.25rem; }
.btn-close { background: none; border: none; font-size: 1.5rem; color: #9ca3af; cursor: pointer; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; max-height: 70vh; overflow-y: auto; }
.form-row label { display: block; font-size: 0.8rem; color: #9ca3af; margin-bottom: 4px; }
.input-text { width: 100%; background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 10px; color: #fff; font-size: 0.95rem; }
.radio-group { display: flex; gap: 16px; margin-top: 4px; }
.radio-group label { display: flex; align-items: center; gap: 6px; cursor: pointer; color: #e5e7eb; }
.check-label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #e5e7eb; }

.params-section { background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); border-radius: 10px; padding: 16px; }
.section-title { margin: 0 0 12px; font-size: 0.9rem; color: #3b82f6; text-transform: uppercase; border-bottom: 1px solid rgba(59,130,246,0.2); padding-bottom: 4px; }

.modal-footer { padding: 20px; border-top: 1px solid #1f2937; display: flex; justify-content: flex-end; gap: 12px; }

.btn-primary { background: #3b82f6; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background .2s; }
.btn-primary:hover { background: #2563eb; }
.btn-ghost { background: transparent; color: #9ca3af; border: 1px solid #374151; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.btn-link { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 0.85rem; padding: 0; }
.btn-link:hover { text-decoration: underline; }
.btn-danger { color: #f87171; }

.text-mono { font-family: monospace; }
.spinning { animation: spin 1s linear infinite; }
@media (max-width: 1100px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .summary-grid { grid-template-columns: 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; gap: 12px; }
  .filter-group { flex-wrap: wrap; }
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
