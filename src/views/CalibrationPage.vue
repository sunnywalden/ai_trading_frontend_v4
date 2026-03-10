<template>
  <div class="page-container">
    <section class="section-header">
      <div class="page-header-row">
        <div>
          <h2>🎯 置信度校准中心</h2>
          <p>Reliability Diagram · Brier Score · ECE 跟踪</p>
        </div>
        <button class="refresh-button" :disabled="store.loadingCalibration" @click="store.fetchCalibration()">
          {{ store.loadingCalibration ? '计算中...' : '刷新' }}
        </button>
      </div>
    </section>

    <!-- 关键指标卡 -->
    <div class="metrics-row" v-if="store.calibration">
      <div class="metric-card" :class="briGrade(store.calibration.brier_score)">
        <div class="mc-label">Brier Score</div>
        <div class="mc-value">{{ store.calibration.brier_score?.toFixed(4) }}</div>
        <div class="mc-sub">越小越好 (完美=0)</div>
      </div>
      <div class="metric-card" :class="eceGrade(store.calibration.ece)">
        <div class="mc-label">ECE（期望校准误差）</div>
        <div class="mc-value">{{ ((store.calibration.ece ?? 0) * 100).toFixed(2) }}%</div>
        <div class="mc-sub">阈值 12% · {{ (store.calibration.ece ?? 0) > 0.12 ? '⚠️ 需调整' : '✓ 已校准' }}</div>
      </div>
      <div class="metric-card">
        <div class="mc-label">校准因子</div>
        <div class="mc-value">{{ store.calibration.adjustment_factor?.toFixed(3) }}</div>
        <div class="mc-sub">1.0 = 无调整</div>
      </div>
      <div class="metric-card">
        <div class="mc-label">是否需要调整</div>
        <div class="mc-value" :class="store.calibration.needs_adjustment ? 'danger' : 'good'">
          {{ store.calibration.needs_adjustment ? '是' : '否' }}
        </div>
        <div class="mc-sub">{{ store.calibration.snapshot_date }}</div>
      </div>
    </div>

    <div class="row-half" style="margin-bottom: 20px;">
      <!-- Reliability Diagram -->
      <div class="panel">
        <div class="panel-title">📐 Reliability Diagram（置信度 vs 实际胜率）</div>
        <div ref="reliabilityEl" style="width:100%; height:320px;" />
      </div>

      <!-- Brier / ECE 历史趋势 -->
      <div class="panel">
        <div class="panel-title">📈 Brier Score & ECE 历史趋势（近 90 天）</div>
        <div ref="historyEl" style="width:100%; height:320px;" />
      </div>
    </div>

    <!-- 校准桶详情表 -->
    <div class="panel" v-if="store.calibration?.calibration_buckets?.length">
      <div class="panel-title">🪣 置信度分桶详细统计</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>置信度区间</th>
            <th>预测次数</th>
            <th>实际胜率</th>
            <th>偏差</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in store.calibration.calibration_buckets" :key="b.bucket">
            <td class="sym">{{ formatBucketRange(b) }}</td>
            <td>{{ b.count }}</td>
            <td :class="Math.abs(b.actual_rate - b.predicted_rate) > 0.1 ? 'danger' : 'good'">
              {{ (b.actual_rate * 100).toFixed(1) }}%
            </td>
            <td :class="Math.abs(b.actual_rate - b.predicted_rate) > 0.1 ? 'danger' : 'good'">
              {{ ((b.actual_rate - b.predicted_rate) * 100).toFixed(1) }}%
            </td>
            <td>
              <span v-if="Math.abs(b.actual_rate - b.predicted_rate) <= 0.05" class="badge good-badge">良好</span>
              <span v-else-if="Math.abs(b.actual_rate - b.predicted_rate) <= 0.1" class="badge warn-badge">偏差</span>
              <span v-else class="badge danger-badge">超偏差</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAiHubStore } from '@/stores/aiHub'
import * as echarts from 'echarts'

const store = useAiHubStore()
const reliabilityEl = ref<HTMLElement | null>(null)
const historyEl = ref<HTMLElement | null>(null)
let reliChart: echarts.ECharts | null = null
let histChart: echarts.ECharts | null = null

function briGrade(v: number | null | undefined) { return !v ? '' : v < 0.1 ? 'good' : v < 0.2 ? 'warn' : 'danger' }
function eceGrade(v: number | null | undefined) { return !v ? '' : v < 0.08 ? 'good' : v < 0.12 ? 'warn' : 'danger' }

type CalibrationBucketView = {
  bucket: string
  bucket_start?: number | null
  bucket_end?: number | null
  actual_rate: number
  predicted_rate: number
}

function getBucketBounds(bucket: CalibrationBucketView): [number, number] | null {
  if (typeof bucket.bucket_start === 'number' && typeof bucket.bucket_end === 'number') {
    return [bucket.bucket_start, bucket.bucket_end]
  }

  const [left, right] = (bucket.bucket || '').split('-', 2)
  const start = Number(left)
  const end = Number(right)
  if (Number.isFinite(start) && Number.isFinite(end)) {
    return [start, end]
  }
  return null
}

function getBucketMidpoint(bucket: CalibrationBucketView): number | null {
  const bounds = getBucketBounds(bucket)
  if (!bounds) return null
  const [start, end] = bounds
  return (start + end) / 2
}

function formatBucketRange(bucket: CalibrationBucketView): string {
  const bounds = getBucketBounds(bucket)
  if (!bounds) return bucket.bucket || '—'
  const [start, end] = bounds
  return `${(start * 100).toFixed(0)}–${(end * 100).toFixed(0)}%`
}

function renderReliability() {
  if (!reliabilityEl.value || !store.calibration?.calibration_buckets?.length) return
  if (!reliChart) reliChart = echarts.init(reliabilityEl.value, 'dark')
  const buckets = store.calibration.calibration_buckets
  const mid = buckets.map((b) => {
    const midpoint = getBucketMidpoint(b)
    return midpoint === null ? (b.bucket || '—') : `${(midpoint * 100).toFixed(0)}%`
  })
  reliChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际胜率', '完美校准线'], bottom: 0, textStyle: { color: '#ccc' } },
    xAxis: { type: 'category', data: mid, name: '预测置信度', axisLabel: { color: '#999' } },
    yAxis: { type: 'value', min: 0, max: 1, axisLabel: { formatter: (v: number) => (v * 100).toFixed(0) + '%', color: '#999' }, name: '实际胜率' },
    series: [
      { name: '实际胜率', type: 'bar', data: buckets.map((b) => b.actual_rate), itemStyle: { color: '#00ff88' } },
      { name: '完美校准线', type: 'line', data: buckets.map((b) => getBucketMidpoint(b)), itemStyle: { color: '#ffd700' }, lineStyle: { type: 'dashed' } },
    ],
  })
}

function renderHistory() {
  if (!historyEl.value || !store.calibrationHistory.length) return
  if (!histChart) histChart = echarts.init(historyEl.value, 'dark')
  const hist = [...store.calibrationHistory].reverse()
  histChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['Brier Score', 'ECE'], bottom: 0, textStyle: { color: '#ccc' } },
    xAxis: { type: 'category', data: hist.map((h) => h.snapshot_date), axisLabel: { color: '#999', rotate: 30 } },
    yAxis: [
      { type: 'value', name: 'Brier', axisLabel: { color: '#999' }, min: 0 },
      { type: 'value', name: 'ECE%', axisLabel: { formatter: (v: number) => (v * 100).toFixed(1) + '%', color: '#999' }, min: 0 },
    ],
    series: [
      { name: 'Brier Score', type: 'line', smooth: true, data: hist.map((h) => h.brier_score), itemStyle: { color: '#00ff88' }, markLine: { data: [{ yAxis: 0.2, lineStyle: { color: 'rgba(255,68,68,0.4)', type: 'dashed' } }] } },
      { name: 'ECE', type: 'line', smooth: true, yAxisIndex: 1, data: hist.map((h) => h.ece), itemStyle: { color: '#ff6b35' }, markLine: { data: [{ yAxis: 0.12, lineStyle: { color: 'rgba(255,68,68,0.4)', type: 'dashed' } }] } },
    ],
  })
}

watch(() => store.calibration, renderReliability, { deep: true })
watch(() => store.calibrationHistory, renderHistory, { deep: true })
onMounted(async () => { await store.fetchCalibration(); renderReliability(); renderHistory() })
</script>

<style scoped>
.page-container { padding: 20px; background: #1a1a2e; min-height: 100vh; color: #e0e0e0; }
.section-header { margin-bottom: 20px; }
.page-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.page-header-row h2 { margin: 0 0 4px; color: #00ff88; font-size: 1.4rem; }
.page-header-row p { margin: 0; color: #888; font-size: 0.85rem; }
.refresh-button { padding: 6px 16px; background: rgba(0,255,136,0.15); border: 1px solid #00ff88; color: #00ff88; border-radius: 4px; cursor: pointer; }
.refresh-button:disabled { opacity: 0.5; cursor: not-allowed; }
.metrics-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.metric-card { flex: 1; min-width: 150px; background: rgba(0,255,136,0.05); border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 14px 16px; text-align: center; }
.metric-card.good { border-color: rgba(0,255,136,0.5); }
.metric-card.warn { border-color: rgba(255,215,0,0.5); }
.metric-card.danger { border-color: rgba(255,68,68,0.5); }
.mc-label { font-size: 0.75rem; color: #888; margin-bottom: 6px; }
.mc-value { font-size: 1.5rem; font-weight: 700; margin-bottom: 4px; }
.mc-sub { font-size: 0.72rem; color: #666; }
.good { color: #00ff88; } .warn { color: #ffd700; } .danger { color: #ff4444; }
.row-half { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.panel { background: #0d1117; border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.panel-title { font-size: 0.9rem; font-weight: 600; color: #00ff88; margin-bottom: 12px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.data-table th { padding: 8px; background: rgba(0,255,136,0.08); color: #00ff88; text-align: left; }
.data-table td { padding: 7px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.sym { color: #00ff88; font-weight: 600; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; }
.good-badge { background: rgba(0,255,136,0.2); color: #00ff88; }
.warn-badge { background: rgba(255,215,0,0.2); color: #ffd700; }
.danger-badge { background: rgba(255,68,68,0.2); color: #ff4444; }
</style>
