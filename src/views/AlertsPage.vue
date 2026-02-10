<template>
  <div class="alerts-page">
    <h1 class="page-title">价格告警</h1>

    <div class="toolbar">
      <button class="btn-primary" @click="showCreate = true">+ 新建告警</button>
      <select v-model="filterStatus" @change="reload">
        <option value="">全部</option>
        <option value="ACTIVE">活跃</option>
        <option value="TRIGGERED">已触发</option>
        <option value="PAUSED">暂停</option>
      </select>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <!-- 告警列表 -->
    <div class="alert-list">
      <div v-for="a in (alerts || [])" :key="a.id" class="alert-card">
        <div class="a-header">
          <span class="a-symbol">{{ a.symbol }}</span>
          <span class="a-cond">{{ condLabel(a.condition_type) }} ${{ a.threshold }}</span>
          <span class="a-status" :class="'st-' + (a.alert_status || '').toLowerCase()">{{ a.alert_status }}</span>
        </div>
        <div class="a-body">
          <span>动作: {{ a.action }}</span>
          <span v-if="a.triggered_at">触发于: {{ formatTime(a.triggered_at) }}</span>
        </div>
        <div class="a-actions">
          <button v-if="a.alert_status === 'ACTIVE'" class="btn-small warn" @click="pauseAlert(a)">暂停</button>
          <button v-if="a.alert_status === 'PAUSED'" class="btn-small" @click="resumeAlert(a)">恢复</button>
          <button class="btn-small danger" @click="removeAlert(a.id)">删除</button>
        </div>
      </div>
      <div v-if="(!alerts || alerts.length === 0) && !loading" class="empty">暂无告警规则</div>
    </div>

    <!-- 告警历史 -->
    <div class="card history-card">
      <h3>触发历史</h3>
      <div v-for="h in (history || [])" :key="h.id" class="hist-item">
        <span class="h-symbol">{{ h.symbol }}</span>
        <span>触发价 ${{ h.trigger_price }}</span>
        <span class="h-time">{{ formatTime(h.trigger_time) }}</span>
        <span v-if="h.action_taken" class="h-action">{{ h.action_taken }}</span>
      </div>
      <div v-if="!history || history.length === 0" class="empty">暂无触发记录</div>
    </div>

    <!-- 创建弹窗 -->
    <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
      <div class="modal">
        <h3>新建价格告警</h3>
        <div class="form-grid">
          <label>标的 <input v-model="form.symbol" placeholder="AAPL" /></label>
          <label>条件
            <select v-model="form.condition_type">
              <option value="price_above">价格高于</option>
              <option value="price_below">价格低于</option>
            </select>
          </label>
          <label>阈值 <input v-model.number="form.threshold" type="number" step="0.01" /></label>
          <label>动作
            <select v-model="form.action">
              <option value="notify">仅通知</option>
              <option value="auto_execute">自动执行</option>
            </select>
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreate = false">取消</button>
          <button class="btn-primary" @click="submitCreate">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAlertStore } from '@/stores/alert'

const store = useAlertStore()
const { alerts, history, loading } = storeToRefs(store)

const filterStatus = ref('')
const showCreate = ref(false)
const form = reactive({ symbol: '', condition_type: 'price_above', threshold: 0, action: 'notify' })

async function reload() { await store.load(filterStatus.value || undefined) }
async function submitCreate() {
  await store.add({ ...form })
  showCreate.value = false
  form.symbol = ''; form.threshold = 0
}
async function pauseAlert(a: any) { await store.edit(a.id, { alert_status: 'PAUSED' }) }
async function resumeAlert(a: any) { await store.edit(a.id, { alert_status: 'ACTIVE' }) }
async function removeAlert(id: number) { await store.remove(id) }
function condLabel(t: string) { return t === 'price_above' ? '价格 ≥' : t === 'price_below' ? '价格 ≤' : t }
function formatTime(ts: string) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await Promise.all([store.load(), store.loadHistory()])
})
</script>

<style scoped>
.alerts-page { padding: 0; }
.page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
.btn-primary { padding: 6px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
.btn-secondary { padding: 6px 16px; background: var(--bg-secondary, #e5e7eb); border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
.btn-small { padding: 2px 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.75rem; background: #6366f1; color: #fff; }
.btn-small.warn { background: #f59e0b; }
.btn-small.danger { background: #ef4444; }
.toolbar select { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border, #ddd); }
.loading { text-align: center; padding: 2rem; color: var(--text-secondary); }
.alert-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.alert-card { background: var(--bg-card, #fff); border-radius: 12px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.a-header { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
.a-symbol { font-weight: 700; font-size: 1.05rem; }
.a-cond { font-size: 0.85rem; color: var(--text-secondary); }
.a-status { margin-left: auto; font-size: 0.7rem; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
.st-active { background: #d1fae5; color: #065f46; }
.st-triggered { background: #fef3c7; color: #92400e; }
.st-paused { background: #e5e7eb; color: #374151; }
.a-body { display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px; }
.a-actions { display: flex; gap: 8px; }
.card { background: var(--bg-card, #fff); border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.card h3 { font-size: 1rem; margin-bottom: 12px; }
.hist-item { display: flex; gap: 12px; padding: 6px 0; border-bottom: 1px solid var(--border, #eee); font-size: 0.85rem; }
.h-symbol { font-weight: 600; min-width: 60px; }
.h-time { color: var(--text-secondary); }
.h-action { color: #6366f1; }
.empty { color: var(--text-secondary); text-align: center; padding: 1rem; font-size: 0.85rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--bg-card, #fff); border-radius: 16px; padding: 24px; width: 400px; }
.modal h3 { margin-bottom: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.form-grid label { display: flex; flex-direction: column; font-size: 0.85rem; }
.form-grid input, .form-grid select { margin-top: 4px; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
</style>
