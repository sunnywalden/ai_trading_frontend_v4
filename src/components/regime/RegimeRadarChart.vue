<template>
  <div class="regime-radar-card">
    <div class="card-header">
      <span class="card-title">📡 五维体制评分</span>
      <span v-if="hasScores" class="update-time">{{ formattedDate }}</span>
    </div>

    <div v-if="hasScores" ref="chartRef" class="chart-wrap" />

    <div v-else-if="!loading" class="empty-state">
      <p>暂无评分数据</p>
    </div>
    <div v-else class="loading-state">
      <span class="spinner" /><span>加载中...</span>
    </div>

    <!-- 维度说明 -->
    <div v-if="hasScores" class="dimension-legend">
      <div v-for="dim in DIMENSIONS" :key="dim.key" class="dim-item">
        <span class="dim-dot" :style="{ background: dim.color }" />
        <span class="dim-label">{{ dim.label }}</span>
        <span class="dim-value">{{ dimValue(dim.key) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { RegimeScores } from '@/api/regimeService'

interface Props {
  scores: RegimeScores | null
  classificationDate: string | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const DIMENSIONS = [
  { key: 'trend',    label: '趋势强度', color: '#00ff88' },
  { key: 'vol',      label: '波动率',   color: '#ff9900' },
  { key: 'breadth',  label: '市场广度', color: '#00ccff' },
  { key: 'macro',    label: '宏观环境', color: '#cc88ff' },
  { key: 'momentum', label: '价格动量', color: '#ffcc00' },
] as const

const hasScores = computed(() =>
  props.scores !== null &&
  typeof props.scores === 'object' &&
  Object.values(props.scores).some((v) => v !== null),
)

const formattedDate = computed(() => {
  if (!props.classificationDate) return ''
  return new Date(props.classificationDate).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})

function dimValue(key: keyof RegimeScores): string {
  const v = props.scores?.[key]
  if (typeof v !== 'number') return '—'
  return v.toFixed(1)
}

function buildOption(): echarts.EChartsOption {
  const values = DIMENSIONS.map((d) => {
    const v = props.scores?.[d.key]
    return typeof v === 'number' ? Number(v.toFixed(1)) : 0
  })

  return {
    backgroundColor: 'transparent',
    radar: {
      indicator: DIMENSIONS.map((d) => ({ name: d.label, max: 100 })),
      center: ['50%', '50%'],
      radius: '68%',
      splitNumber: 4,
      axisName: { color: '#888899', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      splitArea: { show: false },
      axisLine:  { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: '当前体制评分',
            symbol: 'circle',
            symbolSize: 5,
            areaStyle: { color: 'rgba(0, 255, 136, 0.12)' },
            lineStyle: { color: '#00ff88', width: 2 },
            itemStyle: { color: '#00ff88' },
            label: {
              show: true,
              formatter: (p: unknown) => {
                const params = p as { value: number[] | number; dataIndex: number }
                const arr = Array.isArray(params.value) ? params.value : [params.value]
                return String(arr[params.dataIndex] ?? '')
              },
              color: '#aaaacc',
              fontSize: 10,
            },
          },
        ],
        tooltip: { show: true },
      },
    ],
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1a1a3a',
      borderColor: '#333355',
      textStyle: { color: '#ccccdd', fontSize: 12 },
    },
  }
}

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value, 'dark')
  chartInstance.setOption(buildOption())
}

function updateChart() {
  if (!chartInstance) return
  chartInstance.setOption(buildOption(), { notMerge: true })
}

function handleResize() {
  chartInstance?.resize()
}

watch(
  () => props.scores,
  async () => {
    await nextTick()
    if (!chartInstance && hasScores.value) {
      initChart()
    } else {
      updateChart()
    }
  },
  { deep: true },
)

onMounted(async () => {
  await nextTick()
  if (hasScores.value) initChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  chartInstance?.dispose()
  chartInstance = null
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.regime-radar-card {
  background: #12122a;
  border: 1px solid #1e1e4a;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #ccccdd;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.update-time {
  font-size: 11px;
  color: #555577;
}

.chart-wrap {
  width: 100%;
  height: 260px;
}

.dimension-legend {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 6px 12px;
  border-top: 1px solid #1e1e4a;
  padding-top: 10px;
}

.dim-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dim-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dim-label {
  font-size: 11px;
  color: #888899;
  flex: 1;
}

.dim-value {
  font-size: 12px;
  font-weight: 600;
  color: #ccccdd;
}

.empty-state,
.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #555577;
  font-size: 13px;
  padding: 40px 0;
  justify-content: center;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #333355;
  border-top-color: #00ff88;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
