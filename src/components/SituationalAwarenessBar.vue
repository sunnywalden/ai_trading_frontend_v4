<template>
  <!-- 36px 粘性顶部态势感知条 -->
  <div class="sa-bar" v-if="snapshot">
    <!-- Block 1: 市场体制 -->
    <div class="sa-block regime-block" :style="{ borderLeft: `3px solid ${snapshot.regime.color}` }">
      <span class="sa-icon">🌊</span>
      <span class="sa-label">体制</span>
      <span class="sa-value" :style="{ color: snapshot.regime.color }">
        {{ snapshot.regime.regime_label || '—' }}
      </span>
      <span class="sa-sub" v-if="snapshot.regime.confidence">
        {{ snapshot.regime.confidence.toFixed(0) }}%
      </span>
      <span class="sa-trend" v-if="snapshot.regime.trend_direction">
        {{ trendIcon(snapshot.regime.trend_direction) }}
      </span>
    </div>

    <div class="sa-divider" />

    <!-- Block 2: VaR -->
    <div class="sa-block var-block">
      <span class="sa-icon">⚠️</span>
      <span class="sa-label">VaR</span>
      <span class="sa-value" :style="{ color: varColor }">
        {{ snapshot.var.current_pct.toFixed(1) }}%/{{ snapshot.var.limit_pct }}%
      </span>
      <div class="var-bar">
        <div
          class="var-bar-fill"
          :style="{
            width: `${Math.min(snapshot.var.usage_ratio * 100, 100)}%`,
            background: varColor,
          }"
        />
      </div>
    </div>

    <div class="sa-divider" />

    <!-- Block 3: 活跃围栏 -->
    <div class="sa-block fences-block">
      <span class="sa-icon">📅</span>
      <span class="sa-label">围栏</span>
      <span class="sa-value" :class="{ warn: snapshot.active_fences.count > 0 }">
        {{ snapshot.active_fences.count }}
      </span>
      <span class="sa-sub" v-if="snapshot.active_fences.entries.length > 0">
        {{ snapshot.active_fences.entries.slice(0, 2).map(e => e.symbol).join('·') }}
      </span>
    </div>

    <div class="sa-divider" />

    <!-- Block 4: 算法执行 -->
    <div class="sa-block exec-block">
      <span class="sa-icon">⑥</span>
      <span class="sa-label">执行中</span>
      <span class="sa-value">{{ snapshot.active_executions.count }}</span>
      <span class="sa-sub" v-if="snapshot.active_executions.entries.length > 0">
        {{ snapshot.active_executions.entries.slice(0, 2).map(e => e.symbol).join('·') }}
      </span>
    </div>

    <div class="sa-divider" />

    <!-- Block 5: 待确认 -->
    <div
      class="sa-block confirms-block"
      :class="{ flashing: snapshot.pending_confirms.is_flashing }"
    >
      <span class="sa-icon">⏳</span>
      <span class="sa-label">待确认</span>
      <span class="sa-value" :class="{ danger: snapshot.pending_confirms.count > 0 }">
        {{ snapshot.pending_confirms.count }}
      </span>
      <span class="sa-sub" v-if="snapshot.pending_confirms.symbols.length > 0">
        {{ snapshot.pending_confirms.symbols.join('·') }}
      </span>
    </div>

    <div class="sa-divider" />

    <!-- Block 6: 自主模式 -->
    <div class="sa-block autonomy-block">
      <span class="sa-icon">🤖</span>
      <span class="sa-label">自主</span>
      <span class="sa-value" :style="{ color: snapshot.autonomy.color }">
        {{ snapshot.autonomy.level_label }}
      </span>
      <span class="sa-dot" :class="snapshot.autonomy.is_running ? 'running' : 'paused'" />
    </div>

    <!-- 右侧：更新时间 -->
    <div class="sa-timestamp">
      {{ formatTime(snapshot.as_of) }}
      <span class="ws-dot" :class="connected ? 'ws-ok' : 'ws-off'" />
    </div>
  </div>

  <!-- 骨架屏 -->
  <div class="sa-bar sa-skeleton" v-else>
    <div v-for="i in 6" :key="i" class="skeleton-block" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useSituationalAwarenessStore } from '@/stores/situationalAwareness'
import { VAR_LEVEL_COLORS } from '@/api/situationalAwarenessService'

const store = useSituationalAwarenessStore()
const snapshot  = computed(() => store.snapshot)
const connected = computed(() => store.connected)

const varColor = computed(() => {
  const level = snapshot.value?.var.level ?? 'green'
  return VAR_LEVEL_COLORS[level] ?? '#10b981'
})

function trendIcon(dir: string | null): string {
  if (dir === 'up')   return '↑'
  if (dir === 'down') return '↓'
  return '→'
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  store.fetchSnapshot()
  // 每 5 秒轮询（WebSocket 建联由 AppLayout 统一处理）
  pollTimer = setInterval(() => store.fetchSnapshot(), 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.sa-bar {
  display: flex;
  align-items: center;
  height: 36px;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0 12px;
  gap: 0;
  font-size: 11px;
  color: #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.sa-block {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  height: 100%;
  cursor: default;
  transition: background 0.15s;
  white-space: nowrap;
}

.sa-block:hover {
  background: rgba(255, 255, 255, 0.05);
}

.sa-icon { font-size: 12px; }
.sa-label { color: #64748b; font-size: 10px; }
.sa-value { font-weight: 600; font-size: 11px; }
.sa-sub { color: #94a3b8; font-size: 10px; }
.sa-trend { font-size: 11px; }

.sa-value.warn   { color: #f59e0b; }
.sa-value.danger { color: #ef4444; animation: pulse 1s ease-in-out infinite; }

.sa-divider {
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

/* VaR 迷你进度条 */
.var-bar {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}
.var-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 自主模式运行指示点 */
.sa-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.sa-dot.running { background: #10b981; animation: pulse 2s ease-in-out infinite; }
.sa-dot.paused  { background: #6b7280; }

/* 围栏闪烁 */
.flashing .sa-value {
  animation: flash 0.8s ease-in-out infinite;
}

/* WS 连接状态 */
.ws-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-left: 4px;
}
.ws-dot.ws-ok  { background: #10b981; }
.ws-dot.ws-off { background: #6b7280; }

.sa-timestamp {
  margin-left: auto;
  display: flex;
  align-items: center;
  color: #64748b;
  font-size: 10px;
  white-space: nowrap;
  padding-left: 12px;
}

/* 骨架屏 */
.sa-skeleton .skeleton-block {
  width: 80px;
  height: 20px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  margin: 0 10px;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes shimmer {
  0%   { opacity: 0.3; }
  50%  { opacity: 0.6; }
  100% { opacity: 0.3; }
}
</style>
