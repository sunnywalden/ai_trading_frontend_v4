<template>
  <div class="guideline-container">
    <h3 class="guideline-title">📖 机会发现说明</h3>
    
    <div class="guideline-grid">
      <!-- 策略执行机制 -->
      <div class="guideline-section">
        <h4>⚙️ 策略执行机制</h4>
        <ul class="guideline-list">
          <li>
            <strong>自选股票池:</strong> 运行策略时可自由选择目标股票池（美股科技、香港蓝筹等）
          </li>
          <li>
            <strong>异步执行:</strong> 策略任务提交后会在后台异步运行，可以随时离开页面或查看历史记录
          </li>
          <li>
            <strong>参数定制:</strong> 支持二次输入最低评分阈值及最多展示结果个数，满足不同风险偏好
          </li>
          <li>
            <strong>实时监控:</strong> 支持实时查看策略执行状态、进度及最终命中的资产详情
          </li>
          <li>
            <strong>结果导出:</strong> 策略执行完成后可导出详细的分析报告。
          </li>
        </ul>
      </div>

      <!-- 三维评分 -->
      <div class="guideline-section">
        <h4>📊 三维评分体系</h4>
        <div class="score-dimensions">
          <div class="dimension-item">
            <span class="dimension-icon">📈</span>
            <div class="dimension-detail">
              <strong>技术面 (0-100)</strong>
              <p>MA 趋势、MACD 动量、RSI 超卖、布林通道、成交量等技术指标综合评估</p>
            </div>
          </div>
          
          <div class="dimension-item">
            <span class="dimension-icon">💼</span>
            <div class="dimension-detail">
              <strong>基本面 (0-100)</strong>
              <p>市盈率、市净率、ROE、营收增长率、毛利率、负债率等财务健康度评估</p>
            </div>
          </div>
          
          <div class="dimension-item">
            <span class="dimension-icon">🌡️</span>
            <div class="dimension-detail">
              <strong>情绪面 (0-100)</strong>
              <p>社交媒体热度、新闻情绪、看涨期权活跃度、做空比率等市场情绪指标</p>
            </div>
          </div>
        </div>
        <p class="dimension-formula">
          <strong>综合评分 =</strong> 技术面 × 40% + 基本面 × 35% + 情绪面 × 25%
        </p>
      </div>

      <!-- 宏观风险联动 -->
      <div class="guideline-section">
        <h4>🌍 宏观风险联动</h4>
        <table class="macro-link-table">
          <thead>
            <tr>
              <th>宏观风险等级</th>
              <th>筛选阈值</th>
              <th>策略调整</th>
            </tr>
          </thead>
          <tbody>
            <tr class="risk-low">
              <td>LOW / MEDIUM</td>
              <td>≥ 75 分</td>
              <td>常规筛选，推荐 1-3 个机会</td>
            </tr>
            <tr class="risk-high">
              <td>HIGH</td>
              <td>≥ 80 分</td>
              <td>提高阈值，优先防御性标的</td>
            </tr>
            <tr class="risk-extreme">
              <td>EXTREME</td>
              <td>≥ 85 分</td>
              <td>严格筛选，可能无推荐</td>
            </tr>
          </tbody>
        </table>
        <p class="macro-hint">
          💡 宏观风险偏高时，系统自动提高筛选门槛，降低激进建仓风险
        </p>
      </div>

      <!-- 推荐等级 -->
      <div class="guideline-section">
        <h4>🎯 推荐等级</h4>
        <div class="recommendation-levels">
          <div class="level-item level-strong-buy">
            <span class="level-badge">强力建仓</span>
            <span class="level-score">90-100分</span>
            <p>三维评分均优秀，宏观环境友好，建议积极建仓</p>
          </div>
          
          <div class="level-item level-buy">
            <span class="level-badge">建议建仓</span>
            <span class="level-score">80-89分</span>
            <p>综合评分良好，可适度建仓，关注风险控制</p>
          </div>
          
          <div class="level-item level-hold">
            <span class="level-badge">持有观望</span>
            <span class="level-score">70-79分</span>
            <p>部分指标欠佳，建议观望或仓位控制在 10% 以下</p>
          </div>
          
          <div class="level-item level-no-recommend">
            <span class="level-badge">不推荐</span>
            <span class="level-score">&lt; 70分</span>
            <p>不符合筛选条件，不会出现在机会列表中</p>
          </div>
        </div>
      </div>

      <!-- 数据来源 -->
      <div class="guideline-section">
        <h4>🗂️ 数据来源与更新</h4>
        <ul class="guideline-list">
          <li>
            <strong>技术数据:</strong> Yahoo Finance、Alpha Vantage，实时/延迟 15 分钟
          </li>
          <li>
            <strong>基本面数据:</strong> Financial Modeling Prep、IEX Cloud，季度更新
          </li>
          <li>
            <strong>情绪数据:</strong> StockTwits、Reddit、Twitter API，小时级更新
          </li>
          <li>
            <strong>兜底机制:</strong> 数据源限流时，使用本地维护的静态股票池（结果偏保守）
          </li>
        </ul>
      </div>

      <!-- 使用建议 -->
      <div class="guideline-section">
        <h4>💡 使用建议</h4>
        <ul class="guideline-list highlight-tips">
          <li>
            <strong>日常使用:</strong> 系统每日 20:30 自动扫描并生成推荐，次日查看即可，无需手动触发
          </li>
          <li>
            <strong>实时扫描:</strong> 如需获取最新数据，可点击「立即扫描」手动触发（注意耗时较长）
          </li>
          <li>
            <strong>重要事件:</strong> 重大财报、政策发布后，可强制刷新获取最新评估
          </li>
          <li>
            <strong>风险控制:</strong> 宏观风险 HIGH/EXTREME 时，即使有推荐也应降低仓位
          </li>
          <li>
            <strong>历史回溯:</strong> 查看历史扫描记录，分析推荐准确率和市场变化趋势
          </li>
          <li>
            <strong>分散投资:</strong> 不要仅依赖单一机会，结合持仓评估模块综合决策
          </li>
        </ul>
      </div>
    </div>

    <div class="disclaimer">
      ⚠️ <strong>风险提示:</strong> 本模块仅提供决策参考，不构成投资建议。所有投资决策需自行承担风险，建议结合宏观风险、持仓状况和个人风险承受能力综合判断。
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.guideline-container {
  margin-top: 40px;
  padding: 24px 28px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
}

.guideline-title {
  margin: 0 0 24px 0;
  font-size: 1.4rem;
  color: #38bdf8;
  text-align: center;
}

.guideline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 24px;
}

.guideline-section {
  padding: 18px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 10px;
}

.guideline-section h4 {
  margin: 0 0 14px 0;
  font-size: 1rem;
  color: #e5e7eb;
}

.guideline-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.guideline-list li {
  position: relative;
  margin-bottom: 10px;
  padding-left: 12px;
  font-size: 0.85rem;
  color: #d1d5db;
  line-height: 1.6;
}

.guideline-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #38bdf8;
  font-weight: bold;
}

.guideline-list li strong {
  color: #38bdf8;
}

.score-dimensions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.dimension-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.dimension-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.dimension-detail {
  flex: 1;
}

.dimension-detail strong {
  display: block;
  margin-bottom: 4px;
  font-size: 0.9rem;
  color: #e5e7eb;
}

.dimension-detail p {
  margin: 0;
  font-size: 0.8rem;
  color: #9ca3af;
  line-height: 1.5;
}

.dimension-formula {
  margin: 16px 0 0;
  padding: 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  font-size: 0.85rem;
  color: #93c5fd;
  text-align: center;
}

.macro-link-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}

.macro-link-table th {
  padding: 10px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(55, 65, 81, 0.6);
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 600;
  text-align: left;
}

.macro-link-table td {
  padding: 10px;
  border: 1px solid rgba(55, 65, 81, 0.6);
  font-size: 0.8rem;
  color: #d1d5db;
}

.macro-link-table tr.risk-low {
  background: rgba(34, 197, 94, 0.05);
}

.macro-link-table tr.risk-high {
  background: rgba(249, 115, 22, 0.05);
}

.macro-link-table tr.risk-extreme {
  background: rgba(239, 68, 68, 0.05);
}

.macro-hint {
  margin: 12px 0 0;
  padding: 10px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
  font-size: 0.8rem;
  color: #fbbf24;
}

.recommendation-levels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.level-item {
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.level-item.level-strong-buy {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.level-item.level-buy {
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.level-item.level-hold {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.level-item.level-no-recommend {
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.level-badge {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e5e7eb;
}

.level-score {
  font-size: 0.75rem;
  color: #9ca3af;
}

.level-item p {
  margin: 0;
  font-size: 0.8rem;
  color: #d1d5db;
  line-height: 1.5;
}

.highlight-tips li {
  background: rgba(56, 189, 248, 0.05);
  padding: 10px 10px 10px 22px;
  border-radius: 6px;
  border-left: 3px solid rgba(56, 189, 248, 0.5);
}

.disclaimer {
  margin-top: 24px;
  padding: 14px 18px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  font-size: 0.85rem;
  color: #fca5a5;
  text-align: center;
  line-height: 1.6;
}

.disclaimer strong {
  color: #fef2f2;
}

@media (max-width: 1200px) {
  .guideline-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
