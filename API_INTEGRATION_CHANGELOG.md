# API 集成更新日志

## 更新日期: 2026-01-04

### 概述
根据后端API文档（ai_trading_backend_v8/API_DOCUMENTATION.md）对前端代码进行了全面更新，将所有API接口与后端V8版本对齐。

---

## 主要更新内容

### 1. API客户端配置 (src/api/client.ts)

#### 更新baseURL
- **旧配置**: `baseURL: "/api"`
- **新配置**: `baseURL: "http://localhost:8088"`
- **原因**: 直接连接到后端服务端口，便于开发调试

#### 新增接口类型定义

##### 持仓评估相关
- `PositionItem` - 单个持仓详情
- `PositionsSummary` - 持仓汇总信息
- `PositionsAssessmentResponse` - 持仓评估完整响应
- `TechnicalAnalysisResponse` - 技术分析响应
- `FundamentalAnalysisResponse` - 基本面分析响应

##### 宏观风险相关
- `MacroRiskOverviewResponse` - 宏观风险概览
- `MonetaryPolicyResponse` - 货币政策数据
- `GeopoliticalEventsResponse` - 地缘政治事件
- `SchedulerJobsResponse` - 定时任务状态

#### 新增API函数
```typescript
// 持仓评估
fetchPositionsAssessment(window_days?: number)
fetchTechnicalAnalysis(symbol, timeframe?, force_refresh?)
fetchFundamentalAnalysis(symbol, force_refresh?)
refreshPositions()

// 宏观风险
fetchMacroRiskOverview()
fetchMonetaryPolicy()
fetchGeopoliticalEvents(days?)
refreshMacroData()

// 系统管理
fetchSchedulerJobs()
pauseScheduler()
resumeScheduler()
```

---

### 2. 主应用更新 (src/App.vue)

#### 移除Demo数据
- 删除 `demoPositions` 数组
- 删除 `demoMacroRisk` 对象
- 所有数据现在通过真实API获取

#### 新增状态管理
```typescript
// 持仓评估数据
const positionsData = ref<PositionsAssessmentResponse | null>(null);
const positionsLoading = ref(false);
const positionsError = ref("");

// 宏观风险数据
const macroRiskData = ref<MacroRiskOverviewResponse | null>(null);
const macroLoading = ref(false);
const macroError = ref("");
```

#### 新增数据加载函数
- `loadPositionsData()` - 加载持仓评估数据
- `loadMacroRiskData()` - 加载宏观风险数据
- `onRefreshPositions()` - 刷新持仓数据
- `onRefreshMacro()` - 刷新宏观数据

#### 更新生命周期
```typescript
onMounted(() => {
  loadAiState();        // 行为评分
  loadPositionsData();  // 持仓评估
  loadMacroRiskData();  // 宏观风险
});
```

#### UI增强
- 添加刷新按钮
- 显示加载状态
- 显示错误信息
- 添加汇总信息栏（总持仓、总市值、总盈亏等）

---

### 3. 组件更新

#### PositionScoreCard (src/components/PositionScoreCard.vue)

**新增Props:**
```typescript
quantity?: number;         // 持仓数量
avgCost?: number;         // 平均成本
currentPrice?: number;     // 当前价格
unrealizedPnl?: number;   // 未实现盈亏
riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';  // 风险等级
```

**扩展recommendation类型:**
- 新增 `STRONG_BUY` 和 `STRONG_SELL`
- 原有: `BUY`, `HOLD`, `SELL`

**新增UI元素:**
- 持仓信息区块（数量、成本、价格、盈亏）
- 风险等级标识
- 盈亏颜色标识（绿色/红色）

#### MacroRiskDashboard (src/components/MacroRiskDashboard.vue)

**重构Props结构:**
- 旧方式: 扁平化的多个props
- 新方式: 单一 `data` prop，类型为 `MacroRiskOverviewResponse`

**新增展示区块:**
- AI 综合分析摘要
- 风险警报列表（INFO/WARNING/CRITICAL）
- 主要关注点列表
- 总体建议

**简化风险维度展示:**
- 保留5个维度的评分展示
- 移除详细指标（可通过专门接口获取）
- 聚焦于评分和描述

---

## API端点映射

### 后端V8 API → 前端函数

| 后端端点 | 前端函数 | 用途 |
|---------|---------|------|
| GET /health | fetchHealth() | 健康检查 |
| GET /api/v1/positions/assessment | fetchPositionsAssessment() | 持仓评估 |
| GET /api/v1/positions/{symbol}/technical | fetchTechnicalAnalysis() | 技术分析 |
| GET /api/v1/positions/{symbol}/fundamental | fetchFundamentalAnalysis() | 基本面分析 |
| POST /api/v1/positions/refresh | refreshPositions() | 刷新持仓数据 |
| GET /api/v1/macro/risk/overview | fetchMacroRiskOverview() | 宏观风险概览 |
| GET /api/v1/macro/monetary-policy | fetchMonetaryPolicy() | 货币政策 |
| GET /api/v1/macro/geopolitical-events | fetchGeopoliticalEvents() | 地缘政治 |
| POST /api/v1/macro/refresh | refreshMacroData() | 刷新宏观数据 |
| GET /admin/scheduler/jobs | fetchSchedulerJobs() | 查看定时任务 |

---

## 数据流更新

### 旧数据流
```
组件 → Demo数据（硬编码）
```

### 新数据流
```
组件 → 状态管理 → API调用 → 后端服务 → 数据库/第三方API
```

---

## 配置说明

### 后端要求
1. 后端服务需运行在 `http://localhost:8088`
2. 确保所有API端点已实现
3. 跨域配置需允许前端访问

### 前端配置
如需修改后端地址，编辑 `src/api/client.ts`:
```typescript
const api = axios.create({
  baseURL: "http://your-backend-url:port",
  timeout: 30000
});
```

---

## 新增样式类

### App.vue
- `.refresh-button` - 刷新按钮样式
- `.summary-bar` - 汇总信息栏
- `.summary-item` - 汇总项
- `.error-message` - 错误提示
- `.loading-message` - 加载提示
- `.info-message` - 信息提示

### PositionScoreCard.vue
- `.rec-strong-buy` / `.rec-strong-sell` - 强烈买卖建议
- `.risk-badge` - 风险标识
- `.position-info` - 持仓信息区块
- `.info-row` / `.info-label` / `.info-value` - 信息行样式

### MacroRiskDashboard.vue
- `.ai-summary-section` - AI分析摘要
- `.alerts-section` - 警报列表
- `.alert-item` - 单个警报
- `.key-concerns` - 关注点列表
- `.recommendations-section` - 建议区块

---

## 兼容性说明

### 向后兼容
- PositionScoreCard 组件保留了 `aiSummary` prop（虽然新API使用 `aiAdvice`）
- 所有新增字段都是可选的（使用 `?` 标记）

### 已移除
- Demo数据相关的常量和类型定义
- 旧的扁平化prop结构（MacroRiskDashboard）

---

## 测试建议

### 1. API连通性测试
```bash
# 检查后端服务
curl http://localhost:8088/health

# 测试持仓评估
curl http://localhost:8088/api/v1/positions/assessment

# 测试宏观风险
curl http://localhost:8088/api/v1/macro/risk/overview
```

### 2. 前端功能测试
1. 启动前端开发服务器
2. 检查三个标签页是否正常加载
3. 测试刷新按钮功能
4. 验证错误处理（关闭后端服务测试）
5. 检查数据展示是否正确

### 3. 边界情况测试
- 空持仓列表
- 网络错误
- 超时情况
- 无效数据格式

---

## 已知限制

1. **CORS问题**: 如果前端和后端在不同域，需要配置CORS
2. **超时设置**: 当前设置为30秒，大数据量可能需要调整
3. **错误处理**: 当前只做了基础错误提示，可考虑增强

---

## 下一步优化建议

1. **缓存策略**: 实现前端数据缓存，减少API调用
2. **实时更新**: 考虑使用WebSocket实现数据推送
3. **详细视图**: 为技术分析和基本面添加详情页面
4. **图表集成**: 添加技术指标图表和趋势可视化
5. **导出功能**: 支持导出持仓报告和风险分析
6. **通知系统**: 高风险警报的桌面通知

---

## 问题排查

### 问题1: 无法连接到后端
**检查**:
- 后端是否在运行
- 端口是否正确
- 防火墙设置

### 问题2: 数据加载失败
**检查**:
- 浏览器控制台错误
- 网络请求状态
- 后端日志

### 问题3: 界面显示异常
**检查**:
- 数据格式是否匹配
- 浏览器兼容性
- CSS是否正确加载

---

## 联系方式

如有问题或建议，请查看：
- 后端API文档: `/Users/admin/IdeaProjects/ai_trading_backend_v8/API_DOCUMENTATION.md`
- 项目设计文档: `POSITION_AND_MACRO_RISK_DESIGN.md`
