<template>
  <div class="signal-cards-mobile">
    <!-- 顶部操作栏 -->
    <div class="mobile-header">
      <h3>{{ $t('dashboard.pending_signals') }} ({{ signals.length }})</h3>
      <div class="header-filters">
        <label class="filter-checkbox">
          <input 
            type="checkbox" 
            :checked="filterByPosition"
            @change="$emit('update:filterByPosition', ($event.target as HTMLInputElement).checked)"
          />
          <span>{{ $t('quant_loop.position_filter') }}</span>
        </label>
      </div>
    </div>

    <!-- 信号卡片列表 -->
    <div v-if="signals.length === 0" class="empty-state">
      <p>📭</p>
      <p>{{ $t('common.no_data') }}</p>
    </div>

    <div v-else class="cards-container">
      <div 
        v-for="signal in signals" 
        :key="signal.signal_id"
        class="signal-card"
        :class="{ selected: isSelected(signal.signal_id) }"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <input 
            type="checkbox" 
            class="card-checkbox"
            :checked="isSelected(signal.signal_id)"
            @change="toggleSelect(signal.signal_id)"
          />
          <div class="card-symbol">{{ signal.symbol }}</div>
          <span :class="['direction-badge', signal.direction.toLowerCase()]">
            {{ formatDirection(signal.direction) }}
          </span>
        </div>

        <!-- 卡片内容 -->
        <div class="card-body">
          <div class="card-row">
            <span class="label">{{ $t('quant_loop.headers.type') }}</span>
            <span :class="['signal-type-badge', getSignalTypeClass(signal.signal_type)]">
              {{ formatSignalType(signal.signal_type) }}
            </span>
          </div>

          <div class="card-row">
            <span class="label">{{ $t('quant_loop.headers.position') }}</span>
            <template v-if="signal.extra_metadata?.current_position">
              <div class="position-info">
                <span class="position-qty">
                  {{ signal.extra_metadata.current_position.qty }}{{ $t('quant_loop.shares') }}
                </span>
                <span 
                  class="position-pnl" 
                  :class="signal.extra_metadata.current_position.unrealized_pnl >= 0 ? 'positive' : 'negative'"
                >
                  {{ signal.extra_metadata.current_position.unrealized_pnl >= 0 ? '+' : '' }}{{ signal.extra_metadata.current_position.unrealized_pnl.toFixed(2) }}
                </span>
              </div>
            </template>
            <span v-else class="no-position">{{ $t('quant_loop.no_position') }}</span>
          </div>

          <div class="card-row">
            <span class="label">{{ $t('quant_loop.headers.strength') }}</span>
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                :style="{ width: `${signal.signal_strength}%` }"
                :class="getStrengthClass(signal.signal_strength)"
              ></div>
              <span class="strength-text">{{ signal.signal_strength.toFixed(0) }}</span>
            </div>
          </div>

          <div class="card-row">
            <span class="label">{{ $t('quant_loop.headers.confidence') }}</span>
            <span class="value-lg">{{ (signal.confidence * 100).toFixed(1) }}%</span>
          </div>

          <div class="card-row">
            <span class="label">{{ $t('quant_loop.headers.expected_return') }}</span>
            <span 
              class="value-lg" 
              :class="signal.expected_return >= 0 ? 'positive' : 'negative'"
            >
              {{ (signal.expected_return * 100).toFixed(2) }}%
            </span>
          </div>

          <div class="card-row">
            <span class="label">{{ $t('quant_loop.headers.qty') }}</span>
            <span class="value">{{ signal.suggested_quantity }}</span>
          </div>

          <div class="card-row">
            <span class="label">{{ $t('quant_loop.generated_at') }}</span>
            <span class="value time">{{ formatTime(signal.generated_at) }}</span>
          </div>
        </div>

        <!-- 卡片操作 -->
        <div class="card-actions">
          <button class="btn-card btn-details" @click="$emit('view-details', signal)">
            {{ $t('quant_loop.view_details') }}
          </button>
          <button class="btn-card btn-execute" @click="$emit('execute-single', { signal, dryRun: !executeRealTrades })">
            {{ executeRealTrades ? $t('quant_loop.execute_real') : $t('quant_loop.execute_sim') }}
          </button>
          <button class="btn-card btn-reject" @click="$emit('reject', signal)">
            {{ $t('quant_loop.reject') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 底部固定工具栏 -->
    <div class="bottom-toolbar" v-if="selectedCount > 0">
      <div class="toolbar-info">
        <span>{{ $t('quant_loop.signals_selected', { n: selectedCount }) }}</span>
        <label class="toolbar-toggle">
          <input type="checkbox" v-model="executeRealTrades" />
          <span>{{ $t('quant_loop.real_trade') }}</span>
        </label>
      </div>
      <div class="toolbar-actions">
        <button 
          class="btn-toolbar btn-execute-batch"
          :class="{ danger: executeRealTrades }"
          @click="executeSelected"
        >
          {{ executeRealTrades ? $t('quant_loop.execute_real') : $t('quant_loop.execute_batch') }}
        </button>
        <button class="btn-toolbar btn-reject-batch" @click="rejectSelected">
          {{ $t('quant_loop.reject_batch') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TradingSignal } from '@/api/quantLoopService'

const { t, locale } = useI18n()
const props = defineProps<{
  signals: TradingSignal[]
  filterByPosition: boolean
}>()

const emit = defineEmits<{
  'execute': [{ signals: TradingSignal[], dryRun: boolean }]
  'execute-single': [{ signal: TradingSignal, dryRun: boolean }]
  'reject': [signal: TradingSignal]
  'reject-batch': [signals: TradingSignal[]]
  'view-details': [signal: TradingSignal]
  'update:filterByPosition': [value: boolean]
}>()

const selectedSignals = ref<Set<string>>(new Set())
const executeRealTrades = ref(false)

const selectedCount = computed(() => selectedSignals.value.size)

function isSelected(signalId: string) {
  return selectedSignals.value.has(signalId)
}

function toggleSelect(signalId: string) {
  if (selectedSignals.value.has(signalId)) {
    selectedSignals.value.delete(signalId)
  } else {
    selectedSignals.value.add(signalId)
  }
}

function executeSelected() {
  const selected = props.signals.filter(s => selectedSignals.value.has(s.signal_id))
  if (executeRealTrades.value) {
    if (!confirm(t('quant_loop.confirm_batch_execute', { n: selected.length }))) {
      return
    }
  }
  emit('execute', { signals: selected, dryRun: !executeRealTrades.value })
  selectedSignals.value.clear()
}

function rejectSelected() {
  const selected = props.signals.filter(s => selectedSignals.value.has(s.signal_id))
  if (confirm(t('quant_loop.confirm_batch_reject', { n: selected.length }))) {
    emit('reject-batch', selected)
    selectedSignals.value.clear()
  }
}

function formatSignalType(type: string): string {
  const typeMap: Record<string, string> = {
    'LONG': t('quant_loop.long'),
    'SHORT': t('quant_loop.short'),
    'CLOSE_LONG': t('quant_loop.types.exit'),
    'CLOSE_SHORT': t('quant_loop.types.exit'),
    'MOMENTUM': t('quant_loop.types.trend'),
    'MEAN_REVERSION': t('quant_loop.types.reversion'),
    'BREAKOUT': t('quant_loop.types.breakout')
  }
  return typeMap[type] || type
}

function getSignalTypeClass(type: string): string {
  if (type.includes('LONG') || type.includes('MOMENTUM')) return 'long'
  if (type.includes('SHORT')) return 'short'
  if (type.includes('CLOSE')) return 'close'
  return 'neutral'
}

function getStrengthClass(strength: number): string {
  if (strength >= 80) return 'high'
  if (strength >= 60) return 'medium'
  return 'low'
}

function formatDirection(direction: string): string {
  const directionMap: Record<string, string> = {
    'LONG': t('quant_loop.long'),
    'SHORT': t('quant_loop.short')
  }
  return directionMap[direction] || direction
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return t('quant_loop.just_now')
  if (minutes < 60) return t('quant_loop.minutes_ago', { n: minutes })
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('quant_loop.hours_ago', { n: hours })
  
  return date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.signal-cards-mobile {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  position: relative;
}

.mobile-header {
  margin-bottom: var(--spacing-lg);
}

.mobile-header h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  font-weight: 600;
}

.header-filters {
  display: flex;
  gap: var(--spacing-md);
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  touch-action: manipulation;
}

.filter-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-4xl) var(--spacing-lg);
  color: var(--text-tertiary);
}

.empty-state p:first-child {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-bottom: 80px; /* 为底部工具栏留空间 */
}

.signal-card {
  background: linear-gradient(135deg, var(--bg-primary) 0%, rgba(30, 41, 59, 0.8) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.signal-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-md);
}

.signal-card.selected {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, var(--bg-primary) 100%);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.card-checkbox {
  width: 24px;
  height: 24px;
  cursor: pointer;
  accent-color: var(--color-primary);
  flex-shrink: 0;
}

.card-symbol {
  flex: 1;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
}

.direction-badge {
  padding: 4px 12px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.direction-badge.long {
  background: var(--color-success-light);
  color: var(--color-success);
}

.direction-badge.short {
  background: var(--color-error-light);
  color: var(--color-error);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: rgba(15, 23, 42, 0.5);
  border-radius: var(--radius-md);
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 28px;
}

.card-row .label {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  font-weight: 500;
}

.card-row .value,
.card-row .value-lg {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 600;
}

.card-row .value-lg {
  font-size: var(--font-size-lg);
}

.card-row .positive {
  color: var(--color-success);
}

.card-row .negative {
  color: var(--color-error);
}

.signal-type-badge {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.signal-type-badge.long {
  background: var(--color-success-light);
  color: var(--color-success);
}

.signal-type-badge.short {
  background: var(--color-error-light);
  color: var(--color-error);
}

.signal-type-badge.close {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.position-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.position-qty {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.position-pnl {
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.no-position {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.strength-bar {
  position: relative;
  width: 100px;
  height: 24px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.strength-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  transition: width 0.3s ease;
}

.strength-fill.high {
  background: linear-gradient(90deg, var(--color-success) 0%, #059669 100%);
}

.strength-fill.medium {
  background: linear-gradient(90deg, var(--color-warning) 0%, #d97706 100%);
}

.strength-fill.low {
  background: linear-gradient(90deg, #64748b 0%, #475569 100%);
}

.strength-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.time {
  font-size: var(--font-size-xs) !important;
  color: var(--text-muted) !important;
}

.card-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-card {
  flex: 1;
  min-height: var(--touch-target-comfortable);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: 600;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.btn-details {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.btn-details:active {
  background: #475569;
  transform: scale(0.95);
}

.btn-execute {
  background: linear-gradient(135deg, var(--color-success) 0%, #059669 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-execute:active {
  transform: scale(0.95);
  box-shadow: none;
}

.btn-reject {
  background: linear-gradient(135deg, var(--color-error) 0%, #dc2626 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-reject:active {
  transform: scale(0.95);
  box-shadow: none;
}

/* 底部固定工具栏 */
.bottom-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-md) var(--spacing-lg);
  padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
  z-index: var(--z-fixed);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
}

.toolbar-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.toolbar-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.toolbar-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-error);
}

.toolbar-actions {
  display: flex;
  gap: var(--spacing-md);
}

.btn-toolbar {
  flex: 1;
  min-height: var(--touch-target-comfortable);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-lg);
  font-weight: 600;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;
}

.btn-execute-batch {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-execute-batch.danger {
  background: linear-gradient(135deg, var(--color-error) 0%, #dc2626 100%);
}

.btn-execute-batch:active {
  transform: scale(0.96);
  box-shadow: var(--shadow-sm);
}

.btn-reject-batch {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.btn-reject-batch:active {
  background: #475569;
  transform: scale(0.96);
}
</style>
