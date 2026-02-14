<template>
  <div class="header">
    <div class="filters">
      <span class="pill">{{ $t('execution_list.header.universe', { name: universeName }) }}</span>
      <span class="pill">{{ $t('execution_list.header.min_score', { score: minScore }) }}</span>
      <span class="pill">{{ $t('execution_list.header.max_results', { count: maxResults }) }}</span>
      <span v-if="forceRefresh" class="pill warning">{{ $t('execution_list.header.force_refresh') }}</span>
    </div>
    <span class="hint">{{ $t('execution_list.header.hint') }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  universeName: string;
  minScore: number;
  maxResults: number;
  forceRefresh: boolean;
}>();
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  color: #9ca3af;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(55, 65, 81, 0.8);
}

.pill.warning {
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.15);
}

.hint {
  font-size: 0.75rem;
  color: #9ca3af;
}
</style>
