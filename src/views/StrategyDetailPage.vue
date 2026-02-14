<template>
  <div class="strategy-detail-page">
    <el-breadcrumb separator="/" style="margin-bottom: 16px;">
      <el-breadcrumb-item :to="{ path: '/strategies' }">策略库管理</el-breadcrumb-item>
      <el-breadcrumb-item>{{ strategy?.name || '策略详情' }}</el-breadcrumb-item>
    </el-breadcrumb>
    
    <el-page-header @back="goBack" :content="strategy?.name || '策略详情'">
      <template #extra>
        <el-switch
          v-if="strategy"
          v-model="strategy.is_active"
          :loading="loading"
          active-text="已启用"
          inactive-text="已禁用"
          @change="handleToggle"
        />
      </template>
    </el-page-header>

    <el-card v-if="strategy" class="strategy-info" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="策略名称">{{ strategy.name }}</el-descriptions-item>
        <el-descriptions-item label="策略类型">{{ strategy.style }}</el-descriptions-item>
        <el-descriptions-item label="版本">v{{ strategy.version }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="strategy.is_active ? 'success' : 'info'">
            {{ strategy.is_active ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ strategy.description }}
        </el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <el-tag v-for="tag in strategy.tags" :key="tag" size="small" style="margin-right: 8px;">
            {{ tag }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <div class="params-section">
        <div class="section-header">
          <span>策略参数</span>
          <el-button size="small" @click="showEditDialog = true">编辑参数</el-button>
        </div>
        <el-descriptions :column="2" border style="margin-top: 16px;">
          <el-descriptions-item 
            v-for="(value, key) in strategy.default_params" 
            :key="key" 
            :label="key"
          >
            {{ value }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-divider />

      <div class="risk-section">
        <div class="section-header">
          <span>风险配置</span>
        </div>
        <el-descriptions :column="2" border style="margin-top: 16px;">
          <el-descriptions-item 
            v-for="(value, key) in strategy.risk_profile" 
            :key="key" 
            :label="key"
          >
            {{ value }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <el-card v-if="performance" class="performance-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>性能指标</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="metric-box">
            <div class="metric-label">总信号数</div>
            <div class="metric-value">{{ performance.total_signals }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-box">
            <div class="metric-label">胜率</div>
            <div class="metric-value">{{ (performance.win_rate * 100).toFixed(2) }}%</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-box">
            <div class="metric-label">平均收益率</div>
            <div class="metric-value" :class="performance.avg_pnl_pct >= 0 ? 'positive' : 'negative'">
              {{ (performance.avg_pnl_pct * 100).toFixed(2) }}%
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-box">
            <div class="metric-label">总盈亏</div>
            <div class="metric-value" :class="performance.total_pnl >= 0 ? 'positive' : 'negative'">
              ${{ performance.total_pnl.toFixed(2) }}
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="signals-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>最近信号</span>
          <el-button type="primary" size="small" :loading="runLoading" @click="handleRun">
            运行策略
          </el-button>
        </div>
      </template>
      
      <el-table :data="signals" style="width: 100%">
        <el-table-column prop="symbol" label="股票代码" width="120" />
        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">
              {{ row.action }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="signal_strength" label="信号强度" width="120">
          <template #default="{ row }">
            {{ row.signal_strength?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重" width="100">
          <template #default="{ row }">
            {{ (row.weight * 100).toFixed(1) }}%
          </template>
        </el-table-column>
        <el-table-column prop="direction" label="方向" width="100" />
        <el-table-column prop="notes" label="备注" />
        <el-table-column prop="created_at" label="生成时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑参数对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑策略参数" width="600px">
      <el-form :model="editForm" label-width="150px">
        <el-form-item 
          v-for="(value, key) in editForm.params" 
          :key="key" 
          :label="key"
        >
          <el-input v-model="editForm.params[key]" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSaveParams">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useStrategyStore } from '@/stores/strategyStore'
import type { Strategy, StrategyPerformance, StrategySignal } from '@/types/strategy'

const route = useRoute()
const router = useRouter()
const strategyStore = useStrategyStore()

const strategyId = computed(() => route.params.id as string)
const strategy = computed(() => strategyStore.currentStrategy)
const performance = ref<StrategyPerformance | null>(null)
const signals = ref<StrategySignal[]>([])

const loading = ref(false)
const runLoading = ref(false)
const saveLoading = ref(false)
const showEditDialog = ref(false)

const editForm = ref({
  params: {} as Record<string, any>
})

const goBack = () => {
  router.push('/strategies')
}

const handleToggle = async (value: boolean) => {
  loading.value = true
  try {
    await strategyStore.toggleStrategy(strategyId.value, value)
    ElMessage.success(value ? '策略已启用' : '策略已禁用')
  } catch (error) {
    ElMessage.error('操作失败')
    // 回滚状态
    if (strategy.value) {
      strategy.value.is_active = !value
    }
  } finally {
    loading.value = false
  }
}

const handleRun = async () => {
  runLoading.value = true
  try {
    await strategyStore.runStrategy(strategyId.value, {
      symbols: [],
      use_custom_params: false
    })
    ElMessage.success('策略运行成功')
    // 刷新信号列表
    await loadSignals()
  } catch (error: any) {
    ElMessage.error(error.message || '运行失败')
  } finally {
    runLoading.value = false
  }
}

const handleSaveParams = async () => {
  saveLoading.value = true
  try {
    await strategyStore.updateParams(strategyId.value, editForm.value.params)
    ElMessage.success('参数更新成功')
    showEditDialog.value = false
    await strategyStore.loadStrategy(strategyId.value)
  } catch (error) {
    ElMessage.error('参数更新失败')
  } finally {
    saveLoading.value = false
  }
}

const getActionType = (action: string) => {
  const typeMap: Record<string, string> = {
    'BUY': 'success',
    'SELL': 'danger',
    'HOLD': 'info',
    'INCREASE': 'warning',
    'DECREASE': 'warning'
  }
  return typeMap[action] || 'info'
}

const formatDate = (date: string | Date | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const loadPerformance = async () => {
  try {
    performance.value = await strategyStore.loadPerformance(strategyId.value)
  } catch (error) {
    console.error('Failed to load performance:', error)
  }
}

const loadSignals = async () => {
  try {
    signals.value = await strategyStore.getSignals(strategyId.value, 20)
  } catch (error) {
    console.error('Failed to load signals:', error)
  }
}

watch(showEditDialog, (value) => {
  if (value && strategy.value) {
    editForm.value.params = { ...strategy.value.default_params }
  }
})

onMounted(async () => {
  await strategyStore.loadStrategy(strategyId.value)
  await Promise.all([
    loadPerformance(),
    loadSignals()
  ])
})
</script>

<style scoped>
.strategy-detail-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
}

.params-section,
.risk-section {
  margin-top: 16px;
}

.performance-card .metric-box {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.metric-value.positive {
  color: #67c23a;
}

.metric-value.negative {
  color: #f56c6c;
}
</style>
