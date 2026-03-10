<template>
  <div class="algo-execution-page">
    <header class="page-header">
      <div class="title-area">
        <h1>算法执行 (TWAP/VWAP)</h1>
        <p>V10 智能拆单执行引擎，减少大额订单滑点与市场冲击。</p>
      </div>
      <div class="actions">
        <button class="primary-btn" @click="showSubmitModal = true">提交新算法任务</button>
      </div>
    </header>

    <div class="execution-grid">
      <!-- 活跃任务面板 -->
      <section class="active-tasks">
        <div class="section-header">
          <h3>活跃任务</h3>
        </div>
        <div v-if="tasks.length === 0" class="empty-status">暂无正在运行的算法任务</div>
        <div v-else class="task-list">
          <div v-for="task in tasks" :key="task.task_id" class="task-card">
            <div class="task-info">
              <span class="symbol">{{ task.symbol }}</span>
              <span :class="`side ${(task.side || 'BUY').toLowerCase()}`">{{ task.side === 'BUY' ? '买入' : '卖出' }}</span>
              <span class="algo-tag">{{ task.algo }}</span>
            </div>
            <div class="task-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getProgress(task) + '%' }"></div>
              </div>
              <span class="progress-text">{{ getProgress(task) }}% ({{ task.slices_log ? task.slices_log.length : 0 }}/{{ task.slices }})</span>
            </div>
            <div class="task-footer">
              <span class="status-badge" :class="(task.status || '').toLowerCase()">{{ task.status }}</span>
              <button v-if="task.status === 'RUNNING'" class="cancel-btn" @click="cancelTask(task.task_id)">取消</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 历史记录 -->
      <section class="execution-history">
        <div class="section-header">
          <h3>最近记录</h3>
        </div>
        <div class="history-table">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>标的</th>
                <th>方向</th>
                <th>算法</th>
                <th>数量</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in history" :key="h.task_id">
                <td>{{ formatTime(h.created_at) }}</td>
                <td>{{ h.symbol }}</td>
                <td :class="(h.side || 'BUY').toLowerCase()">{{ h.side === 'BUY' ? '买入' : '卖出' }}</td>
                <td>{{ h.algo }}</td>
                <td>{{ h.quantity }}</td>
                <td><span class="status-dot" :class="(h.status || '').toLowerCase()"></span> {{ h.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- 提交任务模态框 -->
    <div v-if="showSubmitModal" class="modal-overlay">
      <div class="modal-content">
        <h3>创建算法执行任务</h3>
        <div class="form-group">
          <label>股票代码</label>
          <input v-model="form.symbol" placeholder="例如: AAPL" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>方向</label>
            <select v-model="form.side">
              <option value="BUY">买入</option>
              <option value="SELL">卖出</option>
            </select>
          </div>
          <div class="form-group">
            <label>算法类型</label>
            <select v-model="form.algo">
              <option value="TWAP">TWAP (时间加权)</option>
              <option value="VWAP">VWAP (成交量加权)</option>
              <option value="MKT">MKT (快速市价)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>总数量</label>
          <input type="number" v-model.number="form.quantity" />
        </div>
        <div class="form-row" v-if="form.algo !== 'MKT'">
          <div class="form-group">
            <label>持续时间 (分钟)</label>
            <input type="number" v-model.number="form.duration_minutes" />
          </div>
          <div class="form-group">
            <label>切片数量</label>
            <input type="number" v-model.number="form.slices" />
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showSubmitModal = false">取消</button>
          <button class="primary-btn" @click="submitTask" :disabled="submitting">提交执行</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { formatClientDateTime } from '@/utils/datetime'
import { executionAlgoApi, type AlgoTask } from '@/api/executionAlgoService'
import { ElMessage } from 'element-plus'

const tasks = ref<AlgoTask[]>([])
const history = ref<AlgoTask[]>([])
const showSubmitModal = ref(false)
const submitting = ref(false)
let timer: any = null

const form = ref({
  symbol: '',
  side: 'BUY' as 'BUY' | 'SELL',
  quantity: 100,
  algo: 'TWAP' as any,
  duration_minutes: 30,
  slices: 6
})

const fetchTasks = async () => {
  try {
    const res = await executionAlgoApi.listTasks({ status: 'RUNNING' })
    tasks.value = res.data?.tasks || []
    const histRes = await executionAlgoApi.listTasks({ limit: 50 })
    history.value = (histRes.data?.tasks || []).filter(t => t.status !== 'RUNNING').slice(0, 10)
  } catch (e) {
    console.error('Failed to fetch tasks', e)
  }
}

const submitTask = async () => {
  if (!form.value.symbol) return
  submitting.value = true
  try {
    const payload = { ...form.value, symbol: form.value.symbol.toUpperCase() }
    await executionAlgoApi.submit(payload)
    ElMessage.success('算法任务已提交')
    showSubmitModal.value = false
    await fetchTasks()
  } catch (e) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

const cancelTask = async (id: string) => {
  try {
    await executionAlgoApi.cancelTask(id)
    ElMessage.info('任务请求取消')
    await fetchTasks()
  } catch (e) {
    ElMessage.error('取消失败')
  }
}

const getProgress = (task: AlgoTask) => {
  if (task.status === 'DONE') return 100
  const count = task.slices_log?.length || 0
  return Math.round((count / task.slices) * 100)
}

const formatTime = (iso: string) => formatClientDateTime(iso)

onMounted(() => {
  fetchTasks()
  timer = setInterval(fetchTasks, 5000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.algo-execution-page {
  padding: 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}
.title-area h1 { font-size: 24px; margin-bottom: 4px; }
.title-area p { color: #888; }

.execution-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.section-header { margin-bottom: 16px; border-left: 4px solid var(--primary-color); padding-left: 12px; }

.task-card {
  background: #1e1e1e;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #333;
}
.task-info { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.symbol { font-weight: bold; font-size: 18px; }
.side.buy { color: #f5222d; }
.side.sell { color: #52c41a; }
.algo-tag { background: #333; padding: 2px 8px; border-radius: 4px; font-size: 12px; }

.progress-bar { height: 8px; background: #333; border-radius: 4px; overflow: hidden; margin-bottom: 4px; }
.progress-fill { height: 100%; background: var(--primary-color); transition: width 0.3s; }
.progress-text { font-size: 12px; color: #888; }

.task-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
.status-badge { font-size: 12px; border-radius: 10px; padding: 1px 8px; }
.status-badge.running { background: rgba(24, 144, 255, 0.2); color: #1890ff; }

.history-table table { width: 100%; border-collapse: collapse; }
.history-table th { text-align: left; color: #888; padding: 12px; border-bottom: 1px solid #333; }
.history-table td { padding: 12px; border-bottom: 1px solid #1a1a1a; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background: #1e1e1e; padding: 24px; border-radius: 12px; width: 400px; }
.form-group { margin-bottom: 16px; display: flex; flex-direction: column; }
.form-row { display: flex; gap: 16px; }
.form-row .form-group { flex: 1; }
input, select { background: #2a2a2a; border: 1px solid #333; color: white; padding: 8px; border-radius: 4px; margin-top: 4px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }

.primary-btn { background: var(--primary-color); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.primary-btn:disabled { opacity: 0.5; }
.cancel-btn { background: transparent; border: 1px solid #ff4d4f; color: #ff4d4f; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
</style>
