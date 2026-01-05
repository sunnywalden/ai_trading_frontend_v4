<template>
  <div class="layout">
    <aside class="sidebar">
      <h1>AI Trading · 控制塔</h1>
      <p class="desc">
        后端：风险因子 + 行为评分 + 自动对冲引擎<br>
        前端：实时状态总览 + 标的行为画像 + Greeks 风险水位（Vue3）
      </p>
      
      <nav class="nav-menu">
        <router-link
          v-for="route in routes"
          :key="route.path"
          :to="route.path"
          class="nav-button"
          active-class="active"
        >
          <span class="nav-icon">{{ route.icon }}</span>
          <span class="nav-label">{{ route.label }}</span>
        </router-link>
      </nav>
    </aside>
    <main class="main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <section class="footer">
        <p>
          当前版本：前后端物理分离 · REST 调用<br />
          行为评分与卖飞评分驱动每个标的的 ShockPolicy / EarningsPolicy；Greeks 暴露通过水位条形图展示与限额的相对关系。
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">

const routes = [
  { path: '/behavior', label: '行为评分', icon: '🎯' },
  { path: '/positions', label: '持仓评估', icon: '📊' },
  { path: '/macro', label: '宏观风险', icon: '🌍' }
];
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 100vh;
  background: radial-gradient(circle at top, #0f172a 0, #020617 60%);
  color: #e5e7eb;
}

.sidebar {
  padding: 24px 20px;
  border-right: 1px solid rgba(30, 64, 175, 0.6);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  background: radial-gradient(circle at top left, #111827 0, #020617 70%);
  flex-shrink: 0;
}

.desc {
  font-size: 0.8rem;
  color: #9ca3af;
  line-height: 1.4;
  margin: 0;
  flex-shrink: 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(55, 65, 81, 0.8);
  border-radius: 10px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.nav-button:hover {
  background: rgba(31, 41, 55, 0.8);
  border-color: rgba(56, 189, 248, 0.5);
  color: #e5e7eb;
}

.nav-button.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.8);
  color: #38bdf8;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-label {
  flex: 1;
}

.guideline {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.footer {
  margin-top: auto;
  padding: 20px 24px;
  border-top: 1px solid rgba(31, 41, 55, 0.8);
  font-size: 0.78rem;
  color: #6b7280;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(30, 64, 175, 0.6);
  }
}
</style>
