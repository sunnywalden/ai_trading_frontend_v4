# 前端 UI/UX 设计文档

> **AI量化交易闭环系统** - Frontend Design  
> 版本：V10.1 | 更新日期：2026-02-26  
> 变更摘要（V10.1）：VaR/宏观风险/滑点/热点等 Dashboard 数据真实化；Copilot 操作意图确认弹窗落地（`action_intent` 执行闭环）；ETF 标的池管理入口（ETFWatchlistPanel）；港股持仓视图（Tiger API 统一，US/HK 市场标签）；Paper Trading 毕业自动化状态展示；自主控制台移除 Telegram 依赖；组合页增加批量 AI 决策历史  
> 历史版本：V10.0（2026-02-24）新增 AI 自主度控制面板、回测中心、组合优化、压力测试、Trading Copilot、Paper Trading、期权分析中心

---

## 1. 设计理念

### 1.1 核心理念

- **AI 运行中枢**：Dashboard 展示 AI 自主运行状态，人工以审计员身份观察
- **零操作目标**：FULL 模式下用户无需任何日常操作，仅需配置边界
- **人机协同入口**：Copilot 是唯一主动交互窗口，自然语言驱动一切
- **可信可追溯**：每笔 AI 决策均有 reasoning 展示，操作可撤销

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

### 3.1 导航结构（V10.1 更新）

```
交易仪表盘 (Dashboard) ← 首页
├── 🤖 AI 自主中枢
│   ├── AI 自主控制 (Autonomy Control) ← AI 运行状态 + 自主度配置（V10.1 VaR 实时展示）
│   ├── Trading Copilot 💬 ← 对话式人机接口（V10.1 操作意图执行闭环）
│   └── 量化交易闭环 (Quant Loop)
├── 核心功能
│   ├── 持仓评估 (Positions)  ← V10.1 港股视图（US/HK 市场标签）
│   ├── AI 交易决策 (AI Advisor)
│   ├── 交易日志 (Journal)
│   ├── 价格告警 (Alerts)
│   └── Paper Trading 🧪       ← V10.1 毕业自动化进度展示
├── 研究与分析
│   ├── 回测中心 (Backtest) 🔬
│   ├── 组合优化 (Portfolio) 📐 ← V10.1 批量 AI 决策历史
│   ├── 压力测试 (Stress Test) 🛡
│   ├── 期权分析 (Options) 📊（只读）
│   ├── 市场热点 (Hotspots)
│   ├── 宏观分析 (Macro)
│   ├── 策略筛选 (Opportunities)
│   └── 策略库管理 (Strategies) ← V10.1 ETF 标的池管理（ETFWatchlistPanel）
├── 复盘
│   └── 行为评分 (Behavior)
└── 系统
    └── 系统监控 (System)
```

### 3.2 页面层级（V10.1）

| 页面 | 路由 | 说明 |
|------|------|------|
| 交易仪表盘 | `/dashboard` | 首页，含 AI 运行状态、VaR/宏观风险水位（V10.1 真实数据）|
| **AI 自主控制** | `/autonomy` | AI 运行状态、自主度切换、审计日志；V10.1 新增允许市场/标的类型多选、VaR 实时展示 |
| **Trading Copilot** | `/copilot` | 对话式人机接口；V10.1 `action_intent` 执行闭环落地 |
| 量化交易闭环 | `/quant-loop` | 闭环可视化 |
| 持仓评估 | `/positions` | 技术+基本面评估；V10.1 港股持仓视图（US/HK 市场标签，Tiger API）|
| AI 交易决策 | `/ai-advisor` | AI 决策历史+手动触发 |
| 交易日志 | `/journal` | 交易复盘与 AI 自动复盘 |
| 价格告警 | `/alerts` | 条件触发推送 |
| **Paper Trading** | `/paper` | 模拟账户独立视图；V10.1 新增 Paper→Live 毕业自动化状态展示 |
| **回测中心** | `/backtest` | 提交回测、查看报告、策略对比 |
| **组合优化** | `/portfolio` | Markowitz+Kelly 组合构建；V10.1 新增批量 AI 决策历史 |
| **压力测试** | `/stress-test` | 历史情景+自定义压测 |
| **期权分析** | `/options` | IV曲面、P/C Ratio、异常成交（只读）|
| 市场热点 | `/hotspots` | 热门赛道与个股 |
| 宏观分析 | `/macro` | 地缘政治+经济指标 |
| 策略筛选 | `/opportunities` | 多因子选股 |
| 策略库管理 | `/strategies` | 策略库管理 |
| 策略详情 | `/strategies/:id` | 策略参数配置与运行 |
| 行为评分 | `/behavior` | AI 决策质量评分 |
| 系统监控 | `/system` | 系统健康 |
| 登录 | `/login` | JWT 认证 |

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
│ � 风险仪表                                      │
│ VaR 1日(95%): -$2,340 (-1.9%)  最大回撤: -4.3%  │
│ 宏观风险: 🟡 中等  Sharpe: 1.45  Beta: 0.82      │
├──────────────────────────────────────────────────┤
│ 🔔 实时信号 & 待办                                │
│ ● AAPL 触及止损位 $178.50    [查看计划] 2min ago │
│ ● NVDA MACD金叉信号           [查看详情] 15m ago  │
│ ● 2 个计划今日到期            [处理]             │
│ ● TSLA 价格告警: 突破 $250   [查看] 1h ago       │
└──────────────────────────────────────────────────┘
```

**交互规范**：
- 自动刷新：每 30s 通过 WebSocket 或轮询更新（V10.1 VaR/宏观风险来自真实计算）
- Greeks 超限告警：>80% 红色闪烁
- 信号列表：按时间倒序，最多显示 10 条
- 资金曲线：支持 30D/90D/YTD/ALL 切换
- VaR 水位：绿色（<2%）/ 黄色（2-3%）/ 红色（>3%，超 VaR 上限）

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

**功能**：技术面+基本面综合评估；V10.1 新增港股持仓（通过 Tiger API 统一获取）

**列表视图**：

```
┌─────────────────────────────────────────────────┐
│ 📊 持仓评估          [筛选: 全部▼ US HK] [刷新] │
├──────┬──────┬───────┬───────┬──────┬────────────┤
│市场  │标的  │数量   │成本   │浮盈  │综合评分    │
├──────┼──────┼───────┼───────┼──────┼────────────┤
│ 🇺🇸US │AAPL  │100    │$178.5 │+$340 │85 ⭐⭐⭐⭐⭐│
│      │      │       │       │      │趋势: 强势↑ │
│      │      │       │       │      │[详情]      │
├──────┼──────┼───────┼───────┼──────┼────────────┤
│ 🇭🇰HK │00700 │200    │HK$355 │+HK$1,400│78 ⭐⭐⭐⭐│
│      │腾讯  │       │       │      │趋势: 中性→ │
│      │      │       │       │      │[详情]      │
├──────┼──────┼───────┼───────┼──────┼────────────┤
│ 🇺🇸US │NVDA  │50     │$520.0 │-$120 │62 ⭐⭐⭐   │
│      │      │       │       │      │趋势: 弱势↓ │
│      │      │       │       │      │[详情]      │
└──────┴──────┴───────┴───────┴──────┴────────────┘
```

**V10.1 港股注意事项**：
- 市场标签：US（美股）/ HK（港股）；行情数据统一来自 Tiger API（`Market.HK`）
- 港股价格以港币显示，组合汇总按实时汇率换算为美元
- 港股无 yfinance 降级，数据完全依赖 Tiger；Tiger 离线时显示上次缓存价

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

### 4.8 策略库管理 (Strategy Library)

**功能**：管理和配置12大类量化策略

**列表视图**：

```
┌─────────────────────────────────────────────┐
│ 📚 策略库                           [批量运行] │
├────────┬──────┬──────┬──────┬──────────────┤
│筛选： │全部 │均值回归│趋势跟踪│多因子│防御│波动率│宏观对冲│
├─────────────────────────────────────────────┤
│ 📈 均值回归 (Mean Reversion)                   │
├─────────────────────────────────────────────┤
│ ● 布林带均值回归 - 已启用           [运行]   │
│   价格偏离 > 2σ 时回归交易                  │
│   最近运行: 2h ago  信号数: 3            │
│   [详情] [禁用] [编辑参数]                   │
├─────────────────────────────────────────────┤
│ ○ 配对交易 - 已禁用                   [启用]   │
│   协整股票对价差交易                        │
│   最近运行: 1d ago  信号数: 0            │
│   [详情] [编辑参数]                           │
├─────────────────────────────────────────────┤
│ 📈 趋势跟踪 (Trend Following)                  │
├─────────────────────────────────────────────┤
│ ● 突破动量 - 已启用                   [运行]   │
│   突破关键阻力/支撑位加仓                  │
│   最近运行: 30m ago  信号数: 5           │
│   [详情] [禁用] [编辑参数]                   │
├─────────────────────────────────────────────┤
│ ... (其他策略)                                   │
└─────────────────────────────────────────────┘
```

**策略详情页**：

```
┌───────────────────────────────────────────┐
│ 📊 布林带均值回归                             │
│ 状态: 已启用 🟢                    [禁用] [运行] │
├───────────────────────────────────────────┤
│ 📝 策略描述                                      │
│ 基于布林带指标，当价格偏离中轨超逾2倍标准差时 │
│ 触发均值回归交易信号。适用于震荡市。           │
├───────────────────────────────────────────┤
│ ⚙️ 策略参数                                      │
├───────────────────────────────────────────┤
│ 时间窗口:    [20] 天                            │
│ 标准差倍数:  [2.0]                              │
│ 止损比例:    [2.0] %                            │
│ 止盈比例:    [3.0] %                            │
│ 最大仓位:    [15] %                             │
│                                                   │
│                           [保存] [重置默认]  │
├───────────────────────────────────────────┤
│ 📈 历史表现                                      │
├───────────────────────────────────────────┤
│ 胜率: 58%     盈亏比: 1.8      Sharpe: 1.2      │
│ 总信号数: 127    平均持仓: 8天                │
│                                                   │
│ ECharts 折线图: 策略收益曲线 vs 基准          │
├───────────────────────────────────────────┤
│ 📦 最近信号 (Top 10)                            │
├───────────────────────────────────────────┤
│ AAPL  买入  $178.50  2h ago  已执行  PnL: +$230  │
│ TSLA  卖出  $248.20  1d ago  已执行  PnL: -$45   │
│ NVDA  买入  $520.30  2d ago  已取消  PnL: N/A    │
└───────────────────────────────────────────┘
```

**交互规范**：
- 策略分类筛选：按类型分组展示
- 启用/禁用切换：即时生效
- 参数编辑：表单验证 + 实时预览
- 批量运行：选中多个策略并行执行
- 历史表现：图表展示 + 指标统计

**API 调用**：
- GET `/api/v1/strategies` - 获取策略列表
- GET `/api/v1/strategies/{id}` - 获取策略详情
- POST `/api/v1/strategies/{id}/run` - 运行策略
- PUT `/api/v1/strategies/{id}/params` - 更新参数
- PUT `/api/v1/strategies/{id}/toggle` - 启用/禁用
- GET `/api/v1/strategies/{id}/performance` - 历史表现
- GET `/api/v1/strategies/{id}/signals` - 最近信号

---

### 4.9 行为评分 (Behavior)

---

### 4.10 AI 自主控制 (Autonomy Control) —— V10 新增

**设计目标**：人工控制中心——查看 AI 运行状态、切换自主度、审计日志、紧急暫停

**布局**：
```
┌──────────────────────────────────────────────────┐
│ 🤖 AI 自主控制                                  │
├──────────────────────────────────────────────────┤
│ 自主度模式：  [全自主] [半自主✓] [建议模式] │
│ 运行状态：  🟢 运行中  AI 已自主执行 3 笔交易   │
│ 记录时间：  2026-02-24 09:30      [紧急暂停] │
├──────────────────────────────────────────────────┤
│ 🛡 风险边界配置                                │
│ 单标的最大仓位  [25]%   单日最多交易 [10]笔  │
│ VaR@95% 上限   [3]%    压力测试上限 [15]%     │
│ 允许标的类型  [STOCK,ETF ▼]  允许市场 [US,HK ▼]│
│                              [保存配置]       │
├──────────────────────────────────────────────────┤
│ 📊 今日实时风险                                  │
│ 当前 VaR 1日: -$2,340 (-1.9%)  ✅ 未超限        │
│ 宏观风险评分: 58/100 🟡 中等风险               │
├──────────────────────────────────────────────────┤
│ 📝 AI 决策审计日志（最近 20 笔）                  │
│ 09:32 AAPL 买入 $178.5×100 [TWAP] 置信度:78 [撤销]│
│ 09:28 NVDA 卖出 $520.3×50 [市价] 置信度:71 [查看]│
│ 09:15 TSLA 风险闸机拒绝：VaR 超限              │
│                                [加载更多]      │
└──────────────────────────────────────────────────┘
```

**交互规范（V10.1 更新）**：
- 自主度模式切换：带确认对话框（切换全自主时加重警示）
- 紧急暂停按钮：红色明显按钮，点击后即刷新状态为暂停
- 撤销按钮：审计日志内每笔 30 分钟内有撤销链接
- 风险边界更改：即时生效，记录到系统日志（V10.1 移除 Telegram 依赖）
- 允许标的类型：下拉多选（STOCK / ETF / STOCK,ETF）；允许市场：US / US,HK
- 今日实时风险区：VaR 来自 `VaRCalculator.calculate_var_cvar()`，每次页面加载刷新

**API**：
- `GET /api/v1/autonomy/status`
- `PUT /api/v1/autonomy/level`
- `POST /api/v1/autonomy/pause` / `resume`
- `GET /api/v1/autonomy/audit-log`
- `POST /api/v1/autonomy/revoke/{exec_id}`

---

### 4.11 Trading Copilot —— V10 新增

**设计目标**：对话式人机接口，替代散落的按鈕操作

**布局**：
```
┌─────────────────────────────────────────┐
│ 💬 Trading Copilot              [清空]│
├─────────────────────────────────────────┤
│ 🖋 盘前摘要（自动生成）          [刷新]│
│ AI 今日计划：布林带策略扫描 08:30...          │
├─────────────────────────────────────────┤
│ 对话历史                              │
│ ┇ 👤 今天 AI 做了哪些交易？                 │
│ ┇ 🤖 共 3 笔：AAPL 买入、NVDA 卖出、TSLA 拒绝│
│ ┇    [AAPL详情 ↗] [NVDA详情 ↗] [TSLA原因]│
│ ┇ 👤 把 AAPL 止损改到 175           │
│ ┇ 🤖 确认：将 AAPL 止损位修改为 $175  [确认]│
├─────────────────────────────────────────┤
│ [输入框] 问任何事...      [deepseek] [发送]│
│ 快捷：[盘前摘要] [当日复盘] [暨同风险]         │
└─────────────────────────────────────────┘
```

**消息类型规范**：
- 查询类：直接显示结果，可能带内链接跳转
- 分析类：流式输出动画ﾈTyping indicatorﾉ
- 操作意图：黄色警告框 + 确认按鈕才执行
- AI 模型标记：消息顶部显示 deepseek-chat / deepseek-reasoner

**API**：
- `POST /api/v1/copilot/chat`
- `GET /api/v1/copilot/history`
- `GET /api/v1/copilot/morning-brief`
- `POST /api/v1/copilot/confirm/{action_id}`

---

### 4.12 回测中心 (Backtest) —— V10 新增

**布局**：
```
┌─────────────────────────────────────────────┐
│ 🔬 回测中心                      [新建回测]│
├─────────────────────────────────────────────┤
│ 提交回测表单：                           │
│ 策略： [布林带均値回归 ▼]  标的池: [AAPL,NVDA]│
│ 时间范围： [2023-01-01] — [2024-12-31]  │
│ 作并方式： ☑ Walk-Forward    资金: $100,000│
│                               [提交回测]       │
├─────────────────────────────────────────────┤
│ 任务列表：                                  │
│ • 布林带均値回归 2023-2024 ✔ [62%胜率]│
│   Sharpe: 1.42  回撤: -8.3%  [查看报告]│
│ • 突破动量    2023-2024 ⏳运行中 ...│
├─────────────────────────────────────────────┤
│ 报告面板（展开）：                            │
│ 年化收益：+18.3% 最大回撤: -8.3%        │
│ Sharpe: 1.42  Sortino: 1.76  Alpha: +7.2%  │
│ ECharts: 策略收益 vs SPY 基准  [导出 CSV]│
└─────────────────────────────────────────────┘
```

**API**：
- `POST /api/v1/backtest/run`
- `GET /api/v1/backtest/tasks`
- `GET /api/v1/backtest/tasks/{id}/report`
- `GET /api/v1/backtest/compare`

---

### 4.13 组合优化 (Portfolio) —— V10 新增

**布局**：
```
┌───────────────────────────────────────────┐
│ 📐 组合优化                     [运行优化]│
├───────────────────────────────────────────┤
│ 优化方法： [Markowitz✓] [风险平价] [Kelly]    │
├───────────────────────────────────────────┤
│ 有效前沿（ECharts 散点图）                │
│       套算收益↑                              │
│  12%  *  *  * ← 当前持仓                   │
│   8%       ◎ ← Markowitz 最优                  │
│  ___──────────────────────────────→            │
│ 0    5%   10%   15% 风险(Std.Dev)             │
├───────────────────────────────────────────┤
│ 推荐仓位分配 vs 当前持仓                │
│ AAPL  目标: 15%  当前: 22%  ↓减 7%         │
│ NVDA  目标: 20%  当前: 12%  ↑加 8%         │
│ MSFT  目标: 12%  当前: 0%   ♔新建           │
│               [生成再平衡计划]             │
└───────────────────────────────────────────┘
```

---

### 4.14 压力测试 (Stress Test) —— V10 新增

**布局**：
```
┌───────────────────────────────────────────┐
│ 🛡 压力测试              [运行压力测试]│
├───────────────────────────────────────────┤
│ 情景选择：                                  │
│ ☑ GFC_2008 (金融危机 -50%)                  │
│ ☑ COVID_2020 (疫情熶断 -35%)              │
│ ☑ RATE_HIKE_2022 (加息周期 -33%)         │
│ ☐ FLASH_CRASH (闪崩 -10%)               │
│ ☐ 自定义情景...  [+ 新建]              │
├───────────────────────────────────────────┤
│ 结果燭影图（ECharts 棒状图）：             │
│ GFC_2008: -$18,450 (-14.8%)  ☒ 超限！  │
│ COVID:    -$11,230 (-9.0%)               │
│ 2022加息:  -$8,500 (-6.8%)              │
├───────────────────────────────────────────┤
│ CVaR@99%: -$15,200  各标的巨燫: 热力图          │
│ 😨 GFC_2008 超过容忍限！建议增加防御策略  │
└───────────────────────────────────────────┘
```

---

### 4.15 Paper Trading —— V10 新增 / V10.1 增强毕业自动化

**布局**：与实盘 Dashboard 布局一致，顶部标注 `模拟盘`，随时可切换到实盘视图

```
┌───────────────────────────────────────────┐
│ 🧪 Paper Trading          [切换实盘视图] │
├───────────────────────────────────────────┤
│ 模拟权益: $105,420    模拟盈亏: +5.4%    │
│ 今日已实现: +$320      最大回撤: -3.1%    │
├───────────────────────────────────────────┤
│ Paper → Live 毕业进度 (V10.1 自动化)      │
│ 布林带均值回归                            │
│ ████████████████████░░░░ 32/30天 ✅通过  │
│ 胜率: 62%  最大回撤: -4.1%  [申请毕业 →] │
│                                          │
│ 突破动量                                  │
│ ████████████░░░░░░░░░░░░ 18/30天 ⏳进行中 │
│ 胜率: 55%  最大回撤: -5.2%  [查看详情]   │
├───────────────────────────────────────────┤
│ 毕业历史                                  │
│ ✔ 布林带  2026-01-15 毕业  → 实盘运行中  │
├───────────────────────────────────────────┤
│ 模拟交易记录                             │
│ AAPL 买入 $178.5 +$420 ✔ 已关闭          │
│              [重置模拟账户] [导出记录]    │
└───────────────────────────────────────────┘
```

**V10.1 新增：毕业自动化交互规范**：
- 毕业进度条：`已运行天数 / PAPER_GRADUATION_DAYS`（默认 30 天），每日定时任务更新
- 满足条件（天数 + 胜率 + 回撤上限）后，状态自动变为「可升级」，顶部 Banner 提示
- 「申请毕业」按钮：调用 `POST /api/v1/paper/graduate/{strategy_run_id}`，创建真实策略运行记录并切换
- 毕业历史：显示已毕业策略及当前实盘运行状态
- V10.1 移除 Telegram 毕业提醒；改为系统内 Banner 通知 + 审计日志记录

---

### 4.16 期权分析 (Options) —— V10 新增（只读工具）

**信息调用类型**，不执行任何期权交易；行情数据通过 Tiger API（`TigerOptionClient`）获取

**布局**：
```
┌────────────────────────────────────────────┐
│ 📊 期权分析                    [输入标的]    │
│ AAPL │ [IV曲面] [IV Rank] [P/C Ratio] [异常成交]│
├────────────────────────────────────────────┤
│ IV Rank: 72%  偏高，适合卖方策略              │
│ IV: 28.5%  52周区间: 18%-42%                 │
│ 数据来源: 🐯 Tiger API  更新: 2m ago         │
├────────────────────────────────────────────┤
│ IV 微笑曲面（ECharts 3D / 热力图）│ 期权链     │
│ 到期日 × 执行价 → IV 颜色  │ 调 │ 到 │ Delta│
├────────────────────────────────────────────┤
│ 异常成交: AAPL 03/21 $185C  100仓 > 10x ★  │
└────────────────────────────────────────────┘
```

### 4.17 ETF 标的池管理 (ETFWatchlistPanel) —— V10.1 新增

**位置**：嵌入 StrategiesPage，作为策略配置的标的池扩展面板

**布局**：
```
┌──────────────────────────────────────────────────┐
│ 📋 ETF 标的池                     [+ 添加 ETF]   │
├────────────┬──────────────────────┬──────────────┤
│筛选：全部  │宽基指数  │行业 ETF  │商品/债券 │杠杆│
├────────────┴──────────────────────┴──────────────┤
│ 🌐 宽基指数                                      │
│ SPY   SPDR S&P 500  ×1.0  ✅ 允许 FULL 模式      │
│ QQQ   Nasdaq 100    ×1.0  ✅ 允许 FULL 模式  [移除]│
├──────────────────────────────────────────────────┤
│ 🏭 行业 ETF                                       │
│ XLK   科技行业 ETF  ×1.0  ✅ 允许 FULL 模式      │
│ XLE   能源行业 ETF  ×1.0  ✅ 允许 FULL 模式      │
├──────────────────────────────────────────────────┤
│ ⚠️ 杠杆/反向 ETF                                  │
│ TQQQ  3倍做多 QQQ  ×3.0  ❌ FULL 模式禁用 [详情]│
│ SQQQ  3倍做空 QQQ  ×-3.0 ❌ FULL 模式禁用       │
└──────────────────────────────────────────────────┘
```

**交互规范**：
- 添加 ETF：输入 ticker，自动从 Tiger API 验证并填充 name/leverage_factor
- 杠杆 ETF（`leverage_factor != 1.0`）：自动标记 ⚠️，FULL 模式下 `allowed_in_full_mode=false`，不参与自主交易
- 所有 ETF 共享 `ALLOWED_ASSET_TYPES=STOCK,ETF` 配置，需同步更新 Autonomy 页的「允许标的类型」
- API：`GET/POST/DELETE /api/v1/strategies/etf-watchlist`

---

### 4.18 组合优化 — V10.1 新增批量 AI 决策历史

在原有组合优化页面底部增加「AI 批量决策历史」面板：

```
┌──────────────────────────────────────────────────┐
│ 🤖 AI 组合级决策历史 (V10.1)     [本周▼]        │
├──────────────────────────────────────────────────┤
│ 批次 #2026-02-26-003  09:32  信号数:8  执行:5   │
│ 决策摘要：集中于科技行业，AAPL/NVDA/META 多头     │
│ 组合收益预期: +2.1%  实际 T+3: +1.8%             │
│ [展开详情 ▾]                                      │
├──────────────────────────────────────────────────┤
│ 批次 #2026-02-25-011  15:45  信号数:6  拒绝:6   │
│ 决策摘要：VaR 超限，整批拒绝执行                  │
│ 拒绝原因: portfolio_var_exceeded                  │
│ [展开详情 ▾]                                      │
└──────────────────────────────────────────────────┘
```

**API**：`GET /api/v1/portfolio/batch-decisions?limit=20`；展开详情调用 `GET /api/v1/portfolio/batch-decisions/{batch_id}`

---

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
#### VaRGauge - VaR 水位仪表盘（V10.1 新增）

```vue
<!-- 用于 Dashboard 风险仪表区和 Autonomy 今日风险区 -->
<template>
  <div class="var-gauge" :class="gaugeLevel">
    <div class="var-label">VaR 1日 (95%)</div>
    <div class="var-value">{{ formatCurrency(varDollar) }}</div>
    <div class="var-pct">{{ (varPct * 100).toFixed(2) }}%</div>
    <div class="var-bar">
      <div class="var-fill" :style="{ width: Math.min(Math.abs(varPct) / 0.03 * 100, 100) + '%' }"></div>
    </div>
    <div class="var-limit-label">VaR 上限: {{ limitPct * 100 }}%</div>
  </div>
</template>
```

**Props**: `varPct: number`, `varDollar: number`, `limitPct: number`  
**Class**: `gaugeLevel` = `safe`（<2%）/ `warn`（2-3%）/ `breach`（>3%）

#### ActionIntentConfirmModal - 操作意图确认弹窗（V10.1 新增）

```vue
<!-- 由 CopilotPage 在收到 action_intent != null 消息时触发 -->
<template>
  <div v-if="intent" class="intent-modal-overlay">
    <div class="intent-modal intent-warning">
      <h3>⚠️ 操作意图确认</h3>
      <div class="intent-type">{{ intentTypeLabel(intent.type) }}</div>
      <div class="intent-params">
        <div v-for="(val, key) in intent.params" :key="key">
          <span class="param-key">{{ key }}:</span>
          <span class="param-val">{{ val }}</span>
        </div>
      </div>
      <div class="intent-actions">
        <button class="btn-confirm" @click="confirm">确认执行</button>
        <button class="btn-cancel" @click="cancel">取消</button>
      </div>
    </div>
  </div>
</template>
```

**Emit**: `confirm` → 调用 `POST /api/v1/copilot/confirm/{action_id}`；`cancel` → 关闭弹窗不执行

#### ETFWatchlistPanel - ETF 标的池面板（V10.1 新增）

见 §4.17

#### PaperGraduationCard - Paper 毕业进度卡片（V10.1 新增）

```vue
<template>
  <div class="graduation-card" :class="status">
    <div class="strategy-name">{{ strategyName }}</div>
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
    </div>
    <div class="progress-label">{{ runDays }} / {{ targetDays }} 天</div>
    <div class="metrics">
      <span>胜率 {{ winRate }}%</span>
      <span>最大回撤 {{ maxDrawdown }}%</span>
    </div>
    <button v-if="status === 'eligible'" class="btn-graduate" @click="graduate">
      申请毕业 →
    </button>
  </div>
</template>
```

#### StrategyCard - 策略卡片

```vue
<template>
  <div class="strategy-card" :class="strategyStatus">
    <div class="strategy-header">
      <span class="category-badge">{{ strategy.category }}</span>
      <span class="strategy-name">{{ strategy.name }}</span>
      <span class="status-indicator" :class="strategy.status">
        {{ statusLabel(strategy.status) }}
      </span>
    </div>
    <div class="strategy-description">
      {{ strategy.description }}
    </div>
    <div class="strategy-metrics">
      <div class="metric">
        <span class="label">胜率</span>
        <span class="value">{{ strategy.winRate }}%</span>
      </div>
      <div class="metric">
        <span class="label">Sharpe</span>
        <span class="value">{{ strategy.sharpeRatio }}</span>
      </div>
      <div class="metric">
        <span class="label">信号数</span>
        <span class="value">{{ strategy.signalCount }}</span>
      </div>
    </div>
    <div class="strategy-actions">
      <button @click="toggleStrategy">
        {{ strategy.enabled ? '禁用' : '启用' }}
      </button>
      <button @click="runStrategy">运行</button>
      <button @click="editParams">编辑参数</button>
      <button @click="viewDetail">详情</button>
    </div>
  </div>
</template>
```

#### StrategyParamsEditor - 策略参数编辑器

```vue
<template>
  <div class="params-editor">
    <div v-for="param in strategy.params" :key="param.key" class="param-field">
      <label>{{ param.label }}</label>
      <input 
        v-if="param.type === 'number'"
        type="number" 
        v-model="param.value"
        :min="param.min"
        :max="param.max"
        :step="param.step"
      />
      <select v-else-if="param.type === 'select'" v-model="param.value">
        <option v-for="opt in param.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <div class="param-hint">{{ param.hint }}</div>
    </div>
    <div class="editor-actions">
      <button @click="saveParams">保存</button>
      <button @click="resetDefaults">重置默认</button>
      <button @click="cancel">取消</button>
    </div>
  </div>
</template>
```

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

```typescript
// stores/strategyStore.ts
export const useStrategyStore = defineStore('strategy', () => {
  const strategies = ref<Strategy[]>([]);
  const currentStrategy = ref<Strategy | null>(null);
  const loading = ref(false);
  
  // 计算属性
  const enabledStrategies = computed(() => 
    strategies.value.filter(s => s.enabled)
  );
  
  const strategiesByCategory = computed(() => {
    const grouped = new Map<string, Strategy[]>();
    strategies.value.forEach(s => {
      if (!grouped.has(s.category)) {
        grouped.set(s.category, []);
      }
      grouped.get(s.category)!.push(s);
    });
    return grouped;
  });
  
  // 操作
  async function loadStrategies() {
    loading.value = true;
    const { data } = await fetchStrategies();
    strategies.value = data;
    loading.value = false;
  }
  
  async function loadStrategyDetail(id: number) {
    const { data } = await fetchStrategyDetail(id);
    currentStrategy.value = data;
  }
  
  async function runStrategy(id: number) {
    await runStrategyAPI(id);
    // 刷新策略状态
    await loadStrategyDetail(id);
  }
  
  async function updateParams(id: number, params: Record<string, any>) {
    await updateStrategyParams(id, params);
    await loadStrategyDetail(id);
  }
  
  async function toggleStrategy(id: number) {
    await toggleStrategyAPI(id);
    await loadStrategies();
  }
  
  return {
    strategies,
    currentStrategy,
    loading,
    enabledStrategies,
    strategiesByCategory,
    loadStrategies,
    loadStrategyDetail,
    runStrategy,
    updateParams,
    toggleStrategy
  };
});
```

### 6.2 其他 Store

- `useAuthStore` - 用户认证
- `usePlansStore` - 交易计划
- `usePositionsStore` - 持仓数据
- `useJournalStore` - 交易日志
- `useNotificationStore` - 通知推送
- `useStrategyStore` - 策略库管理

**V10 Stores（保留）**：
- `useAutonomyStore` - AI 自主控制台状态（运行模式、审计日志、Circuit Breaker 状态）
- `useCopilotStore` - Copilot 对话历史、早报内容
- `useBacktestStore` - 回测任务列表、当前报告
- `usePortfolioStore` - 有效前沿数据、推荐配置
- `useStressTestStore` - 情景结果、热力图数据
- `usePaperTradingStore` - 模拟账户权益、可升级策略列表

**V10.1 新增 Stores**：
- `useRiskMetricsStore` - VaR/最大回撤/宏观风险实时数据（来自后端 VaRCalculator + MacroRiskScoringService）
- `useETFWatchlistStore` - ETF 标的池列表（etf_watchlist 表）
- `useBatchDecisionStore` - AI 批量决策历史（autonomy_audit_log + batch_decision_id 聚合）

```typescript
// stores/riskMetrics.ts （V10.1 新增）
export const useRiskMetricsStore = defineStore('riskMetrics', () => {
  const varData = ref<{ var_95_pct: number; var_95_dollar: number; max_drawdown_pct: number; sharpe_ratio: number } | null>(null);
  const macroScore = ref<{ overall_score: number; level: string } | null>(null);
  const loading = ref(false);

  async function load(accountId: string) {
    loading.value = true;
    const [varRes, macroRes] = await Promise.all([
      fetchVaRMetrics(accountId),
      fetchMacroRisk(),
    ]);
    varData.value = varRes.data;
    macroScore.value = macroRes.data;
    loading.value = false;
  }

  const varLevel = computed(() => {
    const pct = Math.abs(varData.value?.var_95_pct ?? 0);
    if (pct > 0.03) return 'breach';
    if (pct > 0.02) return 'warn';
    return 'safe';
  });

  return { varData, macroScore, loading, varLevel, load };
});
```

---

## 7. 路由设计

```typescript
// router/index.ts — V10.1 更新
const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/DashboardV2Page.vue') },

  // V10 新增：AI 自主中枢
  { path: '/autonomy', name: 'Autonomy', component: () => import('@/views/AutonomyPage.vue') },
  { path: '/copilot', name: 'Copilot', component: () => import('@/views/CopilotPage.vue') },
  { path: '/backtest', name: 'Backtest', component: () => import('@/views/BacktestPage.vue') },
  { path: '/portfolio', name: 'Portfolio', component: () => import('@/views/PortfolioPage.vue') },
  { path: '/stress-test', name: 'StressTest', component: () => import('@/views/StressTestPage.vue') },
  { path: '/paper', name: 'PaperTrading', component: () => import('@/views/PaperTradingPage.vue') },
  { path: '/options', name: 'Options', component: () => import('@/views/OptionsAnalysisPage.vue') },

  // 原有路由保留
  { path: '/ai-advisor', name: 'AIAdvisor', component: () => import('@/views/AIAdvisorPage.vue') },
  { path: '/portfolio/batch-decisions', name: 'BatchDecisions', component: () => import('@/views/PortfolioPage.vue') }, // 复用 PortfolioPage，通过 tab 切换
  { path: '/journal', name: 'Journal', component: () => import('@/views/JournalPage.vue') },
  { path: '/strategies', name: 'Strategies', component: () => import('@/views/StrategiesPage.vue') },
  { path: '/strategies/:id', name: 'StrategyDetail', component: () => import('@/views/StrategyDetailPage.vue') },
  { path: '/positions', name: 'Positions', component: () => import('@/views/PositionsPage.vue') },
  { path: '/hotspots', name: 'Hotspots', component: () => import('@/views/MarketHotspotsPage.vue') },
  { path: '/macro', name: 'Macro', component: () => import('@/views/MacroRiskPage.vue') },
  { path: '/opportunities', name: 'Opportunities', component: () => import('@/views/OpportunitiesPage.vue') },
  { path: '/behavior', name: 'Behavior', component: () => import('@/views/BehaviorScorePage.vue') },
  { path: '/alerts', name: 'Alerts', component: () => import('@/views/AlertsPage.vue') },
  { path: '/quant-loop', name: 'QuantLoop', component: () => import('@/views/QuantLoopDashboard.vue') },
  { path: '/system', name: 'System', component: () => import('@/views/SystemMonitorPage.vue') },
  { path: '/login', name: 'Login', component: () => import('@/views/LoginPage.vue') },
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

- PRODUCT.md - 产品需求文档（V10.1）
- API.md - API 接口文档
- BACKEND_DESIGN.md - 后端设计文档（V10.1）
- RELEASE_PLAN_V10.1.md - V10.1 版本规划

### D. V10.1 变更一览

| 章节 | 变更类型 | 说明 |
|------|---------|------|
| §3.1 导航结构 | 更新 | 港股持仓入口、ETF 配置入口、Paper 毕业自动化标注 |
| §4.1 Dashboard | 新增 | 风险仪表区（VaR 水位 + 宏观风险评分，来自真实数据）|
| §4.6 Positions | 增强 | 港股持仓视图，US/HK 市场标签，Tiger API 数据来源 |
| §4.10 Autonomy | 更新 | 移除 Telegram 确认；新增允许标的/市场多选；今日实时 VaR 展示 |
| §4.11 Copilot | 增强 | 操作意图确认弹窗完整交互设计（V10.1 执行闭环）；移除 Telegram 快捷入口 |
| §4.15 Paper Trading | 增强 | 毕业自动化进度卡片、毕业历史、申请毕业按钮 |
| §4.17 ETFWatchlistPanel | 新增 | ETF 标的池管理面板（嵌入 StrategiesPage）|
| §4.18 批量 AI 决策历史 | 新增 | 嵌入 PortfolioPage，展示 AI 组合级决策批次记录 |
| §5.1 组件库 | 新增 | VaRGauge、ActionIntentConfirmModal、ETFWatchlistPanel、PaperGraduationCard |
| §6.1 Stores | 新增 | useRiskMetricsStore、useETFWatchlistStore、useBatchDecisionStore |
