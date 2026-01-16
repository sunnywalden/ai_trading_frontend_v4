# 前后端开发任务拆解清单（结合当前后端实现）

> 适配个人交易版本（基于 `PRD_PERSONAL_TRADING.md`）
> 参考后端：`/Users/admin/IdeaProjects/ai_trading_backend_v8/backend`
> 文档版本：v1.0
> 日期：2026-01-16

---

## 1. 后端现有接口与模块概览（已实现）

### 1.1 主要路由入口

- `app/main.py`
  - `/health`
  - `/api/v1/ai/state`
  - `/api/v1/run-auto-hedge-once`
  - `/api/v1/admin/behavior/rebuild`
  - `/api/v1/admin/scheduler/jobs`
  - `/api/v1/admin/scheduler/jobs/{job_id}/pause`
  - `/api/v1/admin/scheduler/jobs/{job_id}/resume`
  - `/api/v1/admin/scheduler/jobs/{job_id}/schedule`

### 1.2 业务路由

- `app/routers/position_macro.py`
  - `GET /api/v1/positions/assessment`
  - `POST /api/v1/positions/refresh`
  - `GET /api/v1/positions/{symbol}/technical`
  - `GET /api/v1/positions/{symbol}/fundamental`
  - `GET /api/v1/macro/risk/overview`
  - `GET /api/v1/macro/monetary-policy`
  - `GET /api/v1/macro/geopolitical-events`
  - `POST /api/v1/macro/refresh`

- `app/routers/opportunities.py`
  - `GET /api/v1/opportunities/latest`
  - `GET /api/v1/opportunities/runs`
  - `GET /api/v1/opportunities/runs/{run_id}`
  - `POST /api/v1/opportunities/scan`

- `app/routers/api_monitoring.py`
  - `GET /api/v1/stats`
  - `GET /api/v1/stats/{provider}`
  - `GET /api/v1/report`
  - `GET /api/v1/rate-limit/{provider}`
  - `GET /api/v1/policies`
  - `GET /api/v1/policies/{provider}`
  - `GET /api/v1/monitoring/health`

---

## 2. 当前前端调用对齐情况（摘自 `src/api/client.ts`）

### 2.1 已对齐

- 持仓评估：`/v1/positions/assessment` ✅
- 单标的技术面：`/v1/positions/{symbol}/technical` ✅
- 单标的基本面：`/v1/positions/{symbol}/fundamental` ✅
- 刷新持仓：`/v1/positions/refresh` ✅
- 宏观风险概览：`/v1/macro/risk/overview` ✅
- 宏观政策：`/v1/macro/monetary-policy` ✅
- 地缘事件：`/v1/macro/geopolitical-events` ✅
- 宏观刷新：`/v1/macro/refresh` ✅
- 机会扫描：`/v1/opportunities/*` ✅
- API 监控：`/v1/monitoring/*` ✅
- 行为评分重建：`/v1/admin/behavior/rebuild` ✅
- 调度任务：`/v1/admin/scheduler/*` ✅
- 健康检查：`/health` ✅

### 2.2 个人交易版本需要新增或扩展

- 交易计划相关接口（目前后端无）
- 持仓评估字段扩展（预算占用率/计划偏离度）
- 行为评分字段扩展（纪律/计划偏离评分）

---

## 3. 前端开发任务拆解清单

### 3.1 页面级改造

- 行为评分页（`BehaviorScorePage.vue`）
  - 精简指标展示
  - 新增“计划偏离总览”卡片
  - 文案改为执行纪律导向

- 持仓评估页（`PositionsPage.vue`）
  - 新增预算占用率与计划偏离展示
  - `PositionScoreCard.vue` 增加标签区

- 宏观风险页（`MacroRiskPage.vue`）
  - 默认收敛为摘要 + 等级
  - 详细信息折叠

- 潜在机会页（`OpportunitiesPage.vue`）
  - 改为“执行列表”
  - 增加计划匹配标签

- API 监控页（`ApiMonitoringPage.vue`）
  - 替换为“系统健康”视图
  - 仅展示 `/monitoring/health` 状态

### 3.2 组件级改造

- 新增组件（占位）
  - `PlanDeviationSummaryCard.vue`
  - `BudgetUtilizationBadge.vue`
  - `PlanDeviationTag.vue`
  - `MacroRiskDigestCard.vue`
  - `ExecutionListHeader.vue`
  - `PlanMatchTag.vue`
  - `SystemHealthCard.vue`

- 改造组件
  - `PositionScoreCard.vue`
  - `OpportunityCard.vue` → `ExecutionItemCard.vue`

### 3.3 API 对接任务

- 持仓评估响应结构扩展：前端需要容错显示 `budget_utilization` / `plan_deviation`（后端未实现）
- 行为评分新增 `discipline_score` 或 `plan_deviation_score`（后端未实现）
- 计划接口上线后接入：计划卡片/执行列表过滤

---

## 4. 后端开发任务拆解清单

### 4.1 交易计划模块（新增）

- 路由：`app/routers/trading_plan.py`（新增）
- 接口：
  - `GET /api/v1/plan/list`
  - `POST /api/v1/plan/create`
  - `PATCH /api/v1/plan/{id}`
  - `DELETE /api/v1/plan/{id}`

- Schema：`app/schemas/trading_plan.py`
- Service：`app/services/trading_plan_service.py`
- Model：`app/models/trading_plan.py`

### 4.2 持仓评估扩展字段

- 在 `PositionsAssessmentResponse` 中增加：
  - `budget_utilization`（风险预算占用率）
  - `plan_deviation`（计划偏离度）

- 修改位置：
  - `app/schemas/position_assessment.py`
  - `app/services/position_scoring_service.py`
  - `app/routers/position_macro.py`

### 4.3 行为评分纪律指标

- 增加 `discipline_score` / `plan_deviation_score`
- 修改位置：
  - `app/services/behavior_scoring_service.py`
  - `app/schemas/ai_state.py`

### 4.4 机会与计划匹配

- 新增字段：计划匹配度、原因
- 修改位置：
  - `app/services/potential_opportunities_service.py`
  - `app/schemas/opportunities.py`

### 4.5 系统健康（API 监控精简）

- 已有：`GET /api/v1/monitoring/health`
- 建议：增加简化字段（`last_updated`）
  - 修改位置：`app/routers/api_monitoring.py`

---

## 5. 依赖与风险

- 交易计划模块是前端执行列表与计划卡片的核心依赖
- 预算与偏离字段需要业务规则定义（后端先提供占位策略）
- 机会匹配与计划匹配需要一致的“计划模型”

---

## 6. 交付建议

- 第一阶段：前端 UI 改造 + 后端新增字段占位
- 第二阶段：计划模块 CRUD + 计划匹配逻辑
- 第三阶段：行为评分纪律指标 + 复盘流程
