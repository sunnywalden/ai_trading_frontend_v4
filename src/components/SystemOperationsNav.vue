<template>
  <nav class="system-ops-nav" aria-label="系统二级导航">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="nav-chip"
      :class="{ active: route.path === item.to }"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-body">
        <span class="nav-title">{{ item.title }}</span>
        <span class="nav-desc">{{ item.desc }}</span>
      </span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { to: '/system-monitor', title: '系统监控', desc: '服务健康、生命周期、数据流与 API 观测', icon: '🖥️' },
  { to: '/live-safety', title: 'AI 安全', desc: '模型退化、数据陈旧与自主度节流', icon: '🛡️' },
  { to: '/task-management', title: '任务管理', desc: '调度器总览、动态配置与运营自动化', icon: '⚙️' },
] as const
</script>

<style scoped>
.system-ops-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.nav-chip {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.16);
  background: rgba(15, 23, 42, 0.68);
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-chip:hover {
  border-color: rgba(56, 189, 248, 0.35);
  transform: translateY(-1px);
}

.nav-chip.active {
  border-color: rgba(56, 189, 248, 0.55);
  background: rgba(8, 145, 178, 0.14);
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.15);
}

.nav-icon {
  font-size: 1.1rem;
  line-height: 1.2;
}

.nav-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.nav-title {
  color: #f8fafc;
  font-size: 0.92rem;
  font-weight: 600;
}

.nav-desc {
  color: #94a3b8;
  font-size: 0.78rem;
  line-height: 1.5;
}
</style>
