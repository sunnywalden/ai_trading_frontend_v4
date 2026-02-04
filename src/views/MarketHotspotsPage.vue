<template>
  <div class="space-y-6 page-container">
    <!-- Header Area -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-100 italic tracking-wider">市场热点 <span class="text-blue-400 font-normal">MARKET HOTSPOTS</span></h2>
        <p class="text-gray-400 text-sm mt-1">聚合美股、全球宏观及重大财经动态的实时资讯</p>
      </div>
      <div class="flex items-center gap-4">
        <!-- View Mode Toggle -->
        <div class="flex items-center bg-gray-800/50 p-1 rounded-lg border border-gray-700">
          <button 
            @click="viewMode = 'grid'"
            :class="['p-1.5 rounded-md transition-all', viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200']"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 012 2H4V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 012 2h-6V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 012 2H4v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 012 2h-6v-2z" />
            </svg>
          </button>
          <button 
            @click="viewMode = 'list'"
            :class="['p-1.5 rounded-md transition-all', viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200']"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <button 
          @click="fetchHotspots(true)" 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
          :disabled="loading"
        >
          <span v-if="loading" class="animate-spin text-lg">↻</span>
          <span>强制刷新</span>
        </button>
        <div class="text-xs text-gray-500 font-mono">
          Update: {{ lastUpdateTime }}
        </div>
      </div>
    </div>

    <!-- Summary Bar -->
    <div v-if="hotspots.length > 0" class="summary-bar">
      <div class="summary-item">
        <span class="summary-label">资讯总数</span>
        <span class="summary-value">{{ hotspots.length }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">BULLISH</span>
        <span class="summary-value profit">{{ sentimentSummary.bullish }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">BEARISH</span>
        <span class="summary-value loss">{{ sentimentSummary.bearish }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">平均影响</span>
        <span class="summary-value" :class="sentimentSummary.avgImpact > 60 ? 'warning' : 'info'">
          {{ sentimentSummary.avgImpact.toFixed(1) }}%
        </span>
      </div>
      <div class="summary-item">
        <span class="summary-label">涉及标的</span>
        <span class="summary-value buy">{{ sentimentSummary.uniqueSymbols }}</span>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button 
        v-for="cat in categories" 
        :key="cat.id"
        @click="filterCategory = cat.id"
        :class="[
          'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
          filterCategory === cat.id 
            ? 'bg-blue-600/30 border-blue-400 text-blue-200' 
            : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:border-gray-500'
        ]"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Main Content Area -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="h-48 bg-gray-800/30 animate-pulse rounded-xl border border-gray-800"></div>
    </div>

    <div v-else-if="filteredHotspots.length > 0">
      <!-- Grid Mode -->
      <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <HotspotCard 
          v-for="(item, index) in filteredHotspots" 
          :key="index"
          :title="item.title"
          :description="item.description"
          :impact-score="item.market_impact_score"
          :sentiment="item.sentiment"
          :category="item.category"
          :source="item.source"
          :time="item.event_date"
          :severity="item.severity"
          :url="item.url"
          :related-symbols="item.related_symbols"
        />
      </div>

      <!-- List Mode -->
      <div v-else class="space-y-3">
        <div 
          v-for="(item, index) in filteredHotspots" 
          :key="index"
          class="flex items-center gap-4 p-4 bg-gray-800/20 hover:bg-gray-800/40 border border-gray-800/50 hover:border-blue-500/30 rounded-lg transition-all group"
        >
          <div :class="['w-1 h-12 rounded-full shrink-0', item.sentiment === 'BULLISH' ? 'bg-green-500' : (item.sentiment === 'BEARISH' ? 'bg-red-500' : 'bg-blue-500')]"></div>
          
          <div class="flex-grow min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-1.5 py-0.5 bg-gray-900 text-[9px] font-bold text-gray-500 rounded uppercase tracking-tighter">{{ item.source }}</span>
              <span class="text-[10px] text-gray-600 uppercase font-mono">{{ formatTime(item.event_date) }}</span>
              <div v-if="item.related_symbols?.length" class="flex gap-1 ml-2">
                <span v-for="sym in item.related_symbols" :key="sym" class="text-[9px] font-mono font-bold text-blue-500">{{ sym }}</span>
              </div>
            </div>
            <h3 class="text-sm font-bold text-gray-200 truncate group-hover:text-blue-400 transition-colors">
              <span class="mr-1 opacity-70">{{ getCategoryIcon(item.category) }}</span>
              {{ item.title }}
            </h3>
          </div>

          <div class="flex items-center gap-8 shrink-0">
            <div class="text-right">
              <div class="text-[8px] text-gray-600 font-bold uppercase mb-0.5">Impact</div>
              <div :class="['text-sm font-mono font-bold', item.market_impact_score > 70 ? 'text-red-500' : 'text-blue-400']">{{ item.market_impact_score }}</div>
            </div>
            <a :href="item.url" target="_blank" class="p-2 text-gray-500 hover:text-blue-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-24 text-gray-500">
      <div class="text-6xl mb-4 text-gray-700 italic">No News Found</div>
      <p>今日暂无符合条件的热点资讯</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import HotspotCard from '../components/HotspotCard.vue';
import { 
  fetchCategories, 
  fetchLatestHotspots, 
  type Hotspot, 
  type Category 
} from '../api/client';

const hotspots = ref<Hotspot[]>([]);
const categories = ref<Category[]>([{ id: 'ALL', label: '全部动态' }]);
const loading = ref(false);
const filterCategory = ref('ALL');
const viewMode = ref<'grid' | 'list'>('grid');
const lastUpdateTime = ref('');

const sentimentSummary = computed(() => {
  const bullish = hotspots.value.filter(h => h.sentiment === 'BULLISH').length;
  const bearish = hotspots.value.filter(h => h.sentiment === 'BEARISH').length;
  const avgImpact = hotspots.value.length > 0 
    ? hotspots.value.reduce((acc, h) => acc + h.market_impact_score, 0) / hotspots.value.length 
    : 0;
  
  const symbols = new Set<string>();
  hotspots.value.forEach(h => {
    h.related_symbols?.forEach(s => symbols.add(s));
  });

  return {
    bullish,
    bearish,
    avgImpact,
    uniqueSymbols: symbols.size
  };
});

const fetchHotspots = async (force: boolean = false) => {
  loading.value = true;
  try {
    // Fetch Categories
    const catData = await fetchCategories();
    categories.value = [{ id: 'ALL', label: '全部动态' }, ...catData];

    // Fetch Latest Hotspots
    const data = await fetchLatestHotspots(force);
    hotspots.value = data;
    lastUpdateTime.value = new Date().toLocaleTimeString();
  } catch (e: any) {
    console.error('Failed to fetch hotspots', e);
  } finally {
    loading.value = false;
  }
};

const filteredHotspots = computed(() => {
  if (filterCategory.value === 'ALL') return hotspots.value;
  return hotspots.value.filter(h => h.category === filterCategory.value);
});

const getCategoryClass = (cat: string) => {
  const classes: Record<string, string> = {
    'WAR': 'bg-red-500/20 text-red-500 border border-red-500/30',
    'ECONOMY': 'bg-green-500/20 text-green-500 border border-green-500/30',
    'FINANCE': 'bg-blue-500/20 text-blue-500 border border-blue-500/30',
    'POLITICS': 'bg-purple-500/20 text-purple-500 border border-purple-500/30',
    'COMPANY': 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30',
    'TECH': 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30',
  };
  return classes[cat] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
};

const getCategoryIcon = (cat: string) => {
  const icons: Record<string, string> = {
    'WAR': '⚔️',
    'ECONOMY': '📉',
    'FINANCE': '🏦',
    'POLITICS': '⚖️',
    'COMPANY': '🏢',
    'TECH': '⚡️',
  };
  return icons[cat] || '📋';
};

const formatTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

onMounted(() => {
  fetchHotspots();
});
</script>

<style scoped>
.page-container {
  padding: 0 0 2rem 0;
}

.summary-bar {
  display: flex;
  gap: 24px;
  padding: 20px 24px;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #f1f5f9;
  font-family: ui-monospace, monospace;
}

.summary-value.profit { color: #22c55e; }
.summary-value.loss { color: #ef4444; }
.summary-value.warning { color: #f59e0b; }
.summary-value.buy { color: #3b82f6; }
.summary-value.info { color: #06b6d4; }

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
