<template>
  <div class="card">
    <div class="card-header">
      <h2>{{ $t('system.status') }}</h2>
      <span class="badge" :class="modeClass">{{ health?.mode ?? "..." }}</span>
    </div>
    <p class="subtitle">{{ $t('system.subtitle') }}</p>

    <div class="actions">
      <button @click="onRefresh" :disabled="loading">
        {{ loading ? $t('system.refreshing') : $t('system.refresh') }}
      </button>
      <button class="primary" @click="onRunHedge" :disabled="running">
        {{ running ? $t('system.running') : $t('system.run_hedge') }}
      </button>
    </div>

    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { fetchHealth, runAutoHedgeOnce, type HealthResponse } from "../api/client";

const { t } = useI18n();
const health = ref<HealthResponse | null>(null);
const loading = ref(false);
const running = ref(false);
const message = ref("");

// 监听外部刷新触发
const refreshTrigger = inject<any>('refreshTrigger', ref(0));
watch(refreshTrigger, () => {
  load();
});

const modeClass = computed(() => {
  if (!health.value) return "badge-gray";
  if (health.value.mode === "DRY_RUN") return "badge-amber";
  if (health.value.mode === "REAL") return "badge-green";
  return "badge-gray";
});

async function load() {
  loading.value = true;
  message.value = "";
  try {
    health.value = await fetchHealth();
  } catch (e: any) {
    console.error(e);
    message.value = t('common.error_load');
  } finally {
    loading.value = false;
  }
}

async function onRunHedge() {
  running.value = true;
  message.value = "";
  try {
    const res = await runAutoHedgeOnce();
    message.value = t('system.run_result', { detail: res.detail });
  } catch (e: any) {
    console.error(e);
    message.value = t('system.run_failed_simple');
  } finally {
    running.value = false;
  }
}

async function onRefresh() {
  await load();
}

onMounted(load);
</script>

<style scoped>
.card {
  background: rgba(15, 23, 42, 0.9);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.8);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-header h2 {
  margin: 0;
  font-size: 1.1rem;
}
.subtitle {
  margin: 8px 0 16px;
  font-size: 0.85rem;
  color: #9ca3af;
}
.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
button {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: transparent;
  color: #e5e7eb;
  font-size: 0.85rem;
  cursor: pointer;
}
button.primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border-color: transparent;
  font-weight: 600;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
}
.badge-amber {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}
.badge-green {
  background: rgba(34, 197, 94, 0.18);
  color: #4ade80;
}
.badge-gray {
  background: rgba(148, 163, 184, 0.18);
  color: #cbd5f5;
}
.message {
  font-size: 0.8rem;
  color: #a5b4fc;
}
</style>
