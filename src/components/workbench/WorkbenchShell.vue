<template>
  <div class="wb-shell" :class="{ 'wb-shell--degraded': degraded, 'wb-shell--stale': stale }">
    <!-- ── Header ────────────────────────────────────────────────────── -->
    <div class="wb-header">
      <div class="wb-header__left">
        <div class="wb-header__title-row">
          <span v-if="icon" class="wb-header__icon">{{ icon }}</span>
          <h2 class="wb-header__title">{{ title }}</h2>
          <slot name="title-badge" />
        </div>
        <p v-if="subtitle" class="wb-header__subtitle">{{ subtitle }}</p>
      </div>
      <div class="wb-header__right">
        <slot name="actions" />
      </div>
    </div>

    <!-- ── Status strip (data quality / last updated / degraded) ─────── -->
    <div v-if="showStatusStrip" class="wb-status-strip" :class="statusStripClass">
      <span v-if="degraded" class="wb-status-strip__badge wb-status-strip__badge--warn">
        ⚠ 降级
      </span>
      <span v-else-if="stale" class="wb-status-strip__badge wb-status-strip__badge--stale">
        ⏱ 数据陈旧
      </span>
      <span class="wb-status-strip__updated">
        {{ lastUpdatedLabel }}: <em>{{ lastUpdated || '—' }}</em>
      </span>
      <span v-if="dataQuality" class="wb-status-strip__quality">
        数据质量: <em :class="qualityClass">{{ dataQuality }}</em>
      </span>
      <slot name="status-extra" />
    </div>

    <!-- ── Summary cards ─────────────────────────────────────────────── -->
    <div v-if="$slots['summary-cards']" class="wb-summary">
      <slot name="summary-cards" />
    </div>

    <!-- ── Global filters ────────────────────────────────────────────── -->
    <div v-if="$slots.filters" class="wb-filters">
      <slot name="filters" />
    </div>

    <!-- ── Main content area ─────────────────────────────────────────── -->
    <div class="wb-content">
      <!-- Loading state -->
      <div v-if="loading" class="wb-state wb-state--loading">
        <div class="wb-state__spinner"></div>
        <span>{{ loadingText }}</span>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="wb-state wb-state--error">
        <span class="wb-state__icon">⛔</span>
        <span>{{ error }}</span>
        <button v-if="$slots.retry || onRetry" class="wb-state__retry" @click="$emit('retry')">
          重试
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="empty" class="wb-state wb-state--empty">
        <span class="wb-state__icon">📭</span>
        <span>{{ emptyText }}</span>
      </div>

      <!-- Normal content -->
      <slot v-else />
    </div>

    <!-- ── Right detail drawer ────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="wb-drawer">
        <div v-if="drawerOpen" class="wb-drawer-overlay" @click.self="$emit('drawer-close')">
          <aside class="wb-drawer">
            <div class="wb-drawer__header">
              <h3 class="wb-drawer__title">{{ drawerTitle || '详情' }}</h3>
              <button class="wb-drawer__close" @click="$emit('drawer-close')">✕</button>
            </div>
            <div class="wb-drawer__body">
              <slot name="drawer" />
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  /** Page icon (emoji or text) */
  icon?: string
  /** Page title */
  title: string
  /** Optional subtitle below title */
  subtitle?: string
  /** Show the status strip row */
  showStatusStrip?: boolean
  /** ISO timestamp or formatted string */
  lastUpdated?: string
  /** Label for lastUpdated (default: "最后更新") */
  lastUpdatedLabel?: string
  /** high / medium / low / unknown */
  dataQuality?: string
  /** Whether the backend is in degraded mode */
  degraded?: boolean
  /** Whether data is stale but still usable */
  stale?: boolean
  /** Loading state — shows spinner, hides default slot */
  loading?: boolean
  loadingText?: string
  /** Error message — shows error UI */
  error?: string
  /** Empty state — shows empty UI */
  empty?: boolean
  emptyText?: string
  /** Whether the right detail drawer is open */
  drawerOpen?: boolean
  drawerTitle?: string
}>(), {
  showStatusStrip: true,
  lastUpdatedLabel: '最后更新',
  loadingText: '加载中…',
  emptyText: '暂无数据',
  drawerOpen: false,
})

defineEmits<{
  retry: []
  'drawer-close': []
}>()

const statusStripClass = computed(() => ({
  'wb-status-strip--degraded': props.degraded,
  'wb-status-strip--stale': props.stale && !props.degraded,
  'wb-status-strip--ok': !props.degraded && !props.stale,
}))

const qualityClass = computed(() => {
  const q = (props.dataQuality || '').toLowerCase()
  if (q === 'high') return 'q-high'
  if (q === 'medium') return 'q-medium'
  if (q === 'low') return 'q-low'
  return 'q-unknown'
})
</script>

<style scoped>
/* ── Shell structure ─────────────────────────────────────────────────── */
.wb-shell {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  color: #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ──────────────────────────────────────────────────────────── */
.wb-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.wb-header__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.wb-header__icon { font-size: 1.4rem; }
.wb-header__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
}
.wb-header__subtitle {
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: #9ca3af;
}
.wb-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Status strip ────────────────────────────────────────────────────── */
.wb-status-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  color: #6b7280;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  flex-wrap: wrap;
}
.wb-status-strip--degraded { border-color: rgba(245, 158, 11, 0.35); background: rgba(245, 158, 11, 0.07); }
.wb-status-strip--stale    { border-color: rgba(99, 102, 241, 0.3); }
.wb-status-strip__badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.72rem;
}
.wb-status-strip__badge--warn  { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.wb-status-strip__badge--stale { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
.wb-status-strip__updated em,
.wb-status-strip__quality em { font-style: normal; color: #d1d5db; }
.q-high    { color: #6ee7b7 !important; }
.q-medium  { color: #fbbf24 !important; }
.q-low     { color: #f87171 !important; }
.q-unknown { color: #9ca3af !important; }

/* ── Summary cards slot wrapper ─────────────────────────────────────── */
.wb-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}

/* ── Filters ─────────────────────────────────────────────────────────── */
.wb-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ── State overlays ──────────────────────────────────────────────────── */
.wb-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  color: #6b7280;
  font-size: 0.95rem;
  text-align: center;
}
.wb-state__icon { font-size: 2rem; }
.wb-state--loading .wb-state__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(99, 102, 241, 0.25);
  border-top-color: #818cf8;
  border-radius: 50%;
  animation: wb-spin 0.8s linear infinite;
}
.wb-state__retry {
  padding: 8px 18px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 8px;
  color: #93c5fd;
  cursor: pointer;
  font-size: 0.85rem;
}
.wb-state__retry:hover { background: rgba(59, 130, 246, 0.25); }

/* ── Drawer ──────────────────────────────────────────────────────────── */
.wb-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 500;
}
.wb-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: min(440px, 100vw);
  background: #1e293b;
  border-left: 1px solid rgba(148, 163, 184, 0.18);
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
}
.wb-drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}
.wb-drawer__title { margin: 0; font-size: 1.05rem; color: #f3f4f6; }
.wb-drawer__close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
}
.wb-drawer__close:hover { background: rgba(148, 163, 184, 0.1); color: #e5e7eb; }
.wb-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* ── Drawer animation ────────────────────────────────────────────────── */
.wb-drawer-enter-from .wb-drawer,
.wb-drawer-leave-to .wb-drawer   { transform: translateX(100%); }
.wb-drawer-enter-active .wb-drawer,
.wb-drawer-leave-active .wb-drawer {
  transition: transform 0.22s ease;
}
.wb-drawer-enter-from,
.wb-drawer-leave-to   { opacity: 0; }
.wb-drawer-enter-active,
.wb-drawer-leave-active { transition: opacity 0.22s; }

/* ── Responsive ──────────────────────────────────────────────────────── */
@keyframes wb-spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .wb-shell { padding: 16px; gap: 14px; }
  .wb-header { flex-direction: column; gap: 10px; }
  .wb-header__title { font-size: 1.2rem; }
  .wb-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 480px) {
  .wb-shell { padding: 12px; }
  .wb-summary { grid-template-columns: 1fr; }
  .wb-drawer { width: 100vw; }
}
</style>
