<template>
  <div class="pe-page">
    <div class="pe-header">
      <div class="header-left">
        <h2 class="page-title"><span class="icon">⚙️</span> {{ $t('nav.task_management') }}</h2>
        <p class="page-subtitle">系统性管理机会扫描、持仓评估、数据同步等自动触发任务配置</p>
      </div>
      <div class="header-right">
        <button class="btn-primary" @click="openConfigDialog()">
          + 新增配置
        </button>
      </div>
    </div>

    <!-- 过滤器 -->
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
import { ref, onMounted, computed, watch, h } from 'vue'
import { 
  listTaskTriggerConfigs, 
  createTaskTriggerConfig, 
  updateTaskTriggerConfig, 
  deleteTaskTriggerConfig,
  toggleTaskTriggerConfig,
  type TaskTriggerConfig,
  type TaskType,
  type TriggerMode
} from '../api/client'

const configs = ref<TaskTriggerConfig[]>([])
const loading = ref(false)
const selectedType = ref<TaskType | ''>('')
const taskTypes = [
  { value: '' as const, label: '全部' },
  { value: 'POSITION_EVAL' as const, label: '持仓评估' },
  { value: 'OPPORTUNITY_SCAN' as const, label: '机会扫描' },
  { value: 'DATA_WARMUP' as const, label: '数据预热' },
  { value: 'SYSTEM_HEALTH' as const, label: '系统健康' },
] as const

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
  if (!s) return '-'
  return new Date(s).toLocaleString()
}

onMounted(() => {
  loadConfigs()
})
</script>

<style scoped>
.pe-page { padding: 24px; max-width: 1400px; margin: 0 auto; color: #e5e7eb; }
.pe-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
.page-title { margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 10px; }
.page-subtitle { margin: 4px 0 0; color: #9ca3af; font-size: 0.95rem; }

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
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
