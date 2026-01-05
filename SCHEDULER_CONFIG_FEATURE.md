# 定时任务配置功能

## 功能概述

为「潜在机会」模块添加了定时任务配置界面，支持用户自定义扫描任务的执行时间和时区。

## 新增文件

### 1. src/components/SchedulerConfig.vue

完整的定时任务配置组件，功能包括：

- **任务信息展示**
  - 显示当前任务名称、ID、状态
  - 显示下次运行时间和触发器配置
  - 显示当前时区设置

- **时间配置**
  - 时区选择（支持 5 个主要时区）
    - Asia/Shanghai (北京时间 UTC+8)
    - America/New_York (纽约时间 UTC-5/-4)
    - Europe/London (伦敦时间 UTC+0/+1)
    - Asia/Tokyo (东京时间 UTC+9)
    - UTC (协调世界时)
  - 小时输入 (0-23)
  - 分钟输入 (0-59)
  - 实时预览配置结果

- **配置管理**
  - 保存配置到后端
  - 重置到原始配置
  - 自动刷新任务信息
  - 变更检测（只有修改后才能保存）

- **用户提示**
  - 配置建议和最佳实践
  - 成功/错误消息提示
  - 加载状态反馈

## 更新文件

### 2. src/views/OpportunitiesPage.vue

- 引入 SchedulerConfig 组件
- 在指南下方添加定时任务配置区域

### 3. src/api/client.ts

新增 API 类型和函数：

```typescript
// 类型定义
interface SchedulerJobDetail
interface SchedulerJobsListResponse
interface UpdateJobScheduleRequest
interface UpdateJobScheduleResponse

// API 函数
fetchSchedulerJobsList()       // 获取任务列表
pauseSchedulerJob(jobId)       // 暂停任务
resumeSchedulerJob(jobId)      // 恢复任务
updateJobSchedule(jobId, req)  // 更新任务时间配置
```

### 4. API_DOCUMENTATION.md

添加新的 API 端点说明：

#### PUT /admin/scheduler/jobs/{job_id}/schedule

更新定时任务的执行时间和时区配置。

**请求参数**：
- hour (int): 小时 0-23
- minute (int): 分钟 0-59
- timezone (string, optional): 时区名称

**响应**：
- status: 操作状态
- message: 结果消息
- job: 更新后的任务详情

## 使用流程

1. **查看当前配置**
   - 页面加载时自动获取当前定时任务配置
   - 显示下次运行时间和触发器设置

2. **修改配置**
   - 选择目标时区
   - 输入执行小时和分钟
   - 查看实时预览

3. **保存配置**
   - 点击「保存配置」按钮
   - 后端更新任务调度
   - 显示成功消息并自动刷新

4. **重置配置**
   - 如需撤销修改，点击「重置」按钮
   - 恢复到上次保存的配置

## 配置建议

### 推荐时间设置

| 时区 | 推荐时间 | 原因 |
|------|----------|------|
| Asia/Shanghai | 20:30 | 美股盘后，适合扫描次日机会 |
| America/New_York | 18:00 | 美股收盘后 |
| Europe/London | 22:00 | 欧美市场都已收盘 |

### 注意事项

1. ⚠️ **时区影响**: 修改时区会改变实际执行时间，请仔细核对
2. 📊 **市场时段**: 建议选择非交易时段，避免影响实时数据获取
3. 🔄 **生效时间**: 配置保存后立即生效，下次运行时间会重新计算
4. 💾 **持久化**: 配置保存到后端，服务重启后仍然有效

## 后端要求

该功能需要后端实现以下 API 端点：

```
PUT /admin/scheduler/jobs/{job_id}/schedule
```

如果后端尚未实现，前端会显示友好的错误提示：
```
❌ 该 API 端点尚未实现，请联系后端开发人员添加
```

## 界面预览

配置界面包含以下元素：

```
┌─────────────────────────────────────────┐
│ ⏰ 定时任务配置              🔄 刷新    │
├─────────────────────────────────────────┤
│ 每日机会扫描-科技股(20:30)    [运行中]  │
│                                         │
│ 下次运行: 2026-01-06 20:30:00          │
│ 触发器: cron[hour='20', minute='30']   │
│ 时区: Asia/Shanghai                     │
├─────────────────────────────────────────┤
│ 修改执行时间                            │
│                                         │
│ 时区:  [Asia/Shanghai ▼]               │
│ 小时:  [20]  分钟:  [30]               │
│                                         │
│ 预览: 每天 20:30 (Asia/Shanghai)       │
│                                         │
│ [💾 保存配置]  [↩️ 重置]               │
├─────────────────────────────────────────┤
│ 💡 提示：                               │
│ • 修改后将在下一个周期生效               │
│ • 建议选择市场非交易时段                │
│ • 北京时间 20:30 对应美股盘后           │
│ • 时区变更会影响任务触发时间            │
└─────────────────────────────────────────┘
```

## 技术实现

- **Vue 3 Composition API**: 使用 ref、computed 等响应式 API
- **TypeScript**: 完整的类型安全
- **错误处理**: 全面的错误捕获和友好提示
- **状态管理**: 本地状态管理，无需 Vuex/Pinia
- **实时反馈**: 配置变更检测和预览
- **自动刷新**: 保存后自动刷新任务信息

## 兼容性

✅ 前端已完整实现，无编译错误
✅ API 接口已在文档中定义
⏳ 等待后端实现 PUT /admin/scheduler/jobs/{job_id}/schedule
