<template>
  <div class="execution-center">
    <!-- 头部工具栏 -->
    <div class="header-toolbar">
      <div class="title-section">
        <h2>⚡ 执行中心</h2>
        <p class="subtitle">集中管理所有待执行的交易计划</p>
      </div>
      
      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card">
          <span class="stat-label">总计划</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
        <div class="stat-card active">
          <span class="stat-label">待执行</span>
          <span class="stat-value">{{ stats.active }}</span>
        </div>
        <div class="stat-card success">
          <span class="stat-label">已执行</span>
          <span class="stat-value">{{ stats.executed }}</span>
        </div>
        <div class="stat-card failed">
          <span class="stat-label">已失败</span>
          <span class="stat-value">{{ stats.failed }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选和操作栏 -->
    <div class="filter-toolbar">
      <div class="filters">
        <select v-model="filterStatus" @change="loadPlans" class="filter-select">
          <option value="">全部状态</option>
          <option value="ACTIVE">待执行</option>
          <option value="PAUSED">已暂停</option>
          <option value="EXECUTED">已执行</option>
          <option value="CANCELLED">已取消</option>
          <option value="FAILED">已失败</option>
        </select>
        
        <input 
          v-model="filterSymbol" 
          @input="loadPlans"
          placeholder="搜索标的..." 
          class="filter-input"
        />
      </div>
      
      <div class="batch-actions">
        <button 
          v-if="selectedPlans.length > 0"
          @click="batchExecute"
          :disabled="loading"
          class="btn btn-primary"
        >
          批量执行 ({{ selectedPlans.length }})
        </button>
        <button 
          v-if="selectedPlans.length > 0"
          @click="batchCancel"
          :disabled="loading"
          class="btn btn-danger"
        >
          批量取消
        </button>
        <button @click="showCreateDialog = true" class="btn btn-success">
          + 新建计划
        </button>
      </div>
    </div>

    <!-- 计划列表 -->
    <div class="plans-container">
      <div v-if="loading && plans.length === 0" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="plans.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>暂无交易计划</h3>
        <p>点击"新建计划"创建第一个交易计划</p>
      </div>
      
      <div v-else class="plans-table">
        <table>
          <thead>
            <tr>
              <th class="checkbox-col">
                <input 
                  type="checkbox" 
                  @change="toggleSelectAll"
                  :checked="isAllSelected"
                />
              </th>
              <th>标的</th>
              <th>入场价</th>
              <th>止损价</th>
              <th>止盈价</th>
              <th>目标仓位</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="plan in plans" 
              :key="plan.id"
              :class="{ 'selected': isSelected(plan.id) }"
            >
              <td class="checkbox-col">
                <input 
                  type="checkbox" 
                  :checked="isSelected(plan.id)"
                  @change="toggleSelect(plan.id)"
                />
              </td>
              <td class="symbol-cell">
                <strong>{{ plan.symbol }}</strong>
              </td>
              <td class="price-cell">${{ plan.entry_price.toFixed(2) }}</td>
              <td class="price-cell stop-loss">${{ plan.stop_loss.toFixed(2) }}</td>
              <td class="price-cell take-profit">${{ plan.take_profit.toFixed(2) }}</td>
              <td class="position-cell">{{ (plan.target_position * 100).toFixed(1) }}%</td>
              <td class="status-cell">
                <span :class="['status-badge', getStatusClass(plan.plan_status)]">
                  {{ translateStatus(plan.plan_status) }}
                </span>
              </td>
              <td class="time-cell">{{ formatTime(plan.created_at) }}</td>
              <td class="actions-cell">
                <button 
                  v-if="plan.plan_status === 'ACTIVE'"
                  @click="executeSinglePlan(plan.id)"
                  :disabled="loading"
                  class="btn-icon btn-execute"
                  title="执行"
                >
                  ▶
                </button>
                <button 
                  @click="editPlan(plan)"
                  :disabled="loading"
                  class="btn-icon btn-edit"
                  title="编辑"
                >
                  ✏️
                </button>
                <button 
                  @click="deletePlan(plan.id)"
                  :disabled="loading"
                  class="btn-icon btn-delete"
                  title="删除"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="goToPage(page - 1)"
          :disabled="page === 1 || loading"
          class="btn btn-page"
        >
          ‹ 上一页
        </button>
        <span class="page-info">
          第 {{ page }} 页 / 共 {{ totalPages }} 页
        </span>
        <button 
          @click="goToPage(page + 1)"
          :disabled="page >= totalPages || loading"
          class="btn btn-page"
        >
          下一页 ›
        </button>
      </div>
    </div>

    <!-- 新建/编辑计划对话框 -->
    <PlanEditDialog
      v-if="showCreateDialog || editingPlan"
      :show="showCreateDialog || !!editingPlan"
      :plan="editingPlan"
      @close="closeEditDialog"
      @success="handlePlanSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { client } from '../api/client';
import PlanEditDialog from '../components/PlanEditDialog.vue';

interface TradingPlan {
  id: number;
  symbol: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  target_position: number;
  plan_status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  active: number;
  paused: number;
  executed: number;
  cancelled: number;
  failed: number;
}

const plans = ref<TradingPlan[]>([]);
const stats = ref<Stats>({
  total: 0,
  active: 0,
  paused: 0,
  executed: 0,
  cancelled: 0,
  failed: 0
});

const loading = ref(false);
const filterStatus = ref('');
const filterSymbol = ref('');
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

const selectedPlans = ref<number[]>([]);
const showCreateDialog = ref(false);
const editingPlan = ref<TradingPlan | null>(null);

const isAllSelected = computed(() => {
  return plans.value.length > 0 && selectedPlans.value.length === plans.value.length;
});

// 加载计划列表
async function loadPlans() {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      page_size: pageSize.value
    };
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterSymbol.value) params.symbol = filterSymbol.value;

    const response = await client.get('/v1/execution-center/plans', { params });
    plans.value = response.data.plans;
    total.value = response.data.total;
  } catch (error: any) {
    console.error('加载计划列表失败:', error);
    alert(error.response?.data?.detail || '加载失败');
  } finally {
    loading.value = false;
  }
}

// 加载统计数据
async function loadStats() {
  try {
    const response = await client.get('/v1/execution-center/stats');
    stats.value = response.data;
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

// 翻页
function goToPage(newPage: number) {
  page.value = newPage;
  loadPlans();
}

// 选择/取消选择
function toggleSelect(planId: number) {
  const index = selectedPlans.value.indexOf(planId);
  if (index > -1) {
    selectedPlans.value.splice(index, 1);
  } else {
    selectedPlans.value.push(planId);
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedPlans.value = [];
  } else {
    selectedPlans.value = plans.value.map(p => p.id);
  }
}

function isSelected(planId: number) {
  return selectedPlans.value.includes(planId);
}

// 执行单个计划
async function executeSinglePlan(planId: number) {
  if (!confirm('确认执行该交易计划？')) return;
  
  loading.value = true;
  try {
    const response = await client.post('/v1/execution-center/execute', {
      plan_ids: [planId]
    });
    
    if (response.data.success) {
      alert('计划执行成功！');
      await loadPlans();
      await loadStats();
    } else {
      alert('计划执行失败: ' + (response.data.results[0]?.error || '未知错误'));
    }
  } catch (error: any) {
    console.error('执行计划失败:', error);
    alert(error.response?.data?.detail || '执行失败');
  } finally {
    loading.value = false;
  }
}

// 批量执行
async function batchExecute() {
  if (!confirm(`确认执行选中的 ${selectedPlans.value.length} 个计划？`)) return;
  
  loading.value = true;
  try {
    const response = await client.post('/v1/execution-center/execute', {
      plan_ids: selectedPlans.value
    });
    
    alert(`执行完成！成功: ${response.data.success_count}, 失败: ${response.data.failed_count}`);
    selectedPlans.value = [];
    await loadPlans();
    await loadStats();
  } catch (error: any) {
    console.error('批量执行失败:', error);
    alert(error.response?.data?.detail || '批量执行失败');
  } finally {
    loading.value = false;
  }
}

// 批量取消
async function batchCancel() {
  const reason = prompt(`确认取消选中的 ${selectedPlans.value.length} 个计划？\n请输入取消原因（可选）:`);
  if (reason === null) return;
  
  loading.value = true;
  try {
    const response = await client.post('/v1/execution-center/cancel', {
      plan_ids: selectedPlans.value,
      reason: reason || undefined
    });
    
    alert(response.data.message);
    selectedPlans.value = [];
    await loadPlans();
    await loadStats();
  } catch (error: any) {
    console.error('批量取消失败:', error);
    alert(error.response?.data?.detail || '批量取消失败');
  } finally {
    loading.value = false;
  }
}

// 编辑计划
function editPlan(plan: TradingPlan) {
  editingPlan.value = { ...plan };
}

// 删除计划
async function deletePlan(planId: number) {
  if (!confirm('确认删除该计划？此操作不可恢复。')) return;
  
  loading.value = true;
  try {
    await client.delete(`/v1/execution-center/plans/${planId}`);
    alert('删除成功');
    await loadPlans();
    await loadStats();
  } catch (error: any) {
    console.error('删除计划失败:', error);
    alert(error.response?.data?.detail || '删除失败');
  } finally {
    loading.value = false;
  }
}

// 关闭编辑对话框
function closeEditDialog() {
  showCreateDialog.value = false;
  editingPlan.value = null;
}

// 计划保存成功
async function handlePlanSaved() {
  closeEditDialog();
  await loadPlans();
  await loadStats();
}

// 工具函数
function getStatusClass(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    EXECUTED: 'executed',
    CANCELLED: 'cancelled',
    FAILED: 'failed'
  };
  return map[status] || '';
}

function translateStatus(status: string) {
  const map: Record<string, string> = {
    ACTIVE: '待执行',
    PAUSED: '已暂停',
    EXECUTED: '已执行',
    CANCELLED: '已取消',
    FAILED: '已失败'
  };
  return map[status] || status;
}

function formatTime(timeStr: string) {
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

onMounted(async () => {
  await loadPlans();
  await loadStats();
});
</script>

<style scoped>
.execution-center {
  padding: 24px;
  background: linear-gradient(180deg, #0a0e27 0%, #151932 100%);
  min-height: 100vh;
}

.header-toolbar {
  margin-bottom: 24px;
}

.title-section {
  margin-bottom: 20px;
}

.title-section h2 {
  font-size: 28px;
  color: #fff;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #888;
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card.active {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.05) 100%);
  border-color: rgba(33, 150, 243, 0.3);
}

.stat-card.success {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.05) 100%);
  border-color: rgba(76, 175, 80, 0.3);
}

.stat-card.failed {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(244, 67, 54, 0.05) 100%);
  border-color: rgba(244, 67, 54, 0.3);
}

.stat-label {
  color: #999;
  font-size: 13px;
}

.stat-value {
  color: #fff;
  font-size: 32px;
  font-weight: 700;
}

.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: 12px;
  flex: 1;
}

.filter-select,
.filter-input {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
}

.filter-input {
  flex: 1;
  max-width: 300px;
}

.batch-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: #fff;
}

.btn-success {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: #fff;
}

.plans-container {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.loading,
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.plans-table table {
  width: 100%;
  border-collapse: collapse;
}

.plans-table thead {
  background: rgba(255, 255, 255, 0.05);
}

.plans-table th {
  padding: 16px;
  text-align: left;
  color: #999;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
}

.plans-table td {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: #ccc;
}

.plans-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.plans-table tr.selected {
  background: rgba(33, 150, 243, 0.1);
}

.checkbox-col {
  width: 40px;
  text-align: center;
}

.symbol-cell strong {
  color: #2196f3;
  font-size: 15px;
}

.price-cell {
  font-family: 'Courier New', monospace;
}

.stop-loss {
  color: #f44336;
}

.take-profit {
  color: #4caf50;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(33, 150, 243, 0.2);
  color: #64b5f6;
}

.status-badge.paused {
  background: rgba(255, 152, 0, 0.2);
  color: #ffb74d;
}

.status-badge.executed {
  background: rgba(76, 175, 80, 0.2);
  color: #81c784;
}

.status-badge.cancelled,
.status-badge.failed {
  background: rgba(244, 67, 54, 0.2);
  color: #e57373;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.btn-execute {
  background: rgba(76, 175, 80, 0.2);
}

.btn-edit {
  background: rgba(33, 150, 243, 0.2);
}

.btn-delete {
  background: rgba(244, 67, 54, 0.2);
}

.pagination {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.btn-page {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}

.btn-page:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  color: #999;
}
</style>
