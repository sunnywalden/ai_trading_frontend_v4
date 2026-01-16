<template>
  <span class="tag" :class="tagClass">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ score: number }>();

const label = computed(() => (props.score >= 80 ? '匹配计划' : '观察'));

const tagClass = computed(() => (props.score >= 80 ? 'match' : 'watch'));
</script>

<style scoped>
.tag {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
}

.tag.match {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.tag.watch {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.4);
}
</style>
