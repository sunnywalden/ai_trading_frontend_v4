<template>
  <div class="page-container">
    <section class="section-header">
      <div>
        <h2>🧭 交易助手</h2>
        <p>维护你的入场/止损/止盈与目标仓位，计划驱动执行纪律</p>
      </div>
      <button class="refresh-button" @click="loadPlans" :disabled="loading">
        {{ loading ? '刷新中...' : '刷新计划' }}
      </button>
    </section>

    <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>

    <section class="form-card">
      <h3>新增计划</h3>
      <div class="form-grid">
        <label>
          标的
          <input v-model.trim="form.symbol" placeholder="AAPL" />
        </label>
        <label>
          入场价
          <input v-model.number="form.entry_price" type="number" min="0" step="0.01" />
        </label>
        <label>
          止损价
          <input v-model.number="form.stop_loss" type="number" min="0" step="0.01" />
        </label>
        <label>
          止盈价
          <input v-model.number="form.take_profit" type="number" min="0" step="0.01" />
        </label>
        <label>
          目标仓位(0~1)
          <input v-model.number="form.target_position" type="number" min="0" max="1" step="0.01" />
        </label>
        <label>
          有效至
          <input v-model="form.valid_until" type="date" />
        </label>
      </div>
      <label class="notes">
        备注
        <textarea v-model.trim="form.notes" rows="2" placeholder="例如：等待回踩确认"></textarea>
      </label>
      <div class="form-actions">
        <button class="primary-button" @click="onCreate" :disabled="creating">
          {{ creating ? '创建中...' : '创建计划' }}
        </button>
        <span v-if="successMsg" class="success-msg">{{ successMsg }}</span>
      </div>
    </section>

    <section class="list-card">
      <div class="list-header">
        <h3>计划列表</h3>
        <span class="count">共 {{ plans.length }} 条</span>
      </div>
      <div v-if="!plans.length" class="empty">暂无计划</div>
      <div v-else class="plan-grid">
        <div v-for="plan in plans" :key="plan.id" class="plan-item">
          <div class="plan-head">
            <div class="symbol">{{ plan.symbol }}</div>
            <span class="status" :class="`status-${plan.plan_status.toLowerCase()}`">
              {{ statusText(plan.plan_status) }}
            </span>
          </div>
          <div class="plan-body">
            <div>入场 {{ plan.entry_price }}</div>
            <div>止损 {{ plan.stop_loss }}</div>
            <div>止盈 {{ plan.take_profit }}</div>
            <div>目标仓位 {{ (plan.target_position * 100).toFixed(0) }}%</div>
            <div v-if="plan.valid_until">有效至 {{ formatDate(plan.valid_until) }}</div>
          </div>
          <p v-if="plan.notes" class="plan-notes">{{ plan.notes }}</p>
          <div class="plan-actions">
            <button @click="onUpdateStatus(plan.id, 'EXECUTED')">标记已执行</button>
            <button @click="onUpdateStatus(plan.id, 'CANCELLED')">取消</button>
            <button class="danger" @click="onDelete(plan.id)">删除</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  fetchPlans,
  createPlan,
  updatePlan,
  deletePlan,
  type PlanView,
  type PlanStatus
} from '../api/client';

const plans = ref<PlanView[]>([]);
const loading = ref(false);
const creating = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const form = ref({
  symbol: '',
  entry_price: 0,
  stop_loss: 0,
  take_profit: 0,
  target_position: 0.1,
  valid_until: '',
  notes: ''
});

async function loadPlans() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const resp = await fetchPlans();
    plans.value = resp.plans || [];
  } catch (e: any) {
    console.error(e);
    errorMsg.value = '❌ 获取交易计划失败';
  } finally {
    loading.value = false;
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function statusText(status: PlanStatus) {
  const map: Record<PlanStatus, string> = {
    ACTIVE: '进行中',
    EXECUTED: '已执行',
    EXPIRED: '已过期',
    CANCELLED: '已取消'
  };
  return map[status];
}

async function onCreate() {
  if (!form.value.symbol) {
    errorMsg.value = '请输入标的代码';
    return;
  }
  if (!form.value.entry_price || !form.value.stop_loss || !form.value.take_profit) {
    errorMsg.value = '请填写入场/止损/止盈价';
    return;
  }
  creating.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  try {
    await createPlan({
      symbol: form.value.symbol.toUpperCase(),
      entry_price: form.value.entry_price,
      stop_loss: form.value.stop_loss,
      take_profit: form.value.take_profit,
      target_position: form.value.target_position,
      valid_until: form.value.valid_until ? new Date(form.value.valid_until).toISOString() : null,
      notes: form.value.notes || null
    });
    successMsg.value = '✅ 计划已创建';
    form.value = {
      symbol: '',
      entry_price: 0,
      stop_loss: 0,
      take_profit: 0,
      target_position: 0.1,
      valid_until: '',
      notes: ''
    };
    await loadPlans();
  } catch (e: any) {
    console.error(e);
    errorMsg.value = '❌ 创建计划失败';
  } finally {
    creating.value = false;
    setTimeout(() => {
      successMsg.value = '';
    }, 2000);
  }
}

async function onUpdateStatus(planId: number, status: PlanStatus) {
  errorMsg.value = '';
  try {
    await updatePlan(planId, { plan_status: status });
    await loadPlans();
  } catch (e) {
    console.error(e);
    errorMsg.value = '❌ 更新计划状态失败';
  }
}

async function onDelete(planId: number) {
  errorMsg.value = '';
  try {
    await deletePlan(planId);
    await loadPlans();
  } catch (e) {
    console.error(e);
    errorMsg.value = '❌ 删除计划失败';
  }
}

onMounted(() => {
  loadPlans();
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.section-header h2 {
  margin: 0 0 6px;
  font-size: 1.5rem;
  color: #e5e7eb;
}

.section-header p {
  margin: 0;
  font-size: 0.9rem;
  color: #9ca3af;
}

.refresh-button {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.6);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.9rem;
}

.form-card,
.list-card {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  padding: 16px 18px;
}

.form-card h3,
.list-card h3 {
  margin: 0 0 12px;
  font-size: 1.05rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.78rem;
  color: #cbd5f5;
}

input,
textarea {
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #020617;
  color: #e5e7eb;
}

.notes {
  margin-top: 12px;
}

.form-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.primary-button {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #e5e7eb;
  font-weight: 600;
  cursor: pointer;
}

.success-msg {
  font-size: 0.85rem;
  color: #86efac;
}

.list-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.count {
  font-size: 0.8rem;
  color: #9ca3af;
}

.empty {
  padding: 16px;
  color: #9ca3af;
  text-align: center;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.plan-item {
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(2, 6, 23, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.6);
}

.plan-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.symbol {
  font-size: 1rem;
  font-weight: 600;
}

.status {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.status-active {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.status-executed {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.status-expired {
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5f5;
}

.status-cancelled {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.plan-body {
  display: grid;
  gap: 4px;
  font-size: 0.8rem;
  color: #cbd5f5;
}

.plan-notes {
  margin: 8px 0 0;
  font-size: 0.78rem;
  color: #9ca3af;
}

.plan-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.plan-actions button {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(30, 41, 59, 0.8);
  color: #e5e7eb;
  cursor: pointer;
  font-size: 0.75rem;
}

.plan-actions button.danger {
  border-color: rgba(248, 113, 113, 0.6);
  color: #f87171;
}
</style>
