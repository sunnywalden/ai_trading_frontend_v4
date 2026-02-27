<template>
  <div class="event-calendar-page">
    <!-- 页头 -->
    <div class="page-header">
      <h1 class="page-title">{{ t('events.title') }}</h1>
      <p class="page-subtitle">{{ t('events.subtitle') }}</p>
    </div>

    <!-- 活跃围栏警告横幅 -->
    <div v-if="activeFences.length > 0" class="fence-banner">
      <span class="fence-icon">⚠️</span>
      <span>{{ t('events.fence_active_count', { count: activeFences.length }) }}</span>
      <div class="fence-tags">
        <span v-for="f in activeFences" :key="f.symbol" class="fence-tag">
          {{ f.symbol }} ({{ Math.round(f.max_size_pct * 100) }}%)
        </span>
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="filter-row">
      <div class="filter-group">
        <label class="filter-label">{{ t('common.lookahead') }}</label>
        <select class="filter-select" v-model="filterDays" @change="loadCalendar">
          <option :value="3">{{ t('common.days', { n: 3 }) }}</option>
          <option :value="7">{{ t('common.days', { n: 7 }) }}</option>
          <option :value="14">{{ t('common.days', { n: 14 }) }}</option>
          <option :value="30">{{ t('common.days', { n: 30 }) }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">{{ t('common.symbol') }}</label>
        <input class="filter-input" v-model="filterSymbol" :placeholder="t('common.all')" @keyup.enter="loadCalendar" />
      </div>
      <button class="btn-refresh" @click="loadCalendar" :disabled="loading">
        {{ loading ? t('common.loading') : t('common.refresh') }}
      </button>
    </div>

    <!-- 事件列表 -->
    <div class="events-grid" v-if="!loading">
      <div
        v-for="event in events"
        :key="event.id"
        class="event-card"
        :class="`risk-${event.risk_level.toLowerCase()}`"
      >
        <!-- 事件头 -->
        <div class="event-card-header">
          <div class="event-meta">
            <span class="event-type-badge" :class="`type-${event.event_type.toLowerCase()}`">
              {{ EVENT_TYPE_LABELS[event.event_type] || event.event_type }}
            </span>
            <span class="event-date">{{ formatDate(event.event_date) }}</span>
          </div>
          <div class="event-risk-badge" :style="{ color: EVENT_RISK_COLORS[event.risk_level] }">
            {{ event.risk_level }}
          </div>
        </div>

        <!-- 事件主体 -->
        <div class="event-card-body">
          <div class="event-title">
            <span class="event-symbol" v-if="event.symbol !== 'MARKET'">{{ event.symbol }}</span>
            {{ event.title }}
          </div>
          <div class="event-description" v-if="event.description">{{ event.description }}</div>

          <!-- 财报专属：EPS 预期 vs 实际 -->
          <div v-if="event.event_type === 'EARNINGS'" class="earnings-row">
            <div class="eps-item">
              <span class="eps-label">{{ t('events.eps_estimate') }}</span>
              <span class="eps-value">{{ event.eps_estimate?.toFixed(2) ?? '-' }}</span>
            </div>
            <div class="eps-item" v-if="event.eps_actual !== null">
              <span class="eps-label">{{ t('events.eps_actual') }}</span>
              <span class="eps-value" :class="epsClass(event)">
                {{ event.eps_actual?.toFixed(2) ?? '-' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 围栏状态 -->
        <div class="event-card-footer">
          <div v-if="event.requires_fence">
            <span v-if="event.fence_overridden" class="fence-status overridden">
              {{ t('events.fence_overridden') }}
            </span>
            <span v-else-if="event.fence_applied" class="fence-status applied">
              {{ t('events.fence_applied') }}
            </span>
            <span v-else class="fence-status pending">
              {{ t('events.fence_pending') }}
            </span>
          </div>
          <!-- 覆盖按钮 -->
          <button
            v-if="event.requires_fence && !event.fence_overridden"
            class="btn-override"
            @click="openOverrideModal(event)"
          >
            {{ t('events.override') }}
          </button>
        </div>
      </div>

      <!-- 无数据 -->
      <div v-if="events.length === 0" class="empty-state">
        {{ t('events.no_events', { days: filterDays }) }}
      </div>
    </div>

    <div v-else class="loading-state">{{ t('common.loading') }}...</div>

    <!-- 覆盖确认 Modal -->
    <div v-if="showOverrideModal" class="modal-overlay" @click.self="showOverrideModal = false">
      <div class="modal-box">
        <h3 class="modal-title">{{ t('events.override_modal_title') }}</h3>
        <p class="modal-desc">
          {{ t('events.override_modal_desc', { title: overrideTarget?.title }) }}
        </p>
        <textarea
          class="modal-textarea"
          v-model="overrideReason"
          :placeholder="t('events.override_reason_placeholder')"
          rows="3"
        />
        <div class="modal-actions">
          <button class="btn-cancel" @click="showOverrideModal = false">{{ t('common.cancel') }}</button>
          <button
            class="btn-confirm"
            :disabled="overrideReason.length < 5"
            @click="confirmOverride"
          >{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  eventApi,
  EVENT_TYPE_LABELS,
  EVENT_RISK_COLORS,
  type EventCalendarItem,
  type FenceStatus,
} from '@/api/eventService'

const { t } = useI18n()

// ── 状态 ─────────────────────────────────────────────────────────────────────
const loading      = ref(false)
const events       = ref<EventCalendarItem[]>([])
const activeFences = ref<FenceStatus[]>([])
const filterDays   = ref(7)
const filterSymbol = ref('')
// 覆盖 Modal
const showOverrideModal = ref(false)
const overrideTarget    = ref<EventCalendarItem | null>(null)
const overrideReason    = ref('')

// ── 数据加载 ──────────────────────────────────────────────────────────────────
async function loadCalendar() {
  loading.value = true
  try {
    const [calRes, fenceRes] = await Promise.all([
      eventApi.getCalendar(filterDays.value, filterSymbol.value || undefined),
      eventApi.getActiveFences(),
    ])
    events.value       = calRes.data.items
    activeFences.value = fenceRes.data.fences
  } catch (e) {
    console.error('[EventCalendar] load failed', e)
  } finally {
    loading.value = false
  }
}

// ── 辅助函数 ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function epsClass(event: EventCalendarItem) {
  if (event.eps_actual === null || event.eps_estimate === null) return ''
  return event.eps_actual >= event.eps_estimate ? 'eps-beat' : 'eps-miss'
}

function openOverrideModal(event: EventCalendarItem) {
  overrideTarget.value = event
  overrideReason.value = ''
  showOverrideModal.value = true
}

async function confirmOverride() {
  if (!overrideTarget.value?.id) return
  try {
    await eventApi.overrideFence(overrideTarget.value.id, overrideReason.value)
    showOverrideModal.value = false
    await loadCalendar()
  } catch (e) {
    console.error('[EventCalendar] override failed', e)
  }
}

// ── 初始化 ────────────────────────────────────────────────────────────────────
onMounted(loadCalendar)
</script>

<style scoped>
.event-calendar-page { padding: 24px; max-width: 1400px; margin: 0 auto; color: #e0e0e0; }

.page-header { margin-bottom: 24px; }
.page-title  { font-size: 1.8rem; font-weight: 700; color: #fff; margin: 0 0 4px; }
.page-subtitle { color: #888; font-size: 0.9rem; }

.fence-banner {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: rgba(255, 77, 77, 0.12); border: 1px solid #ff4d4d44;
  border-radius: 8px; padding: 10px 16px; margin-bottom: 20px;
  color: #ff8888; font-size: 0.9rem;
}
.fence-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.fence-tag {
  background: rgba(255,77,77,0.2); border-radius: 12px;
  padding: 2px 10px; font-size: 0.8rem; color: #ff9999;
}

.filter-row { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.filter-group { display: flex; align-items: center; gap: 8px; }
.filter-label { font-size: 0.85rem; color: #888; }
.filter-select, .filter-input {
  background: #16213e; color: #e0e0e0; border: 1px solid #333;
  border-radius: 6px; padding: 6px 12px; font-size: 0.85rem;
}
.btn-refresh {
  background: #00ff88; color: #001; border: none; border-radius: 6px;
  padding: 6px 16px; font-weight: 600; cursor: pointer;
}
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

.events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

.event-card {
  background: #0f172a; border: 1px solid #1e293b;
  border-radius: 10px; padding: 16px;
  transition: border-color 0.2s;
}
.event-card:hover { border-color: #334155; }
.event-card.risk-high    { border-left: 3px solid #ff4d4d; }
.event-card.risk-extreme { border-left: 3px solid #ff0055; }
.event-card.risk-medium  { border-left: 3px solid #ff9900; }
.event-card.risk-low     { border-left: 3px solid #00ff88; }

.event-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.event-meta    { display: flex; align-items: center; gap: 8px; }
.event-type-badge {
  font-size: 0.7rem; padding: 2px 8px; border-radius: 10px;
  background: #1e293b; color: #aaa;
}
.event-date    { font-size: 0.8rem; color: #6b7280; }
.event-risk-badge { font-size: 0.75rem; font-weight: 700; }

.event-title   { font-weight: 600; margin-bottom: 4px; }
.event-symbol  { color: #00ff88; margin-right: 6px; font-weight: 700; }
.event-description { font-size: 0.8rem; color: #666; }

.earnings-row  { display: flex; gap: 16px; margin-top: 8px; }
.eps-item      { display: flex; flex-direction: column; }
.eps-label     { font-size: 0.7rem; color: #666; }
.eps-value     { font-size: 0.9rem; font-weight: 600; color: #e0e0e0; }
.eps-beat      { color: #00ff88; }
.eps-miss      { color: #ff4d4d; }

.event-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid #1e293b; }
.fence-status  { font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; }
.fence-status.pending  { background: rgba(255,153,0,0.15); color: #ff9900; }
.fence-status.applied  { background: rgba(0,255,136,0.1); color: #00ff88; }
.fence-status.overridden { background: rgba(100,100,100,0.2); color: #888; }

.btn-override { background: transparent; border: 1px solid #ff9900; color: #ff9900; border-radius: 6px; padding: 3px 10px; font-size: 0.75rem; cursor: pointer; }
.btn-override:hover { background: rgba(255,153,0,0.1); }

.empty-state { grid-column: 1 / -1; padding: 48px; text-align: center; color: #444; }
.loading-state { padding: 48px; text-align: center; color: #888; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; }
.modal-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 28px; width: min(480px, 90vw); }
.modal-title { color: #fff; font-size: 1.1rem; font-weight: 600; margin: 0 0 8px; }
.modal-desc  { color: #888; font-size: 0.9rem; margin-bottom: 16px; }
.modal-textarea { width: 100%; background: #1e293b; color: #e0e0e0; border: 1px solid #334155; border-radius: 6px; padding: 10px; font-size: 0.9rem; resize: vertical; box-sizing: border-box; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.btn-cancel  { background: transparent; border: 1px solid #334155; color: #888; border-radius: 6px; padding: 6px 16px; cursor: pointer; }
.btn-confirm { background: #00ff88; color: #001; border: none; border-radius: 6px; padding: 6px 16px; font-weight: 600; cursor: pointer; }
.btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
