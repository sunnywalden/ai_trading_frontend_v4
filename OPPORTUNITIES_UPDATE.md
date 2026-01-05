# 潜在机会模块更新说明

## 更新日期
2026年1月5日

## 更新内容

### 1. API 类型定义调整 (src/api/client.ts)

根据后端 API 文档，更新了以下类型：

- **OpportunityItem**: 
  - 添加 `rank` 字段（推荐排名）
  - 添加 `current_price` 字段（当前价格）
  - 移除可选字段 `price_change_pct`

- **MacroSnapshot → MacroRisk**:
  - 重命名接口以匹配后端
  - 字段 `summary` → `risk_summary`

- **OpportunityRun**:
  - `run_id`: string → number
  - 添加 `run_key`, `status`, `min_score`, `max_results`, `force_refresh` 字段
  - `qualified_count` → `qualified_symbols`
  - `total_scanned` → `total_symbols`
  - `macro_snapshot` → `macro_risk`
  - notes.universe 添加 `cache_hit` 字段

- **OpportunityRunSummary**:
  - `run_id`: string → number
  - `qualified_count` → `qualified_symbols`
  - `total_scanned` → `total_symbols`

- **LatestOpportunitiesResponse**:
  - 从直接继承 OpportunityRun 改为嵌套结构: `{ status: string, latest: OpportunityRun | null }`

### 2. 页面组件更新 (src/views/OpportunitiesPage.vue)

- 更新所有字段引用以匹配新的 API 结构
- 修正 `loadLatestOpportunities` 函数处理嵌套响应结构
- 修正 `onViewRunDetail` 参数类型（string → number）
- 状态栏、历史记录、详情抽屉全部使用新字段名

### 3. 机会卡片组件增强 (src/components/OpportunityCard.vue)

- 添加排名徽章显示（#1, #2, #3）
- 显示当前股价
- 优化布局和视觉层次

### 4. 指南组件更新 (src/components/OpportunitiesGuideline.vue)

- 添加自动扫描说明（每日 20:30）
- 更新使用建议以反映自动化功能
- 强调手动扫描与自动扫描的区别

## 关键变化总结

| 项目 | 旧值 | 新值 |
|------|------|------|
| 运行ID类型 | string | number |
| 符合条件数 | qualified_count | qualified_symbols |
| 总扫描数 | total_scanned | total_symbols |
| 宏观快照 | macro_snapshot | macro_risk |
| 风险摘要字段 | summary | risk_summary |
| 响应结构 | 直接返回 OpportunityRun | { status, latest } |

## API 端点保持不变

- `GET /api/v1/opportunities/latest`
- `POST /api/v1/opportunities/scan`
- `GET /api/v1/opportunities/runs`
- `GET /api/v1/opportunities/runs/{run_id}`

## 后端特性

- 每日 20:30 (北京时间) 自动扫描科技股
- 幂等键机制：同日多次请求返回缓存
- 宏观风险联动：HIGH/EXTREME 时自动提高阈值到 80 分
- 兜底股票池：数据源限流时使用本地维护列表

## 兼容性

✅ 所有更新已完成，无编译错误
✅ 类型安全：TypeScript 类型定义与后端 API 完全一致
✅ 向后兼容：页面组件已全部适配新的 API 结构

