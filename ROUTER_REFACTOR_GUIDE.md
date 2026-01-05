# 路由重构说明

## 更新日期: 2026-01-04

### 概述
将原有的标签页模式重构为基于Vue Router的独立页面，并提取window_days为全局配置。

---

## 主要改动

### 1. 安装依赖
```bash
npm install vue-router@4 --legacy-peer-deps
```

### 2. 新增文件

#### 全局配置 (`src/config/global.ts`)
```typescript
// 可配置的全局参数
export const globalConfig = {
  windowDays: 15,  // 数据窗口天数
  api: {
    baseURL: 'http://localhost:8088',
    timeout: 30000
  },
  refreshInterval: {
    behavior: 60000,
    positions: 300000,
    macro: 600000
  }
};

// 响应式配置对象
export const appConfig = reactive({
  windowDays: globalConfig.windowDays
});
```

#### 路由配置 (`src/router/index.ts`)
- `/` → 重定向到 `/behavior`
- `/behavior` → 行为评分页面
- `/positions` → 持仓评估页面
- `/macro` → 宏观风险页面

#### 页面组件
- `src/views/BehaviorScorePage.vue` - 行为评分页面
- `src/views/PositionsPage.vue` - 持仓评估页面
- `src/views/MacroRiskPage.vue` - 宏观风险页面

### 3. 修改文件

#### `src/main.ts`
```typescript
import router from "./router";

const app = createApp(App);
app.use(router);  // 注册路由
app.mount("#app");
```

#### `src/App.vue`
- 移除标签页切换逻辑
- 移除所有页面内容代码
- 改为路由容器布局
- 导航按钮改为 `<router-link>`
- 添加页面切换过渡动画

---

## 架构对比

### 旧架构（标签页模式）
```
App.vue
├── 侧边栏导航 (按钮切换)
└── 主内容区
    ├── v-if="currentTab === 'behavior'" → 行为评分内容
    ├── v-if="currentTab === 'positions'" → 持仓评估内容
    └── v-if="currentTab === 'macro'" → 宏观风险内容
```

**问题**：
- 所有页面代码混在一个文件中
- 不支持浏览器前进/后退
- 无法直接链接到特定页面
- 不支持页面级的懒加载

### 新架构（路由模式）
```
App.vue (布局容器)
├── 侧边栏导航 (router-link)
└── router-view (动态路由组件)
    ├── /behavior → BehaviorScorePage.vue
    ├── /positions → PositionsPage.vue
    └── /macro → MacroRiskPage.vue
```

**优势**：
- ✅ 每个页面独立文件，代码清晰
- ✅ 支持浏览器导航历史
- ✅ 可以直接访问 URL（如 `/positions`）
- ✅ 支持页面级懒加载（优化首屏）
- ✅ 更易维护和扩展

---

## 全局配置使用

### 在组件中使用
```typescript
import { appConfig, updateWindowDays } from '../config/global';

// 读取配置
const windowDays = ref(appConfig.windowDays);

// 更新配置
function onWindowDaysChange() {
  updateWindowDays(windowDays.value);
  // 配置会全局生效
}
```

### 配置说明
- `windowDays`: 数据窗口天数（7-365天）
- 行为评分和持仓评估都使用此配置
- 修改后会影响所有使用该配置的页面

---

## URL 路由

| 路径 | 页面 | 描述 |
|------|------|------|
| `/` | 自动重定向 | 重定向到 `/behavior` |
| `/behavior` | 行为评分 | 显示标的行为评分和Greeks水位 |
| `/positions` | 持仓评估 | 显示持仓的技术面、基本面、情绪面评分 |
| `/macro` | 宏观风险 | 显示5维度宏观风险分析 |

---

## 页面功能

### 行为评分页面 (`/behavior`)
- 可配置窗口天数
- 重新计算行为评分按钮
- 风险汇总卡片
- Greeks水位图
- 标的行为评分卡片列表

### 持仓评估页面 (`/positions`)
- 数据刷新按钮
- 持仓汇总信息（总持仓、总市值、总盈亏等）
- 持仓评分卡片列表（包含技术面、基本面、情绪面）
- 显示未实现盈亏和风险等级

### 宏观风险页面 (`/macro`)
- 数据刷新按钮
- AI综合分析摘要
- 风险警报列表
- 5个风险维度评分
- 主要关注点和总体建议

---

## 页面切换动画

使用CSS过渡实现平滑切换：
```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

---

## 开发指南

### 添加新页面
1. 在 `src/views/` 创建新组件
2. 在 `src/router/index.ts` 添加路由
3. 在 `src/App.vue` 的 `routes` 数组添加导航项

### 页面模板
```vue
<template>
  <div class="page-container">
    <!-- 页面内容 -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
// 导入需要的组件和API
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 24px;
}
</style>
```

---

## 注意事项

1. **路由懒加载**: 当前使用 `() => import()` 实现按需加载
2. **页面标题**: 路由守卫自动更新浏览器标题
3. **初始路由**: 访问根路径 `/` 会自动跳转到 `/behavior`
4. **响应式**: 所有页面都支持移动端响应式布局
5. **状态管理**: 每个页面独立管理自己的状态

---

## 测试

### 启动开发服务器
```bash
npm run dev
```

### 测试项
- [x] 点击导航按钮切换页面
- [x] 浏览器前进/后退按钮
- [x] 直接访问URL（如 `http://localhost:5173/positions`）
- [x] 页面刷新后保持当前路由
- [x] 窗口天数配置在行为评分页面生效
- [x] 各页面的刷新按钮功能正常

---

## 性能优化

1. **按需加载**: 只有访问时才加载对应页面代码
2. **组件复用**: 公共组件（如卡片）在多个页面间复用
3. **缓存策略**: 可在路由配置中添加 `keep-alive`
4. **预加载**: 可配置路由预取提升体验

---

## 未来扩展

可能的功能扩展：
- 添加页面级权限控制
- 实现页面间数据共享（Pinia）
- 添加面包屑导航
- 支持多标签页模式
- 添加页面加载进度条
- 实现页面缓存（keep-alive）

---

## 兼容性

- Vue 3.5+
- Vue Router 4.x
- 支持现代浏览器（Chrome, Firefox, Safari, Edge）
- 响应式支持（桌面、平板、移动端）
