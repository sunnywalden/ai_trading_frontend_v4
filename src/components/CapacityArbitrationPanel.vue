<template>
  <div class="capacity-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <div class="header-left">
        <span class="icon">⚔️</span>
        <h3>席位竞争仲裁</h3>
        <span v-if="config?.capacity_replacement_enabled" class="badge-enabled">
          {{ config.capacity_replacement_dry_run ? '试运行' : '运行中' }}
        </span>
        <span v-else class="badge-disabled">已禁用</span>
      </div>
      <div class="header-right">
        <button class="sm-btn" @click="runPreview" :disabled="previewLoading">
          <span v-if="previewLoading">⏳</span>
          <span v-else>🔍 预演</span>
        </button>
        <button class="sm-btn" @click="loadAll" :disabled="loading">🔄</button>
      </div>
    </div>

    <div v-if="loading" class="center-msg">加载中...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <div v-else class="panel-body">
      <!-- 席位利用率 -->
      <div class="capacity-gauge">
        <div class="gauge-row">
          <span class="gauge-label">席位利用率</span>
          <span class="gauge-fraction">{{ stats?.seat_utilization_trend?.at(-1)?.utilization != null
            ? Math.round((stats!.seat_utilization_trend.at(-1)!.utilization) * 100) + '%'
            : `${config?.max_concurrent_positions ?? '—'} 个上限` }}</span>
        </div>
        <div class="gauge-bar">
          <div
            class="gauge-fill"
            :style="{ width: utilizationPct + '%' }"
            :class="utilizationClass"
          ></div>
        </div>
        <div class="gauge-meta">
          上限 {{ config?.max_concurrent_positions ?? '—' }} 席 ·
          最近 {{ stats?.window_days ?? 7 }} 天共 {{ stats?.total_arbitrations ?? 0 }} 次仲裁
        </div>
      </div>

      <!-- 统计卡片 -->
      <div v-if="stats" class="stats-row">
        <div class="mini-card">
          <div class="mini-label">替换率</div>
          <div class="mini-value" :class="stats.replacement_rate > 0.3 ? 'text-warn' : ''">
            {{ (stats.replacement_rate * 100).toFixed(1) }}%
          </div>
        </div>
        <div class="mini-card">
          <div class="mini-label">信号拒绝</div>
          <div class="mini-value">{{ stats.total_signals_rejected }}</div>
        </div>
        <div class="mini-card">
          <div class="mini-label">持仓平出</div>
          <div class="mini-value">{{ stats.total_positions_closed }}</div>
        </div>
        <div class="mini-card">
          <div class="mini-label">保护触发</div>
          <div class="mini-value text-muted" :title="`最小边缘保护 ${(stats.min_edge_protection_rate * 100).toFixed(0)}% · 冷却保护 ${(stats.cooldown_protection_rate * 100).toFixed(0)}%`">
            ℹ️
          </div>
        </div>
      </div>

      <!-- 预演结果 -->
      <div v-if="preview" class="preview-section">
        <div class="preview-header">
          <span class="preview-title">📋 预演结果</span>
          <span class="preview-meta">溢出 {{ preview.overflow }} 席 · {{ preview.dry_run ? 'dry-run' : '真实模式' }}</span>
          <button class="close-btn" @click="preview = null">✕</button>
        </div>

        <!-- 候选池 -->
        <div v-if="preview.candidates_snapshot.length" class="candidate-table-wrap">
          <table class="candidate-table">
            <thead>
              <tr>
                <th>#</th>
                <th>类型</th>
                <th>标的</th>
                <th>原始分</th>
                <th>准入分</th>
                <th>持仓时长</th>
                <th>结果</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in sortedCandidates"
                :key="c.symbol + (c.signal_id ?? '')"
                :class="c.eliminate ? 'row-eliminated' : 'row-approved'"
              >
                <td class="rank-cell">{{ c.rank ?? '—' }}</td>
                <td>
                  <span :class="candidateTypeOf(c) === 'POSITION' ? 'badge-position' : 'badge-signal'">
                    {{ candidateTypeOf(c) === 'POSITION' ? '持仓' : '信号' }}
                  </span>
                </td>
                <td class="symbol-cell">{{ c.symbol }}</td>
                <td class="num-cell">{{ c.raw_score.toFixed(1) }}</td>
                <td class="num-cell score-cell" :class="admissionClass(c.admission_score)">
                  {{ c.admission_score.toFixed(1) }}
                </td>
                <td class="num-cell">{{ c.hold_minutes != null ? Math.round(c.hold_minutes) + ' min' : '—' }}</td>
                <td>
                  <span v-if="isProtected(c)" class="badge-protected" :title="c.protect_reason ?? ''">
                    🛡 保护
                  </span>
                  <span v-else-if="c.eliminate" class="badge-eliminate">
                    ✗ 淘汰
                  </span>
                  <span v-else class="badge-approve">✓ 通过</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="no-overflow-msg">✅ 当前无席位溢出，无需触发仲裁</div>
      </div>

      <!-- 最近仲裁日志 -->
      <div v-if="logs?.items?.length" class="recent-logs">
        <div class="section-title">最近仲裁记录</div>
        <table class="logs-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>账户</th>
              <th>溢出</th>
              <th>淘汰信号</th>
              <th>平仓</th>
              <th>替换</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs.items" :key="log.id">
              <td class="ts-cell">{{ fmtTs(log.created_at) }}</td>
              <td>{{ log.account_id }}</td>
              <td class="num-cell">{{ log.overflow_count }}</td>
              <td class="num-cell">{{ log.eliminated_signals_count }}</td>
              <td class="num-cell">{{ log.eliminated_positions_count }}</td>
              <td>
                <span v-if="log.replacement_triggered" class="badge-replaced">✓</span>
                <span v-else class="text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 配置摘要 -->
      <div v-if="config" class="config-summary">
        <div class="config-title">配置参数</div>
        <div class="config-grid">
          <div class="cfg-item">
            <span class="cfg-key">最大替换/周期</span>
            <span class="cfg-val">{{ config.capacity_replacement_max_per_cycle }}</span>
          </div>
          <div class="cfg-item">
            <span class="cfg-key">最小边缘优势</span>
            <span class="cfg-val">{{ config.capacity_replacement_min_edge }}</span>
          </div>
          <div class="cfg-item">
            <span class="cfg-key">最小持仓时长</span>
            <span class="cfg-val">{{ config.capacity_min_hold_minutes }} min</span>
          </div>
          <div class="cfg-item">
            <span class="cfg-key">冷却时长</span>
            <span class="cfg-val">{{ config.capacity_replacement_cooldown_minutes }} min</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
    capacityArbiterApi,
    type CapacityConfigResponse,
    type CapacityLogListResponse,
    type CapacityPreviewResponse,
    type CapacityStatsResponse,
} from '@/api/capacityArbiterService';
import { computed, onMounted, ref } from 'vue';
import { formatClientDateTime } from '@/utils/datetime';

const props = defineProps<{ accountId: string; regime?: string }>()

const loading        = ref(false)
const previewLoading = ref(false)
const error          = ref<string | null>(null)

const config  = ref<CapacityConfigResponse | null>(null)
const stats   = ref<CapacityStatsResponse | null>(null)
const logs    = ref<CapacityLogListResponse | null>(null)
const preview = ref<CapacityPreviewResponse | null>(null)

const utilizationPct = computed(() => {
  const trend = stats.value?.seat_utilization_trend ?? []
  if (!trend.length) return 0
  return Math.round((trend.at(-1)!.utilization) * 100)
})

const utilizationClass = computed(() => {
  const pct = utilizationPct.value
  if (pct >= 100) return 'gauge-danger'
  if (pct >= 80) return 'gauge-warn'
  return 'gauge-ok'
})

const sortedCandidates = computed(() =>
  [...(preview.value?.candidates_snapshot ?? [])].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
)

function candidateTypeOf(c: { type?: string; candidate_type?: string }) {
  return (c.candidate_type ?? c.type ?? 'SIGNAL').toUpperCase()
}

function isProtected(c: { protected?: boolean; is_protected?: boolean }) {
  return Boolean(c.is_protected ?? c.protected ?? false)
}

function admissionClass(score: number) {
  if (score >= 70) return 'score-high'
  if (score >= 50) return 'score-mid'
  return 'score-low'
}

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [cfgRes, statsRes, logsRes] = await Promise.all([
      capacityArbiterApi.getConfig(),
      capacityArbiterApi.getStats({ account_id: props.accountId, window_days: 7 }),
      capacityArbiterApi.getLogs({ account_id: props.accountId, size: 5 }),
    ])
    config.value = cfgRes
    stats.value  = statsRes
    logs.value   = logsRes
  } catch (e: any) {
    error.value = e?.response?.data?.detail ?? e?.message ?? '加载失败'
  } finally {
    loading.value = false
  }
}

async function runPreview() {
  previewLoading.value = true
  try {
    preview.value = await capacityArbiterApi.preview(props.accountId, props.regime)
  } catch (e: any) {
    error.value = e?.response?.data?.detail ?? e?.message ?? '预演失败'
  } finally {
    previewLoading.value = false
  }
}

function fmtTs(ts: string): string {
  return formatClientDateTime(ts)
}

onMounted(loadAll)
</script>

<style scoped>
.capacity-panel {
  background: var(--card-bg, #1e2130);
  border: 1px solid var(--border-color, #2a3050);
  border-radius: 10px;
  padding: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #e5e7eb;
}

.header-right {
  display: flex;
  gap: 6px;
}

.badge-enabled {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 20px;
}

.badge-disabled {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 20px;
}

.sm-btn {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.sm-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.3);
}

.sm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 利用率仪表 */
.capacity-gauge {
  margin-bottom: 14px;
}

.gauge-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 5px;
}

.gauge-fraction {
  font-weight: 600;
  color: #e5e7eb;
}

.gauge-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.gauge-ok     { background: #22c55e; }
.gauge-warn   { background: #f59e0b; }
.gauge-danger { background: #ef4444; }

.gauge-meta {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

/* 统计行 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.mini-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  padding: 8px;
  text-align: center;
}

.mini-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
.mini-value { font-size: 16px; font-weight: 600; color: #e5e7eb; }
.text-warn  { color: #f59e0b; }
.text-muted { color: #6b7280; }

/* 预演结果 */
.preview-section {
  background: rgba(99, 102, 241, 0.04);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 14px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.preview-title { font-size: 13px; font-weight: 600; color: #e5e7eb; }
.preview-meta  { font-size: 11px; color: #9ca3af; flex: 1; }

.close-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
}

.candidate-table-wrap { overflow-x: auto; }

.candidate-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.candidate-table th {
  text-align: left;
  padding: 6px 8px;
  color: #6b7280;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  font-weight: 500;
}

.candidate-table td {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.row-eliminated { background: rgba(239, 68, 68, 0.04); }
.row-approved   { background: rgba(34, 197, 94, 0.04); }

.rank-cell   { color: #9ca3af; width: 28px; }
.symbol-cell { font-weight: 600; color: #c4b5fd; }
.num-cell    { font-variant-numeric: tabular-nums; }

.badge-position {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
}

.badge-signal {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
}

.badge-protected {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
  cursor: help;
}

.badge-eliminate {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
}

.badge-approve {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
}

.score-cell { font-weight: 600; }
.score-high { color: #4ade80; }
.score-mid  { color: #fbbf24; }
.score-low  { color: #f87171; }

.no-overflow-msg {
  text-align: center;
  color: #4ade80;
  font-size: 13px;
  padding: 16px;
}

/* 最近日志 */
.recent-logs { margin-bottom: 14px; }

.section-title {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.logs-table th {
  text-align: left;
  padding: 5px 8px;
  color: #6b7280;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  font-weight: 500;
}

.logs-table td {
  padding: 5px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: #d1d5db;
}

.ts-cell  { color: #9ca3af; white-space: nowrap; }

.badge-replaced {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
}

/* 配置摘要 */
.config-summary {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px;
}

.config-title {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.cfg-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.cfg-key { color: #9ca3af; }
.cfg-val { color: #e5e7eb; font-weight: 500; }

/* 通用 */
.center-msg { text-align: center; color: #9ca3af; padding: 24px; }
.error-msg  { text-align: center; color: #f87171; padding: 16px; font-size: 13px; }

.panel-body { display: flex; flex-direction: column; gap: 2px; }
</style>
