# 前端 UI/UX 设计文档

> **AI量化交易闭环系统** - Frontend Design  
> 版本：V9.0 | 更新日期：2026-02-13

---

## 1. 设计理念

### 1.1 核心理念

- **一屏全览**：Dashboard 首页一屏知晓关键信息
- **闭环体验**：信号 → 计划 → 执行 → 复盘在系统内完成
- **实时感知**：WebSocket 驱动的实时更新
- **极简操作**：核心流程 ≤ 5 步

### 1.2 视觉风格

- **深色终端风格**：Bloomberg Terminal 审美
- **主色调**：#1a1a2e（深蓝黑）+ #00ff88（霓虹绿）
- **强调色**：#ff6b6b（告警红）+ #ffd93d（警告黄）
- **字体**：Consolas / Monaco（等宽字体）

---

## 2. 技术栈

- **框架**：Vue 3 (Composition API)
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **HTTP 客户端**：Axios
- **图表库**：ECharts 5.4+
- **构建工具**：Vite 5.0
- **CSS**：Scoped CSS + CSS Variables
- **TypeScript**：5.0+

---

## 3. 信息架构

### 3.1 导航结构

```
交易仪表盘 (Dashboard) ← 首页
├── 核心功能
│   ├── 交易计划 (Plans)
│   ├── 交易日志 (Journal)
│   └── 股票分析 (AI Advisor)
├── 分析工具
│   ├── 市场热点 (Hotspots)
│   ├── 持仓评估 (Positions)
│   ├── 宏观分析 (Macro)
│   └── 策略筛选 (Opportunities)
├── 风险管理
│   ├── 行为评分 (Behavior)
│   ├── 资金曲线 (Equity)
│   └── 价格告警 (Alerts)
└── 系统监控
    ├── API 监控 (API Monitoring)
    └── 系统健康 (System Health)
```

### 3.2 页面层级

| 页面 | 路由 | 权限 | 说明 |
|------|------|------|------|
| 交易仪表盘 | `/dashboard` | 需登录 | 首页，核心数据聚合 |
| AI 评估 | `/ai-advisor` | 需登录 | AI 交易决策助手 |
| 交易计划 | `/plans` | 需登录 | 计划管理（创建/执行/监控） |
| 交易日志 | `/journal` | 需登录 | 交易复盘与自我评价 |
| 市场热点 | `/hotspots` | 需登录 | 热门赛道与个股 |
| 持仓评估 | `/positions` | 需登录 | 技术+基本面评估 |
| 宏观分析 | `/macro` | 需登录 | 地缘政治+经济指标 |
| 策略筛选 | `/opportunities` | 需登录 | 多因子选股 |
| 行为评分 | `/behavior` | 需登录 | 交易坏习惯识别 |
| 资金曲线 | `/equity` | 需登录 | 净值走势与回撤 |
| 价格告警 | `/alerts` | 需登录 | 条件触发推送 |
| 登录 | `/login` | 公开 | JWT 认证 |

---

## 4. 页面设计详述

### 4.1 交易仪表盘 (Dashboard V2)

**设计目标**：一屏即可完成核心决策

**布局**：

```
┌──────────────────────────────────────────────────┐
│ 📈 Trading Dashboard             [自动刷新: 30s] │
├────────────┬─────────────┬─────────────┬─────────┤
│ 💰 总权益   │ 💵 今日盈亏  │ 📋 计划执行率 │ ⚠️ 风险 │
│ $125,430   │ +$1,230     │ 3/5 (60%)   │ MEDIUM │
│ +2.3% MTD  │ +0.98%      │ ⚠️ 低于80%  │ 🟡     │
├────────────┴─────────────┴─────────────┴─────────┤
│ 🌊 Greeks 水位                                    │
│ Delta ████████░░ 72%  Gamma ██░░░░░░░░ 18%       │
│ Vega  █████░░░░░ 45%  Theta ███░░░░░░░ 28%       │
├──────────────────────────────────────────────────┤
│ 📈 资金曲线（近30天）                              │
│ ECharts 折线图：我的组合 vs SPY 基准               │
├──────────────────────────────────────────────────┤
│ 🔔 实时信号 & 待办                                │
│ ● AAPL 触及止损位 $178.50    [查看计划] 2min ago │
│ ● NVDA MACD金叉信号           [查看详情] 15m ago  │
│ ● 2 个计划今日到期            [处理]             │
│ ● TSLA 价格告警: 突破 $250   [查看] 1h ago       │
└──────────────────────────────────────────────────┘
```

**交互规范**：
- 自动刷新：每 30s 通过 WebSocket 或轮询更新
- Greeks 超限告警：>80% 红色闪烁
- 信号列表：按时间倒序，最多显示 10 条
- 资金曲线：支持 30D/90D/YTD/ALL 切换

**API 调用**：
- GET `/api/v1/dashboard/v2/full` - 完整数据
- GET `/api/v1/dashboard/v2/quick` - 快速更新（仅核心KPI）

### 4.2 AI 交易决策 (AI Advisor)

**功能**：输入标的，获取 AI 综合决策

**UI 流程**：

```
┌──────────────────────────────────────────────┐
│ 🤖 AI 交易决策                                │
├──────────────────────────────────────────────┤
│ [输入框] AAPL, TSLA, NVDA     [开始评估]     │
│                                              │
│ 热门标的快速选择：                            │
│ [AAPL] [TSLA] [NVDA] [META] [MSFT] [GOOGL]  │
├──────────────────────────────────────────────┤
│ ⏳ 评估中... (预计 30s)                      │
│ ████████████░░░░░░░░ 60%                    │
├──────────────────────────────────────────────┤
│ ✅ AAPL - 买入建议                           │
│ 方向: 做多 ↑  置信度: 75%  风险: MEDIUM      │
│ 入场价: $178.50  止损: $175.00  止盈: $185.00│
│ 建议仓位: 15%   风险收益比: 1:2.3            │
│                                              │
│ 综合判断：技术面强势，基本面健康...           │
│ [创建计划] [执行交易] [查看详细分析]          │
├──────────────────────────────────────────────┤
│ ⚠️ TSLA - 观望                               │
│ 方向: 空头 ↓  置信度: 55%  风险: HIGH        │
│ 理由：风险收益比不足1:2，建议等待更好时机...   │
└──────────────────────────────────────────────┘
```

**评估结果卡片**：
- 颜色编码：
  - 绿色边框：BUY
  - 红色边框：SELL
  - 黄色边框：HOLD
  - 灰色边框：AVOID
- 置信度可视化：进度条 + 数字
- 多维分析折叠面板：技术面/基本面/K线分析

**API 调用**：
- POST `/api/v1/ai-advisor/evaluate` - 批量评估
- GET `/api/v1/ai-advisor/history` - 历史评估

### 4.3 交易计划 (Plans)

**功能**：计划生命周期管理

**列表视图**：

```
┌─────────────────────────────────────────────┐
│ 🧭 交易计划                      [新建计划] │
├──────┬──────┬──────┬──────┬──────┬─────────┤
│筛选： │全部 │待执行│执行中│已完成│已取消/过期│
├─────────────────────────────────────────────┤
│ ● AAPL 买入 - 待执行               [执行]   │
│   入场: $178.50  止损: $175  止盈: $185     │
│   创建: 2h ago  来源: AI建议                │
│   [编辑] [取消] [查看详情]                   │
├─────────────────────────────────────────────┤
│ ● NVDA 卖出 - 执行中               [监控]   │
│   当前价: $520.30  目标: $530  进度: 73%    │
│   创建: 1d ago  来源: 手动                  │
│   [部分平仓] [全部平仓] [调整止损]           │
└─────────────────────────────────────────────┘
```

**创建/编辑表单**：
- 标的选择（支持搜索）
- 方向：买入/卖出
- 入场价/止损/止盈
- 数量/仓位比例
- 自动执行开关
- 备注说明

**API 调用**：
- GET `/api/v1/ai-advisor/plans` - 获取计划列表
- POST `/api/v1/ai-advisor/execute` - 执行计划
- DELETE `/api/v1/ai-advisor/plans/{id}` - 删除计划

### 4.4 交易日志 (Journal)

**功能**：记录交易过程，支持 AI 复盘

**UI 布局**：

```
┌────────────────────────────────────────────┐
│ 📝 交易日志          [新建] [AI周报] [导出]│
├──────┬──────┬──────┬──────────────────────┤
│筛选： │全部 │草稿 │已完成│已AI复盘          │
├────────────────────────────────────────────┤
│ 2026-02-08  AAPL  买入→卖出  +$450  ⭐⭐⭐⭐│
│ 情绪: 😌 calm  错误标签: 无                │
│ 自评: 执行质量良好，按计划入场...          │
│ AI复盘: 入场时机精准，止盈略显保守，建议... │
│ [编辑] [AI复盘] [删除]                     │
├────────────────────────────────────────────┤
│ 2026-02-07  NVDA  买入(持有)  -$120  ⭐⭐⭐ │
│ 情绪: 😰 anxious  错误标签: 追高           │
│ 自评: 入场偏高，未等待回调...              │
│ AI复盘: 入场偏离计划价3.2%，建议设置价格... │
└────────────────────────────────────────────┘
```

**编辑表单**：
- 标的/方向/价格/数量
- 情绪状态：calm/anxious/revenge/fomo/greedy
- 错误标签：sell_fly/chase_high/late_stop_loss
- 经验教训（文本域）
- 执行质量自评（1-5星）

**AI 复盘**：
- 点击"AI复盘"按钮触发
- 调用 AI 分析交易质量
- 提供改进建议

### 4.5 资金曲线 (Equity)

**功能**：净值走势和回撤分析

**UI 布局**：

```
┌───────────────────────────────────────────┐
│ 💰 资金曲线 & PnL 归因                     │
├─────────────┬──────────────┬──────────────┤
│ 总收益      │ 最大回撤      │ Sharpe Ratio │
│ +$12,340    │ -4.3%        │ 1.45         │
│ (+10.2%)    │              │              │
├─────────────┴──────────────┴──────────────┤
│ 📈 净值曲线              [30D][90D][ALL]   │
│ ECharts 折线图: 我的组合 vs SPY            │
│ 回撤区间高亮标注                            │
├───────────────────────────────────────────┤
│ 📊 月度盈亏                                │
│ ECharts 柱状图: 每月已实现盈亏             │
├───────────────────────────────────────────┤
│ 🔍 PnL 归因            [按标的][按策略]     │
│ ECharts 饼图/旭日图                        │
└───────────────────────────────────────────┘
```

**图表交互**：
- 时间范围切换：30D/90D/YTD/ALL
- 鼠标悬停显示详细数据
- 回撤区间高亮（红色阴影）
- 支持缩放和平移

**API 调用**：
- GET `/api/v1/equity/snapshots` - 权益快照
- GET `/api/v1/equity/pnl-attribution` - PnL 归因

### 4.6 持仓评估 (Positions)

**功能**：技术面+基本面综合评估

**列表视图**：

```
┌────────────────────────────────────────────┐
│ 📊 持仓评估                    [刷新全部]   │
├──────┬───────┬───────┬──────┬──────────────┤
│标的  │数量   │成本   │浮盈  │综合评分      │
├──────┼───────┼───────┼──────┼──────────────┤
│AAPL  │100    │$178.5 │+$340 │85 ⭐⭐⭐⭐⭐│
│      │       │       │      │趋势: 强势↑   │
│      │       │       │      │[详情]        │
├──────┼───────┼───────┼──────┼──────────────┤
│NVDA  │50     │$520.0 │-$120 │62 ⭐⭐⭐   │
│      │       │       │      │趋势: 弱势↓   │
│      │       │       │      │[详情]        │
└──────┴───────┴───────┴──────┴──────────────┘
```

**详情页**：
- 技术分析卡片：
  - 趋势/RSI/MACD/布林带
  - 支撑阻力位
  - AI 技术面摘要
- 基本面卡片：
  - PE/PS/增长率/ROE
  - 估值评分
  - AI 基本面摘要
- K线图表（可选）

**API 调用**：
- GET `/api/v1/positions/assessment` - 持仓列表
- GET `/api/v1/positions/{symbol}/technical` - 技术分析
- GET `/api/v1/positions/{symbol}/fundamental` - 基本面

### 4.7 行为评分 (Behavior)

**功能**：识别交易坏习惯

**UI 布局**：

```
┌───────────────────────────────────────────┐
│ 🎯 行为评分 & 交易纪律                     │
├─────────────┬──────────────┬──────────────┤
│ 纪律性评分  │ 卖飞评分      │ 综合健康度   │
│ 78/100      │ 85/100       │ 82/100       │
│ ⭐⭐⭐⭐     │ ⭐⭐⭐⭐      │ ⭐⭐⭐⭐    │
├─────────────┴──────────────┴──────────────┤
│ 📊 行为趋势（近90天）                      │
│ ECharts 折线图: 纪律性/卖飞/健康度走势     │
├───────────────────────────────────────────┤
│ 🔍 坏习惯分析                              │
│ ┌─────────────────────────────────────┐   │
│ │ 卖飞 (Sell Fly)                      │   │
│ │ 次数: 3  占比: 15%  趋势: 改善↓      │   │
│ │ 最近案例: AAPL (+12% after sold)     │   │
│ └─────────────────────────────────────┘   │
│ ┌─────────────────────────────────────┐   │
│ │ 追高 (Chase High)                    │   │
│ │ 次数: 2  占比: 10%  趋势: 稳定→      │   │
│ └─────────────────────────────────────┘   │
└───────────────────────────────────────────┘
```

**改进建议**：
- AI 生成的个性化建议
- 优秀交易案例展示
- 纪律清单 Checklist

**API 调用**：
- GET `/api/v1/behavior/score` - 行为评分
- GET `/api/v1/behavior/trends` - 趋势数据
- GET `/api/v1/behavior/patterns` - 模式识别

---

## 5. 组件设计

### 5.1 通用组件

#### KPICard - KPI 卡片

```vue
<template>
  <div class="kpi-card" :class="variant">
    <div class="kpi-icon">{{ icon }}</div>
    <div class="kpi-content">
      <div class="kpi-label">{{ label }}</div>
      <div class="kpi-value">{{ value }}</div>
      <div class="kpi-change" :class="changeClass">
        {{ change }}
      </div>
    </div>
  </div>
</template>
```

**Props**：
- icon: string - 图标 emoji
- label: string - 标签
- value: string | number - 主值
- change?: string - 变化值（可选）
- variant?: 'default' | 'success' | 'danger' | 'warning'

#### TrendChart - 趋势图表

```vue
<template>
  <div class="trend-chart">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
// ECharts 初始化逻辑
</script>
```

**Props**：
- data: Array - 数据数组
- type: 'line' | 'bar' | 'pie' - 图表类型
- options?: Object - ECharts 配置

#### SignalCard - 信号卡片

```vue
<template>
  <div class="signal-card" :class="signal.action">
    <div class="signal-header">
      <span class="symbol">{{ signal.symbol }}</span>
      <span class="action">{{ actionLabel(signal.action) }}</span>
      <span class="time">{{ formatTime(signal.time) }}</span>
    </div>
    <div class="signal-content">
      {{ signal.content }}
    </div>
    <div class="signal-actions">
      <button @click="viewDetail">查看详情</button>
      <button @click="createPlan">创建计划</button>
    </div>
  </div>
</template>
```

### 5.2 业务组件

#### PositionCard - 持仓卡片
#### PlanCard - 计划卡片
#### JournalEditor - 日志编辑器
#### DecisionMatrix - AI 决策矩阵

---

## 6. 状态管理 (Pinia)

### 6.1 Store 设计

```typescript
// stores/dashboardV2.ts
export const useDashboardV2Store = defineStore('dashboardV2', () => {
  const fullData = ref<DashboardV2Response | null>(null);
  const quickData = ref<QuickUpdateData | null>(null);
  const loading = ref(false);
  
  // 计算属性
  const totalEquity = computed(() => fullData.value?.account.total_equity);
  const todayPnL = computed(() => fullData.value?.pnl.today_pnl);
  
  // 操作
  async function loadFull() {
    loading.value = true;
    const { data } = await fetchDashboardV2Full();
    fullData.value = data;
    loading.value = false;
  }
  
  async function loadQuick() {
    const { data } = await fetchDashboardV2Quick();
    quickData.value = data;
  }
  
  // 自动刷新
  let refreshTimer: NodeJS.Timeout | null = null;
  function startAutoRefresh() {
    loadFull();
    loadQuick();
    refreshTimer = setInterval(() => {
      loadQuick();
    }, 15000); // 15s 快速更新
  }
  
  return {
    fullData,
    quickData,
    loading,
    totalEquity,
    todayPnL,
    loadFull,
    loadQuick,
    startAutoRefresh
  };
});
```

### 6.2 其他 Store

- `useAuthStore` - 用户认证
- `usePlansStore` - 交易计划
- `usePositionsStore` - 持仓数据
- `useJournalStore` - 交易日志
- `useNotificationStore` - 通知推送

---

## 7. 路由设计

```typescript
// router/index.ts
const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardV2Page.vue'),
    meta: { requiresAuth: true, title: '交易仪表盘' }
  },
  {
    path: '/ai-advisor',
    name: 'AIAdvisor',
    component: () => import('@/views/AIAdvisorPage.vue'),
    meta: { requiresAuth: true, title: 'AI 交易决策' }
  },
  {
    path: '/plans',
    name: 'Plans',
    component: () => import('@/views/PlansPage.vue'),
    meta: { requiresAuth: true, title: '交易计划' }
  },
  {
    path: '/journal',
    name: 'Journal',
    component: () => import('@/views/JournalPage.vue'),
    meta: { requiresAuth: true, title: '交易日志' }
  },
  // ... 其他路由
];
```

---

## 8. 响应式设计

### 8.1 断点

```css
/* 移动端 */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* 平板 */
@media (min-width: 769px) and (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 桌面端 */
@media (min-width: 1025px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### 8.2 移动端适配

- 导航：折叠菜单（汉堡按钮）
- 卡片：单列布局
- 图表：自适应容器宽度
- 表单：触摸友好的输入控件

---

## 9. 性能优化

### 9.1 懒加载

- 路由级别代码分割
- 图表组件按需加载
- 图片懒加载

### 9.2 缓存策略

- API 响应缓存（Axios 拦截器）
- 组件级别缓存（keep-alive）
- 静态资源强缓存

### 9.3 虚拟滚动

- 大列表使用虚拟滚动（vue-virtual-scroller）
- 信号/计划/日志列表优化

---

## 10. 国际化 (i18n)

**支持语言**：
- 简体中文（默认）
- 英文（计划中）

**实现方式**：
```typescript
// i18n/zh-CN.ts
export default {
  dashboard: {
    title: '交易仪表盘',
    totalEquity: '总权益',
    todayPnL: '今日盈亏'
  }
};
```

---

## 11. 可访问性 (A11y)

- 语义化 HTML
- ARIA 标签
- 键盘导航支持
- 颜色对比度 ≥ 4.5:1
- 焦点可见性

---

## 12. 浏览器兼容性

**支持浏览器**：
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

**Polyfills**：
- 根据 browserslist 自动注入

---

## 附录

### A. 设计规范

**间距**：
- 基础单位：8px
- 卡片内边距：16px
- 卡片间距：24px

**圆角**：
- 小组件：4px
- 卡片：8px
- 按钮：6px

**阴影**：
```css
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.5);
```

### B. 颜色变量

```css
:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-card: #0f3460;
  
  --text-primary: #e0e0e0;
  --text-secondary: #a9a9a9;
  --text-muted: #6c757d;
  
  --accent-green: #00ff88;
  --accent-red: #ff6b6b;
  --accent-yellow: #ffd93d;
  --accent-blue: #4facfe;
  
  --border-color: #2c3e50;
}
```

### C. 参考文档

- PRODUCT.md - 产品需求文档
- API.md - API 接口文档
- BACKEND_DESIGN.md - 后端设计文档
