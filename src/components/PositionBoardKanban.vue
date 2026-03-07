<template>
  <div class="pb-wrapper">
    <div class="pb-scroll-area">
      <div
        v-for="col in board?.columns ?? []"
        :key="col.state"
        class="pb-column"
        :class="{ 'col-active': col.count > 0 }"
        :style="col.count > 0 ? { borderColor: col.color + '55' } : {}"
      >
        <!-- 列头 -->
        <div class="col-header">
          <span class="state-dot" :style="{ background: col.color }"></span>
          <span class="state-label">{{ col.label }}</span>
          <span class="state-count" :style="col.count > 0 ? { color: col.color } : {}">
            {{ col.count }}
          </span>
        </div>

        <!-- 持仓卡片 -->
        <div class="card-list">
          <div
            v-for="card in col.cards"
            :key="card.id"
            class="pos-card"
            @click="card.latest_plan_id ? $emit('cardClick', card.latest_plan_id) : undefined"
          >
            <div class="card-top">
              <span class="card-symbol">{{ card.symbol }}</span>
              <span
                class="card-dir"
                :style="{ color: card.direction === 'LONG' ? '#10b981' : '#ef4444' }"
              >{{ card.direction ?? '—' }}</span>
            </div>
            <div class="card-bottom">
              <span class="card-conf">
                {{ card.total_qty }}
              </span>
              <span v-if="card.unrealized_pnl_pct != null" :style="{ color: card.unrealized_pnl_pct >= 0 ? '#10b981' : '#ef4444', fontSize: '10px' }">
                {{ (card.unrealized_pnl_pct * 100).toFixed(2) }}%
              </span>
              <span v-else class="card-time">{{ formatSeconds(card.hold_seconds) }}</span>
            </div>
          </div>

          <div v-if="col.count === 0" class="empty-col">—</div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="pb-loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import type { PositionBoard } from '@/api/lifecycleService';

interface Props {
  board: PositionBoard | null
  loading?: boolean
}

withDefaults(defineProps<Props>(), { loading: false })
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
.pb-wrapper {
  position: relative;
  height: 100%;
  min-height: 240px;
}

.pb-scroll-area {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 8px 4px 12px;
  height: 100%;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}

.pb-column {
  min-width: 120px;
  max-width: 150px;
  flex: 1;
  flex-shrink: 0;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.2s;
}

.col-header {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.state-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.state-label {
  flex: 1;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state-count {
  font-size: 13px;
  font-weight: 700;
  color: #4b5563;
  min-width: 18px;
  text-align: right;
}

.card-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.pos-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.pos-card:hover {
  background: rgba(99,102,241,0.12);
  border-color: rgba(99,102,241,0.4);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.card-symbol {
  font-size: 13px;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: 0.02em;
}

.card-dir {
  font-size: 10px;
  font-weight: 600;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 3px;
}

.card-conf {
  font-size: 10px;
  color: #6366f1;
}

.card-time {
  font-size: 10px;
  color: #6b7280;
}

.empty-col {
  text-align: center;
  color: #374151;
  font-size: 18px;
  padding: 16px 0;
}

.pb-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.45);
  border-radius: 8px;
  font-size: 12px;
  color: #6366f1;
}
</style>
