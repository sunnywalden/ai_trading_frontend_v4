<template>
  <div class="portfolio-dashboard">
    <div class="dashboard-grid">
      <!-- 核心水球图/仪表盘 -->
      <div class="dashboard-card main-metrics">
        <div class="metric-top">
          <div class="metric-circle" :style="{ borderColor: getScoreColor(analysis.weighted_score) }">
            <div class="score-value">{{ analysis.weighted_score }}</div>
            <div class="score-label">{{ $t('portfolio.weighted_score') }}</div>
          </div>
          <div class="beta-box">
            <div class="beta-value" :class="getBetaClass(analysis.total_beta)">{{ analysis.total_beta }}</div>
            <div class="beta-label">{{ $t('portfolio.beta_label') }}</div>
          </div>
        </div>
        <div class="ai-summary" v-if="analysis.ai_summary">
          <h4>🤖 {{ $t('portfolio.ai_summary') }}</h4>
          <p>{{ analysis.ai_summary }}</p>
        </div>
      </div>

      <!-- 行业分布饼图 -->
      <div class="dashboard-card chart-card">
        <h4>{{ $t('portfolio.sector_exposure') }}</h4>
        <div ref="chartRef" class="sector-chart"></div>
      </div>

      <!-- 优化建议 -->
      <div class="dashboard-card recommendations-card">
        <h4>💡 {{ $t('portfolio.optimization_title') }}</h4>
        <div class="rec-list">
          <div v-for="(rec, idx) in recommendations" :key="idx" class="rec-item" :class="rec.type.toLowerCase()">
            <div class="rec-icon">{{ getRecIcon(rec.type) }}</div>
            <div class="rec-content">
              <div class="rec-action">{{ rec.action }}</div>
              <div class="rec-reason">{{ rec.reason }}</div>
            </div>
          </div>
        </div>
        <div v-if="recommendations.length === 0" class="no-rec">
          {{ $t('portfolio.no_recommendations') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';

const props = defineProps<{
  analysis: {
    weighted_score: number;
    total_beta: number;
    sector_ratios: Record<string, number>;
    ai_summary?: string;
  };
  recommendations: Array<{
    type: string;
    action: string;
    reason: string;
  }>;
}>();

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const initChart = () => {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value);
  const data = Object.entries(props.analysis.sector_ratios).map(([name, value]) => ({
    name,
    value: Math.round(value * 1000) / 10
  })).sort((a, b) => b.value - a.value);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#888' }
    },
    series: [
      {
        name: '行业占比',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#1e1e1e',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            formatter: '{b}\n{c}%'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  };

  chartInstance.setOption(option);
};

const getScoreColor = (score: number) => {
  if (score >= 80) return '#4caf50';
  if (score >= 60) return '#2196f3';
  if (score >= 40) return '#ff9800';
  return '#f44336';
};

const getBetaClass = (beta: number) => {
  if (beta > 1.3) return 'high-risk';
  if (beta < 0.7) return 'low-risk';
  return 'normal';
};

const getRecIcon = (type: string) => {
  switch (type) {
    case 'REBALANCE': return '🔄';
    case 'HEDGE': return '🛡️';
    case 'DIVERSIFY': return '🧩';
    case 'RISK': return '⚠️';
    default: return '💡';
  }
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const handleResize = () => {
  chartInstance?.resize();
};

watch(() => props.analysis, () => {
  initChart();
}, { deep: true });
</script>

<style scoped>
.portfolio-dashboard {
  margin-bottom: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.dashboard-card {
  background: var(--card-bg, #1e1e1e);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #333;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.main-metrics {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.metric-top {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.metric-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 6px solid #4caf50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 1.8rem;
  font-weight: bold;
}

.score-label {
  font-size: 0.7rem;
  color: #888;
}

.beta-box {
  flex: 1;
}

.beta-value {
  font-size: 2rem;
  font-weight: bold;
}

.beta-value.high-risk { color: #f44336; }
.beta-value.low-risk { color: #2196f3; }
.beta-value.normal { color: #4caf50; }

.beta-label {
  color: #888;
  font-size: 0.85rem;
}

.ai-summary h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  color: #aaa;
}

.ai-summary p {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #ddd;
}

.chart-card h4 {
  margin: 0 0 1rem 0;
  color: #aaa;
}

.sector-chart {
  height: 250px;
}

.recommendations-card h4 {
  margin: 0 0 1rem 0;
  color: #aaa;
}

.rec-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rec-item {
  display: flex;
  gap: 1rem;
  padding: 0.8rem;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border-left: 4px solid #555;
}

.rec-item.rebalance { border-left-color: #2196f3; }
.rec-item.hedge { border-left-color: #9c27b0; }
.rec-item.diversify { border-left-color: #4caf50; }
.rec-item.risk { border-left-color: #ff9800; }

.rec-icon {
  font-size: 1.2rem;
}

.rec-action {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
}

.rec-reason {
  font-size: 0.85rem;
  color: #999;
}

.no-rec {
  text-align: center;
  color: #666;
  padding: 2rem;
}
</style>
