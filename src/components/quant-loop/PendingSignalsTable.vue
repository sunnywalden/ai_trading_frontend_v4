<template>
  <div class="pending-signals-table">
    <div class="table-header">
      <h3>{{ $t('dashboard.pending_signals') }} ({{ signals.length }})</h3>
      <div class="header-actions">
        <label class="action-toggle">
          <input type="checkbox" v-model="executeRealTrades" />
          <span>{{ $t('dashboard.execute_real_trade_desc') }}</span>
        </label>
        <label class="action-toggle filter-toggle">
          <input 
            type="checkbox" 
            :checked="filterByPosition"
            @change="$emit('update:filterByPosition', ($event.target as HTMLInputElement).checked)"
          />
          <span>{{ $t('quant_loop.position_filter') }}</span>
        </label>
        <button 
          class="btn-execute"
          :class="{ disabled: selectedSignals.size === 0, danger: executeRealTrades }"
          :disabled="selectedSignals.size === 0"
          @click="executeSelected"
        >
          {{ executeRealTrades ? $t('quant_loop.execute_real') : $t('quant_loop.execute_selected') }} ({{ selectedSignals.size }})
        </button>
        <button 
          class="btn-reject"
          :class="{ disabled: selectedSignals.size === 0 }"
          :disabled="selectedSignals.size === 0"
          @click="rejectSelected"
        >
          {{ $t('quant_loop.reject_selected') }} ({{ selectedSignals.size }})
        </button>
      </div>
    </div>
    
    <div v-if="signals.length === 0" class="empty-state">
      <p>{{ $t('common.no_data') }}</p>
    </div>
    
    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th class="checkbox-col">
              <input 
                type="checkbox" 
                :checked="allSelected"
                :indeterminate="someSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th>{{ $t('quant_loop.headers.symbol') }}</th>
            <th>{{ $t('quant_loop.headers.type') }}</th>
            <th>{{ $t('quant_loop.headers.direction') }}</th>
            <th>{{ $t('quant_loop.headers.position') }}</th>
            <th>{{ $t('quant_loop.headers.strength') }}</th>
            <th>{{ $t('quant_loop.headers.confidence') }}</th>
            <th>{{ $t('quant_loop.headers.expected_return') }}</th>
            <th>{{ $t('quant_loop.headers.risk_score') }}</th>
            <th>{{ $t('quant_loop.headers.qty') }}</th>
            <th>{{ $t('quant_loop.headers.time') }}</th>
            <th>{{ $t('quant_loop.headers.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="signal in signals" 
            :key="signal.signal_id"
            :class="{ selected: isSelected(signal.signal_id) }"
            @click="toggleSelect(signal.signal_id)"
          >
            <td class="checkbox-col" @click.stop>
              <input 
                type="checkbox" 
                :checked="isSelected(signal.signal_id)"
                @change="toggleSelect(signal.signal_id)"
              />
            </td>
            <td class="symbol">{{ signal.symbol }}</td>
            <td>
              <span :class="['signal-type-badge', getSignalTypeClass(signal.signal_type)]">
                {{ formatSignalType(signal.signal_type) }}
              </span>
            </td>
            <td>
              <span :class="['direction-badge', signal.direction.toLowerCase()]">
                {{ formatDirection(signal.direction) }}
              </span>
            </td>
            <td class="position-info">
              <template v-if="signal.extra_metadata?.current_position">
                <div class="position-qty">
                  {{ signal.extra_metadata.current_position.qty }}{{ $t('quant_loop.shares') }}
                </div>
                <div class="position-pnl" :class="signal.extra_metadata.current_position.unrealized_pnl >= 0 ? 'positive' : 'negative'">
                  {{ signal.extra_metadata.current_position.unrealized_pnl >= 0 ? '+' : '' }}{{ signal.extra_metadata.current_position.unrealized_pnl.toFixed(2) }}
                </div>
              </template>
              <span v-else class="no-position">-</span>
            </td>
            <td>
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :style="{ width: `${signal.signal_strength}%` }"
                  :class="getStrengthClass(signal.signal_strength)"
                ></div>
                <span class="strength-text">{{ signal.signal_strength.toFixed(0) }}</span>
              </div>
            </td>
            <td>{{ (signal.confidence * 100).toFixed(1) }}%</td>
            <td :class="signal.expected_return >= 0 ? 'positive' : 'negative'">
              {{ (signal.expected_return * 100).toFixed(2) }}%
            </td>
            <td>
              <span :class="getRiskClass(signal.risk_score)">
                {{ signal.risk_score.toFixed(0) }}
              </span>
            </td>
            <td>{{ signal.suggested_quantity }}</td>
            <td class="time">{{ formatTime(signal.generated_at) }}</td>
            <td class="actions" @click.stop>
              <button class="btn-small" @click="$emit('view-details', signal)">
                {{ $t('quant_loop.details') }}
              </button>
              <button class="btn-small btn-primary" @click="executeSingle(signal)">
                {{ executeRealTrades ? $t('quant_loop.execute_real') : $t('common.execute') }}
              </button>
              <button class="btn-small btn-danger" @click="rejectSingle(signal)">
                {{ $t('quant_loop.reject') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TradingSignal } from '@/api/quantLoopService'

const { t, locale } = useI18n()
const props = defineProps<{
  signals: TradingSignal[],
  filterByPosition: boolean
}>()

const emit = defineEmits<{
  'execute': [{ signals: TradingSignal[], dryRun: boolean }]
  'execute-single': [{ signal: TradingSignal, dryRun: boolean }]
  'reject': [signal: TradingSignal]
  'reject-batch': [signals: TradingSignal[]]
  // eslint-disable-next-line vue/no-unused-properties
  'view-details': [signal: TradingSignal]
  'update:filterByPosition': [value: boolean]
}>()

const selectedSignals = ref<Set<string>>(new Set())
const executeRealTrades = ref(false)

const allSelected = computed(() => {
  return props.signals.length > 0 && selectedSignals.value.size === props.signals.length
})

const someSelected = computed(() => {
  return selectedSignals.value.size > 0 && selectedSignals.value.size < props.signals.length
})

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

function toggleSelectAll() {
  if (allSelected.value) {
    selectedSignals.value.clear()
  } else {
    props.signals.forEach(signal => selectedSignals.value.add(signal.signal_id))
  }
}

function executeSelected() {
  const selected = props.signals.filter(s => selectedSignals.value.has(s.signal_id))
  if (executeRealTrades.value) {
    if (!confirm(t('quant_loop.confirm_batch_execute', { n: selected.length }))) {
      return
    }
  }
  emit('execute', { 
    signals: selected, 
    dryRun: !executeRealTrades.value 
  })
  selectedSignals.value.clear()
}

function rejectSelected() {
  const signals = props.signals.filter(s => selectedSignals.value.has(s.signal_id))
  if (confirm(t('quant_loop.reject_selected_confirm'))) {
    emit('reject-batch', signals)
    selectedSignals.value.clear()
  }
}

function executeSingle(signal: TradingSignal) {
  if (executeRealTrades.value) {
    if (!confirm(t('quant_loop.confirm_single_execute', { symbol: signal.symbol }))) {
      return
    }
  }
  emit('execute-single', { 
    signal, 
    dryRun: !executeRealTrades.value 
  })
}

function rejectSingle(signal: TradingSignal) {
  if (confirm(t('quant_loop.reject_confirm'))) {
    emit('reject', signal)
  }
}

function getStrengthClass(strength: number) {
  if (strength >= 80) return 'high'
  if (strength >= 60) return 'medium'
  return 'low'
}

function getRiskClass(risk: number) {
  if (risk >= 70) return 'risk-high'
  if (risk >= 40) return 'risk-medium'
  return 'risk-low'
}

function formatTime(time: string) {
  if (!time) return '-'
  
  try {
    const date = new Date(time)
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return time // 如果解析失败，返回原始字符串
    }
    
    const now = new Date()
    const diff = (now.getTime() - date.getTime()) / 1000 / 60 // minutes
    
    if (diff < 1) return t('quant_loop.just_now')
    if (diff < 60) return t('quant_loop.minutes_ago', { n: Math.floor(diff) })
    if (diff < 1440) return t('quant_loop.hours_ago', { n: Math.floor(diff / 60) })
    return date.toLocaleString(locale.value)
  } catch (e) {
    return time
  }
}

function formatSignalType(type: string) {
  const typeMap: Record<string, string> = {
    'ENTRY': t('quant_loop.types.entry'),
    'EXIT': t('quant_loop.types.exit'),
    'ADD': t('quant_loop.types.add'),
    'REDUCE': t('quant_loop.types.reduce'),
    'HEDGE': t('quant_loop.types.hedge')
  }
  return typeMap[type] || type
}

function getSignalTypeClass(type: string) {
  const classMap: Record<string, string> = {
    'ENTRY': 'entry',
    'EXIT': 'exit',
    'ADD': 'add',
    'REDUCE': 'reduce',
    'HEDGE': 'hedge'
  }
  return classMap[type] || 'entry'
}

function formatDirection(direction: string) {
  const directionMap: Record<string, string> = {
    'LONG': t('quant_loop.long'),
    'SHORT': t('quant_loop.short')
  }
  return directionMap[direction] || direction
}
</script>

<style scoped>
.pending-signals-table {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #cbd5e1;
  cursor: pointer;
  margin-right: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.action-toggle:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
}

.action-toggle input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #8b5cf6;
}

.action-toggle .hint {
  font-size: 12px;
  color: #64748b;
  margin-left: -4px;
}

.btn-execute.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-execute.danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

h3 {
  margin: 0;
  font-size: 20px;
  color: #f1f5f9;
  font-weight: 600;
}

.btn-execute {
  padding: 10px 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-execute:hover:not(.disabled) {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
}

.btn-execute.disabled {
  background: #475569;
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}

.btn-reject {
  padding: 10px 20px;
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
}

.btn-reject:hover:not(.disabled) {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  box-shadow: 0 6px 16px rgba(100, 116, 139, 0.4);
  transform: translateY(-2px);
}

.btn-reject.disabled {
  background: #475569;
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
  font-size: 16px;
}

.table-container {
  overflow-x: auto;
  padding: 0;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

thead {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  position: sticky;
  top: 0;
  z-index: 10;
}

th {
  padding: 16px 14px;
  text-align: left;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid rgba(139, 92, 246, 0.3);
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
}

tbody tr {
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  transition: all 0.3s ease;
  cursor: pointer;
  background: rgba(30, 41, 59, 0.3);
}

tbody tr:hover {
  background: rgba(139, 92, 246, 0.1);
  transform: scale(1.01);
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.2);
}

tbody tr.selected {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-left: 3px solid #8b5cf6;
  box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.1);
}

td {
  padding: 14px;
  color: #f1f5f9;
  font-size: 14px;
  border-bottom: 1px solid rgba(51, 65, 85, 0.3);
}

.checkbox-col {
  width: 40px;
}

.symbol {
  font-weight: 600;
  color: #a78bfa;
}

.direction-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.direction-badge.long {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.direction-badge.short {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.signal-type-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.signal-type-badge.entry {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.signal-type-badge.exit {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.signal-type-badge.add {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.signal-type-badge.reduce {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
}

.signal-type-badge.hedge {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
}

.position-info {
  font-size: 12px;
}

.position-qty {
  color: #94a3b8;
  margin-bottom: 2px;
}

.position-pnl {
  font-weight: 600;
}

.position-pnl.positive {
  color: #22c55e;
}

.position-pnl.negative {
  color: #ef4444;
}

.no-position {
  color: #64748b;
}

.strength-bar {
  position: relative;
  width: 100px;
  height: 20px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s;
}

.strength-fill.high {
  background: #22c55e;
}

.strength-fill.medium {
  background: #f59e0b;
}

.strength-fill.low {
  background: #ef4444;
}

.strength-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: #f1f5f9;
}

.positive {
  color: #22c55e;
}

.negative {
  color: #ef4444;
}

.risk-high {
  color: #ef4444;
}

.risk-medium {
  color: #f59e0b;
}

.risk-low {
  color: #22c55e;
}

.time {
  color: #94a3b8;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 6px 14px;
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.btn-small:hover {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.btn-small.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
}

.btn-small.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.4);
}

.btn-small.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
}

.btn-small.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
}
</style>
