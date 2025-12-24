<template>
  <div class="layout">
    <aside class="sidebar">
      <h1>AI Trading · 控制塔</h1>
      <p class="desc">
        后端：风险因子 + 行为评分 + 自动对冲引擎<br>
        前端：实时状态总览 + 标的行为画像 + Greeks 风险水位（Vue3）
      </p>
    </aside>
    <main class="main">
      <section class="admin-bar">
        <div class="admin-left">
          <span class="admin-title">行为评分</span>
          <span class="admin-sub">基于最近 N 天的老虎历史成交 & 盈亏</span>
        </div>
        <div class="admin-right">
          <label class="admin-label">
            窗口天数
            <input
              v-model.number="behaviorWindowDays"
              type="number"
              min="7"
              max="365"
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

      <section class="top-row">
        <RiskSummaryCard />
        <GreeksWaterLevel
          v-if="aiState"
          class="gauge"
          :limits="aiState.limits"
          :exposure="aiState.exposure"
        />
      </section>

      <section class="grid-row">
        <SymbolBehaviorCard
          v-for="item in symbolList"
          :key="item.symbol"
          :symbol="item.symbol"
          :tier="item.tier"
          :behavior-score="item.behavior_score"
          :sell-fly-score="item.sell_fly_score"
          :overtrade-score="item.overtrade_score"
          :revenge-score="item.revenge_score"
          :trade-count="item.trade_count"
          :sell-fly-events="item.sell_fly_events"
          :sell-fly-extra-cost-ratio="item.sell_fly_extra_cost_ratio"
          :overtrade-index="item.overtrade_index"
          :revenge-events="item.revenge_events"
        />
      </section>

      <section class="footer">
        <p>
          当前版本：前后端物理分离 · REST 调用（/api/health, /api/run-auto-hedge-once, /api/ai/state）<br />
          行为评分与卖飞评分驱动每个标的的 ShockPolicy / EarningsPolicy；Greeks 暴露通过水位条形图展示与限额的相对关系。
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import RiskSummaryCard from "./components/RiskSummaryCard.vue";
import SymbolBehaviorCard from "./components/SymbolBehaviorCard.vue";
import GreeksWaterLevel from "./components/GreeksWaterLevel.vue";
import { fetchAiState, type AiStateResponse, rebuildBehavior, type BehaviorRebuildResponse } from "./api/client";

const aiState = ref<AiStateResponse | null>(null);
const loading = ref(false);
const errorMsg = ref("");

const behaviorWindowDays = ref(60);
const rebuilding = ref(false);
const rebuildMsg = ref("");

async function onRebuildBehavior() {
  if (rebuilding.value) return;
  rebuilding.value = true;
  rebuildMsg.value = "";
  try {
    const resp: BehaviorRebuildResponse = await rebuildBehavior(behaviorWindowDays.value);
    rebuildMsg.value = `已重算 ${resp.symbols_processed.length} 个标的的行为评分`;
    // 重算后自动刷新 AI 状态
    await loadAiState();
  } catch (e: any) {
    console.error(e);
    rebuildMsg.value = "行为评分重算失败，请稍后重试";
  } finally {
    rebuilding.value = false;
  }
}

const symbolList = computed(() => {
  if (!aiState.value) return [];
  return Object.values(aiState.value.symbols);
});

async function loadAiState() {
  loading.value = true;
  errorMsg.value = "";
  try {
    aiState.value = await fetchAiState();
  } catch (e: any) {
    console.error(e);
    errorMsg.value = "获取 AI 风控/行为状态失败";
  } finally {
    loading.value = false;
  }
}

onMounted(loadAiState);
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 100vh;
  background: radial-gradient(circle at top, #0f172a 0, #020617 60%);
  color: #e5e7eb;
}
.sidebar {
  padding: 24px 20px;
  border-right: 1px solid rgba(30, 64, 175, 0.6);
  background: radial-gradient(circle at top left, #111827 0, #020617 70%);
}
.sidebar h1 {
  margin: 0 0 12px;
  font-size: 1.15rem;
}
.desc {
  font-size: 0.8rem;
  color: #9ca3af;
  line-height: 1.4;
}
.main {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.top-row {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr);
  gap: 12px;
  align-items: stretch;
}
.gauge {
  align-self: stretch;
}
.grid-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(31, 41, 55, 0.8);
  font-size: 0.78rem;
  color: #6b7280;
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
@media (max-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(30, 64, 175, 0.6);
  }
  .top-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
