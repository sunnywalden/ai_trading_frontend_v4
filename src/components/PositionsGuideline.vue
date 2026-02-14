<template>
  <div class="guideline-card">
    <h2>📊 {{ $t('positions.guideline.title') }}</h2>
    
    <div class="score-section">
      <h3>{{ $t('positions.guideline.composite.title') }}</h3>
      <p class="desc">{{ $t('positions.guideline.composite.desc') }}</p>
      <ul>
        <li><span class="range">81-100</span> {{ $t('positions.guideline.composite.excellent') }}</li>
        <li><span class="range">61-80</span> {{ $t('positions.guideline.composite.good') }}</li>
        <li><span class="range">40-60</span> {{ $t('positions.guideline.composite.neutral') }}</li>
        <li><span class="range">25-40</span> {{ $t('positions.guideline.composite.poor') }}</li>
        <li><span class="range">0-25</span> {{ $t('positions.guideline.composite.bad') }}</li>
      </ul>
    </div>

    <div class="score-section">
      <h3>{{ $t('positions.guideline.technical.title') }}</h3>
      <p class="desc">{{ $t('positions.guideline.technical.desc') }}</p>
      <ul>
        <li v-for="(item, index) in $tm('positions.guideline.technical.items')" :key="index">
          {{ $rt(item) }}
        </li>
      </ul>
      <p class="impact">{{ $t('positions.guideline.technical.impact') }}</p>
    </div>

    <div class="score-section">
      <h3>{{ $t('positions.guideline.snapshot.title') }}</h3>
      <p class="desc">{{ $t('positions.guideline.snapshot.desc') }}</p>
      <ul>
        <li v-for="(item, index) in $tm('positions.guideline.snapshot.items')" :key="index">
          <span v-html="$rt(item)"></span>
        </li>
      </ul>
      <p class="impact">{{ $t('positions.guideline.snapshot.impact') }}</p>
      <p class="warning">{{ $t('positions.guideline.snapshot.warning') }}</p>
    </div>

    <div class="score-section">
      <h3>{{ $t('positions.guideline.fundamental.title') }}</h3>
      <p class="desc">{{ $t('positions.guideline.fundamental.desc') }}</p>
      <ul>
        <li v-for="(item, index) in $tm('positions.guideline.fundamental.items')" :key="index">
          <span v-html="$rt(item)"></span>
        </li>
      </ul>
      <p class="impact">{{ $t('positions.guideline.fundamental.impact') }}</p>
    </div>

    <div class="score-section">
      <h3>{{ $t('positions.guideline.sentiment.title') }}</h3>
      <p class="desc">{{ $t('positions.guideline.sentiment.desc') }}</p>
      <ul>
        <li v-for="(item, index) in $tm('positions.guideline.sentiment.items')" :key="index">
          {{ $rt(item) }}
        </li>
      </ul>
      <p class="impact">{{ $t('positions.guideline.sentiment.impact') }}</p>
    </div>

    <div class="recommendation-section">
      <h3>{{ $t('positions.guideline.recommendations.title') }}</h3>
      <div class="rec-grid">
        <div class="rec-item rec-strong-buy">
          <span class="rec-label">STRONG BUY</span>
          <span class="rec-desc">{{ $t('positions.guideline.recommendations.strong_buy') }}</span>
        </div>
        <div class="rec-item rec-buy">
          <span class="rec-label">BUY</span>
          <span class="rec-desc">{{ $t('positions.guideline.recommendations.buy') }}</span>
        </div>
        <div class="rec-item rec-hold">
          <span class="rec-label">HOLD</span>
          <span class="rec-desc">{{ $t('positions.guideline.recommendations.hold') }}</span>
        </div>
        <div class="rec-item rec-reduce">
          <span class="rec-label">REDUCE</span>
          <span class="rec-desc">{{ $t('positions.guideline.recommendations.reduce') }}</span>
        </div>
        <div class="rec-item rec-sell">
          <span class="rec-label">SELL</span>
          <span class="rec-desc">{{ $t('positions.guideline.recommendations.sell') }}</span>
        </div>
      </div>
    </div>

    <div class="risk-section">
      <h3>{{ $t('positions.guideline.risks.title') }}</h3>
      <div class="risk-grid">
        <div class="risk-item risk-low">
          <span class="risk-label">LOW</span>
          <span class="risk-desc">{{ $t('positions.guideline.risks.low') }}</span>
        </div>
        <div class="risk-item risk-medium">
          <span class="risk-label">MEDIUM</span>
          <span class="risk-desc">{{ $t('positions.guideline.risks.medium') }}</span>
        </div>
        <div class="risk-item risk-high">
          <span class="risk-label">HIGH</span>
          <span class="risk-desc">{{ $t('positions.guideline.risks.high') }}</span>
        </div>
        <div class="risk-item risk-extreme">
          <span class="risk-label">EXTREME</span>
          <span class="risk-desc">{{ $t('positions.guideline.risks.extreme') }}</span>
        </div>
      </div>
    </div>

    <div class="note-section">
      <p>⚠️ <strong>{{ $t('positions.guideline.notes.title') }}</strong>：</p>
      <ul>
        <li v-for="(item, index) in $tm('positions.guideline.notes.items')" :key="index">
          {{ $rt(item) }}
        </li>
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
