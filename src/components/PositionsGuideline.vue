<template>
  <div class="guideline-card">
    <h2>📊 持仓评估说明</h2>
    
    <div class="score-section">
      <h3>综合评分 (0-100)</h3>
      <p class="desc">技术面、基本面、情绪面加权综合评分</p>
      <ul>
        <li><span class="range">81-100</span> 优秀 - 强烈推荐配置</li>
        <li><span class="range">61-80</span> 良好 - 适合持有或增持</li>
        <li><span class="range">40-60</span> 中性 - 观望或持有</li>
        <li><span class="range">25-40</span> 较差 - 建议减仓</li>
        <li><span class="range">0-25</span> 差 - 强烈建议清仓</li>
      </ul>
    </div>

    <div class="score-section">
      <h3>技术面评分 (0-100)</h3>
      <p class="desc">基于趋势、动量、支撑阻力等技术指标</p>
      <ul>
        <li>趋势方向与强度（BULLISH/BEARISH/SIDEWAYS）</li>
        <li>RSI相对强弱指标（超买/超卖）</li>
        <li>MACD动量指标</li>
        <li>布林带位置</li>
        <li>成交量比率</li>
        <li>关键支撑位和阻力位</li>
      </ul>
      <p class="impact">💡 分数越高，技术面越强势</p>
    </div>

    <div class="score-section">
      <h3>日线趋势快照 (Wall Street视角)</h3>
      <p class="desc">每日每标的生成一次，持久化缓存，手动触发刷新</p>
      <ul>
        <li><strong>趋势方向</strong>：BULLISH（看涨）/ BEARISH（看跌）/ SIDEWAYS（横盘）</li>
        <li><strong>趋势强度</strong>：0-100（算法强度打分，非置信度）</li>
        <li><strong>RSI状态</strong>：OVERSOLD（超卖）/ NEUTRAL（中性）/ OVERBOUGHT（超买）</li>
        <li><strong>MACD状态</strong>：BULLISH_CROSSOVER（金叉）/ BEARISH_CROSSOVER（死叉）</li>
        <li><strong>布林带位置</strong>：当前价格在布林带的相对位置</li>
        <li><strong>量能分析</strong>：volume_ratio > 1 放量（绿色），< 1 缩量（橙色）</li>
        <li><strong>关键价位</strong>：支撑位和阻力位（显示前2-3个）</li>
        <li><strong>AI摘要</strong>：OpenAI生成的交易员风格解读（失败降级为规则摘要）</li>
      </ul>
      <p class="impact">💡 快照为持久化缓存，可能为空，需手动刷新</p>
      <p class="warning">⚠️ 宏观风险与日线趋势独立分析，不混合为一个信号源</p>
    </div>

    <div class="score-section">
      <h3>基本面评分 (0-100)</h3>
      <p class="desc">基于估值、盈利能力、成长性、财务健康度</p>
      <ul>
        <li><strong>估值</strong>：PE、PB、PEG等估值指标</li>
        <li><strong>盈利能力</strong>：ROE、ROA、净利润率</li>
        <li><strong>成长性</strong>：营收增长、利润增长</li>
        <li><strong>财务健康</strong>：流动比率、负债权益比</li>
      </ul>
      <p class="impact">💡 分数越高，基本面越稳健</p>
    </div>

    <div class="score-section">
      <h3>情绪面评分 (0-100)</h3>
      <p class="desc">基于市场情绪、资金流向、投资者行为</p>
      <ul>
        <li>分析师评级和目标价</li>
        <li>机构持仓变化</li>
        <li>新闻舆情分析</li>
        <li>期权Put/Call比率</li>
        <li>社交媒体情绪</li>
      </ul>
      <p class="impact">💡 分数越高，市场情绪越乐观</p>
    </div>

    <div class="recommendation-section">
      <h3>操作建议说明</h3>
      <div class="rec-grid">
        <div class="rec-item rec-strong-buy">
          <span class="rec-label">STRONG BUY</span>
          <span class="rec-desc">强烈买入 (85+)</span>
        </div>
        <div class="rec-item rec-buy">
          <span class="rec-label">BUY</span>
          <span class="rec-desc">买入 (75-85)</span>
        </div>
        <div class="rec-item rec-hold">
          <span class="rec-label">HOLD</span>
          <span class="rec-desc">持有 (40-75)</span>
        </div>
        <div class="rec-item rec-reduce">
          <span class="rec-label">REDUCE</span>
          <span class="rec-desc">减仓 (30-40)</span>
        </div>
        <div class="rec-item rec-sell">
          <span class="rec-label">SELL</span>
          <span class="rec-desc">卖出 (<30)</span>
        </div>
      </div>
    </div>

    <div class="risk-section">
      <h3>风险等级说明</h3>
      <div class="risk-grid">
        <div class="risk-item risk-low">
          <span class="risk-label">LOW</span>
          <span class="risk-desc">低风险 (80+)</span>
        </div>
        <div class="risk-item risk-medium">
          <span class="risk-label">MEDIUM</span>
          <span class="risk-desc">中等风险 (60-80)</span>
        </div>
        <div class="risk-item risk-high">
          <span class="risk-label">HIGH</span>
          <span class="risk-desc">高风险 (40-60)</span>
        </div>
        <div class="risk-item risk-extreme">
          <span class="risk-label">EXTREME</span>
          <span class="risk-desc">极高风险 (<40)</span>
        </div>
      </div>
    </div>

    <div class="note-section">
      <p>⚠️ <strong>重要提示</strong>：</p>
      <ul>
        <li>评分仅供参考，不构成投资建议</li>
        <li>趋势快照为持久化缓存，每日每标的只保留最新快照</li>
        <li>快照可能为空（未生成/未刷新/无数据），需手动触发刷新</li>
        <li>趋势强度为算法打分，不是置信度</li>
        <li>宏观风险与持仓趋势独立分析，不混合信号</li>
        <li>建议结合个人风险承受能力做决策</li>
        <li>注意及时止损，控制仓位</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.guideline-card {
  background: rgba(15, 23, 42, 0.95);
  border-radius: 14px;
  padding: 20px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  margin-top: 24px;
}

.guideline-card h2 {
  margin: 0 0 20px;
  font-size: 1.1rem;
  color: #38bdf8;
  font-weight: 600;
}

.score-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.5);
}

.score-section:last-of-type {
  border-bottom: none;
}

.score-section h3 {
  margin: 0 0 8px;
  font-size: 0.95rem;
  color: #e5e7eb;
  font-weight: 600;
}

.desc {
  margin: 0 0 12px;
  font-size: 0.8rem;
  color: #9ca3af;
  font-style: italic;
}

.score-section ul {
  margin: 0 0 10px;
  padding-left: 20px;
  list-style: none;
}

.score-section ul li {
  margin-bottom: 6px;
  font-size: 0.8rem;
  color: #d1d5db;
  position: relative;
  padding-left: 0;
}

.score-section ul li::before {
  content: "•";
  color: #38bdf8;
  font-weight: bold;
  display: inline-block;
  width: 1em;
  margin-left: -1em;
}

.range {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-weight: 600;
  font-size: 0.75rem;
  margin-right: 6px;
}

.impact {
  margin: 10px 0 0;
  padding: 8px 12px;
  background: rgba(34, 197, 94, 0.1);
  border-left: 3px solid #22c55e;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #a7f3d0;
}

.warning {
  margin: 10px 0 0;
  padding: 8px 12px;
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #fbbf24;
}

.recommendation-section,
.risk-section {
  margin-bottom: 24px;
}

.recommendation-section h3,
.risk-section h3 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #e5e7eb;
  font-weight: 600;
}

.rec-grid,
.risk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.rec-item,
.risk-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid;
  transition: all 0.2s ease;
}

.rec-item:hover,
.risk-item:hover {
  transform: translateY(-2px);
}

.rec-strong-buy {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
}

.rec-buy {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.rec-hold {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.rec-reduce {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}

.rec-sell {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.rec-strong-sell {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

.risk-low {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
}

.risk-medium {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}

.risk-high {
  background: rgba(249, 115, 22, 0.15);
  border-color: rgba(249, 115, 22, 0.4);
}

.risk-extreme {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

.rec-label,
.risk-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #e5e7eb;
}

.rec-desc,
.risk-desc {
  font-size: 0.75rem;
  color: #9ca3af;
}

.note-section {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  padding: 14px;
  margin-top: 24px;
}

.note-section p {
  margin: 0 0 10px;
  font-size: 0.85rem;
  color: #fbbf24;
}

.note-section ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.note-section ul li {
  margin-bottom: 6px;
  font-size: 0.8rem;
  color: #fde68a;
  position: relative;
  padding-left: 0;
}

.note-section ul li::before {
  content: "▸";
  color: #fbbf24;
  font-weight: bold;
  display: inline-block;
  width: 1em;
  margin-left: -1em;
}
</style>
