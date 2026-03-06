<template>
  <div class="signal-budget-widget">
    <!-- 标题 -->
    <div class="widget-header">
      <span class="widget-icon">📡</span>
      <span class="widget-title">信号配额</span>
      <span
        class="elite-rate-badge"
        :class="eliteRateBadgeClass"
      >精英率 {{ stats?.elite_rate_pct?.toFixed(1) ?? '--' }}%</span>
      <button class="refresh-btn" @click="loadData" :disabled="loading">
        <span v-if="loading" class="spin">⟳</span>
        <span v-else>⟳</span>
      </button>
    </div>

    <!-- 加载态 / 空态 -->
    <div v-if="loading && !stats" class="widget-loading">加载中…</div>
    <div v-else-if="error" class="widget-error">{{ error }}</div>

    <template v-else-if="stats">
      <!-- 三格指标卡 -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-value">{{ stats.total_passed }}</div>
          <div class="kpi-label">今日通过</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value kpi-warn">{{ stats.total_evaluated - stats.total_passed }}</div>
          <div class="kpi-label">今日拒绝</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value kpi-dim">{{ config?.max_daily_signals ?? '--' }}</div>
          <div class="kpi-label">日配额上限</div>
        </div>
      </div>

      <!-- 漏斗瀑布柱图 -->
      <div class="chart-label">漏斗逐层过滤</div>
      <div ref="funnelChartRef" class="funnel-chart"></div>

      <!-- 参数快览 -->
      <div class="config-row">
        <div class="config-item">
          <span class="config-key">置信门槛</span>
          <span class="config-val">{{ config?.signal_confidence_threshold ?? '--' }}</span>
        </div>
        <div class="config-item">
          <span class="config-key">最小共振维度</span>
          <span class="config-val">{{ config?.signal_resonance_min_dims ?? '--' }}/6</span>
        </div>
        <div class="config-item">
          <span class="config-key">最大并发仓位</span>
          <span class="config-val">{{ config?.max_concurrent_positions ?? '--' }}</span>
        </div>
      </div>

      <div class="widget-footer">
        <router-link to="/signal-watchtower" class="watchtower-link">
          前往信号哨所 →
        </router-link>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { signalQualityService } from '@/api/signalQualityService'
import type { FunnelStats, QualityConfig } from '@/api/signalQualityService'

const props = withDefaults(defineProps<{ sinceDays?: number }>(), {
  sinceDays: 7,
})

const loading          = ref(false)
const error            = ref<string | null>(null)
const stats            = ref<FunnelStats | null>(null)
const config           = ref<QualityConfig | null>(null)
const funnelChartRef   = ref<HTMLElement | null>(null)
let funnelChart: echarts.ECharts | null = null
let disposed = false

function handleResize() {
  if (!funnelChart) return
  try {
    funnelChart.resize()
  } catch {
    // ignore disposed chart resize during rapid route switches
  }
}

const eliteRateBadgeClass = computed(() => {
  const r = stats.value?.elite_rate_pct ?? 0
  if (r <= 5)  return 'badge-ok'
  if (r <= 15) return 'badge-warn'
  return 'badge-high'
})

async function loadData() {
  if (disposed) return
  loading.value = true
  error.value   = null
  try {
    const [s, c] = await Promise.all([
      signalQualityService.getFunnelStats(props.sinceDays),
      signalQualityService.getConfig(),
    ])
    stats.value  = s
    config.value = c
    await nextTick()
    if (!disposed) renderFunnelChart()
  } catch (e: any) {
    error.value = e?.message ?? '加载失败'
  } finally {
    loading.value = false
  }
}

function renderFunnelChart() {
  if (!funnelChartRef.value || !stats.value) return
  if (disposed) return
  if (!funnelChart) {
    funnelChart = echarts.init(funnelChartRef.value)
  }

  const s = stats.value
  const total = s.total_evaluated || 1
  const layers = [
    { name: 'L0 流动性', rejected: s.layer_stats.layer_0_rejected },
    { name: 'L1 体制门', rejected: s.layer_stats.layer_1_rejected },
    { name: 'L2 组合容量', rejected: s.layer_stats.layer_2_rejected },
    { name: 'L3 共振强制', rejected: s.layer_stats.layer_3_rejected },
    { name: 'L4 置信度', rejected: s.layer_stats.layer_4_rejected },
  ]
  // 从左到右各阶段存量
  const stages: number[] = [total]
  layers.forEach(l => {
    stages.push(Math.max(0, stages[stages.length - 1] - l.rejected))
  })
  const labels = ['进入', ...layers.map(l => l.name), '精英通过']
  const values = stages.concat([s.total_passed])

  funnelChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}: {c}' },
    grid:    { top: 10, bottom: 24, left: 10, right: 10, containLabel: true },
    xAxis:   { type: 'category', data: labels, axisLabel: { fontSize: 9, color: '#9ca3af' } },
    yAxis:   { type: 'value', show: false },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({
        value: v,
        itemStyle: {
          color: i === values.length - 1
            ? '#22c55e'
            : i === 0 ? '#60a5fa' : '#f59e0b',
        },
      })),
      label: { show: true, position: 'top', fontSize: 9, color: '#e5e7eb',
               formatter: (p: any) => p.value > 0 ? p.value : '' },
      barMaxWidth: 32,
    }],
  })
}

onMounted(() => {
  disposed = false
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  disposed = true
  window.removeEventListener('resize', handleResize)
  if (funnelChart) {
    try {
      funnelChart.dispose()
    } catch {
      // ignore duplicate dispose noise
    }
    funnelChart = null
  }
})
</script>

<script lang="ts">
import { computed } from 'vue'
export default { name: 'SignalBudgetWidget' }
</script>

<style scoped>
.signal-budget-widget {
  background: linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(31,41,55,0.95) 100%);
  border: 1px solid rgba(75,85,99,0.4);
  border-radius: 12px;
  padding: 16px;
  min-width: 280px;
  color: #e5e7eb;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.widget-icon { font-size: 16px; }
.widget-title { font-size: 14px; font-weight: 600; flex: 1; }

.elite-rate-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}
.badge-ok   { background: rgba(34,197,94,0.2);  color: #22c55e; }
.badge-warn { background: rgba(245,158,11,0.2); color: #f59e0b; }
.badge-high { background: rgba(239,68,68,0.2);  color: #ef4444; }

.refresh-btn {
  background: none; border: none; cursor: pointer;
  color: #6b7280; font-size: 14px; padding: 2px 4px;
  transition: color 0.2s;
}
.refresh-btn:hover { color: #93c5fd; }
.spin { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.widget-loading,
.widget-error {
  text-align: center; padding: 20px 0; font-size: 12px; color: #6b7280;
}
.widget-error { color: #f87171; }

/* KPI 行 */
.kpi-row {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.kpi-card {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 8px 4px;
  text-align: center;
}
.kpi-value {
  font-size: 20px;
  font-weight: 700;
  color: #22c55e;
  line-height: 1.1;
}
.kpi-warn  { color: #f59e0b; }
.kpi-dim   { color: #9ca3af; }
.kpi-label { font-size: 10px; color: #6b7280; margin-top: 2px; }

/* 漏斗图 */
.chart-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
.funnel-chart { height: 100px; width: 100%; }

/* 参数快览 */
.config-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.config-item {
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  padding: 4px 8px;
  flex: 1;
  min-width: 80px;
}
.config-key { font-size: 9px; color: #6b7280; }
.config-val { font-size: 13px; font-weight: 600; color: #93c5fd; }

/* 链接 */
.widget-footer { margin-top: 10px; text-align: right; }
.watchtower-link {
  font-size: 11px;
  color: #60a5fa;
  text-decoration: none;
  transition: color 0.2s;
}
.watchtower-link:hover { color: #93c5fd; }
</style>
