<template>
  <div class="journal-page">
    <h1 class="page-title">交易日志</h1>

    <!-- 操作栏 -->
    <div class="toolbar">
      <button class="btn-primary" @click="showCreate = true">+ 新建日志</button>
      <select v-model="filterStatus" @change="reload">
        <option value="">全部</option>
        <option value="DRAFT">草稿</option>
        <option value="COMPLETED">已完成</option>
        <option value="REVIEWED">已复盘</option>
      </select>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <!-- 列表 -->
    <div class="journal-list">
      <div v-for="j in (journals || [])" :key="j.id" class="journal-card" @click="selectJournal(j)">
        <div class="j-header">
          <span class="j-symbol">{{ j.symbol }}</span>
          <span class="j-dir" :class="['BUY', 'LONG'].includes(j.direction) ? 'dir-buy' : 'dir-sell'">{{ j.direction }}</span>
          <span class="j-status" :class="'s-' + (j.journal_status || '').toLowerCase()">{{ j.journal_status }}</span>
        </div>
        <div class="j-body">
          <span>入场 {{ j.entry_date || '-' }} @ ${{ j.entry_price || '-' }}</span>
          <span>出场 {{ j.exit_date || '-' }} @ ${{ j.exit_price || '-' }}</span>
          <span class="j-pnl" :class="(j.realized_pnl ?? 0) >= 0 ? 'pnl-pos' : 'pnl-neg'">
            PnL: ${{ (j.realized_pnl ?? 0).toFixed(2) }}
          </span>
        </div>
        <div class="j-footer">
          <span v-if="j.emotion_state" class="j-emotion">{{ j.emotion_state }}</span>
          <span v-if="j.execution_quality" class="j-quality">执行质量: {{ j.execution_quality }}/5</span>
          <button v-if="j.journal_status !== 'REVIEWED' && j.journal_status !== 'FAILED'" class="btn-small" @click.stop="doAiReview(j.id)">AI 复盘</button>
        </div>
        <div v-if="j.journal_status === 'FAILED' && j.lesson_learned" class="j-error-msg">
          <strong>失败原因：</strong>{{ j.lesson_learned }}
        </div>
        <div v-if="j.ai_review" class="j-review">
          <strong>AI 复盘：</strong>
          <p>{{ j.ai_review }}</p>
        </div>
      </div>
      <div v-if="(!journals || journals.length === 0) && !loading" class="empty">暂无交易日志</div>
    </div>

    <!-- 分页 -->
    <div v-if="total > 20" class="pagination">
      <button :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
      <span>{{ page }} / {{ Math.ceil(total / 20) }}</span>
      <button :disabled="page >= Math.ceil(total / 20)" @click="goPage(page + 1)">下一页</button>
    </div>

    <!-- 创建弹窗 -->
    <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
      <div class="modal">
        <h3>新建交易日志</h3>
        <div class="form-grid">
          <label>标的 <input v-model="form.symbol" placeholder="AAPL" /></label>
          <label>方向
            <select v-model="form.direction"><option value="BUY">BUY</option><option value="SELL">SELL</option></select>
          </label>
          <label>入场日期 <input v-model="form.entry_date" type="date" /></label>
          <label>入场价 <input v-model.number="form.entry_price" type="number" step="0.01" /></label>
          <label>出场日期 <input v-model="form.exit_date" type="date" /></label>
          <label>出场价 <input v-model.number="form.exit_price" type="number" step="0.01" /></label>
          <label>数量 <input v-model.number="form.quantity" type="number" /></label>
          <label>已实现盈亏 <input v-model.number="form.realized_pnl" type="number" step="0.01" /></label>
          <label>执行质量(1-5) <input v-model.number="form.execution_quality" type="number" min="1" max="5" /></label>
          <label>情绪 <input v-model="form.emotion_state" placeholder="calm / fomo / revenge" /></label>
          <label class="full">反思 <textarea v-model="form.lesson_learned" rows="3"></textarea></label>
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
import { ref, reactive, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useJournalStore } from '@/stores/journal'
import { useQuantLoopStore } from '@/stores/quantLoop'

const store = useJournalStore()
const quantLoopStore = useQuantLoopStore()
const { journals, total, page, loading } = storeToRefs(store)
const { systemStatus } = storeToRefs(quantLoopStore)

const filterStatus = ref('')
const showCreate = ref(false)
const form = reactive({
  symbol: '', direction: 'BUY',
  entry_date: '', exit_date: '',
  entry_price: null as number | null, exit_price: null as number | null,
  quantity: null as number | null, realized_pnl: null as number | null,
  execution_quality: null as number | null, emotion_state: '', lesson_learned: '',
})

async function reload() { 
  const accountId = systemStatus.value?.account_id
  await store.load(1, 20, undefined, filterStatus.value || undefined, accountId) 
}
async function goPage(p: number) { 
  const accountId = systemStatus.value?.account_id
  await store.load(p, 20, undefined, filterStatus.value || undefined, accountId) 
}

// 监听账户变化
watch(() => systemStatus.value?.account_id, (newId) => {
  if (newId) reload()
})
async function submitCreate() {
  await store.add({ ...form } as any)
  showCreate.value = false
  Object.assign(form, { symbol: '', direction: 'BUY', entry_date: '', exit_date: '', entry_price: null, exit_price: null, quantity: null, realized_pnl: null, execution_quality: null, emotion_state: '', lesson_learned: '' })
}
async function doAiReview(id: number) { await store.aiReview(id) }
function selectJournal(_j: any) { /* future: open detail panel */ }

onMounted(reload)
</script>

<style scoped>
.journal-page { padding: 0; }
.page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
.btn-primary { padding: 6px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
.btn-secondary { padding: 6px 16px; background: var(--bg-secondary, #e5e7eb); border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
.btn-small { padding: 2px 10px; background: #6366f1; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.75rem; }
.toolbar select { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border, #ddd); }
.loading { text-align: center; padding: 2rem; color: var(--text-secondary); }
.journal-list { display: flex; flex-direction: column; gap: 12px; }
.journal-card {
  background: var(--bg-card, #fff); border-radius: 12px; padding: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08); cursor: pointer; transition: box-shadow .2s;
}
.journal-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.12); }
.j-header { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.j-symbol { font-weight: 700; font-size: 1.05rem; }
.j-dir { font-size: 0.75rem; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
.dir-buy { background: #d1fae5; color: #065f46; }
.dir-sell { background: #fee2e2; color: #991b1b; }
.j-status { font-size: 0.7rem; padding: 1px 6px; border-radius: 4px; margin-left: auto; }
.s-draft { background: #e5e7eb; color: #374151; }
.s-completed { background: #dbeafe; color: #1e40af; }
.s-reviewed { background: #d1fae5; color: #065f46; }
.s-failed { background: #fee2e2; color: #b91c1c; }
.j-error-msg { margin-top: 8px; padding: 8px 12px; background: #fff1f2; color: #991b1b; border-radius: 8px; font-size: 0.8rem; border: 1px solid #fecaca; }
.j-body { display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-secondary, #666); margin-bottom: 4px; flex-wrap: wrap; }
.j-pnl { font-weight: 700; }
.pnl-pos { color: #10b981; }
.pnl-neg { color: #ef4444; }
.j-footer { display: flex; gap: 12px; align-items: center; font-size: 0.8rem; }
.j-emotion { background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 4px; }
.j-quality { color: var(--text-secondary); }
.j-review { margin-top: 8px; padding: 10px; background: var(--bg-secondary, #f3f4f6); border-radius: 8px; font-size: 0.85rem; white-space: pre-wrap; }
.pagination { display: flex; gap: 12px; align-items: center; justify-content: center; margin-top: 16px; }
.pagination button { padding: 4px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.empty { color: var(--text-secondary); text-align: center; padding: 2rem; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--bg-card, #fff); border-radius: 16px; padding: 24px; width: 480px; max-height: 90vh; overflow-y: auto; }
.modal h3 { margin-bottom: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.form-grid label { display: flex; flex-direction: column; font-size: 0.85rem; }
.form-grid label.full { grid-column: 1 / -1; }
.form-grid input, .form-grid select, .form-grid textarea {
  margin-top: 4px; padding: 6px 8px; border: 1px solid var(--border, #ddd); border-radius: 6px;
  font-size: 0.85rem;
}
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
</style>
