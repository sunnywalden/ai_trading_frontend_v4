<template>
  <div class="page-container">
    <!-- ── 页头 ─────────────────────────────────────────────────────────── -->
    <section class="section-header">
      <div class="page-header-row">
        <div>
          <h2>🧠 市场体制感知</h2>
          <p>实时市场宏观体制分类 · 五维评分 · 策略权重自动调配</p>
        </div>
        <div class="header-actions">
          <button class="refresh-button" :disabled="loading" @click="fetchAll">
            {{ loading ? '加载中...' : '刷新' }}
          </button>
          <button
            v-if="canOverride"
            class="warning-button"
            @click="overrideDialogOpen = true"
          >
            手动覆写体制
          </button>
        </div>
      </div>
    </section>

    <!-- ── 第一行：全宽状态卡 ─────────────────────────────────────────── -->
    <div class="row-full" style="margin-bottom: 20px;">
      <RegimeStatusCard
        :info="currentRegime"
        :var-multiplier="varMultiplier"
        :loading="loading"
        @refresh="fetchAll"
      />
    </div>

    <!-- ── 第二行：雷达图 左 + 权重 右 ──────────────────────────────── -->
    <div class="row-half" style="margin-bottom: 20px;">
      <RegimeRadarChart
        :scores="currentRegime?.scores ?? null"
        :classification-date="currentRegime?.classification_date ?? null"
        :loading="loading"
      />
      <RegimeStrategyWeights
        :regime="currentRegime?.regime ?? null"
        :weights="strategyWeights"
        :updated-at="weightsUpdatedAt"
        :loading="loadingWeights"
      />
    </div>

    <!-- ── 第三行：时间轴 全宽 ────────────────────────────────────────── -->
    <div class="row-full">
      <RegimeTimeline
        :regimes="history"
        :total="historyTotal"
        :loading="loadingHistory"
        @load-more="loadMoreHistory"
      />
    </div>

    <!-- ── 手动覆写弹窗 ────────────────────────────────────────────────── -->
    <div v-if="overrideDialogOpen" class="modal-overlay" @click.self="overrideDialogOpen = false">
      <div class="modal-box">
        <h3 style="margin: 0 0 16px;">手动覆写市场体制</h3>

        <label class="form-label">目标体制</label>
        <select v-model="overrideForm.regime" class="form-select">
          <option
            v-for="(label, key) in REGIME_LABELS"
            :key="key"
            :value="key"
          >{{ label }}（{{ key }}）</option>
        </select>

        <label class="form-label" style="margin-top: 14px;">覆写原因</label>
        <textarea
          v-model="overrideForm.reason"
          class="form-textarea"
          rows="3"
          placeholder="请填写覆写理由（必填）"
        />

        <div class="modal-actions">
          <button class="cancel-button" @click="overrideDialogOpen = false">取消</button>
          <button
            class="danger-button"
            :disabled="!overrideForm.reason.trim() || submitting"
            @click="submitOverride"
          >
            {{ submitting ? '提交中...' : '确认覆写' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  regimeApi,
  type RegimeInfo,
  type RegimeType,
  type RegimeStrategyWeight,
  REGIME_LABELS,
} from '@/api/regimeService'
import RegimeStatusCard      from '@/components/regime/RegimeStatusCard.vue'
import RegimeRadarChart      from '@/components/regime/RegimeRadarChart.vue'
import RegimeStrategyWeights from '@/components/regime/RegimeStrategyWeights.vue'
import RegimeTimeline        from '@/components/regime/RegimeTimeline.vue'

// ── State ────────────────────────────────────────────────────────────────────
const loading        = ref(false)
const loadingWeights = ref(false)
const loadingHistory = ref(false)
const submitting     = ref(false)

const currentRegime    = ref<RegimeInfo | null>(null)
const varMultiplier    = ref<number>(1.0)
const strategyWeights  = ref<RegimeStrategyWeight[]>([])
const weightsUpdatedAt = ref<string | null>(null)
const history          = ref<RegimeInfo[]>([])
const historyTotal     = ref<number>(0)
const historyPage      = ref<number>(1)

const overrideDialogOpen = ref(false)
const overrideForm = ref<{ regime: RegimeType | ''; reason: string }>({
  regime: '',
  reason: '',
})

// TODO: 正式版按角色判断，此处默认允许
const canOverride = computed(() => true)

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchCurrent() {
  try {
    loading.value = true
    const res = await regimeApi.getCurrent()
    // 确保 res.data 是 RegimeCurrentResponse 而不是 RegimeInfo
    if (res.data && 'regime' in res.data) {
      currentRegime.value = res.data.regime
      varMultiplier.value  = res.data.var_multiplier ?? 1.0
    } else {
      // 容错：如果后端还是返回旧的平铺结构
      currentRegime.value = res.data as any
      varMultiplier.value = 1.0
    }
  } catch (e) {
    console.error('[RegimePage] fetchCurrent error', e)
  } finally {
    loading.value = false
  }
}

async function fetchWeights() {
  try {
    loadingWeights.value = true
    const res = await regimeApi.getStrategyWeights()
    strategyWeights.value  = res.data?.weights ?? []
    weightsUpdatedAt.value = res.data?.updated_at ?? null
  } catch (e) {
    console.error('[RegimePage] fetchWeights error', e)
  } finally {
    loadingWeights.value = false
  }
}

async function fetchHistory(page = 1) {
  try {
    loadingHistory.value = true
    const res = await regimeApi.getHistory(page, 20)
    const list = res.data?.regimes ?? []
    if (page === 1) {
      history.value = list
    } else {
      history.value = [...history.value, ...list]
    }
    historyTotal.value = res.data?.total ?? 0
    historyPage.value  = page
  } catch (e) {
    console.error('[RegimePage] fetchHistory error', e)
  } finally {
    loadingHistory.value = false
  }
}

async function fetchAll() {
  await fetchCurrent()
  fetchWeights()
  fetchHistory(1)
}

async function loadMoreHistory() {
  await fetchHistory(historyPage.value + 1)
}

// ── Override ──────────────────────────────────────────────────────────────────
async function submitOverride() {
  if (!overrideForm.value.regime || !overrideForm.value.reason.trim()) return
  try {
    submitting.value = true
    await regimeApi.override({
      regime: overrideForm.value.regime as RegimeType,
      reason: overrideForm.value.reason.trim(),
    })
    overrideDialogOpen.value = false
    overrideForm.value = { regime: '', reason: '' }
    await fetchAll()
  } catch (e) {
    console.error('[RegimePage] override error', e)
  } finally {
    submitting.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => { fetchAll() })
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: #ddddee;
}

.section-header p {
  margin: 0;
  font-size: 13px;
  color: #555577;
}

.page-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.row-full {
  width: 100%;
}

.row-half {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .row-half { grid-template-columns: 1fr; }
}

/* ── buttons ────────────────────────────────────────────────────────────── */
.refresh-button {
  padding: 7px 16px;
  border: 1px solid #333366;
  border-radius: 5px;
  background: transparent;
  color: #aaaacc;
  cursor: pointer;
  font-size: 13px;
  transition: border-color 0.2s, color 0.2s;
}
.refresh-button:hover { border-color: #00ff88; color: #00ff88; }
.refresh-button:disabled { opacity: 0.4; cursor: not-allowed; }

.warning-button {
  padding: 7px 16px;
  border: 1px solid #ff9900;
  border-radius: 5px;
  background: transparent;
  color: #ff9900;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}
.warning-button:hover { background: rgba(255, 153, 0, 0.1); }

.danger-button {
  padding: 7px 16px;
  border: 1px solid #ff4d4d;
  border-radius: 5px;
  background: rgba(255, 77, 77, 0.08);
  color: #ff4d4d;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}
.danger-button:hover { background: rgba(255, 77, 77, 0.18); }
.danger-button:disabled { opacity: 0.4; cursor: not-allowed; }

.cancel-button {
  padding: 7px 16px;
  border: 1px solid #333355;
  border-radius: 5px;
  background: transparent;
  color: #888899;
  cursor: pointer;
  font-size: 13px;
}

/* ── override modal ─────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: #12122a;
  border: 1px solid #2a2a5a;
  border-radius: 10px;
  padding: 28px 32px;
  width: 440px;
  max-width: 95vw;
}

.modal-box h3 {
  color: #ddddee;
  font-size: 16px;
}

.form-label {
  display: block;
  font-size: 12px;
  color: #888899;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-select,
.form-textarea {
  width: 100%;
  background: #0e0e2a;
  border: 1px solid #2a2a5a;
  border-radius: 5px;
  color: #ccccdd;
  font-size: 13px;
  padding: 7px 10px;
  box-sizing: border-box;
}

.form-textarea {
  resize: vertical;
  min-height: 72px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
