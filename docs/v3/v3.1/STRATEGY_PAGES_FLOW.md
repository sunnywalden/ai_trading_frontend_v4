# 策略相关页面交互设计

## 1. 页面概览

### 1.1 三个核心页面

| 页面 | 路由 | 定位 | 核心功能 |
|------|------|------|----------|
| **策略库管理** | `/strategies` | 策略资产管理中心 | 浏览、管理、配置所有内置策略 |
| **策略详情** | `/strategies/:id` | 单个策略深度视图 | 查看策略详细信息、参数配置、性能分析、历史运行 |
| **策略筛选** | `/opportunities` | 策略执行与结果中心 | 快速运行策略、查看信号结果、投资机会挖掘 |

---

## 2. 功能定位与使用场景

### 2.1 策略库管理页面（StrategiesPage）

**角色定位：** 策略资产的"仓库管理系统"

**核心价值：**
- 📚 **浏览所有策略**：15个内置策略一览无余，按类别组织（均值回归、趋势跟踪、多因子等）
- 🔍 **快速筛选**：通过分类标签和搜索快速定位目标策略
- ⚙️ **批量管理**：批量启用/禁用、批量运行策略
- 📊 **性能速览**：每个策略卡片显示关键性能指标（胜率、年化收益等）

**使用场景：**
- 策略研究员：浏览所有可用策略，了解策略库全景
- 量化分析师：对比不同策略的性能表现
- 投资经理：批量启用适合当前市场环境的策略组合
- 风控人员：查看各策略的风险配置和运行状态

**页面结构：**
```
┌─────────────────────────────────────────┐
│ 策略库管理                    [搜索框] │
├─────────────────────────────────────────┤
│ [全部] [均值回归] [趋势跟踪] [多因子]   │
│ [防御] [波动率] [宏观对冲]              │
│                     [批量运行 (3)]      │
├─────────────────────────────────────────┤
│ ┌──┐ 策略卡片1         ┌──┐ 策略卡片2  │
│ │☐│ 布林带均值回归     │☐│ 突破动量    │
│ └──┘ 最近运行: 2/14    └──┘ 暂无记录   │
│      [查看详情]              [查看详情] │
│                                         │
│ ┌──┐ 策略卡片3         ┌──┐ 策略卡片4  │
│ │☐│ 低波动率           │☐│ 黄金交叉    │
│ ...                                     │
└─────────────────────────────────────────┘
```

---

### 2.2 策略详情页面（StrategyDetailPage）

**角色定位：** 单个策略的"深度检查室"

**核心价值：**
- 🔬 **深度信息**：策略算法详情、参数说明、适用场景
- ⚙️ **参数配置**：精细调整策略参数（如布林带标准差倍数）
- 📈 **性能分析**：详细的历史回测数据、收益曲线、风险指标
- 🎯 **信号追踪**：查看该策略历史产生的所有交易信号
- 🔄 **快速运行**：单策略快速执行，立即查看结果

**使用场景：**
- 策略研究：深入了解策略逻辑和参数含义
- 参数优化：调整策略参数，寻找最优配置
- 回测验证：查看历史性能，评估策略有效性
- 信号审查：检查策略产生的具体信号质量

**页面结构：**
```
┌─────────────────────────────────────────┐
│ ← 布林带均值回归                 [已启用]│
├─────────────────────────────────────────┤
│ 基本信息                                │
│ ┌─────────────────────────────────────┐ │
│ │ 策略名称: 布林带均值回归            │ │
│ │ 策略类型: 均值回归                  │ │
│ │ 版本: v1.0                          │ │
│ │ 描述: 基于布林带的均值回归策略...   │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 策略参数                    [编辑参数]  │
│ ┌─────────────────────────────────────┐ │
│ │ lookback_period: 20                 │ │
│ │ std_multiplier: 2.0                 │ │
│ │ target_universe: US_LARGE_CAP       │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 风险配置                                │
│ ┌─────────────────────────────────────┐ │
│ │ max_position_size: 0.10             │ │
│ │ stop_loss_pct: -0.05                │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 性能指标                                │
│ ┌─────────────────────────────────────┐ │
│ │ 年化收益: 12.5%    胜率: 58%        │ │
│ │ 最大回撤: -8.2%    夏普比率: 1.35   │ │
│ │ 总运行次数: 156    平均持仓天数: 8  │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 历史运行记录                            │
│ ┌─────────────────────────────────────┐ │
│ │ Run ID      状态    信号数  时间    │ │
│ │ abc-123   COMPLETED   5    2/14     │ │
│ │ def-456   COMPLETED   3    2/13     │ │
│ └─────────────────────────────────────┘ │
│                         [运行策略]      │
└─────────────────────────────────────────┘
```

---

### 2.3 策略筛选页面（OpportunitiesPage）

**角色定位：** 策略执行与结果的"作战指挥室"

**核心价值：**
- ⚡ **快速执行**：一键运行任意策略，异步执行不阻塞
- 📊 **实时监控**：轮询查看策略执行状态和进度
- 🎯 **信号展示**：策略运行完成后立即展示筛选出的标的
- 📈 **结果分析**：查看命中率、平均信号强度等关键指标
- 📜 **运行历史**：最近运行记录一目了然

**使用场景：**
- 日常交易：每天开盘前快速运行所有策略，获取今日机会
- 快速决策：需要立即知道"现在有哪些交易机会"
- 信号追踪：查看具体标的的信号强度和权重
- 批量执行：同时运行多个策略，对比结果

**页面结构：**
```
┌─────────────────────────────────────────┐
│ 🎯 策略筛选                             │
│ 浏览平台内置私募精选策略、触发异步运行  │
├─────────────────────────────────────────┤
│ ⚙️ 可用策略                             │
│ 点击"配置并运行"触发异步回测或实盘扫描  │
│                                         │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│ │策略1│ │策略2│ │策略3│ │策略4│       │
│ │[运行]│ │[运行]│ │[运行]│ │[运行]│       │
│ └─────┘ └─────┘ └─────┘ └─────┘       │
├─────────────────────────────────────────┤
│ 最近运行结果                            │
│ ┌─────────────────────────────────────┐ │
│ │ 布林带均值回归  COMPLETED            │ │
│ │ 运行时间: 2/14 17:23                │ │
│ │ 命中: 5 个标的                      │ │
│ │ 命中率: 2.5%  平均强度: 0.85        │ │
│ │                                     │ │
│ │ 标的  信号强度  权重  行业          │ │
│ │ AAPL   0.92    0.25   科技          │ │
│ │ MSFT   0.88    0.22   科技          │ │
│ │ ...                                 │ │
│ │ [导出结果] [查看详情]               │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 🧾 策略运行历史（最近 8 次）            │
│ ┌─────────────────────────────────────┐ │
│ │ Run ID  策略ID  状态  命中  时间   │ │
│ │ abc-123  策略1  完成   5   2/14    │ │
│ │ def-456  策略2  完成   3   2/14    │ │
│ │ ...                                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 3. 页面间交互流程

### 3.1 核心交互关系图

```
┌──────────────────┐
│                  │
│  策略库管理页     │  ← 入口：浏览所有策略
│  /strategies     │
│                  │
└────┬─────────┬───┘
     │         │
     │ [查看   │ [批量运行]
     │  详情]  │
     │         │
     ↓         ↓
┌──────────────┐   ┌──────────────┐
│              │   │              │
│  策略详情页   │   │  策略筛选页   │
│  /strategies │   │  /opportun   │
│  /:id        │   │  ities       │
│              │   │              │
└──────┬───────┘   └───────┬──────┘
       │                   │
       │ [运行策略]         │ [配置并运行]
       │                   │
       └───────────────────┘
                │
                ↓
         ┌──────────────┐
         │ 策略运行结果  │
         │ (在策略筛选   │
         │  页面显示)    │
         └──────────────┘
```

### 3.2 详细交互流程

#### 流程 1：从策略库到策略详情（深度研究流程）

```
用户操作：
1. 进入策略库管理页 (/strategies)
2. 浏览所有策略，使用分类过滤（如"均值回归"）
3. 点击某个策略卡片的"查看详情"按钮
4. 进入策略详情页 (/strategies/{id})
5. 查看详细参数、性能指标、历史运行记录
6. 可选：点击"编辑参数"调整配置
7. 可选：点击"运行策略"执行回测
8. 点击返回按钮回到策略库管理页

技术实现：
- StrategyCard 组件发出 @view 事件
- StrategiesPage 调用 router.push(`/strategies/${strategy.id}`)
- StrategyDetailPage 通过 route.params.id 获取策略ID
- 页面加载时调用 strategyStore.loadStrategyDetail(id)
```

#### 流程 2：从策略库到策略筛选（批量执行流程）

```
用户操作：
1. 进入策略库管理页 (/strategies)
2. 勾选多个策略的复选框
3. 点击"批量运行"按钮
4. 系统后台批量执行选中的策略
5. 用户可以切换到策略筛选页 (/opportunities) 查看执行结果
6. 在策略筛选页查看最近运行的策略结果和历史记录

技术实现：
- StrategiesPage 维护 selectedStrategies: string[]
- 批量运行时调用 strategyStore.runStrategy(id, params)
- 运行完成后提示用户："批量运行完成，前往策略筛选查看结果"
- 提供快速跳转链接到 /opportunities
```

#### 流程 3：从策略详情到执行结果（单策略深度分析流程）

```
用户操作：
1. 在策略详情页 (/strategies/{id})
2. 点击"运行策略"按钮
3. 弹出参数配置对话框（可选择使用默认参数）
4. 确认运行
5. 页面显示"策略已提交，正在执行中..."
6. 选择：
   a) 在当前页面等待，查看"历史运行记录"表格刷新
   b) 点击提示中的链接跳转到策略筛选页查看详细结果

技术实现：
- StrategyDetailPage 调用 strategyStore.runStrategy(id, params)
- 获取 run_id 后可以：
  - 轮询 fetchStrategyRunStatus(run_id) 更新状态
  - 或提示用户前往 /opportunities 查看结果
- 运行完成后刷新 strategyStore.loadPerformance(id)
```

#### 流程 4：从策略筛选到策略详情（从结果反查流程）

```
用户操作：
1. 在策略筛选页 (/opportunities)
2. 查看最近运行的策略结果
3. 对某个策略的结果感兴趣
4. 点击策略卡片或结果卡片上的"查看策略详情"链接
5. 进入该策略的详情页 (/strategies/{id})
6. 深入了解策略配置和历史表现

技术实现：
- StrategyRecentRunCard 或 StrategyCard 添加跳转链接
- 点击时 router.push(`/strategies/${strategy.id}`)
```

#### 流程 5：快速执行流程（日常交易场景）

```
用户操作：
1. 直接进入策略筛选页 (/opportunities)
2. 浏览可用策略列表
3. 点击某个策略的"配置并运行"按钮
4. 配置参数后提交
5. 系统异步执行，页面轮询显示进度
6. 执行完成后在"最近运行结果"区域显示结果
7. 查看命中的标的、信号强度等信息
8. 导出结果或切换到交易日志记录

技术实现：
- OpportunitiesPage 点击策略卡片触发 openStrategyRunModal
- 提交后调用 runStrategy 获取 run_id
- 启动轮询 pollStrategyRunStatus(run_id)
- 完成后调用 fetchStrategyRunResults 显示结果
```

---

## 4. 功能联动设计

### 4.1 策略状态同步

**需求：** 三个页面中策略的状态应保持一致

**实现方案：**
- 使用 Pinia Store (strategyStore) 作为单一数据源
- 所有页面共享同一个 store 实例
- 状态变更（启用/禁用、参数修改）立即更新 store
- 其他页面通过响应式数据自动更新UI

```typescript
// strategyStore.ts
export const useStrategyStore = defineStore('strategy', () => {
  const strategies = ref<Strategy[]>([])
  const performances = ref<Record<string, StrategyPerformance>>({})
  
  // 任何地方调用 toggleStrategy 都会更新所有页面
  const toggleStrategy = async (id: string) => {
    const strategy = strategies.value.find(s => s.id === id)
    if (strategy) {
      strategy.is_active = !strategy.is_active
      await updateStrategyStatus(id, strategy.is_active)
    }
  }
  
  return { strategies, performances, toggleStrategy, ... }
})
```

### 4.2 运行结果通知

**需求：** 策略运行完成后，用户应该知道去哪里查看结果

**实现方案：**

**方案A：页面内通知 + 快速跳转**
```typescript
// 策略库管理页批量运行后
ElMessage.success({
  message: '批量运行完成！点击查看结果',
  duration: 5000,
  showClose: true,
  onClick: () => {
    router.push('/opportunities')
  }
})
```

**方案B：悬浮通知栏**
```vue
<!-- App.vue 添加全局通知栏 -->
<div v-if="hasNewResults" class="global-notification">
  <span>🎉 有 3 个策略运行完成</span>
  <router-link to="/opportunities">查看结果</router-link>
  <button @click="dismissNotification">×</button>
</div>
```

**方案C：在策略筛选页显示运行中的任务**
```vue
<!-- OpportunitiesPage.vue 添加进行中区域 -->
<div v-if="runningTasks.length > 0" class="running-tasks">
  <h3>🔄 执行中的策略</h3>
  <div v-for="task in runningTasks" :key="task.run_id">
    <span>{{ task.strategy_name }}</span>
    <progress :value="task.progress" max="100"></progress>
    <span>{{ task.status }}</span>
  </div>
</div>
```

### 4.3 参数配置共享

**需求：** 用户在策略详情页修改的参数，运行时应该使用

**实现方案：**
- 策略详情页的参数编辑直接更新 strategy.default_params
- 运行策略时可选择：
  - 使用最新配置的参数 (use_custom_params: true)
  - 使用系统默认参数 (use_custom_params: false)

```vue
<!-- StrategyRunModal.vue 参数配置对话框 -->
<el-form>
  <el-radio-group v-model="useCustomParams">
    <el-radio :label="false">使用系统默认参数</el-radio>
    <el-radio :label="true">使用自定义参数</el-radio>
  </el-radio-group>
  
  <div v-if="useCustomParams">
    <el-form-item v-for="(value, key) in params" :key="key" :label="key">
      <el-input v-model="params[key]" />
    </el-form-item>
  </div>
</el-form>
```

### 4.4 性能数据实时更新

**需求：** 策略运行后，性能指标应自动刷新

**实现方案：**
- 策略运行完成后，自动调用 `loadPerformance(strategy_id)`
- 使用 WebSocket 或轮询更新性能数据（可选）
- 性能卡片组件自动响应 store 中的数据变化

```typescript
// strategyStore.ts
const runStrategy = async (id: string, params: any) => {
  const result = await apiRunStrategy(id, params)
  
  // 策略运行完成后自动刷新性能
  await pollRunStatus(result.run_id)
  await loadPerformance(id)  // 自动刷新性能数据
  
  return result
}
```

---

## 5. 导航增强建议

### 5.1 面包屑导航

在策略详情页添加面包屑，清晰显示层级关系：

```vue
<!-- StrategyDetailPage.vue -->
<el-breadcrumb separator="/">
  <el-breadcrumb-item :to="{ path: '/strategies' }">策略库管理</el-breadcrumb-item>
  <el-breadcrumb-item>{{ strategy?.name }}</el-breadcrumb-item>
</el-breadcrumb>
```

### 5.2 快捷操作按钮

在各页面添加快捷跳转：

```vue
<!-- StrategiesPage.vue 页面头部 -->
<div class="page-header">
  <h1>策略库管理</h1>
  <div class="quick-actions">
    <el-button @click="router.push('/opportunities')">
      前往策略筛选
    </el-button>
  </div>
</div>

<!-- OpportunitiesPage.vue 页面头部 -->
<div class="page-header">
  <h2>策略筛选</h2>
  <div class="quick-actions">
    <el-button @click="router.push('/strategies')">
      查看所有策略
    </el-button>
  </div>
</div>
```

### 5.3 相关策略推荐

在策略详情页显示相关策略：

```vue
<!-- StrategyDetailPage.vue 底部 -->
<el-card class="related-strategies">
  <template #header>相关策略</template>
  <div class="strategy-chips">
    <el-tag 
      v-for="related in relatedStrategies" 
      :key="related.id"
      @click="router.push(`/strategies/${related.id}`)"
      style="cursor: pointer; margin-right: 8px;"
    >
      {{ related.name }}
    </el-tag>
  </div>
</el-card>
```

---

## 6. 用户使用流程示例

### 场景 1：研究新策略

**目标：** 了解并测试一个新的策略

```
1. 左侧导航点击"策略库管理" → 进入 /strategies
2. 点击分类"均值回归" → 过滤显示均值回归类策略
3. 看到"布林带均值回归"，点击"查看详情" → 进入 /strategies/{id}
4. 阅读策略描述、查看参数配置（lookback_period: 20, std_multiplier: 2.0）
5. 查看历史性能指标（年化收益 12.5%，胜率 58%）
6. 点击"运行策略"按钮 → 弹出配置对话框
7. 选择"使用默认参数"，点击"确认运行"
8. 页面提示"策略已提交"，并显示"查看结果"链接
9. 点击链接 → 跳转到 /opportunities
10. 在"最近运行结果"区域看到刚才的运行结果
11. 查看命中的 5 个标的及其信号强度
```

### 场景 2：日常交易前准备

**目标：** 每天开盘前运行所有策略，获取交易机会

```
1. 左侧导航点击"策略筛选" → 进入 /opportunities
2. 页面显示可用策略列表（15个策略卡片）
3. 依次点击 3-4 个策略的"配置并运行"按钮
4. 每个策略提交后，在"执行中的策略"区域显示进度
5. 等待 1-2 分钟，策略执行完成
6. 在"最近运行结果"卡片中查看每个策略的结果
7. 策略1 命中 5 个标的，策略2 命中 3 个标的
8. 点击"查看详情"查看具体标的信息
9. 点击"导出结果"下载 CSV 文件
10. 将结果导入交易系统或手动操作
```

### 场景 3：策略组合管理

**目标：** 根据市场环境配置策略组合

```
1. 左侧导航点击"策略库管理" → 进入 /strategies
2. 当前市场判断：震荡行情，适合均值回归策略
3. 点击"均值回归"分类 → 显示 3 个均值回归策略
4. 勾选这 3 个策略的复选框
5. 点击"批量运行 (3)" → 系统后台执行
6. 弹出提示："批量运行完成，点击查看结果"
7. 点击提示 → 跳转到 /opportunities
8. 在"策略运行历史"表格中看到刚才的 3 条记录
9. 点击每条记录的"查看结果" → 对比各策略表现
10. 发现"布林带均值回归"表现最好，点击策略名称 → 跳转到 /strategies/{id}
11. 在详情页点击"编辑参数"，调整 std_multiplier 从 2.0 到 2.5
12. 保存后点击"运行策略" → 测试新参数效果
```

### 场景 4：性能监控与优化

**目标：** 监控策略表现，优化参数配置

```
1. 左侧导航点击"策略库管理" → 进入 /strategies
2. 页面显示所有策略，每个卡片上有性能指标
3. 发现某个策略胜率下降（从 60% 降到 45%）
4. 点击该策略"查看详情" → 进入 /strategies/{id}
5. 查看"历史运行记录"表格，分析最近 10 次运行
6. 发现最近市场波动率增加，当前参数不适应
7. 点击"编辑参数"，调整 lookback_period 从 20 到 15
8. 点击"运行策略" → 测试新参数
9. 等待执行完成，查看新的性能指标
10. 如果效果改善，保存新参数配置
11. 返回策略库管理页 → 性能卡片自动更新
```

---

## 7. 技术实现要点

### 7.1 状态管理（Pinia Store）

```typescript
// stores/strategyStore.ts
export const useStrategyStore = defineStore('strategy', () => {
  const strategies = ref<Strategy[]>([])
  const performances = ref<Record<string, StrategyPerformance>>({})
  const loading = ref(false)
  
  const loadStrategies = async (params?: { is_builtin?: boolean; limit?: number }) => {
    loading.value = true
    try {
      const result = await fetchStrategies(params)
      strategies.value = result.strategies
    } finally {
      loading.value = false
    }
  }
  
  const loadPerformance = async (strategyId: string) => {
    const perf = await fetchStrategyPerformance(strategyId)
    performances.value[strategyId] = perf
  }
  
  const runStrategy = async (id: string, params: any) => {
    const result = await apiRunStrategy(id, params)
    return result.run_id
  }
  
  return { 
    strategies, 
    performances, 
    loading, 
    loadStrategies, 
    loadPerformance, 
    runStrategy 
  }
})
```

### 7.2 路由配置

```typescript
// router/index.ts
{
  path: '/strategies',
  name: 'Strategies',
  component: () => import('../views/StrategiesPage.vue'),
  meta: { 
    title: '策略库管理',
    breadcrumb: '策略库管理'
  }
},
{
  path: '/strategies/:id',
  name: 'StrategyDetail',
  component: () => import('../views/StrategyDetailPage.vue'),
  meta: { 
    title: '策略详情',
    breadcrumb: '策略详情'
  }
},
{
  path: '/opportunities',
  name: 'Opportunities',
  component: () => import('../views/OpportunitiesPage.vue'),
  meta: { 
    title: '策略筛选',
    breadcrumb: '策略筛选'
  }
}
```

### 7.3 页面间数据传递

**方式1：通过 Store 共享**
```typescript
// StrategiesPage.vue
const handleRun = async (strategy: Strategy) => {
  const runId = await strategyStore.runStrategy(strategy.id, {})
  // Store 中已记录，其他页面可访问
}

// OpportunitiesPage.vue
onMounted(() => {
  // 自动获取最近的运行记录
  loadRecentRuns()
})
```

**方式2：通过路由参数**
```typescript
// StrategiesPage.vue
router.push({
  name: 'Opportunities',
  query: { runId: 'abc-123' }  // 传递 runId
})

// OpportunitiesPage.vue
const route = useRoute()
const highlightRunId = route.query.runId
```

**方式3：通过事件总线（可选）**
```typescript
// eventBus.ts
export const eventBus = mitt()

// StrategiesPage.vue
eventBus.emit('strategy-run-complete', { strategyId, runId })

// OpportunitiesPage.vue
eventBus.on('strategy-run-complete', ({ strategyId, runId }) => {
  // 刷新数据
})
```

---

## 8. UI/UX 优化建议

### 8.1 视觉连贯性

- **统一配色**：三个页面使用一致的主题色
- **图标系统**：策略类别使用统一的图标（📊 📈 🎯 等）
- **卡片风格**：策略卡片在各页面保持一致的设计

### 8.2 交互反馈

- **Loading 状态**：策略运行时显示骨架屏或进度条
- **成功提示**：操作完成后使用 ElMessage 显示结果
- **错误处理**：网络错误时显示友好的错误信息和重试按钮

### 8.3 性能优化

- **懒加载**：策略卡片使用虚拟滚动（如果策略数量很多）
- **缓存策略**：性能数据缓存 5 分钟，减少 API 调用
- **预加载**：鼠标悬停策略卡片时预加载详情数据

### 8.4 响应式设计

- **移动端适配**：三栏布局在移动端切换为单栏堆叠
- **触摸优化**：按钮和卡片有足够的点击区域（最小 44x44px）

---

## 9. 下一步开发建议

### 9.1 短期任务（本周）

- [x] 在左侧导航添加"策略库管理"入口
- [ ] 在 StrategiesPage 添加"前往策略筛选"按钮
- [ ] 在 OpportunitiesPage 添加"查看所有策略"按钮
- [ ] 策略详情页添加面包屑导航
- [ ] 批量运行完成后显示跳转提示

### 9.2 中期任务（下周）

- [ ] 实现策略运行状态轮询
- [ ] 添加"执行中的策略"区域
- [ ] 实现参数配置共享机制
- [ ] 添加相关策略推荐
- [ ] 性能数据自动刷新

### 9.3 长期优化（下月）

- [ ] WebSocket 实时推送策略运行状态
- [ ] 策略对比功能（在策略库选中多个对比）
- [ ] 策略组合管理（保存常用策略组合）
- [ ] 策略回测历史图表（收益曲线、回撤曲线）
- [ ] AI 策略推荐（根据用户行为推荐合适策略）

---

## 10. 总结

### 三页面核心定位

| 页面 | 一句话定位 | 核心用户价值 |
|------|-----------|-------------|
| **策略库管理** | 策略资产的管理中心 | 了解全局、批量管理、性能监控 |
| **策略详情** | 单个策略的深度视图 | 参数调优、性能分析、历史追踪 |
| **策略筛选** | 策略执行与结果中心 | 快速运行、查看信号、投资决策 |

### 交互原则

1. **从全局到细节**：策略库 → 策略详情
2. **从配置到执行**：策略详情 → 策略筛选
3. **从执行到结果**：策略筛选 → 查看信号
4. **从结果到优化**：查看结果 → 返回详情调参

### 用户旅程

```
策略研究者：策略库 → 策略详情 → 深度分析
日常交易者：策略筛选 → 快速运行 → 查看信号
投资经理：策略库 → 批量运行 → 策略筛选查看结果
参数优化者：策略详情 → 调整参数 → 运行测试 → 查看结果
```

通过清晰的功能定位和流畅的交互流程，三个页面形成了一个完整的策略研究、执行、分析闭环。
