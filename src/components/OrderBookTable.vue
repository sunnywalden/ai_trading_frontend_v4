<template>
  <div class="ob-table-root">
    <!-- 过滤栏 -->
    <div class="filter-bar">
      <!-- 搜索 -->
      <div class="search-wrap">
        <input
          v-model="localSearch"
          type="text"
          class="search-input"
          placeholder="搜索标的..."
          @input="debounceSearch"
        />
      </div>

      <!-- 方向 -->
      <select v-model="localFilters.direction" class="filter-select" @change="applyFilters">
        <option value="">全部方向</option>
        <option value="BUY">买入</option>
        <option value="SELL">卖出</option>
      </select>

      <!-- 来源 -->
      <select v-model="localFilters.source" class="filter-select" @change="applyFilters">
        <option value="">全部来源</option>
        <option value="AI_AUTONOMOUS">AI自主</option>
        <option value="AI_ADVISORY">AI建议</option>
        <option value="MANUAL">人工</option>
      </select>

      <!-- 置信度 -->
      <div class="conf-range">
        <span class="range-label">置信≥</span>
        <input
          v-model.number="localFilters.confidence_min"
          type="number"
          class="range-input"
          min="0" max="100" step="1"
          @change="applyFilters"
        />
      </div>

      <!-- 重置 -->
      <button class="reset-btn" @click="resetFilters">重置</button>

      <span class="spacer"></span>
      <span class="row-count">{{ totalRows }} 条</span>
    </div>

    <!-- 分组区域 -->
    <div class="group-area">
      <!-- Active Group -->
      <div class="group-block">
        <div class="group-header green" @click="toggleGroup('active')">
          <span class="group-icon">{{ groupOpen.active ? '▾' : '▸' }}</span>
          <span class="group-title">活跃中（含持仓）</span>
          <span class="group-badge green-badge">{{ activeRows.length }}</span>
        </div>
        <div v-if="groupOpen.active" class="table-wrap">
          <OBRowTable :rows="activeRows" @detail="$emit('detail', $event)" @stopLoss="$emit('stopLoss', $event)" />
        </div>
      </div>

      <!-- Monitoring Group -->
      <div class="group-block">
        <div class="group-header blue" @click="toggleGroup('monitoring')">
          <span class="group-icon">{{ groupOpen.monitoring ? '▾' : '▸' }}</span>
          <span class="group-title">监控中</span>
          <span class="group-badge blue-badge">{{ monitoringRows.length }}</span>
        </div>
        <div v-if="groupOpen.monitoring" class="table-wrap">
          <OBRowTable :rows="monitoringRows" @detail="$emit('detail', $event)" @stopLoss="$emit('stopLoss', $event)" />
        </div>
      </div>

      <!-- Completed Group -->
      <div class="group-block">
        <div class="group-header gray" @click="toggleGroup('completed')">
          <span class="group-icon">{{ groupOpen.completed ? '▾' : '▸' }}</span>
          <span class="group-title">已完成</span>
          <span class="group-badge gray-badge">{{ completedRows.length }}</span>
        </div>
        <div v-if="groupOpen.completed" class="table-wrap">
          <OBRowTable :rows="completedRows" @detail="$emit('detail', $event)" @stopLoss="$emit('stopLoss', $event)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type { OrderBookRow, OrderBookFilters } from '@/api/orderBookService'
import OBRowTable from './OBRowTable.vue'

interface Props {
  activeRows: OrderBookRow[]
  monitoringRows: OrderBookRow[]
  completedRows: OrderBookRow[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const emit = defineEmits<{
  (e: 'filterChange', filters: OrderBookFilters): void
  (e: 'searchChange', keyword: string): void
  (e: 'detail', row: OrderBookRow): void
  (e: 'stopLoss', row: OrderBookRow): void
}>()

const groupOpen = reactive({ active: true, monitoring: true, completed: false })
const localSearch = ref('')
const localFilters = reactive<OrderBookFilters>({
  direction: undefined, source: undefined,
  confidence_min: undefined, confidence_max: undefined,
})

let searchTimer: number | undefined

const totalRows = computed(() =>
  props.activeRows.length + props.monitoringRows.length + props.completedRows.length
)

function toggleGroup(k: 'active' | 'monitoring' | 'completed') {
  groupOpen[k] = !groupOpen[k]
}

function applyFilters() {
  const f: OrderBookFilters = {}
  if (localFilters.direction) f.direction = localFilters.direction
  if (localFilters.source)    f.source    = localFilters.source
  if (localFilters.confidence_min) f.confidence_min = localFilters.confidence_min
  emit('filterChange', f)
}

function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    emit('searchChange', localSearch.value)
  }, 300)
}

function resetFilters() {
  Object.assign(localFilters, { direction: undefined, source: undefined, confidence_min: undefined })
  localSearch.value = ''
  emit('filterChange', {})
  emit('searchChange', '')
}
</script>

<style scoped>
.ob-table-root { display: flex; flex-direction: column; height: 100%; gap: 8px; }

/* ---- 过滤栏 ---- */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
}

.search-wrap { position: relative; }
.search-input {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 12px;
  padding: 5px 10px;
  outline: none;
  width: 140px;
}
.search-input::placeholder { color: #64748b; }
.search-input:focus { border-color: rgba(99,102,241,0.5); }

.filter-select {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 12px;
  padding: 5px 8px;
  outline: none;
  cursor: pointer;
}

.conf-range { display: flex; align-items: center; gap: 4px; }
.range-label { font-size: 11px; color: #64748b; }
.range-input {
  width: 56px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 12px;
  padding: 5px 8px;
  outline: none;
}

.reset-btn {
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 5px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #fca5a5;
  cursor: pointer;
}
.reset-btn:hover { background: rgba(239,68,68,0.18); }

.spacer { flex: 1; }
.row-count { font-size: 11px; color: #64748b; }

/* ---- 分组 ---- */
.group-area { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; flex: 1; }

.group-block {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.15s;
}
.group-header:hover { background: rgba(255,255,255,0.05); }
.group-header.green { border-left: 3px solid #10b981; }
.group-header.blue  { border-left: 3px solid #60a5fa; }
.group-header.gray  { border-left: 3px solid #6b7280; }

.group-icon { font-size: 10px; color: #64748b; }
.group-title { color: #e2e8f0; }

.group-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
}
.green-badge { background: rgba(16,185,129,0.15); color: #10b981; }
.blue-badge  { background: rgba(96,165,250,0.15);  color: #60a5fa; }
.gray-badge  { background: rgba(107,114,128,0.15); color: #9ca3af; }

.table-wrap {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.15) transparent;
}
</style>
