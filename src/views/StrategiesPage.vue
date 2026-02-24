<template>
  <div class="strategies-page">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-title">策略库管理</h1>
        <span class="strategy-count">{{ filteredStrategies.length }} 个策略</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" class="action-btn" @click="router.push('/opportunities')">
          {{ $t('strategies.go_to_opportunities') }} →
        </el-button>
        <el-input
          v-model="searchQuery"
          :placeholder="$t('strategies.search_placeholder')"
          class="search-input"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-section">
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat.value"
          class="cat-tab"
          :class="{ active: selectedCategory === cat.value }"
          @click="selectedCategory = cat.value"
        >
          {{ cat.label }}
        </button>
      </div>
      <el-button
        class="batch-btn"
        :disabled="selectedStrategies.length === 0"
        @click="batchRun"
      >
        批量运行
        <span v-if="selectedStrategies.length > 0" class="batch-count">{{ selectedStrategies.length }}</span>
      </el-button>
    </div>

    <!-- 卡片列表 -->
    <div v-loading="strategyStore.loading" class="card-container">
      <div v-if="filteredStrategies.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p class="empty-text">{{ $t('strategies.no_strategies') }}</p>
      </div>

      <el-checkbox-group v-else v-model="selectedStrategies" class="card-grid">
        <label
          v-for="strategy in filteredStrategies"
          :key="strategy.id"
          class="card-item"
          :class="{ selected: selectedStrategies.includes(strategy.id) }"
        >
          <el-checkbox :value="strategy.id" class="card-checkbox" />
          <StrategyCard
            :strategy="strategy"
            :performance="strategyStore.performances[strategy.id] || {}"
            @toggle="handleToggle"
            @run="handleRun"
            @view="handleView"
            class="card-inner"
          />
        </label>
      </el-checkbox-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useStrategyStore } from '@/stores/strategyStore'
import StrategyCard from '@/components/StrategyCard.vue'
import type { Strategy } from '@/types/strategy'

const { t: $t } = useI18n()

const router = useRouter()
const strategyStore = useStrategyStore()
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedStrategies = ref<string[]>([])

const categories = [
  { value: '', label: $t('strategies.categories.all') },
  { value: '均值回归', label: $t('strategies.categories.mean_reversion') },
  { value: '趋势跟踪', label: $t('strategies.categories.trend_following') },
  { value: '多因子', label: $t('strategies.categories.multi_factor') },
  { value: '防御', label: $t('strategies.categories.defense') },
  { value: '波动率', label: $t('strategies.categories.volatility') },
  { value: '宏观对冲', label: $t('strategies.categories.macro_hedge') },
]

const filteredStrategies = computed(() => {
  let result = strategyStore.strategies

  if (selectedCategory.value) {
    result = result.filter(s => s.style === selectedCategory.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query)
    )
  }

  return result
})

onMounted(async () => {
  // Load all builtin strategies with a high limit
  await strategyStore.loadStrategies({ is_builtin: true, limit: 100 })
  
  // Load performance for each strategy
  for (const strategy of strategyStore.strategies) {
    strategyStore.loadPerformance(strategy.id).catch(console.error)
  }
})

const handleSearch = () => {
  // Search is handled by computed property
}

const handleCategoryChange = () => {
  // Filter is handled by computed property
}

const handleToggle = (strategy: any) => {
  console.log('Strategy toggled:', strategy)
}

const handleView = (strategy: any) => {
  router.push(`/strategies/${strategy.id}`)
}

const handleRun = async (strategy: any) => {
  console.log('Strategy run:', strategy)
  // Reload performance after run
  await strategyStore.loadPerformance(strategy.id)
}

const batchRun = async () => {
  if (selectedStrategies.value.length === 0) {
    return
  }

  const successCount = ref(0)
  const failCount = ref(0)

  for (const strategyId of selectedStrategies.value) {
    try {
      await strategyStore.runStrategy(strategyId, {
        symbols: [],
        use_custom_params: false
      })
      successCount.value++
    } catch (error) {
      failCount.value++
    }
  }

  ElMessage.success({
    message: `批量运行完成: ${successCount.value} 成功, ${failCount.value} 失败`,
    duration: 5000,
    showClose: true
  })

  // 提示用户可以前往策略筛选查看结果
  setTimeout(() => {
    ElMessage.info({
      message: '点击顶部按钮前往策略筛选查看运行结果',
      duration: 3000
    })
  }, 500)

  selectedStrategies.value = []
}
</script>

<style scoped>
/* ===== 页面容器 ===== */
.strategies-page {
  padding: 28px 24px;
  min-height: 100vh;
  background: transparent;
}

/* ===== 页面标题 ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title-group {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.02em;
}

.strategy-count {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 220px;
}

/* Element Plus overrides */
:deep(.el-input__wrapper) {
  background-color: rgba(15, 23, 42, 0.6) !important;
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.2) inset !important;
  border-radius: 8px;
}
:deep(.el-input__inner) {
  color: #e2e8f0;
}
:deep(.el-input__inner::placeholder) {
  color: #475569;
}

/* ===== 筛选栏 ===== */
.filter-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: 12px;
}

.category-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.cat-tab {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #64748b;
  border: 1px solid transparent;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.cat-tab:hover {
  color: #94a3b8;
  background: rgba(56, 189, 248, 0.06);
}

.cat-tab.active {
  background: rgba(14, 165, 233, 0.15);
  color: #38bdf8;
  border-color: rgba(14, 165, 233, 0.3);
  font-weight: 600;
}

.batch-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.batch-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #38bdf8;
  color: #0f172a;
  font-size: 0.7rem;
  font-weight: 700;
}

/* ===== 卡片网格 ===== */
.card-container {
  min-height: 300px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* ===== 卡片 + 复选框一体化 ===== */
.card-item {
  display: block;
  position: relative;
  cursor: pointer;
  /* 隐藏原生 label 行为 */
  font-size: inherit;
  font-weight: inherit;
}

/* 选中状态卡片高亮 */
.card-item.selected :deep(.strategy-card) {
  border-color: rgba(56, 189, 248, 0.6);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.98) 60%);
}

/* 复选框：隐藏内建的，根据选中状态显示角标 */
.card-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
}

/* 隐藏 Element Plus 复选框的默认 label 文字 */
:deep(.card-checkbox .el-checkbox__label) {
  display: none;
}

/* 复选框未选中时默认包裹隐藏 */
:deep(.card-checkbox .el-checkbox__inner) {
  background-color: rgba(15, 23, 42, 0.8);
  border-color: rgba(56, 189, 248, 0.3);
}

/* 卡片内容不被复选框透过层覆盖 */
.card-inner {
  display: block;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 16px;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.4;
}

.empty-text {
  color: #475569;
  font-size: 0.95rem;
  margin: 0;
}
</style>
