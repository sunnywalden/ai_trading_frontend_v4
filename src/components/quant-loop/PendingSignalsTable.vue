<template>
  <div class="pending-signals-table">
    <div class="table-header">
      <h3>待执行信号 ({{ signals.length }})</h3>
      <div class="header-actions">
        <label class="action-toggle">
          <input type="checkbox" v-model="executeRealTrades" />
          <span>执行真实交易</span>
        </label>
        <button 
          class="btn-execute"
          :class="{ disabled: selectedSignals.size === 0, danger: executeRealTrades }"
          :disabled="selectedSignals.size === 0"
          @click="executeSelected"
        >
          {{ executeRealTrades ? '⚠️ 确认执行 (真实)' : '执行选中信号' }} ({{ selectedSignals.size }})
        </button>
        <button 
          class="btn-reject"
          :class="{ disabled: selectedSignals.size === 0 }"
          :disabled="selectedSignals.size === 0"
          @click="rejectSelected"
        >
          拒绝选中信号 ({{ selectedSignals.size }})
        </button>
      </div>
    </div>
    
    <div v-if="signals.length === 0" class="empty-state">
      <p>暂无待执行信号</p>
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
            <th>标的</th>
            <th>信号类型</th>
            <th>方向</th>
            <th>当前持仓</th>
            <th>信号强度</th>
            <th>置信度</th>
            <th>预期收益</th>
            <th>风险评分</th>
            <th>建议数量</th>
            <th>生成时间</th>
            <th>操作</th>
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
                  {{ signal.extra_metadata.current_position.qty }}股
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
                详情
              </button>
              <button class="btn-small btn-primary" @click="executeSingle(signal)">
                执行
              </button>
              <button class="btn-small btn-danger" @click="rejectSingle(signal)">
                拒绝
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
import { TradingSignal } from '@/api/quantLoopService'

const props = defineProps<{
  signals: TradingSignal[]
}>()

const emit = defineEmits<{
  'execute': [{ signals: TradingSignal[], dryRun: boolean }]
  'execute-single': [{ signal: TradingSignal, dryRun: boolean }]
  'reject': [signal: TradingSignal]
  'reject-batch': [signals: TradingSignal[]]
  'view-details': [signal: TradingSignal]
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
    if (!confirm(`⚠️ 警告：确认对选中的 ${selected.length} 个标的执行【真实交易】？\n此操作将提交订单到券商，请确保账户状态和风控设置无误。`)) {
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
  emit('reject-batch', signals)
  selectedSignals.value.clear()
}

function executeSingle(signal: TradingSignal) {
  if (executeRealTrades.value) {
    if (!confirm(`⚠️ 警告：确认对 ${signal.symbol} 执行【真实交易】？`)) {
      return
    }
  }
  emit('execute-single', { 
    signal, 
    dryRun: !executeRealTrades.value 
  })
}

function rejectSingle(signal: TradingSignal) {
  emit('reject', signal)
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
    
    if (diff < 0) return '刚刚' // 处理未来时间
    if (diff < 1) return '刚刚'
    if (diff < 60) return `${Math.floor(diff)}分钟前`
    if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
    return date.toLocaleString('zh-CN')
  } catch (e) {
    return time // 出错时返回原始字符串
  }
}

function formatSignalType(type: string) {
  const typeMap: Record<string, string> = {
    'ENTRY': '开仓',
    'EXIT': '平仓',
    'ADD': '加仓',
    'REDUCE': '减仓',
    'HEDGE': '对冲'
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
    'LONG': '做多',
    'SHORT': '做空'
  }
  return directionMap[direction] || direction
}
</script>

<style scoped>
.pending-signals-table {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
  color: #94a3b8;
  cursor: pointer;
  margin-right: 8px;
}

.action-toggle input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.btn-execute.danger {
  background: #ef4444;
}

.btn-execute.danger:hover {
  background: #dc2626;
}

h3 {
  margin: 0;
  font-size: 18px;
  color: #f1f5f9;
}

.btn-execute {
  padding: 8px 16px;
  background: #a78bfa;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-execute:hover:not(.disabled) {
  background: #8b5cf6;
}

.btn-execute.disabled {
  background: #475569;
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-reject {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-reject:hover:not(.disabled) {
  background: #dc2626;
}

.btn-reject.disabled {
  background: #475569;
  cursor: not-allowed;
  opacity: 0.5;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #0f172a;
}

th {
  padding: 12px;
  text-align: left;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 1px solid #334155;
}

tbody tr {
  border-bottom: 1px solid #334155;
  transition: background 0.2s;
  cursor: pointer;
}

tbody tr:hover {
  background: #0f172a;
}

tbody tr.selected {
  background: #8b5cf620;
}

td {
  padding: 12px;
  color: #f1f5f9;
  font-size: 14px;
}

.checkbox-col {
  width: 40px;
}

.symbol {
  font-weight: 600;
  color: #a78bfa;
}

.direction-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.direction-badge.long {
  background: #22c55e20;
  color: #22c55e;
}

.direction-badge.short {
  background: #ef444420;
  color: #ef4444;
}

.signal-type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.signal-type-badge.entry {
  background: #3b82f620;
  color: #3b82f6;
}

.signal-type-badge.exit {
  background: #f59e0b20;
  color: #f59e0b;
}

.signal-type-badge.add {
  background: #8b5cf620;
  color: #8b5cf6;
}

.signal-type-badge.reduce {
  background: #06b6d420;
  color: #06b6d4;
}

.signal-type-badge.hedge {
  background: #6366f120;
  color: #6366f1;
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
  padding: 4px 12px;
  background: #334155;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-small:hover {
  background: #475569;
}

.btn-small.btn-primary {
  background: #a78bfa;
}

.btn-small.btn-primary:hover {
  background: #8b5cf6;
}

.btn-small.btn-danger {
  background: #ef4444;
}

.btn-small.btn-danger:hover {
  background: #dc2626;
}
</style>
