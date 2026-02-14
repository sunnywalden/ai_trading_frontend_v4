<template>
  <div class="performance-chart">
    <h3>性能</h3>
    
    <div ref="chartRef" class="chart-container"></div>
    
    <div class="metrics-summary">
      <div class="metric-card">
        <div class="metric-label">当日PnL</div>
        <div class="metric-value" :class="(metrics?.daily_pnl || 0) >= 0 ? 'positive' : 'negative'">
          {{ (metrics?.daily_pnl || 0) >= 0 ? '+' : '' }}${{ (metrics?.daily_pnl || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">当日收益</div>
        <div class="metric-value" :class="(metrics?.daily_return || 0) >= 0 ? 'positive' : 'negative'">
          {{ (metrics?.daily_return || 0) >= 0 ? '+' : '' }}{{ ((metrics?.daily_return || 0) * 100).toFixed(2) }}%
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">累计收益</div>
        <div class="metric-value" :class="(metrics?.cumulative_return || 0) >= 0 ? 'positive' : 'negative'">
          {{ (metrics?.cumulative_return || 0) >= 0 ? '+' : '' }}{{ ((metrics?.cumulative_return || 0) * 100).toFixed(2) }}%
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">权益</div>
        <div class="metric-value">
          ${{ (metrics?.total_equity || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { DailyPerformance } from '@/api/quantLoopService'

const props = withDefaults(defineProps<{
  metrics?: DailyPerformance
  chartData?: any[]
}>(), {
  metrics: () => ({
    date: '',
    account_id: '',
    signals_executed: 0,
    total_equity: 0,
    daily_pnl: 0,
    daily_return: 0,
    cumulative_return: 0,
    signal_analysis: {},
    best_signal: null,
    worst_signal: null
  })
})

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

onMounted(() => {
  if (chartRef.value) {
    initChart()
  }
})

watch(() => props.chartData, () => {
  updateChart()
}, { deep: true })

function initChart() {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: {
        color: '#f1f5f9'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLine: {
        lineStyle: {
          color: '#334155'
        }
      },
      axisLabel: {
        color: '#94a3b8'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#334155'
        }
      },
      axisLabel: {
        color: '#94a3b8',
        formatter: (value: number) => {
          return value >= 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`
        }
      },
      splitLine: {
        lineStyle: {
          color: '#334155',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '累计收益率',
        type: 'line',
        data: [],
        smooth: true,
        lineStyle: {
          color: '#a78bfa',
          width: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(167, 139, 250, 0.3)' },
            { offset: 1, color: 'rgba(167, 139, 250, 0.0)' }
          ])
        },
        itemStyle: {
          color: '#a78bfa'
        }
      }
    ]
  }
  
  chartInstance.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', handleResize)
}

function updateChart() {
  if (!chartInstance || !props.chartData) return
  
  const dates = props.chartData.map(item => item.date)
  const returns = props.chartData.map(item => (item.cumulative_return * 100).toFixed(2))
  
  chartInstance.setOption({
    xAxis: {
      data: dates
    },
    series: [{
      data: returns
    }]
  })
}

function handleResize() {
  chartInstance?.resize()
}
</script>

<style scoped>
.performance-chart {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
  /* 移动端触摸优化 */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #f1f5f9;
}

.chart-container {
  width: 100%;
  height: 300px;
  margin-bottom: 20px;
}

.metrics-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #334155;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-label {
  color: #94a3b8;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  color: #f1f5f9;
  font-size: 24px;
  font-weight: 700;
}

.metric-value.positive {
  color: #22c55e;
}

.metric-value.negative {
  color: #ef4444;
}

/* 移动端响应式优化 */
@media (max-width: 1024px) {
  .chart-container {
    height: 250px;
  }
  
  .metrics-summary {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
  
  .metric-value {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .performance-chart {
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
  }
  
  h3 {
    margin-bottom: var(--spacing-lg);
    font-size: 18px;
  }
  
  .chart-container {
    height: 220px;
    margin-bottom: var(--spacing-lg);
  }
  
  .metrics-summary {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
    padding-top: var(--spacing-lg);
  }
  
  .metric-card {
    gap: var(--spacing-xs);
    padding: var(--spacing-md);
    background: rgba(15, 23, 42, 0.5);
    border-radius: var(--radius-md);
    border: 1px solid rgba(148, 163, 184, 0.1);
    transition: all 0.2s ease;
  }
  
  .metric-card:active {
    transform: scale(0.98);
    background: rgba(139, 92, 246, 0.1);
  }
  
  .metric-label {
    font-size: 11px;
  }
  
  .metric-value {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .performance-chart {
    padding: var(--spacing-md);
  }
  
  h3 {
    font-size: 16px;
  }
  
  .chart-container {
    height: 200px;
  }
  
  .metrics-summary {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .metric-card {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .metric-label {
    font-size: 10px;
  }
  
  .metric-value {
    font-size: 16px;
  }
}
</style>
