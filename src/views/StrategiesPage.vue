<template>
  <div class="strategies-page">
    <div class="page-header">
      <h1>策略库管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="router.push('/opportunities')">
          前往策略筛选 →
        </el-button>
        <el-input
          v-model="searchQuery"
          placeholder="搜索策略..."
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
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="均值回归">均值回归</el-radio-button>
        <el-radio-button label="趋势跟踪">趋势跟踪</el-radio-button>
        <el-radio-button label="多因子">多因子</el-radio-button>
        <el-radio-button label="防御">防御</el-radio-button>
        <el-radio-button label="波动率">波动率</el-radio-button>
        <el-radio-button label="宏观对冲">宏观对冲</el-radio-button>
      </el-radio-group>

      <div class="batch-actions">
        <el-button @click="batchRun" :disabled="selectedStrategies.length === 0">
          批量运行 ({{ selectedStrategies.length }})
        </el-button>
      </div>
    </div>

    <el-loading :loading="strategyStore.loading">
      <div v-if="filteredStrategies.length === 0" class="empty-state">
        <p>暂无策略</p>
      </div>

      <div v-else class="strategies-grid">
        <div 
          v-for="strategy in filteredStrategies" 
          :key="strategy.id"
          class="strategy-card-wrapper"
        >
          <el-checkbox 
            v-model="selectedStrategies" 
            :label="strategy.id"
            class="strategy-checkbox"
          />
          <StrategyCard
            :strategy="strategy"
            :performance="strategyStore.performances[strategy.id] || {}"
            @toggle="handleToggle"
            @run="handleRun"
            @view="handleView"
          />
        </div>
      </div>
    </el-loading>
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
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: #999;
}

.strategies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.strategy-card-wrapper {
  position: relative;
}

.strategy-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
}
</style>
