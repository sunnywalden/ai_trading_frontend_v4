<template>
  <div class="guideline-card">
    <h2>🌍 宏观风险评估说明</h2>
    
    <div class="score-section">
      <h3>五维风险模型</h3>
      <p class="desc">从政治、经济、市场、金融、技术五个维度全面评估系统性风险</p>
    </div>

    <div class="dimension-section">
      <h3>📊 政治风险 (Political Risk)</h3>
      <p class="desc">评估政治不稳定、政策变化、地缘冲突等因素</p>
      <ul>
        <li><strong>政策变化</strong>：货币政策、财政政策、监管政策调整</li>
        <li><strong>地缘冲突</strong>：国际冲突、贸易摩擦、制裁措施</li>
        <li><strong>政治事件</strong>：选举、领导人更迭、政局不稳</li>
        <li><strong>法规监管</strong>：行业监管加强、合规要求提升</li>
      </ul>
      <div class="risk-range">
        <span class="range-item range-low">0-30：低风险</span>
        <span class="range-item range-medium">30-60：中等风险</span>
        <span class="range-item range-high">60-100：高风险</span>
      </div>
    </div>

    <div class="dimension-section">
      <h3>💰 经济风险 (Economic Risk)</h3>
      <p class="desc">评估经济基本面恶化、增长放缓、通胀压力</p>
      <ul>
        <li><strong>经济增长</strong>：GDP增速、失业率、消费者信心</li>
        <li><strong>通胀压力</strong>：CPI、PPI、核心通胀率变化</li>
        <li><strong>利率环境</strong>：央行政策、国债收益率走势</li>
        <li><strong>商业景气</strong>：PMI、零售数据、企业盈利</li>
      </ul>
      <div class="risk-range">
        <span class="range-item range-low">0-30：经济健康</span>
        <span class="range-item range-medium">30-60：温和放缓</span>
        <span class="range-item range-high">60-100：衰退风险</span>
      </div>
    </div>

    <div class="dimension-section">
      <h3>📈 市场风险 (Market Risk)</h3>
      <p class="desc">评估市场波动、流动性、估值泡沫风险</p>
      <ul>
        <li><strong>波动率</strong>：VIX指数、市场恐慌情绪</li>
        <li><strong>估值水平</strong>：市盈率、席勒PE、市净率</li>
        <li><strong>流动性</strong>：交易量、买卖价差、市场深度</li>
        <li><strong>技术面</strong>：趋势强度、超买超卖、支撑阻力</li>
      </ul>
      <div class="risk-range">
        <span class="range-item range-low">0-30：市场稳定</span>
        <span class="range-item range-medium">30-60：波动加大</span>
        <span class="range-item range-high">60-100：极端波动</span>
      </div>
    </div>

    <div class="dimension-section">
      <h3>🏦 金融风险 (Financial Risk)</h3>
      <p class="desc">评估金融系统脆弱性、信用风险、流动性危机</p>
      <ul>
        <li><strong>信用风险</strong>：违约率、信用利差、债券评级</li>
        <li><strong>银行健康</strong>：银行资本充足率、不良贷款率</li>
        <li><strong>流动性</strong>：货币市场利率、回购利率</li>
        <li><strong>杠杆水平</strong>：保证金债务、企业杠杆率</li>
      </ul>
      <div class="risk-range">
        <span class="range-item range-low">0-30：金融稳健</span>
        <span class="range-item range-medium">30-60：压力显现</span>
        <span class="range-item range-high">60-100：系统性风险</span>
      </div>
    </div>

    <div class="dimension-section">
      <h3>🔬 技术风险 (Technical Risk)</h3>
      <p class="desc">评估技术创新、行业颠覆、网络安全风险</p>
      <ul>
        <li><strong>技术颠覆</strong>：新技术对传统行业的冲击</li>
        <li><strong>创新风险</strong>：研发投入、专利布局、竞争力</li>
        <li><strong>网络安全</strong>：数据泄露、黑客攻击、系统故障</li>
        <li><strong>数字化转型</strong>：企业适应能力、技术债务</li>
      </ul>
      <div class="risk-range">
        <span class="range-item range-low">0-30：技术领先</span>
        <span class="range-item range-medium">30-60：需要投入</span>
        <span class="range-item range-high">60-100：颠覆风险</span>
      </div>
    </div>

    <div class="risk-level-section">
      <h3>综合风险等级说明</h3>
      <div class="level-grid">
        <div class="level-item level-low">
          <span class="level-label">LOW RISK</span>
          <span class="level-score">0-30</span>
          <span class="level-desc">环境良好，可积极配置</span>
          <span class="level-action">✓ 可适度加仓</span>
        </div>
        <div class="level-item level-medium">
          <span class="level-label">MEDIUM RISK</span>
          <span class="level-score">30-60</span>
          <span class="level-desc">存在不确定性，谨慎观望</span>
          <span class="level-action">⚠ 保持中性仓位</span>
        </div>
        <div class="level-item level-high">
          <span class="level-label">HIGH RISK</span>
          <span class="level-score">60-80</span>
          <span class="level-desc">风险显著，建议减仓</span>
          <span class="level-action">⚠ 降低仓位，加强对冲</span>
        </div>
        <div class="level-item level-critical">
          <span class="level-label">CRITICAL RISK</span>
          <span class="level-score">80-100</span>
          <span class="level-desc">极高风险，考虑空仓</span>
          <span class="level-action">🚨 大幅减仓或清仓观望</span>
        </div>
      </div>
    </div>

    <div class="strategy-section">
      <h3>风险应对策略</h3>
      <div class="strategy-grid">
        <div class="strategy-item">
          <span class="strategy-title">🛡️ 防御策略</span>
          <ul>
            <li>增加防御性资产（黄金、国债）</li>
            <li>降低高贝塔股票配置</li>
            <li>提高现金比例</li>
          </ul>
        </div>
        <div class="strategy-item">
          <span class="strategy-title">⚖️ 对冲策略</span>
          <ul>
            <li>使用Put期权对冲下跌风险</li>
            <li>反向ETF部分对冲</li>
            <li>行业轮动，避开高风险板块</li>
          </ul>
        </div>
        <div class="strategy-item">
          <span class="strategy-title">🎯 分散策略</span>
          <ul>
            <li>跨资产类别分散（股债平衡）</li>
            <li>跨市场分散（国内外配置）</li>
            <li>跨行业分散（避免集中风险）</li>
          </ul>
        </div>
        <div class="strategy-item">
          <span class="strategy-title">⏰ 时机策略</span>
          <ul>
            <li>关注风险信号，及时调整</li>
            <li>危机时刻保持冷静</li>
            <li>等待风险释放后再入场</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="indicator-section">
      <h3>关键监测指标</h3>
      <div class="indicator-grid">
        <div class="indicator-item">
          <span class="indicator-name">VIX波动率指数</span>
          <span class="indicator-threshold">>30 高风险</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-name">美债收益率曲线</span>
          <span class="indicator-threshold">倒挂=衰退预警</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-name">高收益债利差</span>
          <span class="indicator-threshold">>600bp 信用风险</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-name">美元指数</span>
          <span class="indicator-threshold">强势=风险偏好低</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-name">PMI指数</span>
          <span class="indicator-threshold"><50 经济收缩</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-name">失业率</span>
          <span class="indicator-threshold">快速上升=衰退</span>
        </div>
      </div>
    </div>

    <div class="note-section">
      <p>⚠️ <strong>重要提示</strong>：</p>
      <ul>
        <li>宏观风险评估基于多源数据和AI模型分析</li>
        <li>系统性风险难以预测，建议定期监测</li>
        <li>不同风险维度可能相互影响，需综合判断</li>
        <li>极端事件（黑天鹅）可能突然改变风险格局</li>
        <li>建议结合自身投资期限和风险承受能力调整策略</li>
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
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.5);
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

.dimension-section {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(71, 85, 105, 0.3);
}

.dimension-section h3 {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: #38bdf8;
  font-weight: 600;
}

.dimension-section ul {
  margin: 0 0 12px;
  padding-left: 20px;
  list-style: none;
}

.dimension-section ul li {
  margin-bottom: 6px;
  font-size: 0.8rem;
  color: #d1d5db;
  position: relative;
  padding-left: 0;
}

.dimension-section ul li::before {
  content: "•";
  color: #38bdf8;
  font-weight: bold;
  display: inline-block;
  width: 1em;
  margin-left: -1em;
}

.risk-range {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.range-item {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
}

.range-low {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
  color: #86efac;
}

.range-medium {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fcd34d;
}

.range-high {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.risk-level-section {
  margin-bottom: 24px;
}

.risk-level-section h3 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #e5e7eb;
  font-weight: 600;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.level-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid;
  transition: all 0.2s ease;
}

.level-item:hover {
  transform: translateY(-2px);
}

.level-low {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
}

.level-medium {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}

.level-high {
  background: rgba(249, 115, 22, 0.15);
  border-color: rgba(249, 115, 22, 0.4);
}

.level-critical {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

.level-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #e5e7eb;
}

.level-score {
  font-size: 0.85rem;
  color: #38bdf8;
  font-weight: 600;
}

.level-desc {
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.4;
}

.level-action {
  font-size: 0.75rem;
  color: #d1d5db;
  font-weight: 600;
  margin-top: 4px;
}

.strategy-section {
  margin-bottom: 24px;
}

.strategy-section h3 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #e5e7eb;
  font-weight: 600;
}

.strategy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.strategy-item {
  padding: 14px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.strategy-item:hover {
  background: rgba(99, 102, 241, 0.12);
  transform: translateY(-2px);
}

.strategy-title {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: #c7d2fe;
  margin-bottom: 8px;
}

.strategy-item ul {
  margin: 0;
  padding-left: 16px;
  list-style: none;
}

.strategy-item ul li {
  margin-bottom: 4px;
  font-size: 0.75rem;
  color: #a5b4fc;
  position: relative;
  padding-left: 0;
}

.strategy-item ul li::before {
  content: "▸";
  color: #818cf8;
  font-weight: bold;
  display: inline-block;
  width: 1em;
  margin-left: -1em;
}

.indicator-section {
  margin-bottom: 24px;
}

.indicator-section h3 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #e5e7eb;
  font-weight: 600;
}

.indicator-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.indicator-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.indicator-item:hover {
  background: rgba(56, 189, 248, 0.12);
  transform: translateY(-1px);
}

.indicator-name {
  font-size: 0.8rem;
  color: #7dd3fc;
  font-weight: 600;
}

.indicator-threshold {
  font-size: 0.7rem;
  color: #93c5fd;
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
