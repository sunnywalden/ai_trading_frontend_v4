<template>
  <div class="card">
    <div class="card-header">
      <h2>系统状态</h2>
      <span class="badge" :class="modeClass">{{ health?.mode ?? "..." }}</span>
    </div>
    <p class="subtitle">AI 风控 + 自动对冲引擎（后端 DRY_RUN / REAL 模式可切换）</p>

    <div class="actions">
      <button @click="onRefresh" :disabled="loading">
        {{ loading ? "刷新中..." : "刷新状态" }}
      </button>
      <button class="primary" @click="onRunHedge" :disabled="running">
        {{ running ? "执行中..." : "执行一次自动对冲" }}
      </button>
    </div>

    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { fetchHealth, runAutoHedgeOnce, type HealthResponse } from "../api/client";

const health = ref<HealthResponse | null>(null);
const loading = ref(false);
const running = ref(false);
const message = ref("");

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
    message.value = "获取状态失败";
  } finally {
    loading.value = false;
  }
}

async function onRunHedge() {
  running.value = true;
  message.value = "";
  try {
    const res = await runAutoHedgeOnce();
    message.value = `自动对冲结果：${res.detail}`;
  } catch (e: any) {
    console.error(e);
    message.value = "执行自动对冲失败";
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
