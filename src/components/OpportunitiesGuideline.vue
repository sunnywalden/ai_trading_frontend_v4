<template>
  <div class="guideline-container">
    <h3 class="guideline-title">{{ t('opportunities_guideline.title') }}</h3>
    
    <div class="guideline-grid">
      <!-- 策略执行机制 -->
      <div class="guideline-section">
        <h4>{{ t('opportunities_guideline.mechanism.title') }}</h4>
        <ul class="guideline-list">
          <li>
            <strong>{{ t('opportunities_guideline.mechanism.pool').split(':')[0] }}:</strong> {{ t('opportunities_guideline.mechanism.pool').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.mechanism.async').split(':')[0] }}:</strong> {{ t('opportunities_guideline.mechanism.async').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.mechanism.custom').split(':')[0] }}:</strong> {{ t('opportunities_guideline.mechanism.custom').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.mechanism.monitor').split(':')[0] }}:</strong> {{ t('opportunities_guideline.mechanism.monitor').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.mechanism.export').split(':')[0] }}:</strong> {{ t('opportunities_guideline.mechanism.export').split(':')[1] }}
          </li>
        </ul>
      </div>

      <!-- 三维评分 -->
      <div class="guideline-section">
        <h4>{{ t('opportunities_guideline.score.title') }}</h4>
        <div class="score-dimensions">
          <div class="dimension-item">
            <span class="dimension-icon">📈</span>
            <div class="dimension-detail">
              <strong>{{ t('opportunities_guideline.score.tech') }}</strong>
              <p>{{ t('opportunities_guideline.score.tech_desc') }}</p>
            </div>
          </div>
          
          <div class="dimension-item">
            <span class="dimension-icon">💼</span>
            <div class="dimension-detail">
              <strong>{{ t('opportunities_guideline.score.fund') }}</strong>
              <p>{{ t('opportunities_guideline.score.fund_desc') }}</p>
            </div>
          </div>
          
          <div class="dimension-item">
            <span class="dimension-icon">🌡️</span>
            <div class="dimension-detail">
              <strong>{{ t('opportunities_guideline.score.sent') }}</strong>
              <p>{{ t('opportunities_guideline.score.sent_desc') }}</p>
            </div>
          </div>
        </div>
        <p class="dimension-formula" v-html="t('opportunities_guideline.score.formula', {
          tech: '<strong>' + t('opportunities_guideline.score.tech') + '</strong>',
          fund: '<strong>' + t('opportunities_guideline.score.fund') + '</strong>',
          sent: '<strong>' + t('opportunities_guideline.score.sent') + '</strong>'
        })"></p>
      </div>

      <!-- 宏观风险联动 -->
      <div class="guideline-section">
        <h4>{{ t('opportunities_guideline.macro.title') }}</h4>
        <table class="macro-link-table">
          <thead>
            <tr>
              <th>{{ t('opportunities_guideline.macro.th_level') }}</th>
              <th>{{ t('opportunities_guideline.macro.th_threshold') }}</th>
              <th>{{ t('opportunities_guideline.macro.th_adj') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr class="risk-low">
              <td>LOW / MEDIUM</td>
              <td>≥ 75</td>
              <td>{{ t('opportunities_guideline.macro.low_med') }}</td>
            </tr>
            <tr class="risk-high">
              <td>HIGH</td>
              <td>≥ 80</td>
              <td>{{ t('opportunities_guideline.macro.high') }}</td>
            </tr>
            <tr class="risk-extreme">
              <td>EXTREME</td>
              <td>≥ 85</td>
              <td>{{ t('opportunities_guideline.macro.extreme') }}</td>
            </tr>
          </tbody>
        </table>
        <p class="macro-hint">
          {{ t('opportunities_guideline.macro.hint') }}
        </p>
      </div>

      <!-- 推荐等级 -->
      <div class="guideline-section">
        <h4>{{ t('opportunities_guideline.recommend.title') }}</h4>
        <div class="recommendation-levels">
          <div class="level-item level-strong-buy">
            <span class="level-badge">{{ t('opportunities_guideline.recommend.strong_buy') }}</span>
            <span class="level-score">90-100</span>
            <p>{{ t('opportunities_guideline.recommend.strong_buy_desc') }}</p>
          </div>
          
          <div class="level-item level-buy">
            <span class="level-badge">{{ t('opportunities_guideline.recommend.buy') }}</span>
            <span class="level-score">80-89</span>
            <p>{{ t('opportunities_guideline.recommend.buy_desc') }}</p>
          </div>
          
          <div class="level-item level-hold">
            <span class="level-badge">{{ t('opportunities_guideline.recommend.hold') }}</span>
            <span class="level-score">70-79</span>
            <p>{{ t('opportunities_guideline.recommend.hold_desc') }}</p>
          </div>
          
          <div class="level-item level-no-recommend">
            <span class="level-badge">{{ t('opportunities_guideline.recommend.no_recommend') }}</span>
            <span class="level-score">&lt; 70</span>
            <p>{{ t('opportunities_guideline.recommend.no_recommend_desc') }}</p>
          </div>
        </div>
      </div>

      <!-- 数据来源 -->
      <div class="guideline-section">
        <h4>{{ t('opportunities_guideline.data.title') }}</h4>
        <ul class="guideline-list">
          <li>
            <strong>{{ t('opportunities_guideline.data.tech').split(':')[0] }}:</strong> {{ t('opportunities_guideline.data.tech').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.data.fund').split(':')[0] }}:</strong> {{ t('opportunities_guideline.data.fund').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.data.sent').split(':')[0] }}:</strong> {{ t('opportunities_guideline.data.sent').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.data.fallback').split(':')[0] }}:</strong> {{ t('opportunities_guideline.data.fallback').split(':')[1] }}
          </li>
        </ul>
      </div>

      <!-- 使用建议 -->
      <div class="guideline-section">
        <h4>{{ t('opportunities_guideline.tips.title') }}</h4>
        <ul class="guideline-list highlight-tips">
          <li>
            <strong>{{ t('opportunities_guideline.tips.daily').split(':')[0] }}:</strong> {{ t('opportunities_guideline.tips.daily').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.tips.realtime').split(':')[0] }}:</strong> {{ t('opportunities_guideline.tips.realtime').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.tips.events').split(':')[0] }}:</strong> {{ t('opportunities_guideline.tips.events').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.tips.risk').split(':')[0] }}:</strong> {{ t('opportunities_guideline.tips.risk').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.tips.history').split(':')[0] }}:</strong> {{ t('opportunities_guideline.tips.history').split(':')[1] }}
          </li>
          <li>
            <strong>{{ t('opportunities_guideline.tips.diversify').split(':')[0] }}:</strong> {{ t('opportunities_guideline.tips.diversify').split(':')[1] }}
          </li>
        </ul>
      </div>
    </div>

    <div class="disclaimer">
      {{ t('opportunities_guideline.disclaimer') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
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
