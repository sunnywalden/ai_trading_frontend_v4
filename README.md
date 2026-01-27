# AI Trading Frontend V4

> AI 量化交易系统前端控制台 - 基于 Vue 3 + TypeScript + Vite 构建的实时风险监控与行为分析仪表盘

## 📋 项目概览

这是 **ai_trading_backend_v8** 项目的前端控制台，提供：

- 🎯 **实时系统状态监控**：查看后端运行模式（DRY_RUN / REAL）及健康状态
- 📊 **Greeks 风险水位可视化**：Delta、Gamma、Vega、Theta 四大风险因子的实时水位展示
- 🧠 **标的行为画像**：基于历史交易数据的行为评分（卖飞评分、过度交易、报复性交易等）
- 🚀 **一键自动对冲**：直接触发后端自动对冲引擎执行对冲策略
- 🔄 **行为评分重算**：支持动态调整统计窗口天数并重新计算行为评分
- 📌 **执行列表**：基于计划与评分筛选机会标的
- 🌍 **宏观提醒**：宏观风险摘要与告警
- 🧭 **交易计划**：入场/止损/止盈与目标仓位管理
- 🤖 **AI 建议**：结构化请求生成建议与订单草案

## 🛠 技术栈

- **框架**：Vue 3（Composition API）
- **语言**：TypeScript
- **构建工具**：Vite 5.x
- **HTTP 客户端**：Axios
- **样式**：原生 CSS（支持 scoped 样式）

## 📦 项目结构

```text
ai_trading_frontend_v4/
├── index.html              # 应用入口 HTML
├── package.json            # 项目依赖和脚本
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts          # Vite 构建配置（含后端 API 代理）
├── src/
│   ├── main.ts             # Vue 应用入口
│   ├── App.vue             # 主应用组件（布局 + 状态管理）
│   ├── style.css           # 全局样式
│   ├── api/
│   │   └── client.ts       # API 客户端（后端接口封装）
│   └── components/
│       ├── RiskSummaryCard.vue      # 系统状态卡片
│       ├── GreeksWaterLevel.vue     # Greeks 风险水位图
│       └── SymbolBehaviorCard.vue   # 标的行为画像卡片
└── README.md               # 项目文档
```

## 🚀 快速开始

### 前置要求

- **Node.js**: >= 16.x
- **npm**: >= 7.x（或使用 yarn/pnpm）
- **后端服务**：确保 `ai_trading_backend_v8` 项目已启动并运行在 `http://127.0.0.1:8088`

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将启动在 `http://localhost:5173`，并自动代理 `/api` 请求到后端服务 `http://127.0.0.1:8088`。

### 构建生产版本

```bash
npm run build
```

### 身份认证（登录）

自 v8 后端默认启用认证，前端已适配登录流程：

- 登录页：`/login`（输入管理员 `username` 与 `password`）
- 登录接口：`POST /api/v1/login`（表单提交，返回 `access_token`）
- 前端会把 token 存入 `localStorage` 或 `sessionStorage`（取决于是否勾选“记住我”）并自动把 `Authorization: Bearer <token>` 注入到后续的 API 请求中
- 在侧边栏会显示当前登录用户名与 token 的剩余有效期（从 JWT 解码得到，仅做展示），当 token 小于 5 分钟时会出现即将过期警示，过期后会自动登出。
- 点击侧边栏的用户名/头像可打开“管理员信息”弹窗，查看 token payload、复制 raw token、登出等操作（仅用于调试与内部运维）。
- 支持主题切换（深色/浅色），用户设置会保存在浏览器并在页面应用
- 若后端返回 401，前端会清除 token 并跳转到 `/login`

### 测试（单元 + E2E）

- 单元测试（Vitest）
  - 安装依赖：`npm install`
  - 运行：`npm run test:unit` 或 `npm run test`
- E2E（Cypress）
  - 启动前端：`npm run dev`（保持在 `http://localhost:5173`）
  - 打开 Cypress：`npm run cypress:open` 或 在 CI 中运行 `npm run test:e2e`
  - 已包含示例测试：登录流与 token 即将过期横幅验证

登录口令只从运行环境读取，不要写入仓库或示例。生产环境请通过后端配置认证并使用 HTTPS。

构建产物将输出到 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 🔌 后端 API 集成

> 文档索引：更多文档请查看 `docs/README.md`（包含 UI/UX、实现总结、监控与部署等文档快速导航）

前端通过 Vite 代理与后端通信，所有 `/api` 请求会被转发到后端服务：

```typescript
// vite.config.ts
proxy: {
  "/api": {
    target: "http://127.0.0.1:8088",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, "")
  }
}
```

### 主要 API 端点

| 端点 | 方法 | 说明 |
| ------ | ------ | ------ |
| `/health` | GET | 获取系统健康状态和运行模式 |
| `/api/v1/run-auto-hedge-once` | POST | 执行一次自动对冲 |
| `/api/v1/ai/state` | GET | 获取 AI 风控状态（限额、暴露、行为评分） |
| `/api/v1/admin/behavior/rebuild` | POST | 重新计算行为评分（支持窗口天数参数） |

### API 数据结构示例

```typescript
// AI 状态响应
interface AiStateResponse {
  trade_mode: string;                        // 交易模式
  limits: {
    max_order_notional_usd: number;          // 最大单笔订单金额
    max_total_gamma_pct: number;             // Gamma 限额百分比
    max_total_vega_pct: number;              // Vega 限额百分比
    max_total_theta_pct: number;             // Theta 限额百分比
  };
  exposure: {
    equity_usd: number;                      // 账户权益
    total_delta_notional_usd: number;        // Delta 名义金额
    total_gamma_usd: number;                 // Gamma 暴露
    total_vega_usd: number;                  // Vega 暴露
    total_theta_usd: number;                 // Theta 暴露
    gamma_pct: number;                       // Gamma 占比
    vega_pct: number;                        // Vega 占比
    theta_pct: number;                       // Theta 占比
    // ... 更多字段
  };
  symbols: Record<string, {
    symbol: string;                          // 标的代码
    tier: string;                            // 风险等级（T1-T4）
    behavior_score: number;                  // 综合行为评分
    sell_fly_score: number;                  // 卖飞评分
    overtrade_score: number;                 // 过度交易评分
    revenge_score: number;                   // 报复性交易评分
    trade_count: number;                     // 统计窗口内交易笔数
    // ... 更多字段
  }>;
}
```

## 📊 核心功能

### 1. 系统状态监控（RiskSummaryCard）

- 显示后端运行模式（DRY_RUN / REAL）
- 提供一键刷新状态和执行自动对冲按钮
- 实时反馈操作结果

### 2. Greeks 风险水位（GreeksWaterLevel）

- **可视化展示**：4 个 Greeks 指标（Delta、Gamma、Vega、Theta）的当前暴露水位
- **颜色预警**：
  - 🟢 **绿色**：安全区（< 60% 限额）
  - 🟠 **橙色**：关注区（60% - 90% 限额）
  - 🔴 **红色**：警戒区（> 90% 限额）
- **动态比例**：进度条宽度对应当前暴露与风险限额的比例

### 3. 标的行为画像（SymbolBehaviorCard）

每个交易标的展示：

- **风险等级**：T1（核心）、T2、T3、T4（边缘）
- **行为评分**：
  - 行为评分：综合行为指标（0-100，越高越"躁动"）
  - 卖飞评分：提前获利了结导致的机会成本评分
  - 过度交易：交易频率与合理水平的偏离度
  - 报复性交易：亏损后立即加仓的情绪化交易次数
- **统计指标**：
  - 成交笔数
  - 卖飞次数
  - 卖飞成本占比
  - 过度交易指数
  - 报复性交易次数

**决策影响**：行为评分越高，系统对该标的的 ShockPolicy（震荡政策）和 EarningsPolicy（财报政策）越保守，自动对冲会倾向于减少裸暴露、增加保护性对冲。

### 4. 行为评分重算

- 支持调整统计窗口天数（7-365 天）
- 点击"重新计算行为评分"按钮触发后端重算
- 重算完成后自动刷新 AI 状态展示最新结果

## 🎨 UI 设计特点

- **深色主题**：渐变背景 + 半透明卡片，适合长时间监控
- **侧边栏导航**：固定宽度侧边栏展示项目信息
- **响应式布局**：使用 Grid 布局，自适应不同屏幕尺寸
- **实时状态反馈**：按钮禁用、加载提示、操作结果消息
- **颜色语义化**：绿色（安全）、橙色（警告）、红色（危险）、蓝色（信息）

## 🔧 配置说明

### Vite 配置（vite.config.ts）

```typescript
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,                              // 开发服务器端口
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",     // 后端服务地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
});
```

### TypeScript 配置（tsconfig.json）

项目使用严格的 TypeScript 配置，确保类型安全。所有组件和 API 接口都有完整的类型定义。

## 📈 数据流说明

```text
┌─────────────┐       HTTP GET        ┌──────────────────┐
│   Vue 组件   │ ─────────────────────>│  后端 API        │
│  (前端页面)  │                        │  (FastAPI)       │
└─────────────┘                        └──────────────────┘
      │                                        │
      │                                        │
      │        JSON 响应 (AI 状态数据)          │
      │<───────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  数据渲染                                            │
│  - RiskSummaryCard: 系统状态 + 操作按钮              │
│  - GreeksWaterLevel: Greeks 风险水位可视化           │
│  - SymbolBehaviorCard: 每个标的的行为画像            │
└─────────────────────────────────────────────────────┘
```

## 🧪 开发建议

### 组件扩展

如需添加新的可视化组件：

1. 在 `src/components/` 创建新的 `.vue` 文件
2. 在 `src/api/client.ts` 中添加对应的 API 接口和类型定义
3. 在 `App.vue` 中导入并使用新组件
4. 确保样式使用 `scoped` 避免污染全局样式

### API 调试

使用浏览器开发者工具的 Network 面板查看 API 请求：

```bash
# 检查后端健康状态
GET http://localhost:5173/health

# 查看 AI 状态
GET http://localhost:5173/api/v1/ai/state
```

### 状态管理

当前项目使用组件内部状态（`ref`、`reactive`），适合小型应用。如需扩展到更复杂的状态管理，建议引入 Pinia：

```bash
npm install pinia
```

## 🐛 常见问题

### 1. 无法连接后端服务

**问题**：前端显示"获取状态失败"

**解决方案**：

- 确认后端服务已启动：`http://127.0.0.1:8000/health`
- 检查 Vite 代理配置中的 `target` 地址是否正确
- 查看浏览器控制台的网络请求错误详情

### 2. 行为评分数据不更新

**问题**：点击"重新计算行为评分"后数据未变化

**解决方案**：

- 检查后端日志确认计算是否成功
- 确认后端 `/api/v1/admin/behavior/rebuild` 接口返回正确
- 尝试手动刷新页面或点击"刷新状态"按钮

### 3. 样式显示异常

**问题**：颜色或布局不正确

**解决方案**：

- 清除浏览器缓存
- 重启开发服务器：`Ctrl+C` 后重新 `npm run dev`
- 检查浏览器控制台是否有 CSS 加载错误

## 📝 版本历史

- **v4.0**（当前版本）
  - 前后端物理分离架构
  - 使用 Vue 3 + TypeScript 重构
  - 新增行为评分重算功能
  - 改进 Greeks 风险水位可视化
  - 优化响应式布局和深色主题

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 许可证

本项目仅供学习和研究使用，请勿用于实际交易。

## 🔗 相关项目

- [ai_trading_backend_v8](../ai_trading_backend_v8) - 后端 AI 风控与对冲引擎

## 📧 联系方式

如有疑问，请通过 Issue 或 Pull Request 与我们联系。

---

**⚠️ 风险提示**：本系统仅供演示和学习用途，不构成投资建议。量化交易存在风险，请谨慎使用并充分测试。
