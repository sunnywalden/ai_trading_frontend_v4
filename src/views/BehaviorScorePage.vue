<template>
  <div class="page-container">
    <section class="admin-bar">
      <div class="admin-left">
        <span class="admin-title">行为评分</span>
        <span class="admin-sub">基于最近 N 天的老虎历史成交 & 盈亏</span>
      </div>
      <div class="admin-right">
        <label class="admin-label">
          窗口天数
          <input
            v-model.number="windowDays"
            type="number"
            min="7"
            max="365"
            @change="onWindowDaysChange"
          />
        </label>
        <button
          class="admin-button"
          :disabled="rebuilding"
          @click="onRebuildBehavior"
        >
          <span v-if="!rebuilding">重新计算行为评分</span>
          <span v-else>正在重算...</span>
        </button>
      </div>
    </section>
    <p v-if="rebuildMsg" class="admin-tip">
      {{ rebuildMsg }}
    </p>

    <p v-if="errorMsg" class="state-message error">{{ errorMsg }}</p>
    <p v-else-if="loading" class="state-message loading">正在加载行为评分...</p>

    <PlanDeviationSummaryCard
      v-if="aiState"
      :total-symbols="symbolList.length"
      :overtrade-count="overtradeCount"
      :revenge-count="revengeCount"
    />

    <section v-if="aiState" class="grid-row">
      <SymbolBehaviorCard
        v-for="item in symbolList"
        :key="item.symbol"
        :symbol="item.symbol"
        :tier="item.tier"
        :behavior-score="item.behavior_score"
        :sell-fly-score="item.sell_fly_score"
        :discipline-score="item.discipline_score"
        :overtrade-score="item.overtrade_score"
        :revenge-score="item.revenge_score"
        :trade-count="item.trade_count"
        :sell-fly-events="item.sell_fly_events"
        :sell-fly-extra-cost-ratio="item.sell_fly_extra_cost_ratio"
        :overtrade-index="item.overtrade_index"
        :revenge-events="item.revenge_events"
      />
    </section>

    <BehaviorGuideline />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import PlanDeviationSummaryCard from '../components/PlanDeviationSummaryCard.vue';
import SymbolBehaviorCard from '../components/SymbolBehaviorCard.vue';
import BehaviorGuideline from '../components/BehaviorGuideline.vue';
import { 
  fetchAiState, 
  type AiStateResponse, 
  rebuildBehavior, 
  type BehaviorRebuildResponse
} from '../api/client';
import { appConfig, updateWindowDays } from '../config/global';

const aiState = ref<AiStateResponse | null>(null);
const loading = ref(false);
const errorMsg = ref('');
const rebuilding = ref(false);
const rebuildMsg = ref('');
const windowDays = ref(appConfig.windowDays);

const symbolList = computed(() => {
  if (!aiState.value) return [];
  return Object.values(aiState.value.symbols);
});

const overtradeCount = computed(() => {
  return symbolList.value.filter(item => item.overtrade_score >= 70).length;
});

const revengeCount = computed(() => {
  return symbolList.value.filter(item => item.revenge_score >= 70).length;
});

async function loadAiState() {
  loading.value = true;
  errorMsg.value = '';
  try {
    aiState.value = await fetchAiState(windowDays.value);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = '⏱️ 请求超时，请稍后再试！';
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = '🌐 网络连接失败，请检查网络或后端服务状态';
    } else {
      errorMsg.value = '❌ 获取 AI 风控/行为状态失败';
    }
  } finally {
    loading.value = false;
  }
}

async function onRebuildBehavior() {
  if (rebuilding.value) return;
  rebuilding.value = true;
  rebuildMsg.value = '';
  try {
    const resp: BehaviorRebuildResponse = await rebuildBehavior(windowDays.value);
    rebuildMsg.value = `✅ 已重算 ${resp.symbols_processed.length} 个标的的行为评分`;
    await loadAiState();
  } catch (e: any) {
    console.error(e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      rebuildMsg.value = '⏱️ 请求超时，请稍后重试！';
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      rebuildMsg.value = '🌐 网络连接失败，请检查后端服务';
    } else {
      rebuildMsg.value = '❌ 行为评分重算失败，请稍后重试';
    }
  } finally {
    rebuilding.value = false;
  }
}

function onWindowDaysChange() {
  updateWindowDays(windowDays.value);
  loadAiState();
}

onMounted(() => {
  loadAiState();
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 24px;
}

.admin-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.admin-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.admin-sub {
  font-size: 0.75rem;
  color: #9ca3af;
}

.admin-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-label {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.admin-label input {
  width: 70px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: #020617;
  color: #e5e7eb;
}

.admin-button {
  padding: 6px 12px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  background: linear-gradient(to right, #22c55e, #16a34a);
  color: #e5e7eb;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
  transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
}

.admin-button:disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}

.admin-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 0 18px rgba(34, 197, 94, 0.8);
}

.admin-tip {
  margin: 0;
  font-size: 0.78rem;
  color: #a5b4fc;
}

.grid-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.state-message {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.state-message.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.state-message.loading {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

</style>
