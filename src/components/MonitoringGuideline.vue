<template>
  <div class="monitoring-guideline">
    <h2 class="main-title">📡 API监控说明</h2>
    
    <div class="guideline-grid">
      <!-- 监控概述 -->
      <div class="guideline-card">
        <h3>📊 监控概述</h3>
        <p>系统自动跟踪所有外部API的调用情况，包括：</p>
        <ul>
          <li><strong>FRED API</strong> - 宏观经济数据（联邦储备经济数据）</li>
          <li><strong>News API</strong> - 地缘政治新闻与市场情绪</li>
          <li><strong>Tiger API</strong> - 行情数据（免费延迟行情）</li>
          <li><strong>Yahoo Finance</strong> - 备用行情数据源</li>
          <li><strong>OpenAI API</strong> - AI决策助手与文本分析</li>
        </ul>
        <p>每次API调用都会记录：调用次数、成功/失败次数、响应时间、错误详情</p>
      </div>
      
      <!-- Rate Limit策略表 -->
      <div class="guideline-card">
        <h3>⚙️ Rate Limit策略（截至2026年1月）</h3>
        <div class="table-wrapper">
          <table class="policy-table">
            <thead>
              <tr>
                <th>API</th>
                <th>日限制</th>
                <th>小时限制</th>
                <th>分钟限制</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>FRED</strong></td>
                <td>120,000</td>
                <td>-</td>
                <td>-</td>
                <td>建议控制在合理范围</td>
              </tr>
              <tr>
                <td><strong>News API</strong></td>
                <td>100</td>
                <td>-</td>
                <td>-</td>
                <td>免费版限制</td>
              </tr>
              <tr>
                <td><strong>Tiger</strong></td>
                <td>-</td>
                <td>3,600</td>
                <td>60</td>
                <td>约1请求/秒</td>
              </tr>
              <tr>
                <td><strong>Yahoo Finance</strong></td>
                <td>2,000</td>
                <td>100</td>
                <td>5</td>
                <td>非官方API，避免被限</td>
              </tr>
              <tr>
                <td><strong>OpenAI</strong></td>
                <td>-</td>
                <td>-</td>
                <td>3</td>
                <td>取决于订阅级别</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 告警阈值说明 -->
      <div class="guideline-card">
        <h3>🚨 告警阈值说明</h3>
        <div class="threshold-items">
          <div class="threshold-item normal">
            <div class="threshold-badge">🟢 NORMAL (正常)</div>
            <p><strong>使用率 &lt; 70%</strong></p>
            <p>运行正常，可以正常调用API</p>
          </div>
          <div class="threshold-item warning">
            <div class="threshold-badge">🟡 WARNING (警告)</div>
            <p><strong>使用率 70% - 90%</strong></p>
            <p>达到日配额的70%时发出警告，建议减少调用频率，优先使用缓存数据</p>
          </div>
          <div class="threshold-item critical">
            <div class="threshold-badge">🔴 CRITICAL (临界)</div>
            <p><strong>使用率 &gt; 90%</strong></p>
            <p>达到日配额的90%时标记为临界状态，立即停止非必要调用，等待额度重置</p>
          </div>
        </div>
      </div>
      
      <!-- 缓存策略说明 -->
      <div class="guideline-card">
        <h3>💾 缓存策略说明</h3>
        <p>所有外部API数据都通过Redis缓存，减少重复调用：</p>
        <ul>
          <li><strong>宏观指标</strong>：6-24小时缓存（FRED API）</li>
          <li><strong>地缘政治事件</strong>：4-24小时缓存（News API）</li>
          <li><strong>市场数据</strong>：5分钟-1小时缓存（Tiger/Yahoo Finance）</li>
          <li><strong>AI决策</strong>：按需调用，无固定缓存（OpenAI）</li>
        </ul>
        <p class="note">💡 跨进程共享：Redis缓存在多实例环境下减少重复调用</p>
      </div>
      
      <!-- 最佳实践建议 -->
      <div class="guideline-card">
        <h3>✅ 最佳实践建议</h3>
        <ul class="best-practices">
          <li>✅ <strong>定期查看监控报告</strong>：每天检查一次监控页面</li>
          <li>✅ <strong>合理设置缓存时长</strong>：根据数据更新频率调整TTL</li>
          <li>✅ <strong>及时响应告警</strong>：收到WARNING时调整调用策略</li>
          <li>✅ <strong>使用Redis缓存</strong>：确保Redis服务正常运行</li>
          <li>✅ <strong>避免频繁强制刷新</strong>：尽量使用缓存数据</li>
          <li>⚠️ <strong>注意非官方API</strong>：Yahoo Finance为非官方API，更容易被限</li>
          <li>⚠️ <strong>OpenAI成本控制</strong>：OpenAI按Token计费，注意控制调用</li>
        </ul>
      </div>
      
      <!-- 故障排查指南 -->
      <div class="guideline-card">
        <h3>🔧 故障排查指南</h3>
        <div class="troubleshooting">
          <div class="trouble-item">
            <h4>问题：API调用被拒绝</h4>
            <ul>
              <li>检查Rate Limit状态卡片</li>
              <li>查看是否有临界告警</li>
              <li>确认是否达到限额</li>
            </ul>
          </div>
          <div class="trouble-item">
            <h4>问题：监控数据不更新</h4>
            <ul>
              <li>检查监控服务健康状态</li>
              <li>确认Redis连接正常</li>
              <li>查看最后更新时间</li>
            </ul>
          </div>
          <div class="trouble-item">
            <h4>问题：缓存未生效</h4>
            <ul>
              <li>确认Redis服务运行中</li>
              <li>检查环境变量 <code>REDIS_ENABLED=true</code></li>
              <li>查看后端日志是否有"Using Redis cache"字样</li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- 额度重置时间 -->
      <div class="guideline-card">
        <h3>🕐 额度重置时间</h3>
        <ul>
          <li><strong>日限额</strong>：UTC午夜重置（北京时间早上8点）</li>
          <li><strong>小时限额</strong>：每小时整点重置</li>
          <li><strong>分钟限额</strong>：每分钟开始时重置</li>
        </ul>
        <p class="note">⚠️ 注意：重启服务会清空Redis计数器（设计如此，避免累积过期数据）</p>
      </div>
      
      <!-- 错误类型说明 -->
      <div class="guideline-card">
        <h3>❌ 常见错误类型</h3>
        <div class="error-types">
          <div class="error-type">
            <h4>Rate Limit Exceeded</h4>
            <p><strong>原因</strong>：超过API限额</p>
            <p><strong>处理</strong>：等待额度重置（通常为UTC午夜或小时/分钟刷新）</p>
          </div>
          <div class="error-type">
            <h4>Connection Timeout</h4>
            <p><strong>原因</strong>：连接超时</p>
            <p><strong>处理</strong>：检查网络连接，稍后重试</p>
          </div>
          <div class="error-type">
            <h4>Authentication Failed</h4>
            <p><strong>原因</strong>：认证失败</p>
            <p><strong>处理</strong>：检查API密钥配置</p>
          </div>
          <div class="error-type">
            <h4>Service Unavailable</h4>
            <p><strong>原因</strong>：服务不可用</p>
            <p><strong>处理</strong>：外部API服务暂时故障，使用备用数据源</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 无需额外逻辑
</script>

<style scoped>
.monitoring-guideline {
  padding: 20px 0;
}

.main-title {
  margin: 0 0 24px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #e5e7eb;
  text-align: center;
}

.guideline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 20px;
}

.guideline-card {
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(55, 65, 81, 0.8);
  border-radius: 12px;
  padding: 24px;
}

.guideline-card h3 {
  margin: 0 0 16px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #38bdf8;
}

.guideline-card h4 {
  margin: 12px 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #e5e7eb;
}

.guideline-card p {
  margin: 8px 0;
  font-size: 0.9rem;
  color: #d1d5db;
  line-height: 1.6;
}

.guideline-card ul {
  margin: 8px 0;
  padding-left: 24px;
}

.guideline-card li {
  margin: 6px 0;
  font-size: 0.9rem;
  color: #d1d5db;
  line-height: 1.6;
}

.note {
  padding: 12px;
  background: rgba(56, 189, 248, 0.1);
  border-left: 3px solid #38bdf8;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #38bdf8;
}

.table-wrapper {
  overflow-x: auto;
  margin: 12px 0;
}

.policy-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.policy-table thead {
  background: rgba(31, 41, 55, 0.8);
}

.policy-table th,
.policy-table td {
  padding: 10px 12px;
  text-align: left;
  border: 1px solid rgba(55, 65, 81, 0.8);
}

.policy-table th {
  font-weight: 600;
  color: #9ca3af;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.policy-table td {
  color: #d1d5db;
}

.threshold-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 12px 0;
}

.threshold-item {
  padding: 16px;
  border-radius: 10px;
  border: 1px solid;
}

.threshold-item.normal {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.threshold-item.warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.threshold-item.critical {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.threshold-badge {
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.threshold-item.normal .threshold-badge {
  color: #22c55e;
}

.threshold-item.warning .threshold-badge {
  color: #f59e0b;
}

.threshold-item.critical .threshold-badge {
  color: #ef4444;
}

.threshold-item p {
  margin: 4px 0;
  font-size: 0.85rem;
}

.best-practices li {
  margin: 10px 0;
}

.troubleshooting {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trouble-item {
  padding: 14px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.trouble-item ul {
  margin: 8px 0 0;
}

.error-types {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-type {
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.error-type h4 {
  margin: 0 0 8px;
  color: #ef4444;
}

.error-type p {
  margin: 4px 0;
  font-size: 0.85rem;
}

code {
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  color: #38bdf8;
}

@media (max-width: 900px) {
  .guideline-grid {
    grid-template-columns: 1fr;
  }
}
</style>
