<template>
  <div class="page-container">
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2>AI 自主中枢</h2>
          <p>管理 AI 自动交易级别、查看决策审计日志</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button
            v-if="!autonomyStore.isPaused"
            class="danger-button"
            @click="handlePause"
          >⏸ 紧急暂停</button>
          <button
            v-else
            class="success-button"
            @click="handleResume"
          >▶ 恢复运行</button>
          <button class="refresh-button" @click="autonomyStore.fetchStatus()">刷新</button>
        </div>
      </div>
    </section>

    <!-- 状态卡片 -->
    <div v-if="status" class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-label">自主级别</div>
        <div class="stat-value" :class="`level-${status.level.toLowerCase()}`">{{ status.level }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">运行状态</div>
        <div class="stat-value" :class="status.paused ? 'text-warning' : 'text-success'">
          {{ status.paused ? '已暂停' : '运行中' }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日交易次数</div>
        <div class="stat-value">{{ status.daily_trades_today }} / {{ status.max_daily_trades }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">熔断器</div>
        <div class="stat-value" :class="status.circuit_breaker_triggered ? 'text-danger' : 'text-success'">
          {{ status.circuit_breaker_triggered ? '已触发' : '正常' }}
        </div>
      </div>
    </div>

    <!-- 级别切换 -->
    <div class="card" style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px;">自主级别设置</h3>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <div
          v-for="lvl in ['FULL', 'SEMI', 'ADVISORY']"
          :key="lvl"
          class="level-option"
          :class="{ active: status?.level === lvl }"
          @click="handleSetLevel(lvl as any)"
        >
          <div class="level-title">{{ levelLabels[lvl] }}</div>
          <div class="level-desc">{{ levelDescs[lvl] }}</div>
        </div>
      </div>
    </div>

    <!-- 手动触发 -->
    <div class="card" style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px;">手动触发</h3>
      <p style="font-size: 13px; color: #888; margin: 0 0 16px;">用于调试：手动触发再平衡扫描（将持仓评分 REDUCE/SELL 转换为交易信号）或决策周期（处理待执行的信号）。</p>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button
          class="trigger-button"
          :disabled="autonomyStore.triggerLoading"
          @click="handleTriggerRebalance"
        >
          {{ autonomyStore.triggerLoading ? '执行中...' : '🔄 触发再平衡扫描' }}
        </button>
        <button
          class="trigger-button"
          :disabled="autonomyStore.triggerLoading"
          @click="handleTriggerDecisionCycle"
        >
          {{ autonomyStore.triggerLoading ? '执行中...' : '⚡ 触发决策周期' }}
        </button>
        <button class="refresh-button" @click="autonomyStore.fetchSignalPipeline()">刷新信号流</button>
      </div>
    </div>

    <!-- 信号流水线 -->
    <div class="card" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0;">信号流水线（最近 30 条）</h3>
        <div v-if="status?.signal_pipeline" style="display: flex; gap: 8px; font-size: 12px;">
          <span class="badge-info">待处理: {{ status.signal_pipeline['GENERATED'] ?? 0 }}</span>
          <span class="badge-info">已验证: {{ status.signal_pipeline['VALIDATED'] ?? 0 }}</span>
          <span class="badge-success">已执行: {{ status.signal_pipeline['EXECUTED'] ?? 0 }}</span>
          <span class="badge-danger">失败: {{ status.signal_pipeline['FAILED'] ?? 0 }}</span>
        </div>
      </div>
      <div v-if="autonomyStore.loading" class="loading-message">加载中...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>标的</th>
            <th>类型</th>
            <th>方向</th>
            <th>数量</th>
            <th>置信度</th>
            <th>状态</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sig in autonomyStore.signalPipeline" :key="sig.signal_id">
            <td>{{ formatDate(sig.created_at) }}</td>
            <td>{{ sig.symbol }}</td>
            <td>
              <span :class="signalTypeClass(sig.type)">{{ sig.type }}</span>
            </td>
            <td>{{ sig.direction ?? '—' }}</td>
            <td>{{ sig.quantity ?? '—' }}</td>
            <td>{{ (sig.strength * 100).toFixed(0) + '%' }}</td>
            <td>
              <span :class="signalStatusClass(sig.status)">{{ sig.status }}</span>
            </td>
            <td style="max-width: 200px; font-size: 11px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              {{ sig.notes ?? '—' }}
            </td>
          </tr>
          <tr v-if="autonomyStore.signalPipeline.length === 0">
            <td colspan="8" style="text-align: center; color: #666;">暂无信号记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 审计日志 -->
    <div class="card">
      <h3 style="margin: 0 0 16px;">决策审计日志</h3>
      <div v-if="autonomyStore.loading" class="loading-message">加载中...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>决策类型</th>
            <th>标的</th>
            <th>方向</th>
            <th>数量</th>
            <th>Risk Gate</th>
            <th>订单 ID</th>
            <th>撤销状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in autonomyStore.auditLogs" :key="log.id">
            <td>{{ formatDate(log.created_at) }}</td>
            <td>{{ log.decision_type }}</td>
            <td>{{ log.symbol ?? '—' }}</td>
            <td>{{ log.direction ?? '—' }}</td>
            <td>{{ log.quantity ?? '—' }}</td>
            <td>
              <span :class="log.risk_gate_passed ? 'badge-success' : 'badge-danger'">
                {{ log.risk_gate_passed ? '通过' : '拦截' }}
              </span>
            </td>
            <td>{{ log.order_id ? log.order_id.substring(0, 12) + '…' : '—' }}</td>
            <td>{{ log.revoked_at ? '已撤销' : '—' }}</td>
            <td>
              <button
                v-if="log.order_id && !log.revoked_at"
                class="small-button danger"
                @click="handleRevoke(log.order_id!)"
              >撤销</button>
            </td>
          </tr>
          <tr v-if="autonomyStore.auditLogs.length === 0">
            <td colspan="9" style="text-align: center; color: #666;">暂无审计记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAutonomyStore } from '@/stores/autonomy'
import type { AutonomyLevel } from '@/api/autonomyService'
import { storeToRefs } from 'pinia'

const autonomyStore = useAutonomyStore()
const { status } = storeToRefs(autonomyStore)

function signalTypeClass(type: string) {
  if (type === 'EXIT' || type === 'REDUCE' || type === 'SELL') return 'badge-warning'
  if (type === 'ENTRY' || type === 'ADD' || type === 'BUY') return 'badge-info'
  return 'badge-default'
}

function signalStatusClass(s: string) {
  if (s === 'EXECUTED') return 'badge-success'
  if (s === 'FAILED' || s === 'REJECTED') return 'badge-danger'
  if (s === 'VALIDATED') return 'badge-info'
  return 'badge-default'
}

const levelLabels: Record<string, string> = {
  FULL: '全自主 (FULL)',
  SEMI: '半自主 (SEMI)',
  ADVISORY: '顾问 (ADVISORY)',
}
const levelDescs: Record<string, string> = {
  FULL: 'AI 全权自动执行，无需人工确认',
  SEMI: 'AI 自动执行，30 分钟内可撤销',
  ADVISORY: 'AI 仅提供建议，需人工批准',
}

async function handleSetLevel(level: AutonomyLevel) {
  await autonomyStore.setLevel(level)
  await autonomyStore.fetchStatus()
}

async function handlePause() {
  await autonomyStore.pause()
}

async function handleResume() {
  await autonomyStore.resume()
}

async function handleTriggerRebalance() {
  await autonomyStore.triggerRebalance()
  await autonomyStore.fetchSignalPipeline()
  await autonomyStore.fetchStatus()
}

async function handleTriggerDecisionCycle() {
  await autonomyStore.triggerDecisionCycle()
  await autonomyStore.fetchSignalPipeline()
  await autonomyStore.fetchStatus()
}

async function handleRevoke(execId: string) {
  await autonomyStore.revokeOrder(execId)
}

function formatDate(s: string) {
  return new Date(s).toLocaleString('zh-CN')
}

onMounted(async () => {
  await autonomyStore.fetchStatus()
  await autonomyStore.fetchAuditLog({ limit: 50 })
  await autonomyStore.fetchSignalPipeline()
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}
.stat-card {
  background: var(--card-bg, #1a1a2e);
  border: 1px solid var(--border-color, #2d2d4e);
  border-radius: 8px;
  padding: 16px;
}
.stat-label { font-size: 12px; color: #888; margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 600; }
.text-success { color: #4caf50; }
.text-warning { color: #ff9800; }
.text-danger { color: #f44336; }
.card {
  background: var(--card-bg, #1a1a2e);
  border: 1px solid var(--border-color, #2d2d4e);
  border-radius: 8px;
  padding: 20px;
}
.level-option {
  flex: 1; min-width: 180px; padding: 14px 18px; border-radius: 8px;
  border: 2px solid var(--border-color, #2d2d4e);
  cursor: pointer; transition: all 0.2s;
}
.level-option:hover { border-color: #4a6fa5; }
.level-option.active { border-color: #4a90e2; background: rgba(74,144,226,0.1); }
.level-title { font-weight: 600; margin-bottom: 4px; }
.level-desc { font-size: 12px; color: #888; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 8px 12px; border-bottom: 1px solid var(--border-color, #2d2d4e); text-align: left; }
.data-table th { color: #888; font-weight: 500; }
.badge-success { background: rgba(76,175,80,0.15); color: #4caf50; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.badge-danger { background: rgba(244,67,54,0.15); color: #f44336; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.danger-button { background: #c62828; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.success-button { background: #2e7d32; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.refresh-button { background: transparent; border: 1px solid #4a6fa5; color: #4a90e2; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.small-button { font-size: 11px; padding: 2px 8px; border-radius: 4px; border: none; cursor: pointer; }
.small-button.danger { background: rgba(244,67,54,0.15); color: #f44336; }
.badge-info { background: rgba(74,144,226,0.15); color: #4a90e2; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.badge-warning { background: rgba(255,152,0,0.15); color: #ff9800; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.badge-default { background: rgba(150,150,150,0.15); color: #aaa; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.trigger-button {
  background: rgba(74,144,226,0.15); color: #4a90e2;
  border: 1px solid rgba(74,144,226,0.4); padding: 8px 18px; border-radius: 6px;
  cursor: pointer; font-size: 13px; transition: all 0.2s;
}
.trigger-button:hover:not(:disabled) { background: rgba(74,144,226,0.3); }
.trigger-button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
