<template>
  <div class="strategies-page">
    <div class="page-header">
      <h1>{{ $t('strategies.title') }}</h1>
      <div class="header-actions">
        <el-button type="primary" @click="router.push('/opportunities')">
          {{ $t('strategies.go_to_opportunities') }}
        </el-button>
        <el-input
          v-model="searchQuery"
          :placeholder="$t('strategies.search_placeholder')"
          style="width: 200px; margin-left: 12px;"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <div class="filter-bar">
      <el-radio-group v-model="selectedCategory" @change="handleCategoryChange">
        <el-radio-button value="">{{ $t('strategies.categories.all') }}</el-radio-button>
        <el-radio-button value="均值回归">{{ $t('strategies.categories.mean_reversion') }}</el-radio-button>
        <el-radio-button value="趋势跟踪">{{ $t('strategies.categories.trend_following') }}</el-radio-button>
        <el-radio-button value="多因子">{{ $t('strategies.categories.multi_factor') }}</el-radio-button>
        <el-radio-button value="防御">{{ $t('strategies.categories.defense') }}</el-radio-button>
        <el-radio-button value="波动率">{{ $t('strategies.categories.volatility') }}</el-radio-button>
        <el-radio-button value="宏观对冲">{{ $t('strategies.categories.macro_hedge') }}</el-radio-button>
      </el-radio-group>

      <div class="batch-actions">
        <el-button @click="batchRun" :disabled="selectedStrategies.length === 0">
          {{ $t('strategies.batch_run', { n: selectedStrategies.length }) }}
        </el-button>
      </div>
    </div>

    <div v-loading="strategyStore.loading">
      <div v-if="filteredStrategies.length === 0" class="empty-state">
        <p>{{ $t('strategies.no_strategies') }}</p>
      </div>

      <el-checkbox-group v-else v-model="selectedStrategies">
        <div class="strategies-grid">
          <div 
            v-for="strategy in filteredStrategies" 
            :key="strategy.id"
            class="strategy-list-item"
          >
            <div class="selection-area">
              <el-checkbox :value="strategy.id" size="large" />
            </div>
            <StrategyCard
              :strategy="strategy"
              :performance="strategyStore.performances[strategy.id] || {}"
              @toggle="handleToggle"
              @run="handleRun"
              @view="handleView"
              class="flex-1"
            />
          </div>
        </div>
      </el-checkbox-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useStrategyStore } from '@/stores/strategyStore'
import StrategyCard from '@/components/StrategyCard.vue'
import type { Strategy } from '@/types/strategy'

const router = useRouter()
const strategyStore = useStrategyStore()
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedStrategies = ref<string[]>([])

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
.strategies-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #f1f5f9;
}

/* Element Plus overrides */
:deep(.el-radio-button__inner) {
  background-color: rgba(15, 23, 42, 0.5);
  color: #94a3b8;
  border-color: rgba(56, 189, 248, 0.2);
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #38bdf8;
  color: #0f172a;
  border-color: #38bdf8;
  box-shadow: -1px 0 0 0 #38bdf8;
}

:deep(.el-input__wrapper) {
  background-color: rgba(15, 23, 42, 0.5);
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.2) inset;
}

:deep(.el-input__inner) {
  color: #f1f5f9;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(30, 41, 59, 0.7);
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: #94a3b8;
}

.strategies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.strategy-list-item {
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 12px;
  padding: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.strategy-list-item:hover {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(56, 189, 248, 0.3);
  transform: translateX(4px);
}

.selection-area {
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-1 {
  flex: 1;
  min-width: 0; /* 防止子元素溢出 */
}
</style>
