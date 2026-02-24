<template>
  <div class="page-container">
    <section class="section-header">
      <h2>压力测试</h2>
      <p>模拟极端市场情景下的组合损失，评估抗风险能力</p>
    </section>

    <div class="layout">
      <!-- 场景选择 -->
      <div class="card panel-left">
        <h3 style="margin: 0 0 16px;">选择压力场景</h3>
        <div v-if="stressStore.loading && !stressStore.scenarios?.length" class="loading-message">加载中...</div>
        <div v-else class="scenario-list">
          <label
            v-for="s in stressStore.scenarios"
            :key="s.id"
            class="scenario-item"
            :class="{ selected: selectedIds.includes(s.id) }"
          >
            <input type="checkbox" :value="s.id" v-model="selectedIds" style="margin-right: 8px;" />
            <div>
              <div class="scenario-name">{{ s.name }}</div>
              <div class="scenario-desc">{{ s.description }}</div>
            </div>
          </label>
        </div>
        <div class="options-row">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" v-model="useCurrentPositions" />
            使用当前持仓
          </label>
        </div>
        <button
          class="primary-button"
          @click="handleRun"
          :disabled="stressStore.loading || selectedIds.length === 0"
          style="width: 100%; margin-top: 16px;"
        >{{ stressStore.loading ? '计算中...' : '🔥 运行压力测试' }}</button>
        <p v-if="stressStore.error" class="error-message">{{ stressStore.error }}</p>
      </div>

      <!-- 结果 -->
      <div class="results-panel" v-if="stressStore.result">
        <!-- 汇总 -->
        <div class="summary-cards">
          <div class="summary-card" :class="{ danger: stressStore.worstLoss > 0.15 }">
            <div class="summary-label">最大情景损失</div>
            <div class="summary-value">{{ (stressStore.result.worst_case_loss_pct * 100).toFixed(1) }}%</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">CVaR@99%</div>
            <div class="summary-value">{{ (stressStore.result.total_cvar_99 * 100).toFixed(1) }}%</div>
          </div>
          <div class="summary-card" :class="{ danger: stressStore.breachCount > 0 }">
            <div class="summary-label">超限场景数</div>
            <div class="summary-value">{{ stressStore.breachCount }}</div>
          </div>
        </div>

        <!-- 场景结果表 -->
        <div class="card" style="margin-top: 16px;">
          <h3 style="margin: 0 0 16px;">场景详情</h3>
          <table class="data-table">
            <thead>
              <tr><th>场景</th><th>组合损失</th><th>CVaR@99%</th><th>超限</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in stressStore.result.results" :key="r.scenario_id">
                <td>{{ r.scenario_name }}</td>
                <td :class="r.portfolio_loss_pct > 0.1 ? 'text-danger' : ''">
                  {{ (r.portfolio_loss_pct * 100).toFixed(1) }}%
                </td>
                <td>{{ (r.cvar_99 * 100).toFixed(1) }}%</td>
                <td>
                  <span :class="r.breach_limit ? 'badge-danger' : 'badge-success'">
                    {{ r.breach_limit ? '超限' : '正常' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="card empty-state">
        <p>选择场景后点击运行以查看结果</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStressTestStore } from '@/stores/stressTest'

const stressStore = useStressTestStore()
const selectedIds = ref<string[]>([])
const useCurrentPositions = ref(true)

async function handleRun() {
  await stressStore.runTest({
    scenario_ids: selectedIds.value,
    use_current_positions: useCurrentPositions.value,
  })
}

onMounted(async () => {
  await stressStore.fetchScenarios()
  // 默认全选
  selectedIds.value = stressStore.scenarios.map(s => s.id)
})
</script>

<style scoped>
.layout { display: grid; grid-template-columns: 280px 1fr; gap: 20px; align-items: start; }
.panel-left { }
.card { background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 20px; }
.scenario-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.scenario-item { display: flex; align-items: flex-start; padding: 10px; border-radius: 6px; border: 1px solid transparent; cursor: pointer; }
.scenario-item:hover { background: rgba(255,255,255,0.03); }
.scenario-item.selected { border-color: #4a90e2; background: rgba(74,144,226,0.06); }
.scenario-name { font-size: 13px; font-weight: 500; }
.scenario-desc { font-size: 11px; color: #888; margin-top: 2px; }
.options-row { margin-top: 12px; }
.summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.summary-card { background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 16px; }
.summary-card.danger { border-color: #c62828; }
.summary-label { font-size: 12px; color: #888; margin-bottom: 6px; }
.summary-value { font-size: 24px; font-weight: 700; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 8px 12px; border-bottom: 1px solid var(--border-color, #2d2d4e); text-align: left; }
.data-table th { color: #888; }
.text-danger { color: #f44336; }
.badge-success { background: rgba(76,175,80,0.15); color: #4caf50; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.badge-danger { background: rgba(244,67,54,0.15); color: #f44336; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.primary-button { background: #4a90e2; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.error-message { color: #f44336; font-size: 13px; margin-top: 8px; }
.empty-state { text-align: center; color: #666; }
.loading-message { color: #888; text-align: center; padding: 20px; }
</style>
