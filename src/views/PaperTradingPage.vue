<template>
  <div class="page-container">
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2>模拟盘</h2>
          <p>无风险的沙盒环境，达标后可晋级实盘（Sharpe≥1.0 / 回撤≤20% / 胜率≥50% / 30天）</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button class="refresh-button" @click="paperStore.fetchStatus()">刷新</button>
          <button class="danger-button" @click="confirmReset">重置账户</button>
        </div>
      </div>
    </section>

    <div v-if="paperStore.loading && !paperStore.account" class="loading-message">加载中...</div>
    <p v-if="paperStore.error" class="error-message">{{ paperStore.error }}</p>

    <!-- 账户汇总 -->
    <div v-if="account" class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-label">账户净值</div>
        <div class="stat-value">${{ account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">可用现金</div>
        <div class="stat-value">${{ account.cash.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总收益</div>
        <div class="stat-value" :class="account.total_pnl >= 0 ? 'text-success' : 'text-danger'">
          {{ account.total_pnl >= 0 ? '+' : '' }}{{ account.total_pnl_pct.toFixed(2) }}%
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">交易次数</div>
        <div class="stat-value">{{ account.trade_count }}</div>
      </div>
    </div>

    <div class="layout">
      <!-- 左: 下单 + 持仓 -->
      <div>
        <!-- 下单表单 -->
        <div class="card" style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 16px;">模拟下单</h3>
          <div class="form-grid">
            <div class="form-field">
              <label>标的</label>
              <input v-model="tradeForm.symbol" placeholder="AAPL" />
            </div>
            <div class="form-field">
              <label>方向</label>
              <div style="display: flex; gap: 8px;">
                <button
                  :class="['side-btn', tradeForm.side === 'BUY' ? 'active-buy' : '']"
                  @click="tradeForm.side = 'BUY'"
                >BUY</button>
                <button
                  :class="['side-btn', tradeForm.side === 'SELL' ? 'active-sell' : '']"
                  @click="tradeForm.side = 'SELL'"
                >SELL</button>
              </div>
            </div>
            <div class="form-field">
              <label>数量</label>
              <input type="number" v-model.number="tradeForm.quantity" min="1" />
            </div>
            <div class="form-field">
              <label>订单类型</label>
              <select v-model="tradeForm.order_type">
                <option value="MKT">市价单</option>
                <option value="LMT">限价单</option>
              </select>
            </div>
            <div v-if="tradeForm.order_type === 'LMT'" class="form-field">
              <label>限价价格</label>
              <input type="number" v-model.number="tradeForm.limit_price" step="0.01" />
            </div>
          </div>
          <button
            class="primary-button"
            style="width: 100%;"
            @click="handleTrade"
            :disabled="paperStore.loading"
          >{{ paperStore.loading ? '执行中...' : '📤 提交模拟单' }}</button>

          <div v-if="lastTrade" class="trade-result">
            <span class="text-success">✓ 成交 {{ lastTrade.quantity }}股 @ ${{ lastTrade.filled_price.toFixed(2) }}</span>
            <span style="color: #888; font-size: 12px; margin-left: 8px;">手续费 ${{ lastTrade.commission.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 持仓 -->
        <div class="card">
          <h3 style="margin: 0 0 16px;">当前持仓</h3>
          <div v-if="!account?.positions.length" style="color: #666; text-align: center; padding: 20px;">无持仓</div>
          <table v-else class="data-table">
            <thead><tr><th>标的</th><th>数量</th><th>均价</th><th>市值</th><th>浮盈亏</th></tr></thead>
            <tbody>
              <tr v-for="p in account.positions" :key="p.symbol">
                <td>{{ p.symbol }}</td>
                <td>{{ p.qty }}</td>
                <td>${{ p.avg_cost.toFixed(2) }}</td>
                <td>${{ p.market_value.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</td>
                <td :class="p.unrealized_pnl >= 0 ? 'text-success' : 'text-danger'">
                  {{ p.unrealized_pnl >= 0 ? '+' : '' }}{{ p.unrealized_pnl_pct.toFixed(2) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 右: 晋级评估 -->
      <div class="card graduation-panel">
        <h3 style="margin: 0 0 16px;">🎓 晋级评估</h3>
        <button class="primary-button" style="width: 100%; margin-bottom: 16px;" @click="paperStore.checkGraduation()">
          检查晋级资格
        </button>
        <div v-if="graduation">
          <div
            class="graduation-banner"
            :class="graduation.eligible ? 'eligible' : 'not-eligible'"
          >
            {{ graduation.eligible ? '✅ 达到晋级标准！可以申请实盘' : '⏳ 尚未达到晋级标准' }}
          </div>
          <p style="font-size: 13px; color: #888; margin-top: 8px;">{{ graduation.message }}</p>
          <div class="requirement-list">
            <div class="req-item" :class="graduation.metrics.sharpe >= graduation.requirements.min_sharpe ? 'pass' : 'fail'">
              <span>Sharpe 比率</span>
              <span>{{ graduation.metrics.sharpe.toFixed(2) }} / ≥{{ graduation.requirements.min_sharpe }}</span>
            </div>
            <div class="req-item" :class="graduation.metrics.max_drawdown <= graduation.requirements.max_drawdown_limit ? 'pass' : 'fail'">
              <span>最大回撤</span>
              <span>{{ (graduation.metrics.max_drawdown * 100).toFixed(1) }}% / ≤{{ (graduation.requirements.max_drawdown_limit * 100).toFixed(0) }}%</span>
            </div>
            <div class="req-item" :class="graduation.metrics.win_rate >= graduation.requirements.min_win_rate ? 'pass' : 'fail'">
              <span>胜率</span>
              <span>{{ (graduation.metrics.win_rate * 100).toFixed(1) }}% / ≥{{ (graduation.requirements.min_win_rate * 100).toFixed(0) }}%</span>
            </div>
            <div class="req-item" :class="graduation.metrics.trade_days >= graduation.requirements.min_days ? 'pass' : 'fail'">
              <span>运行天数</span>
              <span>{{ graduation.metrics.trade_days }} / ≥{{ graduation.requirements.min_days }} 天</span>
            </div>
          </div>
        </div>
        <p v-else style="color: #666; font-size: 13px;">点击按钮评估晋级资格</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePaperTradingStore } from '@/stores/paperTrading'
import { storeToRefs } from 'pinia'
import type { PaperTradeRequest } from '@/api/paperTradingService'

const paperStore = usePaperTradingStore()
const { account, lastTrade, graduation } = storeToRefs(paperStore)

const tradeForm = ref<PaperTradeRequest>({
  symbol: 'AAPL',
  side: 'BUY',
  quantity: 10,
  order_type: 'MKT',
})

async function handleTrade() {
  await paperStore.executeTrade({ ...tradeForm.value, symbol: tradeForm.value.symbol.toUpperCase() })
}

function confirmReset() {
  if (window.confirm('确定要重置模拟账户吗？所有持仓和交易记录将被清除。')) {
    paperStore.resetAccount()
  }
}

onMounted(() => paperStore.fetchStatus())
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
.stat-card { background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 16px; }
.stat-label { font-size: 12px; color: #888; margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 600; }
.layout { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
.card { background: var(--card-bg, #1a1a2e); border: 1px solid var(--border-color, #2d2d4e); border-radius: 8px; padding: 20px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 12px; color: #888; }
.form-field input, .form-field select {
  background: rgba(255,255,255,0.05); border: 1px solid var(--border-color, #2d2d4e);
  border-radius: 6px; color: inherit; padding: 8px; font-size: 13px;
}
.side-btn { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color, #2d2d4e); background: transparent; color: inherit; cursor: pointer; font-size: 13px; }
.side-btn.active-buy { background: rgba(76,175,80,0.15); border-color: #4caf50; color: #4caf50; }
.side-btn.active-sell { background: rgba(244,67,54,0.15); border-color: #f44336; color: #f44336; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 8px 10px; border-bottom: 1px solid var(--border-color, #2d2d4e); text-align: left; }
.data-table th { color: #888; }
.trade-result { margin-top: 12px; font-size: 13px; }
.graduation-banner { padding: 12px; border-radius: 6px; text-align: center; font-weight: 600; font-size: 14px; }
.graduation-banner.eligible { background: rgba(76,175,80,0.1); border: 1px solid #4caf50; color: #4caf50; }
.graduation-banner.not-eligible { background: rgba(255,152,0,0.1); border: 1px solid #ff9800; color: #ff9800; }
.requirement-list { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.req-item { display: flex; justify-content: space-between; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
.req-item.pass { background: rgba(76,175,80,0.08); border-left: 3px solid #4caf50; }
.req-item.fail { background: rgba(244,67,54,0.08); border-left: 3px solid #f44336; }
.text-success { color: #4caf50; }
.text-danger { color: #f44336; }
.primary-button { background: #4a90e2; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.danger-button { background: #c62828; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.refresh-button { background: transparent; border: 1px solid #4a6fa5; color: #4a90e2; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.loading-message { color: #888; text-align: center; padding: 20px; }
.error-message { color: #f44336; font-size: 13px; margin-bottom: 12px; }
</style>
