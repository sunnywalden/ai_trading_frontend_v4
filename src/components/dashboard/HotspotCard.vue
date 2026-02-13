<template>
  <div class="hotspot-card">
    <div class="hotspot-icon">🔥</div>
    <h4 class="hotspot-topic">{{ hotspot.topic }}</h4>
    <div class="hotspot-score">热度: {{ hotspot.heat_score.toFixed(0) }}</div>
    <div class="hotspot-symbols" v-if="hotspot.related_symbols.length > 0">
      <span class="symbol" v-for="sym in hotspot.related_symbols.slice(0, 3)" :key="sym">{{ sym }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MarketHotspot } from '@/api/client'

defineProps<{
  hotspot: MarketHotspot
}>()
</script>

<style scoped>
.hotspot-card {
  padding: 12px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%);
  border-radius: 8px;
  border: 1px solid #fecaca;
  text-align: center;
}

.hotspot-icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.hotspot-topic {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.hotspot-score {
  font-size: 0.75rem;
  color: #dc2626;
  font-weight: 600;
  margin-bottom: 8px;
}

.hotspot-symbols {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

.symbol {
  padding: 2px 6px;
  background: white;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}
</style>