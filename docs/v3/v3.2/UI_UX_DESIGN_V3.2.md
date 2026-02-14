# V3.2 版本 UI/UX 设计文档

## 一、设计原则

### 1.1 移动优先（Mobile First）
从最小屏幕开始设计，逐步增强到大屏幕，确保核心功能在所有设备上可用。

### 1.2 渐进式增强（Progressive Enhancement）
- 核心功能在所有设备上都能使用
- 大屏设备享受更丰富的视觉效果和交互
- 小屏设备优先显示关键信息

### 1.3 触摸友好（Touch Friendly）
- 所有交互元素符合触摸标准尺寸
- 提供清晰的视觉反馈
- 避免需要精确点击的小目标

### 1.4 信息层级（Information Hierarchy）
- 关键信息优先展示
- 次要信息可折叠或隐藏
- 使用视觉权重引导用户注意力

## 二、设计系统

### 2.1 响应式断点（Breakpoints）

```css
/* 设计系统断点定义 */
--breakpoint-xs: 375px;   /* 小屏手机（竖屏）*/
--breakpoint-sm: 568px;   /* 大屏手机（竖屏）或小屏手机（横屏）*/
--breakpoint-md: 768px;   /* 平板（竖屏）或手机（横屏）*/
--breakpoint-lg: 1024px;  /* 平板（横屏）或小笔记本 */
--breakpoint-xl: 1280px;  /* 笔记本 */
--breakpoint-2xl: 1440px; /* 大屏笔记本 */
--breakpoint-3xl: 1920px; /* 桌面显示器 */
```

### 2.2 间距系统（Spacing）

```css
/* 响应式间距 */
/* Mobile */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 20px;
--spacing-2xl: 24px;

/* Tablet */
@media (min-width: 768px) {
  --spacing-xs: 6px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 20px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
}

/* Desktop */
@media (min-width: 1280px) {
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 20px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 40px;
}
```

### 2.3 字体系统（Typography）

```css
/* 移动端 */
--font-size-xs: 12px;
--font-size-sm: 13px;
--font-size-base: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-2xl: 20px;
--font-size-3xl: 24px;

/* 平板及以上 */
@media (min-width: 768px) {
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 15px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 32px;
}
```

### 2.4 触摸目标（Touch Targets）

```css
/* 最小触摸尺寸 */
--touch-target-min: 44px;   /* iOS标准 */
--touch-target-comfortable: 48px;  /* 更舒适的尺寸 */
--touch-target-spacing: 8px; /* 触摸目标间距 */

/* 示例应用 */
.btn-mobile {
  min-height: var(--touch-target-comfortable);
  padding: 12px 20px;
}

.checkbox-label-mobile {
  min-height: var(--touch-target-comfortable);
  display: flex;
  align-items: center;
  padding: 0 12px;
}
```

## 三、组件响应式设计规范

### 3.1 QuantLoopDashboard（量化闭环仪表盘）

#### 3.1.1 布局方案

**桌面端（≥1280px）**
```
┌────────────────────────────────────┐
│        Page Header (全宽)          │
├──────────────┬─────────────────────┤
│ SystemStatus │  CycleControlPanel  │ ← 50/50 Grid
├──────────────┴─────────────────────┤
│      SignalPipelineChart          │ ← 全宽
├───────────────────────────────────┤
│    PendingSignalsTable (全宽)     │
├──────────────┬─────────────────────┤
│ Optimization │  PerformanceChart  │ ← 50/50 Grid
└──────────────┴─────────────────────┘
```

**平板端（768px-1279px）**
```
┌────────────────────────────────────┐
│        Page Header (全宽)          │
├───────────────────────────────────┤
│      SystemStatusCard             │ ← 堆叠布局
├───────────────────────────────────┤
│      CycleControlPanel            │
├───────────────────────────────────┤
│      SignalPipelineChart          │
├───────────────────────────────────┤
│      PendingSignalsTable          │
├───────────────────────────────────┤
│      OptimizationPanel            │
├───────────────────────────────────┤
│      PerformanceChart             │
└───────────────────────────────────┘
```

**移动端（<768px）**
```
┌─────────────────────┐
│   Page Header       │ ← 简化版
├─────────────────────┤
│   Status Summary    │ ← 精简显示
├─────────────────────┤
│   Quick Actions     │ ← 快捷操作
├─────────────────────┤
│ 📊 Pipeline (可滑动) │
├─────────────────────┤
│  Signal Cards       │ ← 卡片式
│  [Card 1]           │
│  [Card 2]           │
│  [Card 3]           │
├─────────────────────┤
│ 📈 Charts (折叠)    │
└─────────────────────┘
```

#### 3.1.2 交互设计

**桌面端**
- 悬停效果（hover state）
- 工具提示（tooltip）
- 右键菜单
- 键盘快捷键

**移动端**
- 点击反馈（active state）
- 长按显示菜单
- 滑动操作
- 底部固定操作栏

### 3.2 CycleControlPanel（周期控制面板）

#### 3.2.1 桌面端布局（≥768px）
```vue
<div class="cycle-control-panel">
  <h3>手动运行控制</h3>
  
  <div class="control-form">
    <!-- 横向布局的复选框 -->
    <div class="checkbox-group-horizontal">
      <label>☐ 执行真实交易</label>
      <label>☐ 运行参数优化</label>
    </div>
    
    <!-- 横向布局的按钮 -->
    <div class="button-group-horizontal">
      <button class="btn-primary">运行完整周期</button>
      <button class="btn-secondary">仅运行优化</button>
    </div>
  </div>
  
  <!-- 运行结果 -->
  <div class="result-section">...</div>
</div>
```

#### 3.2.2 移动端布局（<768px）
```vue
<div class="cycle-control-panel-mobile">
  <h3>运行控制</h3>
  
  <div class="control-form-mobile">
    <!-- 纵向布局的复选框，增大触摸区域 -->
    <label class="checkbox-item-mobile">
      <input type="checkbox" />
      <span class="checkbox-label">执行真实交易</span>
      <span class="checkbox-hint">⚠️ 此操作不可撤销</span>
    </label>
    
    <label class="checkbox-item-mobile">
      <input type="checkbox" />
      <span class="checkbox-label">运行参数优化</span>
      <span class="checkbox-hint">推荐开启</span>
    </label>
    
    <!-- 纵向堆叠的按钮，100%宽度 -->
    <button class="btn-primary-mobile">
      运行完整周期
    </button>
    <button class="btn-secondary-mobile">
      仅运行优化
    </button>
  </div>
  
  <!-- 折叠的运行结果 -->
  <details class="result-section-mobile">
    <summary>查看上次运行结果</summary>
    <div class="result-content">...</div>
  </details>
</div>
```

#### 3.2.3 样式规范

**移动端复选框样式**
```css
/* 移动端复选框优化 */
.checkbox-item-mobile {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 10px;
  border: 2px solid rgba(139, 92, 246, 0.2);
  min-height: 56px; /* 超过最小触摸标准 */
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.checkbox-item-mobile:active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
  transform: scale(0.98);
}

.checkbox-item-mobile input[type="checkbox"] {
  width: 24px;
  height: 24px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: #8b5cf6;
}

.checkbox-label {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.4;
}

.checkbox-hint {
  display: block;
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}
```

**移动端按钮样式**
```css
.btn-primary-mobile,
.btn-secondary-mobile {
  width: 100%;
  min-height: 52px;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
  
  /* 触摸反馈 */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.btn-primary-mobile {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-primary-mobile:active {
  transform: scale(0.97);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.btn-primary-mobile.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
```

### 3.3 PendingSignalsTable（待执行信号表格）

#### 3.3.1 桌面端（≥1024px）- 表格模式
```
┌──────┬────────┬──────────┬───────┬───────┬──────────┐
│ 选择 │ 标的   │ 策略     │ 评分  │ 价格  │ 操作     │
├──────┼────────┼──────────┼───────┼───────┼──────────┤
│ ☐   │ AAPL   │ Momentum │ 85    │ $180  │ [执行]   │
│ ☐   │ TSLA   │ Mean Rev │ 78    │ $240  │ [执行]   │
└──────┴────────┴──────────┴───────┴───────┴──────────┘
```

#### 3.3.2 平板端（768-1023px）- 简化表格
```
┌──────┬────────┬───────┬──────────┐
│ 选择 │ 标的   │ 评分  │ 操作     │
├──────┼────────┼───────┼──────────┤
│ ☐   │ AAPL   │ 85    │ [执行]   │
│      │ Mom... │ $180  │ [详情]   │
├──────┼────────┼───────┼──────────┤
│ ☐   │ TSLA   │ 78    │ [执行]   │
│      │ Mea... │ $240  │ [详情]   │
└──────┴────────┴───────┴──────────┘
```

#### 3.3.3 移动端（<768px）- 卡片模式
```vue
<div class="signal-cards-mobile">
  <div class="signal-card">
    <div class="card-header">
      <input type="checkbox" class="card-checkbox" />
      <div class="card-symbol">AAPL</div>
      <div class="card-score">⭐ 85</div>
    </div>
    
    <div class="card-body">
      <div class="card-info">
        <span class="info-label">策略</span>
        <span class="info-value">Momentum</span>
      </div>
      <div class="card-info">
        <span class="info-label">价格</span>
        <span class="info-value">$180.00</span>
      </div>
      <div class="card-info">
        <span class="info-label">方向</span>
        <span class="info-value direction-long">LONG</span>
      </div>
    </div>
    
    <div class="card-actions">
      <button class="btn-card-primary">立即执行</button>
      <button class="btn-card-secondary">查看详情</button>
    </div>
  </div>
</div>

<!-- 底部固定工具栏 -->
<div class="bottom-toolbar-mobile">
  <button class="toolbar-btn">
    批量执行 (0)
  </button>
  <button class="toolbar-btn">
    批量拒绝
  </button>
</div>
```

#### 3.3.4 卡片样式规范
```css
.signal-card {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.signal-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.card-checkbox {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.card-symbol {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
}

.card-score {
  font-size: 16px;
  font-weight: 600;
  color: #fbbf24;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
}

.card-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 13px;
  color: #94a3b8;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-card-primary,
.btn-card-secondary {
  flex: 1;
  min-height: 44px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-card-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-card-primary:active {
  transform: scale(0.95);
}
```

### 3.4 底部固定工具栏（移动端）

#### 3.4.1 设计规范
```css
.bottom-toolbar-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom)); /* 适配底部安全区域 */
  display: flex;
  gap: 12px;
  z-index: 100;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
}

.toolbar-btn {
  flex: 1;
  min-height: 48px;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  transition: all 0.2s;
}

.toolbar-btn:active {
  transform: scale(0.96);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

## 四、交互细节设计

### 4.1 滚动优化

#### 4.1.1 横向滚动容器
```css
.horizontal-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
  scroll-behavior: smooth;
  
  /* 隐藏滚动条但保持可滚动 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.horizontal-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

/* 滚动指示器 */
.scroll-indicator {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  animation: slideHint 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes slideHint {
  0%, 100% { opacity: 0.3; transform: translate(0, -50%); }
  50% { opacity: 0.8; transform: translate(-8px, -50%); }
}
```

#### 4.1.2 虚拟滚动（长列表优化）
对于超长信号列表，考虑实现虚拟滚动：
```typescript
// 使用 vue-virtual-scroller 或自定义实现
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
```

### 4.2 加载状态

#### 4.2.1 骨架屏（Skeleton Screen）
```vue
<template>
  <div v-if="loading" class="skeleton-container">
    <div class="skeleton-card">
      <div class="skeleton-header"></div>
      <div class="skeleton-content"></div>
      <div class="skeleton-actions"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 16px;
  animation: shimmer 1.5s infinite;
}

.skeleton-header {
  height: 20px;
  background: #334155;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-content {
  height: 60px;
  background: #334155;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-actions {
  height: 44px;
  background: #334155;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style>
```

### 4.3 表单输入优化

#### 4.3.1 移动端表单设计
```vue
<input 
  type="number" 
  inputmode="decimal"
  pattern="[0-9]*"
  class="form-input-mobile"
/>

<style scoped>
.form-input-mobile {
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  font-size: 16px; /* 防止iOS自动缩放 */
  border-radius: 8px;
  border: 2px solid rgba(148, 163, 184, 0.2);
  background: #0f172a;
  color: #f1f5f9;
}

.form-input-mobile:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}
</style>
```

### 4.4 手势支持

#### 4.4.1 长按菜单
```typescript
// 使用 @vueuse/core 的 useLongPress
import { useLongPress } from '@vueuse/core'

const onLongPress = useLongPress(
  () => {
    // 显示上下文菜单
    showContextMenu()
  },
  { delay: 500 }
)
```

#### 4.4.2 滑动操作
```vue
<template>
  <div 
    class="swipeable-card"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- 卡片内容 -->
  </div>
</template>

<script setup lang="ts">
// 实现滑动删除或滑动操作
let touchStartX = 0
let touchEndX = 0

function handleTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0].screenX
}

function handleTouchMove(e: TouchEvent) {
  touchEndX = e.changedTouches[0].screenX
  // 更新视觉反馈
}

function handleTouchEnd() {
  if (touchStartX - touchEndX > 75) {
    // 左滑
    handleSwipeLeft()
  }
  if (touchEndX - touchStartX > 75) {
    // 右滑
    handleSwipeRight()
  }
}
</script>
```

## 五、动画和过渡

### 5.1 页面过渡
```css
/* 淡入效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滑入效果 */
.slide-enter-active {
  transition: all 0.3s ease-out;
}

.slide-enter-from {
  transform: translateX(-20px);
  opacity: 0;
}
```

### 5.2 性能优化
```css
/* 使用 transform 和 opacity 进行动画 */
.optimized-animation {
  will-change: transform, opacity;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

/* 避免使用 */
.bad-animation {
  /* 不要动画这些属性 */
  /* transition: width 0.2s, height 0.2s, top 0.2s; */
}
```

## 六、图标和视觉元素

### 6.1 图标系统
```typescript
// 使用 SVG 图标，支持主题色
const icons = {
  success: `<svg>...</svg>`,
  error: `<svg>...</svg>`,
  warning: `<svg>...</svg>`,
}

// 或使用 iconify
import { Icon } from '@iconify/vue'
```

### 6.2 颜色变量（支持深色模式）
```css
:root {
  /* Primary Colors */
  --color-primary: #8b5cf6;
  --color-primary-hover: #7c3aed;
  --color-primary-active: #6d28d9;
  
  /* Status Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Background */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  
  /* Text */
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  
  /* Border */
  --border-color: rgba(148, 163, 184, 0.2);
  --border-hover: rgba(139, 92, 246, 0.3);
}
```

## 七、可访问性（A11y）

### 7.1 ARIA标签
```vue
<button 
  aria-label="执行交易信号"
  aria-describedby="execute-warning"
>
  执行
</button>
<span id="execute-warning" class="sr-only">
  此操作将提交真实交易订单
</span>
```

### 7.2 键盘导航
```css
/* 键盘焦点指示 */
.btn:focus-visible {
  outline: 3px solid #8b5cf6;
  outline-offset: 2px;
}

/* 隐藏鼠标焦点，只保留键盘焦点 */
.btn:focus:not(:focus-visible) {
  outline: none;
}
```

### 7.3 屏幕阅读器
```vue
<div role="status" aria-live="polite" aria-atomic="true">
  {{ loadingMessage }}
</div>
```

## 八、测试场景

### 8.1 设备测试清单
- [ ] iPhone SE (375×667) - 最小移动设备
- [ ] iPhone 14 (390×844) - 常见移动设备
-[ ] iPhone 14 Pro Max (430×932) - 大屏手机
- [ ] iPad Air (820×1180) - 平板竖屏
- [ ] iPad Pro 12.9" (1024×1366) - 大平板
- [ ] MacBook Air (1440×900) - 小笔记本
- [ ] 1080p (1920×1080) - 标准显示器
- [ ] 2K (2560×1440) - 高分辨率显示器

### 8.2 交互测试
- [ ] 所有按钮可点击/触摸
- [ ] 复选框可正常勾选
- [ ] 表单输入流畅
- [ ] 横向滚动顺畅
- [ ] 长按菜单正常
- [ ] 滑动操作响应
- [ ] 页面过渡流畅
- [ ] 无意外的水平滚动

### 8.3 性能测试
- [ ] 首屏加载 <2s
- [ ] 交互响应 <100ms
- [ ] 滚动帧率 ≥60fps
- [ ] Lighthouse评分 ≥80
- [ ] 内存占用合理

## 九、设计资源

### 9.1 在线工具
- **响应式测试**: Chrome DevTools, Responsively App
- **颜色对比度**: WebAIM Contrast Checker
- **触摸目标检查**: Google Search Console Mobile Usability
- **性能测试**: Lighthouse, WebPageTest

### 9.2 参考指南
- Apple Human Interface Guidelines (iOS)
- Material Design Guidelines (Android)
- WCAG 2.1 Accessibility Guidelines
- MDN Web Docs - Responsive Design

---

**文档版本**: v1.0  
**创建日期**: 2026-02-14  
**设计负责人**: UI/UX Team  
**评审状态**: Ready for Implementation
