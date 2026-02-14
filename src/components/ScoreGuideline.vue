<template>
  <div class="guideline-card">
    <h2>{{ t('score_guideline.title') }}</h2>
    
    <div class="score-section">
      <h3>{{ t('score_guideline.behavior.title') }}</h3>
      <p class="desc">{{ t('score_guideline.behavior.desc') }}</p>
      <ul>
        <li><span class="range">0-30</span> {{ t('score_guideline.behavior.r1') }}</li>
        <li><span class="range">31-60</span> {{ t('score_guideline.behavior.r2') }}</li>
        <li><span class="range">61-80</span> {{ t('score_guideline.behavior.r3') }}</li>
        <li><span class="range">81-100</span> {{ t('score_guideline.behavior.r4') }}</li>
      </ul>
      <p class="impact">{{ t('score_guideline.behavior.impact') }}</p>
    </div>

    <div class="score-section">
      <h3>{{ t('score_guideline.sell_fly.title') }}</h3>
      <p class="desc">{{ t('score_guideline.sell_fly.desc') }}</p>
      <ul>
        <li><span class="range">0-20</span> {{ t('score_guideline.sell_fly.r1') }}</li>
        <li><span class="range">21-50</span> {{ t('score_guideline.sell_fly.r2') }}</li>
        <li><span class="range">51-80</span> {{ t('score_guideline.sell_fly.r3') }}</li>
        <li><span class="range">81-100</span> {{ t('score_guideline.sell_fly.r4') }}</li>
      </ul>
      <p class="impact">{{ t('score_guideline.sell_fly.impact') }}</p>
    </div>

    <div class="score-section">
      <h3>{{ t('score_guideline.overtrading.title') }}</h3>
      <p class="desc">{{ t('score_guideline.overtrading.desc') }}</p>
      <ul>
        <li><span class="range">0-25</span> {{ t('score_guideline.overtrading.r1') }}</li>
        <li><span class="range">26-60</span> {{ t('score_guideline.overtrading.r2') }}</li>
        <li><span class="range">61-85</span> {{ t('score_guideline.overtrading.r3') }}</li>
        <li><span class="range">86-100</span> {{ t('score_guideline.overtrading.r4') }}</li>
      </ul>
      <p class="impact">{{ t('score_guideline.overtrading.impact') }}</p>
    </div>

    <div class="score-section">
      <h3>{{ t('score_guideline.revenge.title') }}</h3>
      <p class="desc">{{ t('score_guideline.revenge.desc') }}</p>
      <ul>
        <li><span class="range">0-20</span> {{ t('score_guideline.revenge.r1') }}</li>
        <li><span class="range">21-50</span> {{ t('score_guideline.revenge.r2') }}</li>
        <li><span class="range">51-80</span> {{ t('score_guideline.revenge.r3') }}</li>
        <li><span class="range">81-100</span> {{ t('score_guideline.revenge.r4') }}</li>
      </ul>
      <p class="impact">{{ t('score_guideline.revenge.impact') }}</p>
    </div>

    <div class="tier-section">
      <h3>{{ t('score_guideline.tier.title') }}</h3>
      <div class="tier-grid">
        <div class="tier-item tier-t1">
          <span class="tier-label">T1</span>
          <span class="tier-desc">{{ t('score_guideline.tier.t1') }}</span>
        </div>
        <div class="tier-item tier-t2">
          <span class="tier-label">T2</span>
          <span class="tier-desc">{{ t('score_guideline.tier.t2') }}</span>
        </div>
        <div class="tier-item tier-t3">
          <span class="tier-label">T3</span>
          <span class="tier-desc">{{ t('score_guideline.tier.t3') }}</span>
        </div>
        <div class="tier-item tier-t4">
          <span class="tier-label">T4</span>
          <span class="tier-desc">{{ t('score_guideline.tier.t4') }}</span>
        </div>
      </div>
    </div>

    <div class="note-section">
      <p><strong>{{ t('score_guideline.impact_note.title') }}</strong></p>
      <ul>
        <li>{{ t('score_guideline.impact_note.i1') }}</li>
        <li>{{ t('score_guideline.impact_note.i2') }}</li>
        <li>{{ t('score_guideline.impact_note.i3') }}</li>
        <li>{{ t('score_guideline.impact_note.i4') }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

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
