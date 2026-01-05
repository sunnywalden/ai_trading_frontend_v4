<template>
  <div class="risk-indicator">
    <div class="indicator-container">
      <svg class="gauge-svg" viewBox="0 0 200 120">
        <!-- 背景弧线 -->
        <path
          :d="backgroundArc"
          fill="none"
          stroke="rgba(55, 65, 81, 0.5)"
          stroke-width="20"
          stroke-linecap="round"
        />
        
        <!-- 渐变色彩弧线 -->
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
            <stop offset="33%" style="stop-color:#f59e0b;stop-opacity:1" />
            <stop offset="66%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#22c55e;stop-opacity:1" />
          </linearGradient>
        </defs>
        <path
          :d="backgroundArc"
          fill="none"
          stroke="url(#gaugeGradient)"
          stroke-width="20"
          stroke-linecap="round"
          opacity="0.3"
        />
        
        <!-- 当前值指针弧线 -->
        <path
          :d="valueArc"
          fill="none"
          :stroke="currentColor"
          stroke-width="20"
          stroke-linecap="round"
        />
        
        <!-- 指针三角形 -->
        <polygon
          :points="needlePoints"
          :fill="currentColor"
          opacity="0.8"
        />
        
        <!-- 中心圆点 -->
        <circle cx="100" cy="100" r="8" fill="rgba(55, 65, 81, 0.8)" />
        <circle cx="100" cy="100" r="5" :fill="currentColor" />
      </svg>
      
      <div class="score-display">
        <div class="score-value" :style="{ color: currentColor }">{{ score }}</div>
        <div class="score-max">/ {{ maxScore }}</div>
      </div>
      
      <div class="level-label" :style="{ color: currentColor }">{{ level }}</div>
    </div>
    
    <div class="scale-labels">
      <span class="scale-label danger">高风险</span>
      <span class="scale-label warning">中风险</span>
      <span class="scale-label safe">低风险</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  score: number;
  maxScore?: number;
  level?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxScore: 100,
  level: ''
});

// 计算弧线路径
const startAngle = -135; // 起始角度
const endAngle = 135;    // 结束角度
const radius = 70;
const centerX = 100;
const centerY = 100;

function polarToCartesian(angle: number) {
  const angleInRadians = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArc(startAngle: number, endAngle: number) {
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y
  ].join(' ');
}

const backgroundArc = computed(() => {
  return describeArc(startAngle, endAngle);
});

const valueArc = computed(() => {
  const percentage = props.score / props.maxScore;
  const currentAngle = startAngle + (endAngle - startAngle) * percentage;
  return describeArc(startAngle, currentAngle);
});

// 计算指针位置
const needlePoints = computed(() => {
  const percentage = props.score / props.maxScore;
  const currentAngle = startAngle + (endAngle - startAngle) * percentage;
  const angleInRadians = (currentAngle * Math.PI) / 180;
  
  const needleLength = 65;
  const needleWidth = 8;
  
  const tipX = centerX + needleLength * Math.cos(angleInRadians);
  const tipY = centerY + needleLength * Math.sin(angleInRadians);
  
  const baseAngle1 = angleInRadians - Math.PI / 2;
  const baseAngle2 = angleInRadians + Math.PI / 2;
  
  const base1X = centerX + needleWidth * Math.cos(baseAngle1);
  const base1Y = centerY + needleWidth * Math.sin(baseAngle1);
  const base2X = centerX + needleWidth * Math.cos(baseAngle2);
  const base2Y = centerY + needleWidth * Math.sin(baseAngle2);
  
  return `${tipX},${tipY} ${base1X},${base1Y} ${base2X},${base2Y}`;
});

// 根据分数确定颜色
const currentColor = computed(() => {
  const percentage = props.score / props.maxScore;
  if (percentage >= 0.7) return '#22c55e'; // 绿色 - 低风险
  if (percentage >= 0.5) return '#3b82f6'; // 蓝色 - 中低风险
  if (percentage >= 0.3) return '#f59e0b'; // 橙色 - 中高风险
  return '#ef4444'; // 红色 - 高风险
});
</script>

<style scoped>
.risk-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.indicator-container {
  position: relative;
  width: 200px;
  height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-svg {
  width: 100%;
  height: auto;
}

.score-display {
  position: absolute;
  bottom: 20px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
}

.score-max {
  font-size: 1rem;
  color: #6b7280;
  font-weight: 600;
}

.level-label {
  position: absolute;
  bottom: 0;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 180px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.scale-label.danger {
  color: #ef4444;
}

.scale-label.warning {
  color: #f59e0b;
}

.scale-label.safe {
  color: #22c55e;
}
</style>
