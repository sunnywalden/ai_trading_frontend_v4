<template>
  <div class="guideline-card">
    <h2>📊 评分标准说明</h2>
    
    <div class="score-section">
      <h3>行为评分 (0-100)</h3>
      <p class="desc">综合行为指标，评估交易行为的理性程度</p>
      <ul>
        <li><span class="range">0-30</span> 极度理性，严格遵守纪律</li>
        <li><span class="range">31-60</span> 较为理性，偶有情绪波动</li>
        <li><span class="range">61-80</span> 较为躁动，频繁情绪化交易</li>
        <li><span class="range">81-100</span> 高度躁动，风险控制失效</li>
      </ul>
      <p class="impact">📈 分数越高 → ShockPolicy / EarningsPolicy 越保守</p>
    </div>

    <div class="score-section">
      <h3>卖飞评分 (0-100)</h3>
      <p class="desc">评估提前获利了结导致的机会成本损失</p>
      <ul>
        <li><span class="range">0-20</span> 极少卖飞，持仓稳定</li>
        <li><span class="range">21-50</span> 偶有卖飞，影响较小</li>
        <li><span class="range">51-80</span> 频繁卖飞，损失较多潜在收益</li>
        <li><span class="range">81-100</span> 严重卖飞，机会成本巨大</li>
      </ul>
      <p class="impact">💡 通过"卖飞成本占比"和"卖飞次数"综合计算</p>
    </div>

    <div class="score-section">
      <h3>过度交易 (0-100)</h3>
      <p class="desc">交易频率与合理水平的偏离程度</p>
      <ul>
        <li><span class="range">0-25</span> 交易频率正常</li>
        <li><span class="range">26-60</span> 交易较为频繁</li>
        <li><span class="range">61-85</span> 明显过度交易</li>
        <li><span class="range">86-100</span> 极度频繁，交易成本高企</li>
      </ul>
      <p class="impact">⚡ 根据"过度交易指数"计算，指数 > 1.5 视为过度</p>
    </div>

    <div class="score-section">
      <h3>报复性交易 (0-100)</h3>
      <p class="desc">亏损后立即加仓的情绪化交易行为</p>
      <ul>
        <li><span class="range">0-20</span> 无报复性交易</li>
        <li><span class="range">21-50</span> 偶有情绪化加仓</li>
        <li><span class="range">51-80</span> 频繁报复性交易</li>
        <li><span class="range">81-100</span> 严重失控，连续情绪化加仓</li>
      </ul>
      <p class="impact">🔥 基于"报复性交易次数"计算，次数越多分数越高</p>
    </div>

    <div class="tier-section">
      <h3>风险等级 (Tier)</h3>
      <div class="tier-grid">
        <div class="tier-item tier-t1">
          <span class="tier-label">T1</span>
          <span class="tier-desc">核心标的，流动性好</span>
        </div>
        <div class="tier-item tier-t2">
          <span class="tier-label">T2</span>
          <span class="tier-desc">主流标的，风险可控</span>
        </div>
        <div class="tier-item tier-t3">
          <span class="tier-label">T3</span>
          <span class="tier-desc">边缘标的，波动较大</span>
        </div>
        <div class="tier-item tier-t4">
          <span class="tier-label">T4</span>
          <span class="tier-desc">高风险标的，谨慎交易</span>
        </div>
      </div>
    </div>

    <div class="note-section">
      <p>⚠️ <strong>决策影响</strong>：行为评分越高，自动对冲引擎会：</p>
      <ul>
        <li>减少裸暴露（Delta 对冲更积极）</li>
        <li>增加保护性对冲（买入 Put 保护）</li>
        <li>收紧震荡政策（ShockPolicy）</li>
        <li>提高财报政策保守度（EarningsPolicy）</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.guideline-card {
  background: rgba(15, 23, 42, 0.95);
  border-radius: 14px;
  padding: 18px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.guideline-card h2 {
  margin: 0 0 16px;
  font-size: 1rem;
  color: #38bdf8;
}

.score-section {
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.5);
}

.score-section:last-of-type {
  border-bottom: none;
}

.score-section h3 {
  margin: 0 0 6px;
  font-size: 0.9rem;
  color: #e5e7eb;
}

.desc {
  margin: 0 0 10px;
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.4;
}

.score-section ul {
  margin: 0 0 8px;
  padding-left: 20px;
  font-size: 0.78rem;
  color: #d1d5db;
  line-height: 1.6;
}

.score-section ul li {
  margin-bottom: 4px;
}

.range {
  display: inline-block;
  padding: 1px 6px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  font-weight: 600;
  color: #60a5fa;
  font-size: 0.72rem;
  min-width: 48px;
  text-align: center;
}

.impact {
  margin: 8px 0 0;
  padding: 6px 10px;
  background: rgba(34, 197, 94, 0.15);
  border-left: 3px solid #22c55e;
  font-size: 0.75rem;
  color: #86efac;
  border-radius: 4px;
  line-height: 1.5;
}

.tier-section {
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.5);
}

.tier-section h3 {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: #e5e7eb;
}

.tier-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.tier-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(55, 65, 81, 0.6);
}

.tier-item.tier-t1 {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.4);
}

.tier-item.tier-t2 {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.4);
}

.tier-item.tier-t3 {
  background: rgba(251, 191, 36, 0.12);
  border-color: rgba(251, 191, 36, 0.4);
}

.tier-item.tier-t4 {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.4);
}

.tier-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #e5e7eb;
}

.tier-desc {
  font-size: 0.7rem;
  color: #9ca3af;
}

.note-section {
  padding: 12px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.note-section p {
  margin: 0 0 8px;
  font-size: 0.78rem;
  color: #fbbf24;
  line-height: 1.5;
}

.note-section ul {
  margin: 0;
  padding-left: 20px;
  font-size: 0.75rem;
  color: #fde68a;
  line-height: 1.6;
}

.note-section ul li {
  margin-bottom: 4px;
}

/* 滚动条样式 */
.guideline-card::-webkit-scrollbar {
  width: 6px;
}

.guideline-card::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 3px;
}

.guideline-card::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.3);
  border-radius: 3px;
}

.guideline-card::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.5);
}
</style>
