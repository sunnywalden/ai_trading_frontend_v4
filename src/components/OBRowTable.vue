<template>
  <table class="obt">
    <thead>
      <tr>
        <th>标的</th>
        <th>方向</th>
        <th>阶段</th>
        <th>来源</th>
        <th>置信</th>
        <th>目标价</th>
        <th>止损价</th>
        <th>目标仓%</th>
        <th>现仓%</th>
        <th>均价</th>
        <th>未平仓PnL</th>
        <th>持仓FSM</th>
        <th>自主行动</th>
        <th>风险</th>
        <th>创建时间</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="row in rows"
        :key="row.plan_id"
        class="ob-row"
        @click.self="$emit('detail', row)"
      >
        <!-- 标的 -->
        <td class="td-symbol">
          <span class="sym">{{ row.symbol }}</span>
          <span v-if="row.account_id" class="account-tag">{{ row.account_id }}</span>
        </td>

        <!-- 方向 -->
        <td>
          <span class="dir-badge" :class="row.direction === 'BUY' ? 'dir-buy' : 'dir-sell'">
            {{ row.direction ?? '—' }}
          </span>
        </td>

        <!-- 阶段 -->
        <td class="td-center">
          <span class="stage-pill">{{ row.pipeline_stage ?? '—' }}</span>
        </td>

        <!-- 来源 -->
        <td>
          <span class="src-badge" :class="`src-${(row.source ?? 'MANUAL').toLowerCase()}`">
            {{ sourceLabel(row.source) }}
          </span>
        </td>

        <!-- 置信 -->
        <td class="td-right">
          <span v-if="row.confidence" :style="{ color: confColor(row.confidence) }">
            {{ row.confidence.toFixed(0) }}%
          </span>
          <span v-else class="dim">—</span>
        </td>

        <!-- 目标价 -->
        <td class="td-right mono">{{ fmt(row.entry_price_target) }}</td>

        <!-- 止损价 -->
        <td class="td-right">
          <span class="stop-val mono">{{ fmt(row.stop_loss) }}</span>
        </td>

        <!-- 目标仓位% -->
        <td class="td-right mono">{{ row.target_position_pct != null ? row.target_position_pct.toFixed(1) + '%' : '—' }}</td>

        <!-- 当前仓位% -->
        <td class="td-right mono">{{ row.current_position_pct != null ? row.current_position_pct.toFixed(1) + '%' : '—' }}</td>

        <!-- 均价 -->
        <td class="td-right mono">{{ fmt(row.fill_avg_price) }}</td>

        <!-- 未平仓PnL -->
        <td class="td-right">
          <span v-if="row.unrealized_pnl != null"
            :class="row.unrealized_pnl >= 0 ? 'pnl-pos' : 'pnl-neg'">
            {{ row.unrealized_pnl >= 0 ? '+' : '' }}{{ row.unrealized_pnl.toFixed(1) }}
          </span>
          <span v-else class="dim">—</span>
        </td>

        <!-- 持仓FSM -->
        <td>
          <span v-if="row.position_fsm_state" class="fsm-mini" :class="`fsm-${row.position_fsm_state.toLowerCase()}`">
            {{ row.position_fsm_state }}
          </span>
          <span v-else class="dim">—</span>
        </td>

        <!-- 自主行动 -->
        <td>
          <span v-if="row.autonomy_action" class="auton-badge" :class="`auton-${row.autonomy_action.toLowerCase()}`">
            {{ row.autonomy_action === 'AUTO_EXECUTE' ? '自动' : '待确认' }}
          </span>
          <span v-else class="dim">—</span>
        </td>

        <!-- 风险标签 -->
        <td>
          <div class="risk-badges">
            <span
              v-for="rb in (row.risk_badges ?? [])"
              :key="rb.type"
              class="risk-badge"
              :class="`risk-${rb.severity}`"
              :title="rb.label"
            >{{ rb.label }}</span>
          </div>
        </td>

        <!-- 创建时间 -->
        <td class="td-time dim">{{ fmtTime(row.created_at) }}</td>

        <!-- 操作 -->
        <td>
          <div class="action-btns">
            <button class="act-btn" @click.stop="$emit('detail', row)">详情</button>
            <button class="act-btn act-policy" @click.stop="$emit('policy', row)">策略</button>
            <button
              v-if="row.stop_loss != null"
              class="act-btn act-stop"
              @click.stop="$emit('stopLoss', row)"
            >止损</button>
          </div>
        </td>
      </tr>

      <!-- 空態 -->
      <tr v-if="!rows.length">
        <td colspan="16" class="empty-td">暂无记录</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { OrderBookRow } from '@/api/orderBookService';
import { formatClientDateTime } from '@/utils/datetime';

defineProps<{ rows: OrderBookRow[] }>()
defineEmits<{
  (e: 'detail',   row: OrderBookRow): void
  (e: 'policy',   row: OrderBookRow): void
  (e: 'stopLoss', row: OrderBookRow): void
}>()

const SOURCE_LABELS: Record<string, string> = {
  AI_AUTONOMOUS: 'AI自主', AI_ADVISORY: 'AI建议', MANUAL: '人工',
}

function sourceLabel(s: string | null | undefined): string { return SOURCE_LABELS[s ?? ''] ?? '—' }

function fmt(v: number | null | undefined, d = 2): string {
  if (v == null) return '—'
  return v.toFixed(d)
}

function confColor(c: number): string {
  if (c >= 70) return '#10b981'
  if (c >= 40) return '#f59e0b'
  return '#ef4444'
}

function fmtTime(iso: string): string {
  return formatClientDateTime(iso)
}
</script>

<style scoped>
.obt {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  white-space: nowrap;
  min-width: 1100px;
}

.obt thead tr {
  background: rgba(255,255,255,0.04);
}

.obt th {
  text-align: left;
  padding: 7px 8px;
  color: #64748b;
  font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  font-size: 10px;
  text-transform: uppercase;
}

.ob-row {
  transition: background 0.1s;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.ob-row:hover { background: rgba(255,255,255,0.04); }

.obt td {
  padding: 6px 8px;
  color: #e2e8f0;
  vertical-align: middle;
}

.td-center { text-align: center; }
.td-right  { text-align: right; }
.td-time   { font-size: 10px; }
.mono      { font-variant-numeric: tabular-nums; font-family: monospace; }
.dim       { color: #4b5563; }

/* symbol */
.td-symbol { display: flex; flex-direction: column; }
.sym { font-weight: 700; color: #e2e8f0; }
.account-tag { font-size: 9px; color: #64748b; }

/* dir badge */
.dir-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px; }
.dir-buy  { background: rgba(16,185,129,0.15); color: #10b981; }
.dir-sell { background: rgba(239,68,68,0.15);  color: #ef4444; }

/* stage */
.stage-pill {
  font-size: 10px;
  font-weight: 700;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(99,102,241,0.15);
  color: #a5b4fc;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* source */
.src-badge { font-size: 9px; padding: 1px 5px; border-radius: 3px; }
.src-ai_autonomous { background: rgba(167,139,250,0.15); color: #a78bfa; }
.src-ai_advisory   { background: rgba(96,165,250,0.15);  color: #60a5fa; }
.src-manual        { background: rgba(107,114,128,0.15); color: #9ca3af; }

/* stop-loss */
.stop-val { color: #f59e0b; }

/* pnl */
.pnl-pos { color: #10b981; font-weight: 600; }
.pnl-neg { color: #ef4444; font-weight: 600; }

/* fsm mini */
.fsm-mini { font-size: 9px; padding: 1px 4px; border-radius: 3px; background: rgba(255,255,255,0.06); }
.fsm-holding { color: #10b981; }
.fsm-entry_pending, .fsm-exit_pending { color: #f59e0b; }
.fsm-closed   { color: #6b7280; }

/* autonomy */
.auton-badge { font-size: 9px; padding: 1px 5px; border-radius: 3px; }
.auton-auto_execute    { background: rgba(16,185,129,0.12); color: #6ee7b7; }
.auton-pending_confirm { background: rgba(245,158,11,0.12); color: #fde68a; }

/* risk badges */
.risk-badges { display: flex; gap: 2px; flex-wrap: wrap; }
.risk-badge { font-size: 8px; padding: 1px 4px; border-radius: 2px; }
.risk-low  { background: rgba(16,185,129,0.1);  color: #6ee7b7; }
.risk-medium { background: rgba(245,158,11,0.1); color: #fde68a; }
.risk-high { background: rgba(239,68,68,0.15); color: #fca5a5; }

/* actions */
.action-btns { display: flex; gap: 4px; }
.act-btn {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(99,102,241,0.15);
  border: 1px solid rgba(99,102,241,0.3);
  color: #e2e8f0;
  cursor: pointer;
  white-space: nowrap;
}
.act-btn:hover { background: rgba(99,102,241,0.25); }
.act-stop {
  background: rgba(245,158,11,0.12);
  border-color: rgba(245,158,11,0.3);
  color: #fef3c7;
}
.act-stop:hover { background: rgba(245,158,11,0.22); }

.act-policy {
  background: rgba(59,130,246,0.14);
  border-color: rgba(96,165,250,0.32);
  color: #eff6ff;
}

.act-policy:hover { background: rgba(59,130,246,0.24); }

.empty-td {
  text-align: center;
  color: #4b5563;
  padding: 24px !important;
  font-size: 12px;
}
</style>
