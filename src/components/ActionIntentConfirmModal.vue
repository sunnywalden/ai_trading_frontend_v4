<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="modal-overlay" @click.self="onCancel">
        <div class="modal-dialog" role="dialog" aria-modal="true">
          <!-- 头部 -->
          <div class="modal-header">
            <span class="modal-icon">⚡</span>
            <h3 class="modal-title">操作意图确认</h3>
            <button class="close-btn" @click="onCancel" aria-label="关闭">✕</button>
          </div>

          <!-- 意图摘要卡片 -->
          <div class="intent-card" :class="`intent-${intent.type}`">
            <div class="intent-type-badge">{{ intentTypeLabel }}</div>
            <p class="intent-desc">{{ intent.description || intentDefaultDesc }}</p>

            <!-- 参数详情 -->
            <table v-if="paramRows.length" class="param-table">
              <tbody>
                <tr v-for="row in paramRows" :key="row.key">
                  <td class="param-key">{{ row.key }}</td>
                  <td class="param-val">{{ row.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 风险警示 -->
          <div v-if="riskWarning" class="risk-warning">
            <span class="risk-icon">⚠️</span>
            <span>{{ riskWarning }}</span>
          </div>

          <!-- 过期计时 -->
          <div v-if="expiresIn > 0" class="expires-bar">
            <div
              class="expires-progress"
              :style="{ width: `${expiresProgressPct}%` }"
              :class="{ urgent: expiresIn < 10 }"
            ></div>
            <span class="expires-text">{{ expiresIn }}s 后自动取消</span>
          </div>

          <!-- 操作按钮 -->
          <div class="modal-footer">
            <button class="btn-cancel" @click="onCancel" :disabled="loading">
              取消
            </button>
            <button class="btn-confirm" @click="onConfirm" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              <span v-else>确认执行</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'

interface ActionIntent {
  type: 'modify_stop' | 'place_order' | 'close_all' | 'pause_autonomy' | string
  description?: string
  params?: Record<string, any>
}

interface Props {
  visible: boolean
  actionId: string
  intent: ActionIntent
  /** 过期倒计时秒数，0 = 不显示 */
  expiresSeconds?: number
}

const props = withDefaults(defineProps<Props>(), {
  expiresSeconds: 30,
})

const emit = defineEmits<{
  (e: 'confirm', actionId: string): void
  (e: 'cancel'): void
}>()

const loading = ref(false)
const expiresIn = ref(props.expiresSeconds)
let timer: ReturnType<typeof setInterval> | null = null

watch(
  () => props.visible,
  (v) => {
    if (v && props.expiresSeconds > 0) {
      expiresIn.value = props.expiresSeconds
      timer = setInterval(() => {
        expiresIn.value--
        if (expiresIn.value <= 0) {
          clearInterval(timer!)
          emit('cancel')
        }
      }, 1000)
    } else {
      if (timer) clearInterval(timer)
    }
  },
)

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const expiresProgressPct = computed(() =>
  props.expiresSeconds > 0
    ? (expiresIn.value / props.expiresSeconds) * 100
    : 100
)

const intentTypeLabel = computed(() => {
  const map: Record<string, string> = {
    modify_stop:    '修改止损',
    place_order:    '下达订单',
    close_all:      '平仓全部',
    pause_autonomy: '暂停自主模式',
  }
  return map[props.intent.type] ?? props.intent.type
})

const intentDefaultDesc = computed(() => {
  const map: Record<string, string> = {
    modify_stop:    '将修改指定标的的止损价格',
    place_order:    '通过 TWAP 算法提交真实订单',
    close_all:      '撤销账户内所有活跃计划，进入清仓流程',
    pause_autonomy: '将自主模式切换回 ADVISORY（人工审批）',
  }
  return map[props.intent.type] ?? '执行 AI 建议的操作'
})

const riskWarning = computed(() => {
  if (props.intent.type === 'close_all') return '此操作将取消所有活跃交易计划，请谨慎确认！'
  if (props.intent.type === 'place_order') return '将向真实账户提交订单，确保资金充足。'
  return null
})

const paramRows = computed(() => {
  const p = props.intent.params ?? {}
  const matched: any[] = p.matched ?? []
  const rows: { key: string; value: string }[] = []
  if (matched[0]) rows.push({ key: '标的', value: matched[0] })
  if (matched[1]) rows.push({ key: '参数值', value: String(matched[1]) })
  if (p.side) rows.push({ key: '方向', value: p.side })
  if (p.quantity) rows.push({ key: '数量', value: String(p.quantity) })
  return rows
})

async function onConfirm() {
  loading.value = true
  if (timer) clearInterval(timer)
  try {
    emit('confirm', props.actionId)
  } finally {
    loading.value = false
  }
}

function onCancel() {
  if (timer) clearInterval(timer)
  emit('cancel')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-dialog {
  background: #1e2535;
  border: 1px solid #2d3748;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.modal-icon { font-size: 20px; }
.modal-title { flex: 1; font-size: 16px; font-weight: 700; color: #f1f5f9; margin: 0; }
.close-btn {
  background: none; border: none; color: #6b7280;
  font-size: 18px; cursor: pointer; padding: 0 4px;
}
.close-btn:hover { color: #f1f5f9; }

.intent-card {
  background: #161b27;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 14px;
  border-left: 4px solid #6366f1;
}
.intent-close_all  { border-left-color: #ef4444; }
.intent-place_order { border-left-color: #22c55e; }
.intent-pause_autonomy { border-left-color: #f59e0b; }

.intent-type-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  background: rgba(99,102,241,0.15);
  color: #818cf8;
  border-radius: 6px;
  padding: 2px 8px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.intent-desc { font-size: 14px; color: #cbd5e1; margin: 0 0 12px; }

.param-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.param-key { color: #6b7280; padding: 3px 0; width: 80px; }
.param-val { color: #f1f5f9; font-weight: 600; font-family: 'JetBrains Mono', monospace; }

.risk-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: #fca5a5;
  margin-bottom: 14px;
}

.expires-bar {
  position: relative;
  height: 6px;
  background: #2d3748;
  border-radius: 3px;
  margin-bottom: 14px;
  overflow: hidden;
}
.expires-progress {
  height: 100%;
  background: #22c55e;
  border-radius: 3px;
  transition: width 1s linear, background 0.3s;
}
.expires-progress.urgent { background: #ef4444; }
.expires-text {
  position: absolute;
  right: 0;
  top: 8px;
  font-size: 11px;
  color: #6b7280;
}

.modal-footer { display: flex; gap: 10px; justify-content: flex-end; }
.btn-cancel {
  padding: 9px 20px; border-radius: 8px; border: 1px solid #374151;
  background: transparent; color: #9ca3af; font-size: 14px; cursor: pointer;
}
.btn-cancel:hover:not(:disabled) { background: #2d3748; color: #f1f5f9; }
.btn-confirm {
  padding: 9px 24px; border-radius: 8px;
  background: #6366f1; border: none; color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
}
.btn-confirm:hover:not(:disabled) { background: #4f46e5; }
.btn-confirm:disabled, .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
