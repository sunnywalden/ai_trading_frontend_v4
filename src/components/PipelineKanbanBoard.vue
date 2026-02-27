<template>
  <div class="kanban-wrapper">
    <div class="kanban-scroll-area">
      <!-- 每个 Stage 列 -->
      <div
        v-for="col in pipeline?.columns ?? []"
        :key="col.stage"
        class="kanban-column"
        :class="{ 'col-active': col.count > 0 }"
      >
        <!-- 列头 -->
        <div class="col-header">
          <span class="stage-badge">S{{ col.stage }}</span>
          <span class="stage-name">{{ col.stage_name }}</span>
          <span class="stage-count">{{ col.count }}</span>
        </div>

        <!-- 任务卡片 -->
        <div class="card-list">
          <div
            v-for="task in col.tasks"
            :key="task.plan_id"
            class="task-card"
            :class="`delay-${task.delay_level}`"
            @click="$emit('cardClick', task.plan_id)"
          >
            <div class="card-top">
              <span class="card-symbol">{{ task.symbol }}</span>
              <span
                class="card-direction"
                :style="{ color: task.direction === 'BUY' ? '#10b981' : '#ef4444' }"
              >{{ task.direction ?? '—' }}</span>
            </div>

            <div class="card-bottom">
              <!-- 置信度 -->
              <span v-if="task.confidence" class="card-conf">
                {{ task.confidence.toFixed(0) }}%
              </span>
              <!-- 停留时间 -->
              <span class="card-time" :class="`delay-${task.delay_level}`">
                {{ formatSeconds(task.seconds_in_stage) }}
              </span>
              <!-- 延迟指示 -->
              <span class="delay-dot" :class="`dot-${task.delay_level}`">●</span>
            </div>
          </div>

          <!-- 空列占位 -->
          <div v-if="col.count === 0" class="empty-col">—</div>
        </div>

        <!-- 列底部统计 -->
        <div class="col-footer">
          <span v-if="col.avg_seconds" class="footer-avg">
            avg {{ formatSeconds(col.avg_seconds) }}
          </span>
          <span v-if="col.p50_benchmark" class="footer-p50">
            P50 {{ formatSeconds(col.p50_benchmark) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="kanban-loading">
      <div class="loading-shimmer">加载中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PipelineDistribution } from '@/api/lifecycleService'

interface Props {
  pipeline: PipelineDistribution | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })
defineEmits<{ (e: 'cardClick', planId: number): void }>()

function formatSeconds(secs: number | null | undefined): string {
  if (secs == null) return '—'
  const s = Math.round(secs)
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  return `${Math.floor(s / 3600)}h`
}
</script>

<style scoped>
.kanban-wrapper {
  position: relative;
  height: 100%;
  min-height: 260px;
}

.kanban-scroll-area {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 4px 12px;
  height: 100%;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}

.kanban-column {
  min-width: 110px;
  max-width: 130px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.2s;
}

.kanban-column.col-active {
  border-color: rgba(99, 102, 241, 0.4);
}

.col-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.stage-badge {
  font-size: 9px;
  color: #6366f1;
  font-weight: 700;
  background: rgba(99, 102, 241, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
}

.stage-name {
  flex: 1;
  font-size: 10px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-count {
  font-size: 11px;
  font-weight: 700;
  color: #e2e8f0;
}

.card-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  max-height: 160px;
}

.task-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 5px;
  padding: 5px 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.task-card:hover {
  background: rgba(255, 255, 255, 0.09);
  transform: translateY(-1px);
}

/* 延迟颜色边框 */
.task-card.delay-green   { border-left: 2px solid #10b981; }
.task-card.delay-yellow  { border-left: 2px solid #f59e0b; }
.task-card.delay-red     { border-left: 2px solid #ef4444; }
.task-card.delay-stopped { border-left: 2px solid #374151; opacity: 0.5; }

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-symbol {
  font-size: 11px;
  font-weight: 600;
  color: #e2e8f0;
}

.card-direction { font-size: 10px; font-weight: 600; }

.card-bottom {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
}

.card-conf  { font-size: 9px; color: #a78bfa; }
.card-time  { font-size: 9px; }
.card-time.delay-green  { color: #10b981; }
.card-time.delay-yellow { color: #f59e0b; }
.card-time.delay-red    { color: #ef4444; }
.card-time.delay-stopped{ color: #6b7280; }

.delay-dot { font-size: 8px; margin-left: auto; }
.dot-green  { color: #10b981; }
.dot-yellow { color: #f59e0b; }
.dot-red    { color: #ef4444; animation: pulse 1s ease-in-out infinite; }
.dot-stopped{ color: #374151; }

.empty-col {
  text-align: center;
  color: #4b5563;
  font-size: 16px;
  padding: 8px 0;
}

.col-footer {
  display: flex;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.footer-avg, .footer-p50 {
  font-size: 9px;
  color: #64748b;
}

.kanban-loading {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
