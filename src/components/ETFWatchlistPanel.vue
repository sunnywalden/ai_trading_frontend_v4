<template>
  <div class="etf-watchlist-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h3 class="panel-title">📊 ETF 自选列表</h3>
      <div class="header-actions">
        <button class="btn-icon" @click="refresh" :disabled="loading" title="刷新">
          <span :class="loading ? 'rotating' : ''">🔄</span>
        </button>
        <button class="btn-icon" @click="showAddModal = true" title="添加 ETF">
          ➕
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.key"
        class="filter-btn"
        :class="{ active: activeFilter === f.key }"
        @click="activeFilter = f.key"
      >
        {{ f.label }}
      </button>
      <input
        v-model="searchText"
        class="search-input"
        placeholder="搜索代码/名称…"
        type="text"
      />
    </div>

    <!-- 列表 -->
    <div class="etf-list">
      <div v-if="loading && !items.length" class="loading-state">
        <div class="skeleton" v-for="i in 5" :key="i"></div>
      </div>
      <div v-else-if="!filteredItems.length" class="empty-state">
        <p>暂无 ETF 数据，点击 ➕ 添加</p>
      </div>
      <TransitionGroup name="list-slide" tag="div" v-else>
        <div
          v-for="item in filteredItems"
          :key="item.symbol"
          class="etf-row"
          @click="emit('select', item)"
        >
          <!-- 代码 + 名称 -->
          <div class="etf-meta">
            <span class="etf-symbol">{{ item.symbol }}</span>
            <span class="etf-name">{{ item.name }}</span>
            <span v-if="heldSymbols.has(item.symbol)" class="etf-held-badge">持中</span>
          </div>
          <!-- 行情 -->
          <div class="etf-price-block">
            <span class="etf-price">{{ formatPrice(item.price) }}</span>
            <span
              class="etf-change"
              :class="item.change_pct >= 0 ? 'up' : 'down'"
            >
              {{ item.change_pct >= 0 ? '+' : '' }}{{ item.change_pct?.toFixed(2) }}%
            </span>
          </div>
          <!-- 分类标签 -->
          <span class="etf-category">{{ item.category }}</span>
          <!-- 删除 -->
          <button
            class="btn-remove"
            @click.stop="removeItem(item.symbol)"
            title="移除"
          >✕</button>
        </div>
      </TransitionGroup>
    </div>

    <!-- 添加弹窗 -->
    <div v-if="showAddModal" class="add-overlay" @click.self="showAddModal = false">
      <div class="add-dialog">
        <h4>添加 ETF</h4>
        <input
          v-model="newSymbol"
          class="add-input"
          placeholder="输入代码，如 SPY / QQQ"
          @keyup.enter="addItem"
          autofocus
        />
        <div class="add-actions">
          <button class="btn-cancel" @click="showAddModal = false">取消</button>
          <button class="btn-add" @click="addItem" :disabled="!newSymbol.trim()">确认添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLifecycleStore } from '@/stores/lifecycle'
import { computed, onMounted, ref } from 'vue'

const lifecycleStore = useLifecycleStore()
/** Set of symbols currently held as active positions (V10.4.4) */
const heldSymbols = computed(() =>
  new Set(lifecycleStore.positions.map(p => p.symbol))
)

interface EtfItem {
  symbol: string
  name: string
  price: number
  change_pct: number
  category: string
  market: 'US' | 'HK' | string
}

const props = defineProps<{
  accountId?: string
}>()

const emit = defineEmits<{
  (e: 'select', item: EtfItem): void
}>()

// ── state ──
const items = ref<EtfItem[]>([])
const loading = ref(false)
const activeFilter = ref('all')
const searchText = ref('')
const showAddModal = ref(false)
const newSymbol = ref('')

const filters = [
  { key: 'all', label: '全部' },
  { key: 'US',  label: '美股' },
  { key: 'HK',  label: '港股' },
]

// ── computed ──
const filteredItems = computed(() => {
  let list = items.value
  if (activeFilter.value !== 'all') {
    list = list.filter(i => i.market === activeFilter.value)
  }
  if (searchText.value) {
    const kw = searchText.value.toUpperCase()
    list = list.filter(
      i => i.symbol.includes(kw) || i.name.includes(searchText.value)
    )
  }
  return list
})

// ── methods ──
async function refresh() {
  loading.value = true
  try {
    const { api } = await import('@/api/client')
    const resp = await api.get<{ items: EtfItem[] }>('/v1/etf/watchlist')
    items.value = resp.data.items ?? []
  } catch (e) {
    console.warn('[ETFWatchlistPanel] failed to fetch:', e)
  } finally {
    loading.value = false
  }
}

async function addItem() {
  const sym = newSymbol.value.trim().toUpperCase()
  if (!sym) return
  try {
    const { api } = await import('@/api/client')
    await api.post('/v1/etf/watchlist', { symbol: sym })
    showAddModal.value = false
    newSymbol.value = ''
    await refresh()
  } catch (e) {
    console.warn('[ETFWatchlistPanel] add failed:', e)
  }
}

async function removeItem(symbol: string) {
  try {
    const { api } = await import('@/api/client')
    await api.delete(`/v1/etf/watchlist/${symbol}`)
    items.value = items.value.filter(i => i.symbol !== symbol)
  } catch (e) {
    console.warn('[ETFWatchlistPanel] remove failed:', e)
  }
}

function formatPrice(p?: number) {
  if (!p) return '--'
  return p >= 1000 ? p.toFixed(1) : p.toFixed(2)
}

onMounted(refresh)
</script>

<style scoped>
.etf-watchlist-panel {
  background: var(--color-bg-secondary, #1a1f2e);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.panel-title { font-size: 15px; font-weight: 700; color: #f1f5f9; margin: 0; }
.header-actions { display: flex; gap: 6px; }
.btn-icon {
  background: none; border: 1px solid #2d3748; border-radius: 6px;
  color: #9ca3af; font-size: 15px; cursor: pointer; padding: 4px 8px;
}
.btn-icon:hover:not(:disabled) { background: #2d3748; color: #f1f5f9; }

.filter-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.filter-btn {
  padding: 4px 12px; border: 1px solid #374151; border-radius: 20px;
  background: transparent; color: #6b7280; font-size: 12px; cursor: pointer;
}
.filter-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 600; }
.search-input {
  flex: 1; min-width: 120px; padding: 5px 10px; border-radius: 8px;
  border: 1px solid #374151; background: #161b27; color: #e2e8f0; font-size: 12px;
}
.search-input::placeholder { color: #4b5563; }

.etf-list { display: flex; flex-direction: column; gap: 4px; min-height: 80px; }

.skeleton {
  height: 44px; border-radius: 8px;
  background: linear-gradient(90deg, #1e2535 25%, #2d3748 50%, #1e2535 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }

.empty-state { text-align: center; padding: 24px; color: #4b5563; font-size: 14px; }

.etf-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #161b27;
  cursor: pointer;
  transition: background 0.15s;
}
.etf-row:hover { background: #1e2535; }

.etf-meta { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.etf-symbol { font-size: 13px; font-weight: 700; color: #e2e8f0; font-family: monospace; }
.etf-name { font-size: 11px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.etf-held-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.35);
  white-space: nowrap;
  flex-shrink: 0;
}

.etf-price-block { display: flex; flex-direction: column; align-items: flex-end; min-width: 70px; }
.etf-price { font-size: 14px; font-weight: 600; color: #f1f5f9; font-family: monospace; }
.etf-change { font-size: 11px; font-weight: 600; }
.up   { color: #22c55e; }
.down { color: #ef4444; }

.etf-category {
  font-size: 10px; color: #818cf8; background: rgba(99,102,241,0.1);
  border-radius: 4px; padding: 2px 6px; white-space: nowrap;
}
.btn-remove {
  background: none; border: none; color: #4b5563; cursor: pointer; font-size: 12px; padding: 2px 4px;
}
.btn-remove:hover { color: #ef4444; }

/* 添加弹窗 */
.add-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5);
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
}
.add-dialog {
  background: #1e2535; border: 1px solid #374151; border-radius: 10px;
  padding: 20px; width: 260px;
}
.add-dialog h4 { margin: 0 0 12px; color: #f1f5f9; font-size: 15px; }
.add-input {
  width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #374151;
  background: #161b27; color: #e2e8f0; font-size: 13px; box-sizing: border-box;
}
.add-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
.btn-cancel { padding: 6px 14px; border-radius: 6px; border: 1px solid #374151; background: transparent; color: #9ca3af; cursor: pointer; font-size: 13px; }
.btn-add { padding: 6px 14px; border-radius: 6px; border: none; background: #6366f1; color: #fff; cursor: pointer; font-size: 13px; font-weight: 600; }
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }

.rotating { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.list-slide-enter-active, .list-slide-leave-active { transition: all 0.2s; }
.list-slide-enter-from, .list-slide-leave-to { opacity: 0; transform: translateX(-8px); }
</style>
