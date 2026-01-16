# 前端页面改造：组件清单与 UI 原型结构

> 适用范围：个人交易版本（基于 `PRD_PERSONAL_TRADING.md`）
> 文档版本：v1.0
> 日期：2026-01-16

---

## 1. 页面改造范围总览

- 行为评分页（`BehaviorScorePage.vue`）
- 持仓评估页（`PositionsPage.vue`）
- 宏观风险页（`MacroRiskPage.vue`）
- 潜在机会页（`OpportunitiesPage.vue`）→ 执行列表
- API 监控页（`ApiMonitoringPage.vue`）→ 系统健康页
- 首页仪表盘（`App.vue` / `Dashboard` 入口，如已存在可复用）

---

## 2. 组件清单（新增/改造/移除）

### 2.1 行为评分页（BehaviorScorePage）

**改造目标**：简化指标 + 突出“交易计划偏离”。

#### 行为评分页 - 新增组件

- `PlanDeviationSummaryCard.vue`：计划偏离总览（偏离次数/偏离原因）

#### 行为评分页 - 改造组件

- `BehaviorGuideline.vue`：文案调整为“纪律与执行”
- `RiskSummaryCard.vue`（如复用）：减少指标项

#### 行为评分页 - 移除/隐藏

- 低价值指标模块（如非核心评分细项）

---

### 2.2 持仓评估页（PositionsPage）

**改造目标**：增加“风险预算占用率/计划偏离度”。

#### 持仓评估页 - 新增组件

- `BudgetUtilizationBadge.vue`：风险预算占用率标签
- `PlanDeviationTag.vue`：计划偏离标识

#### 持仓评估页 - 改造组件

- `PositionScoreCard.vue`：新增预算占用与计划偏离区域
- `TrendSnapshotCard.vue`：保持现有结构，仅做文案优化

#### 持仓评估页 - 移除/隐藏

- 暂无

---

### 2.3 宏观风险页（MacroRiskPage）

**改造目标**：降级为“宏观提醒摘要”。

#### 宏观风险页 - 新增组件

- `MacroRiskDigestCard.vue`：宏观摘要卡片（等级/一句话摘要）

#### 宏观风险页 - 改造组件

- `MacroRiskDashboard.vue`：仅保留摘要与等级

#### 宏观风险页 - 移除/隐藏

- 详细风险分解、长列表事件详情（默认折叠）

---

### 2.4 执行列表页（由 OpportunitiesPage 改造）

**改造目标**：从“机会扫描”变为“执行列表（匹配计划）”。

#### 执行列表页 - 新增组件

- `ExecutionListHeader.vue`：计划过滤/排序/优先级
- `PlanMatchTag.vue`：是否匹配计划

#### 执行列表页 - 改造组件

- `OpportunityCard.vue` → `ExecutionItemCard.vue`
  - 保留核心评分
  - 增加“计划匹配理由”

#### 执行列表页 - 移除/隐藏

- “大规模扫描结果”与非计划相关标签

---

### 2.5 系统健康页（替代 ApiMonitoringPage）

**改造目标**：简化监控为“是否可用”。

#### 系统健康页 - 新增组件

- `SystemHealthCard.vue`：服务状态、最近更新时间、重试按钮

#### 系统健康页 - 改造组件

- `ApiMonitoringPage.vue` 重构为 `SystemHealthPage.vue`

#### 系统健康页 - 移除/隐藏

- 详细 API 调用统计、错误日志、限频策略

---

## 3. UI 原型结构（页面结构树）

### 3.1 行为评分页

```text
[PageHeader]
  - 标题 + 窗口天数
[PlanDeviationSummaryCard]  // 新
[BehaviorScoreCorePanel]    // 简化评分
[BehaviorGuideline]         // 文案改
```

---

### 3.2 持仓评估页

```text
[PageHeader] + [刷新按钮]
[SummaryBar]  // 原有保留
[PositionsGrid]
  - PositionScoreCard
      - BudgetUtilizationBadge  // 新
      - PlanDeviationTag        // 新
      - TrendSnapshotCard       // 原有
[PositionsGuideline]
```text

---

### 3.3 宏观风险页（摘要化）

```text
[PageHeader]
[MacroRiskDigestCard]  // 新
[OptionalDetailAccordion]  // 折叠
```text

---

### 3.4 执行列表页（机会页改造）

```text
[PageHeader]
[ExecutionListHeader]  // 计划过滤/排序
[ExecutionListGrid]
  - ExecutionItemCard (原 OpportunityCard 改造)
      - PlanMatchTag
      - 计划匹配理由
```text

---

### 3.5 系统健康页

```text
[PageHeader]
[SystemHealthCard]
  - 状态
  - 最近更新时间
  - 重试按钮
```

---

## 4. 页面-组件映射表（速查）

| 页面 | 主要组件 | 新增 | 改造 | 移除 |
| --- | --- | --- | --- | --- |
| 行为评分 | `BehaviorGuideline`, `PlanDeviationSummaryCard` | ✅ | ✅ | 部分细项 |
| 持仓评估 | `PositionScoreCard`, `BudgetUtilizationBadge` | ✅ | ✅ | - |
| 宏观风险 | `MacroRiskDigestCard` | ✅ | ✅ | 详情模块 |
| 执行列表 | `ExecutionItemCard`, `PlanMatchTag` | ✅ | ✅ | 扫描详情 |
| 系统健康 | `SystemHealthCard` | ✅ | ✅ | API 监控细节 |

---

## 5. 组件命名与文件建议

- 新增组件统一放置：`src/components/`
- 页面级文件保持原路径：`src/views/`
- 如需新页面：`SystemHealthPage.vue`

---

## 6. 后续落地建议

- 先改造页面结构与文案
- 再接入新增字段（计划偏离、预算占用率）
- 最后补充交互（提醒、折叠、过滤）
