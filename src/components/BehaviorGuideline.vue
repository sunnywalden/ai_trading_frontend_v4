<template>
  <div class="guideline-card">
    <h2>{{ $t('behavior.guideline.title') }}</h2>
    
    <div class="score-section">
      <h3>{{ $t('behavior.guideline.score_0_100') }}</h3>
      <p class="desc">{{ $t('behavior.guideline.desc') }}</p>
      <div class="tier-grid">
        <div class="tier-item tier-t1">
          <span class="tier-label">T1 {{ $t('behavior.guideline.tiers.t1') }}</span>
          <span class="tier-range">85-100</span>
          <span class="tier-desc">{{ $t('behavior.guideline.tiers.t1_desc') }}</span>
        </div>
        <div class="tier-item tier-t2">
          <span class="tier-label">T2 {{ $t('behavior.guideline.tiers.t2') }}</span>
          <span class="tier-range">65-84</span>
          <span class="tier-desc">{{ $t('behavior.guideline.tiers.t2_desc') }}</span>
        </div>
        <div class="tier-item tier-t3">
          <span class="tier-label">T3 {{ $t('behavior.guideline.tiers.t3') }}</span>
          <span class="tier-range">40-64</span>
          <span class="tier-desc">{{ $t('behavior.guideline.tiers.t3_desc') }}</span>
        </div>
        <div class="tier-item tier-t4">
          <span class="tier-label">T4 {{ $t('behavior.guideline.tiers.t4') }}</span>
          <span class="tier-range">0-39</span>
          <span class="tier-desc">{{ $t('behavior.guideline.tiers.t4_desc') }}</span>
        </div>
      </div>
    </div>

    <div class="score-section">
      <h3>{{ $t('behavior.guideline.sell_fly.title') }}</h3>
      <p class="desc">{{ $t('behavior.guideline.sell_fly.desc') }}</p>
      <ul>
        <li><span class="range">80+</span> {{ $t('behavior.guideline.sell_fly.s1') }}</li>
        <li><span class="range">60-79</span> {{ $t('behavior.guideline.sell_fly.s2') }}</li>
        <li><span class="range">40-59</span> {{ $t('behavior.guideline.sell_fly.s3') }}</li>
        <li><span class="range">0-39</span> {{ $t('behavior.guideline.sell_fly.s4') }}</li>
      </ul>
      <p class="impact">{{ $t('behavior.guideline.sell_fly.impact') }}</p>
      <div class="behavior-example">
        <strong>{{ $t('behavior.guideline.sell_fly.example_title') }}</strong>
        <ul>
          <li>{{ $t('behavior.guideline.sell_fly.e1') }}</li>
          <li>{{ $t('behavior.guideline.sell_fly.e2') }}</li>
          <li>{{ $t('behavior.guideline.sell_fly.e3') }}</li>
          <li>{{ $t('behavior.guideline.sell_fly.e4') }}</li>
        </ul>
      </div>
    </div>

    <div class="score-section">
      <h3>{{ $t('behavior.guideline.overtrading.title') }}</h3>
      <p class="desc">{{ $t('behavior.guideline.overtrading.desc') }}</p>
      <ul>
        <li><span class="range">80+</span> {{ $t('behavior.guideline.overtrading.s1') }}</li>
        <li><span class="range">60-79</span> {{ $t('behavior.guideline.overtrading.s2') }}</li>
        <li><span class="range">40-59</span> {{ $t('behavior.guideline.overtrading.s3') }}</li>
        <li><span class="range">0-39</span> {{ $t('behavior.guideline.overtrading.s4') }}</li>
      </ul>
      <p class="impact">{{ $t('behavior.guideline.overtrading.impact') }}</p>
      <div class="behavior-example">
        <strong>{{ $t('behavior.guideline.overtrading.example_title') }}</strong>
        <ul>
          <li>{{ $t('behavior.guideline.overtrading.e1') }}</li>
          <li>{{ $t('behavior.guideline.overtrading.e2') }}</li>
          <li>{{ $t('behavior.guideline.overtrading.e3') }}</li>
          <li>{{ $t('behavior.guideline.overtrading.e4') }}</li>
        </ul>
      </div>
    </div>

    <div class="score-section">
      <h3>{{ $t('behavior.guideline.revenge.title') }}</h3>
      <p class="desc">{{ $t('behavior.guideline.revenge.desc') }}</p>
      <ul>
        <li><span class="range">80+</span> {{ $t('behavior.guideline.revenge.s1') }}</li>
        <li><span class="range">60-79</span> {{ $t('behavior.guideline.revenge.s2') }}</li>
        <li><span class="range">40-59</span> {{ $t('behavior.guideline.revenge.s3') }}</li>
        <li><span class="range">0-39</span> {{ $t('behavior.guideline.revenge.s4') }}</li>
      </ul>
      <p class="impact">{{ $t('behavior.guideline.revenge.impact') }}</p>
      <div class="behavior-example">
        <strong>{{ $t('behavior.guideline.revenge.example_title') }}</strong>
        <ul>
          <li>{{ $t('behavior.guideline.revenge.e1') }}</li>
          <li>{{ $t('behavior.guideline.revenge.e2') }}</li>
          <li>{{ $t('behavior.guideline.revenge.e3') }}</li>
          <li>{{ $t('behavior.guideline.revenge.e4') }}</li>
        </ul>
      </div>
    </div>

    <div class="greeks-section">
      <h3>{{ $t('behavior.guideline.greeks.title') }}</h3>
      <div class="greek-grid">
        <div class="greek-item">
          <span class="greek-symbol">Delta (Δ)</span>
          <span class="greek-desc">{{ $t('behavior.guideline.greeks.delta') }}</span>
        </div>
        <div class="greek-item">
          <span class="greek-symbol">Gamma (Γ)</span>
          <span class="greek-desc">{{ $t('behavior.guideline.greeks.gamma') }}</span>
        </div>
        <div class="greek-item">
          <span class="greek-symbol">Theta (Θ)</span>
          <span class="greek-desc">{{ $t('behavior.guideline.greeks.theta') }}</span>
        </div>
        <div class="greek-item">
          <span class="greek-symbol">Vega (V)</span>
          <span class="greek-desc">{{ $t('behavior.guideline.greeks.vega') }}</span>
        </div>
      </div>
      <p class="greek-note">{{ $t('behavior.guideline.greeks.impact') }}</p>
    </div>

    <div class="action-section">
      <h3>{{ $t('behavior.guideline.action_title') }}</h3>
      <div class="action-grid">
        <div class="action-item action-excellent">
          <span class="action-label">85+</span>
          <span class="action-text">{{ $t('behavior.guideline.actions.s1') }}</span>
        </div>
        <div class="action-item action-good">
          <span class="action-label">65-84</span>
          <span class="action-text">{{ $t('behavior.guideline.actions.s2') }}</span>
        </div>
        <div class="action-item action-warning">
          <span class="action-label">40-64</span>
          <span class="action-text">{{ $t('behavior.guideline.actions.s3') }}</span>
        </div>
        <div class="action-item action-danger">
          <span class="action-label">&lt;40</span>
          <span class="action-text">{{ $t('behavior.guideline.actions.s4') }}</span>
        </div>
      </div>
    </div>

    <div class="note-section">
      <p><strong>{{ $t('behavior.guideline.note.title') }}</strong></p>
      <ul>
        <li>{{ $t('behavior.guideline.note.n1') }}</li>
        <li>{{ $t('behavior.guideline.note.n2') }}</li>
        <li>{{ $t('behavior.guideline.note.n3') }}</li>
        <li>{{ $t('behavior.guideline.note.n4') }}</li>
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
