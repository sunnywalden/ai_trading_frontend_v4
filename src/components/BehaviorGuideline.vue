<template>
  <div class="guideline-card">
    <h2>🧠 行为评分说明</h2>
    
    <div class="score-section">
      <h3>行为评分 (0-100)</h3>
      <p class="desc">综合评估交易行为的健康度和纪律性</p>
      <div class="tier-grid">
        <div class="tier-item tier-t1">
          <span class="tier-label">T1 优秀</span>
          <span class="tier-range">85-100</span>
          <span class="tier-desc">纪律性强，执行力佳</span>
        </div>
        <div class="tier-item tier-t2">
          <span class="tier-label">T2 良好</span>
          <span class="tier-range">65-84</span>
          <span class="tier-desc">基本合规，可持续改进</span>
        </div>
        <div class="tier-item tier-t3">
          <span class="tier-label">T3 警惕</span>
          <span class="tier-range">40-64</span>
          <span class="tier-desc">存在风险，需要调整</span>
        </div>
        <div class="tier-item tier-t4">
          <span class="tier-label">T4 危险</span>
          <span class="tier-range">0-39</span>
          <span class="tier-desc">严重偏离，立即改善</span>
        </div>
      </div>
    </div>

    <div class="score-section">
      <h3>蝇营狗苟评分 (Sell-Fly Score)</h3>
      <p class="desc">评估短期波动操作和追涨杀跌行为</p>
      <ul>
        <li><span class="range">80+</span> 极少追涨杀跌，心态稳定</li>
        <li><span class="range">60-79</span> 偶有追高，整体可控</li>
        <li><span class="range">40-59</span> 频繁短炒，风险增加</li>
        <li><span class="range">0-39</span> 追涨杀跌严重，易亏损</li>
      </ul>
      <p class="impact">💡 分数越高，操作越理性，避免频繁短炒</p>
      <div class="behavior-example">
        <strong>典型表现：</strong>
        <ul>
          <li>看到股票大涨就追高买入</li>
          <li>股价回调时恐慌性卖出</li>
          <li>一天内多次买卖同一标的</li>
          <li>FOMO（错失恐惧）驱动的交易</li>
        </ul>
      </div>
    </div>

    <div class="score-section">
      <h3>过度交易评分 (Overtrading Score)</h3>
      <p class="desc">评估交易频率和仓位管理的合理性</p>
      <ul>
        <li><span class="range">80+</span> 交易节制，不过度频繁</li>
        <li><span class="range">60-79</span> 偶有频繁，需注意成本</li>
        <li><span class="range">40-59</span> 交易过度，成本侵蚀利润</li>
        <li><span class="range">0-39</span> 严重过度交易，高风险</li>
      </ul>
      <p class="impact">💡 分数越高，交易越克制，手续费成本越低</p>
      <div class="behavior-example">
        <strong>典型表现：</strong>
        <ul>
          <li>每天交易次数过多（>5次）</li>
          <li>频繁切换持仓标的</li>
          <li>无明确策略的随机交易</li>
          <li>手续费占比过高（>2%）</li>
        </ul>
      </div>
    </div>

    <div class="score-section">
      <h3>报复性交易评分 (Revenge Trading Score)</h3>
      <p class="desc">评估亏损后的情绪化交易行为</p>
      <ul>
        <li><span class="range">80+</span> 亏损后冷静应对，不急于翻本</li>
        <li><span class="range">60-79</span> 偶有冲动，但能自控</li>
        <li><span class="range">40-59</span> 亏损后易冲动，风险加大</li>
        <li><span class="range">0-39</span> 严重报复性交易，恶性循环</li>
      </ul>
      <p class="impact">💡 分数越高，情绪管理越好，避免亏损扩大</p>
      <div class="behavior-example">
        <strong>典型表现：</strong>
        <ul>
          <li>亏损后立即加仓试图翻本</li>
          <li>连续亏损后重仓单个标的</li>
          <li>情绪化下单，不遵守止损</li>
          <li>连续亏损导致仓位失控</li>
        </ul>
      </div>
    </div>

    <div class="greeks-section">
      <h3>希腊字母指标说明</h3>
      <div class="greek-grid">
        <div class="greek-item">
          <span class="greek-symbol">Delta (Δ)</span>
          <span class="greek-desc">标的价格变动1单位，期权价格变动量</span>
        </div>
        <div class="greek-item">
          <span class="greek-symbol">Gamma (Γ)</span>
          <span class="greek-desc">标的价格变动1单位，Delta的变化量</span>
        </div>
        <div class="greek-item">
          <span class="greek-symbol">Theta (Θ)</span>
          <span class="greek-desc">时间流逝1天，期权价值的衰减量</span>
        </div>
        <div class="greek-item">
          <span class="greek-symbol">Vega (V)</span>
          <span class="greek-desc">波动率变化1%，期权价格变动量</span>
        </div>
      </div>
      <p class="greek-note">💡 希腊值的"水位"代表风险敞口大小，越高表示该维度风险越大</p>
    </div>

    <div class="action-section">
      <h3>操作建议</h3>
      <div class="action-grid">
        <div class="action-item action-excellent">
          <span class="action-label">85+分</span>
          <span class="action-text">保持良好习惯，可适度增加仓位</span>
        </div>
        <div class="action-item action-good">
          <span class="action-label">65-84分</span>
          <span class="action-text">继续保持，注意小问题的改善</span>
        </div>
        <div class="action-item action-warning">
          <span class="action-label">40-64分</span>
          <span class="action-text">警惕信号，调整交易策略</span>
        </div>
        <div class="action-item action-danger">
          <span class="action-label"><40分</span>
          <span class="action-text">立即停止交易，重新审视策略</span>
        </div>
      </div>
    </div>

    <div class="note-section">
      <p>⚠️ <strong>重要提示</strong>：</p>
      <ul>
        <li>行为评分基于历史交易数据，反映您的交易习惯</li>
        <li>低分不代表技术不行，而是行为需要改善</li>
        <li>建议定期回顾评分，持续优化交易行为</li>
        <li>情绪管理是交易成功的关键，保持冷静和纪律</li>
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

.tier-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.tier-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid;
  transition: all 0.2s ease;
}

.tier-item:hover {
  transform: translateY(-2px);
}

.tier-t1 {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
}

.tier-t2 {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.tier-t3 {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}

.tier-t4 {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

.tier-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #e5e7eb;
}

.tier-range {
  font-size: 0.75rem;
  color: #38bdf8;
  font-weight: 600;
}

.tier-desc {
  font-size: 0.75rem;
  color: #9ca3af;
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

.behavior-example {
  margin-top: 12px;
  padding: 12px;
  background: rgba(99, 102, 241, 0.08);
  border-left: 3px solid #818cf8;
  border-radius: 4px;
}

.behavior-example strong {
  display: block;
  margin-bottom: 8px;
  font-size: 0.8rem;
  color: #c7d2fe;
}

.behavior-example ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.behavior-example ul li {
  margin-bottom: 4px;
  font-size: 0.75rem;
  color: #a5b4fc;
  position: relative;
  padding-left: 0;
}

.behavior-example ul li::before {
  content: "▸";
  color: #818cf8;
  font-weight: bold;
  display: inline-block;
  width: 1em;
  margin-left: -1em;
}

.greeks-section {
  margin-bottom: 24px;
}

.greeks-section h3 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #e5e7eb;
  font-weight: 600;
}

.greek-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.greek-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.greek-item:hover {
  background: rgba(99, 102, 241, 0.12);
  transform: translateY(-2px);
}

.greek-symbol {
  font-size: 0.9rem;
  font-weight: 700;
  color: #c7d2fe;
}

.greek-desc {
  font-size: 0.75rem;
  color: #a5b4fc;
  line-height: 1.4;
}

.greek-note {
  margin: 12px 0 0;
  padding: 10px;
  background: rgba(56, 189, 248, 0.1);
  border-left: 3px solid #38bdf8;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #7dd3fc;
}

.action-section {
  margin-bottom: 24px;
}

.action-section h3 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #e5e7eb;
  font-weight: 600;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.action-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid;
  transition: all 0.2s ease;
}

.action-item:hover {
  transform: translateY(-2px);
}

.action-excellent {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
}

.action-good {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.action-warning {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}

.action-danger {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

.action-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #e5e7eb;
}

.action-text {
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.4;
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
