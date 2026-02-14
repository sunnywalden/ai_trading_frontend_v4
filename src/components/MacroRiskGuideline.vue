<template>
  <div class="guideline-card">
    <h2>{{ $t('macro.guideline.title') }}</h2>
    
    <div class="score-section">
      <h3>{{ $t('macro.guideline.five_dim_model') }}</h3>
      <p class="desc">{{ $t('macro.guideline.five_dim_desc') }}</p>
    </div>

    <div class="dimension-section">
      <h3>{{ $t('macro.guideline.political.name') }}</h3>
      <p class="desc">{{ $t('macro.guideline.political.desc') }}</p>
      <ul>
        <li>{{ $t('macro.guideline.political.policy') }}</li>
        <li>{{ $t('macro.guideline.political.geopolitical') }}</li>
        <li>{{ $t('macro.guideline.political.events') }}</li>
        <li>{{ $t('macro.guideline.political.regulations') }}</li>
      </ul>
      <div class="risk-range">
        <span class="range-item range-low">{{ $t('macro.guideline.political.low') }}</span>
        <span class="range-item range-medium">{{ $t('macro.guideline.political.medium') }}</span>
        <span class="range-item range-high">{{ $t('macro.guideline.political.high') }}</span>
      </div>
    </div>

    <div class="dimension-section">
      <h3>{{ $t('macro.guideline.economic.name') }}</h3>
      <p class="desc">{{ $t('macro.guideline.economic.desc') }}</p>
      <ul>
        <li>{{ $t('macro.guideline.economic.growth') }}</li>
        <li>{{ $t('macro.guideline.economic.inflation') }}</li>
        <li>{{ $t('macro.guideline.economic.rates') }}</li>
        <li>{{ $t('macro.guideline.economic.business') }}</li>
      </ul>
      <div class="risk-range">
        <span class="range-item range-low">{{ $t('macro.guideline.economic.health') }}</span>
        <span class="range-item range-medium">{{ $t('macro.guideline.economic.slowdown') }}</span>
        <span class="range-item range-high">{{ $t('macro.guideline.economic.recession') }}</span>
      </div>
    </div>

    <div class="dimension-section">
      <h3>{{ $t('macro.guideline.market.name') }}</h3>
      <p class="desc">{{ $t('macro.guideline.market.desc') }}</p>
      <ul>
        <li>{{ $t('macro.guideline.market.volatility') }}</li>
        <li>{{ $t('macro.guideline.market.valuation') }}</li>
        <li>{{ $t('macro.guideline.market.liquidity') }}</li>
        <li>{{ $t('macro.guideline.market.technical') }}</li>
      </ul>
      <div class="risk-range">
        <span class="range-item range-low">{{ $t('macro.guideline.market.stable') }}</span>
        <span class="range-item range-medium">{{ $t('macro.guideline.market.vol_high') }}</span>
        <span class="range-item range-high">{{ $t('macro.guideline.market.extreme') }}</span>
      </div>
    </div>

    <div class="dimension-section">
      <h3>{{ $t('macro.guideline.financial.name') }}</h3>
      <p class="desc">{{ $t('macro.guideline.financial.desc') }}</p>
      <ul>
        <li>{{ $t('macro.guideline.financial.credit') }}</li>
        <li>{{ $t('macro.guideline.financial.health') }}</li>
        <li>{{ $t('macro.guideline.financial.liquidity') }}</li>
        <li>{{ $t('macro.guideline.financial.leverage') }}</li>
      </ul>
      <div class="risk-range">
        <span class="range-item range-low">{{ $t('macro.guideline.financial.solid') }}</span>
        <span class="range-item range-medium">{{ $t('macro.guideline.financial.stress') }}</span>
        <span class="range-item range-high">{{ $t('macro.guideline.financial.systemic') }}</span>
      </div>
    </div>

    <div class="dimension-section">
      <h3>{{ $t('macro.guideline.technical.name') }}</h3>
      <p class="desc">{{ $t('macro.guideline.technical.desc') }}</p>
      <ul>
        <li>{{ $t('macro.guideline.technical.disruption') }}</li>
        <li>{{ $t('macro.guideline.technical.innovation') }}</li>
        <li>{{ $t('macro.guideline.technical.cybersecurity') }}</li>
        <li>{{ $t('macro.guideline.technical.transformation') }}</li>
      </ul>
      <div class="risk-range">
        <span class="range-item range-low">{{ $t('macro.guideline.technical.leading') }}</span>
        <span class="range-item range-medium">{{ $t('macro.guideline.technical.investment_needed') }}</span>
        <span class="range-item range-high">{{ $t('macro.guideline.technical.disrupt_risk') }}</span>
      </div>
    </div>

    <div class="risk-level-section">
      <h3>{{ $t('macro.guideline.levels_title') }}</h3>
      <div class="level-grid">
        <div class="level-item level-low">
          <span class="level-label">LOW RISK</span>
          <span class="level-score">0-30</span>
          <span class="level-desc">{{ $t('macro.guideline.levels.low_desc') }}</span>
          <span class="level-action">{{ $t('macro.guideline.levels.low_action') }}</span>
        </div>
        <div class="level-item level-medium">
          <span class="level-label">MEDIUM RISK</span>
          <span class="level-score">30-60</span>
          <span class="level-desc">{{ $t('macro.guideline.levels.medium_desc') }}</span>
          <span class="level-action">{{ $t('macro.guideline.levels.medium_action') }}</span>
        </div>
        <div class="level-item level-high">
          <span class="level-label">HIGH RISK</span>
          <span class="level-score">60-80</span>
          <span class="level-desc">{{ $t('macro.guideline.levels.high_desc') }}</span>
          <span class="level-action">{{ $t('macro.guideline.levels.high_action') }}</span>
        </div>
        <div class="level-item level-critical">
          <span class="level-label">CRITICAL RISK</span>
          <span class="level-score">80-100</span>
          <span class="level-desc">{{ $t('macro.guideline.levels.critical_desc') }}</span>
          <span class="level-action">{{ $t('macro.guideline.levels.critical_action') }}</span>
        </div>
      </div>
    </div>

    <div class="strategy-section">
      <h3>{{ $t('macro.guideline.strategies_title') }}</h3>
      <div class="strategy-grid">
        <div class="strategy-item">
          <span class="strategy-title">{{ $t('macro.guideline.defense.title') }}</span>
          <ul>
            <li>{{ $t('macro.guideline.defense.assets') }}</li>
            <li>{{ $t('macro.guideline.defense.beta') }}</li>
            <li>{{ $t('macro.guideline.defense.cash') }}</li>
          </ul>
        </div>
        <div class="strategy-item">
          <span class="strategy-title">{{ $t('macro.guideline.hedge.title') }}</span>
          <ul>
            <li>{{ $t('macro.guideline.hedge.put') }}</li>
            <li>{{ $t('macro.guideline.hedge.etf') }}</li>
            <li>{{ $t('macro.guideline.hedge.rotation') }}</li>
          </ul>
        </div>
        <div class="strategy-item">
          <span class="strategy-title">{{ $t('macro.guideline.diversify.title') }}</span>
          <ul>
            <li>{{ $t('macro.guideline.diversify.assets') }}</li>
            <li>{{ $t('macro.guideline.diversify.market') }}</li>
            <li>{{ $t('macro.guideline.diversify.sector') }}</li>
          </ul>
        </div>
        <div class="strategy-item">
          <span class="strategy-title">{{ $t('macro.guideline.timing.title') }}</span>
          <ul>
            <li>{{ $t('macro.guideline.timing.signals') }}</li>
            <li>{{ $t('macro.guideline.timing.calm') }}</li>
            <li>{{ $t('macro.guideline.timing.entry') }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="indicator-section">
      <h3>{{ $t('macro.guideline.indicators_title') }}</h3>
      <div class="indicator-grid">
        <div class="indicator-item">
          <span class="indicator-name">{{ $t('macro.guideline.indicators.vix') }}</span>
          <span class="indicator-threshold">{{ $t('macro.guideline.indicators.vix_threshold') }}</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-name">{{ $t('macro.guideline.indicators.yield') }}</span>
          <span class="indicator-threshold">{{ $t('macro.guideline.indicators.yield_threshold') }}</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-name">{{ $t('macro.guideline.indicators.spread') }}</span>
          <span class="indicator-threshold">{{ $t('macro.guideline.indicators.spread_threshold') }}</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-name">{{ $t('macro.guideline.indicators.dxy') }}</span>
          <span class="indicator-threshold">{{ $t('macro.guideline.indicators.dxy_threshold') }}</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-name">{{ $t('macro.guideline.indicators.pmi') }}</span>
          <span class="indicator-threshold">{{ $t('macro.guideline.indicators.pmi_threshold') }}</span>
        </div>
        <div class="indicator-item">
          <span class="indicator-name">{{ $t('macro.guideline.indicators.unemployment') }}</span>
          <span class="indicator-threshold">{{ $t('macro.guideline.indicators.unemployment_threshold') }}</span>
        </div>
      </div>
    </div>

    <div class="note-section">
      <p><strong>{{ $t('macro.guideline.notes.title') }}</strong></p>
      <ul>
        <li>{{ $t('macro.guideline.notes.ai') }}</li>
        <li>{{ $t('macro.guideline.notes.periodic') }}</li>
        <li>{{ $t('macro.guideline.notes.interact') }}</li>
        <li>{{ $t('macro.guideline.notes.blackswan') }}</li>
        <li>{{ $t('macro.guideline.notes.capacity') }}</li>
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
