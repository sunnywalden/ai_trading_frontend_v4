# 量化闭环系统 Alpha 增强版 - UI/UX 设计文档

**版本**: V9.1 Design System  
**日期**: 2026-02-13  
**设计师**: 顶级UI/UX工程师  
**设计原则**: 清晰、高效、专业

---

## 一、设计系统基础

### 1.1 颜色系统

#### 主题色
```css
/* 功能色 - Alpha 系列 */
--alpha-positive: #00C853;     /* Alpha > 0 - 鲜绿色 */
--alpha-negative: #FF1744;     /* Alpha < 0 - 警示红 */
--alpha-neutral: #64B5F6;      /* Beta - 中性蓝 */

/* 性能色 - 风险等级 */
--risk-low: #4CAF50;           /* 低风险 - 绿色 */
--risk-medium: #FFC107;        /* 中风险 - 黄色 */
--risk-high: #FF5722;          /* 高风险 - 橙红色 */
--risk-critical: #F44336;      /* 极高风险 - 红色 */

/* 背景色 - 深色终端风格 */
--bg-primary: #0D1117;         /* 主背景 */
--bg-secondary: #161B22;       /* 次级背景 */
--bg-tertiary: #1C2128;        /* 卡片背景 */
--bg-elevated: #21262D;        /* 悬浮元素 */

/* 文本色 */
--text-primary: #C9D1D9;       /* 主文本 */
--text-secondary: #8B949E;     /* 次要文本 */
--text-tertiary: #6E7681;      /* 辅助文本 */
--text-highlight: #58A6FF;     /* 高亮文本 */

/* 边框色 */
--border-default: #30363D;     /* 默认边框 */
--border-muted: #21262D;       /* 弱边框 */
--border-emphasis: #58A6FF;    /* 强调边框 */
```

#### 语义色映射
```css
/* 胜率指标 */
.win-rate-excellent { color: #00E676; }  /* ≥ 65% */
.win-rate-good { color: #7CB342; }       /* 55-65% */
.win-rate-average { color: #FDD835; }    /* 50-55% */
.win-rate-poor { color: #FF6F00; }       /* 45-50% */
.win-rate-bad { color: #E53935; }        /* < 45% */

/* Sharpe Ratio */
.sharpe-excellent { color: #00E676; }    /* > 2.0 */
.sharpe-good { color: #7CB342; }         /* 1.0-2.0 */
.sharpe-average { color: #FDD835; }      /* 0.5-1.0 */
.sharpe-poor { color: #E53935; }         /* < 0.5 */
```

### 1.2 字体系统

```css
/* 字体家族 */
--font-primary: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
--font-number: 'JetBrains Mono', 'SF Mono', monospace;

/* 字号级别 */
--fs-xl: 32px;      /* Alpha 主指标 */
--fs-lg: 24px;      /* 卡片标题 */
--fs-md: 16px;      /* 正文 */
--fs-sm: 14px;      /* 次要文本 */
--fs-xs: 12px;      /* 辅助信息 */

/* 字重 */
--fw-regular: 400;
--fw-medium: 500;
--fw-semibold: 600;
--fw-bold: 700;
```

### 1.3 间距系统

```css
/* 8px 基准 */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
```

### 1.4 圆角系统

```css
--radius-sm: 4px;   /* 按钮、标签 */
--radius-md: 8px;   /* 卡片 */
--radius-lg: 12px;  /* 大卡片 */
--radius-xl: 16px;  /* 模态框 */
```

---

## 二、核心组件设计

### 2.1 AlphaPerformancePanel 组件

**组件定位**：Dashboard核心，展示Alpha/Beta指标

#### 视觉布局
```
┌────────────────────────────────────────────────────────┐
│  Alpha 性能分析                      vs SPY  [30天 ▼] │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  Alpha       │  │  Beta        │  │  Sharpe      ││
│  │  +8.5%       │  │  0.75        │  │  1.82        ││
│  │  ⬆️ 优秀     │  │  🟢 中低风险 │  │  ⬆️ 优秀    ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  Info Ratio  │  │  Active Ret  │  │  Track Error ││
│  │  1.23        │  │  +8.5%       │  │  3.2%        ││
│  │  ⬆️ 良好     │  │  ⬆️优秀      │  │  🟢 稳定    ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                         │
│  📈 累计收益对比                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                 │  │
│  │  ⚫ Portfolio +15.2%                           │  │
│  │  ⚪ SPY +6.7%                               ╱ │  │
│  │  🟢 Active +8.5%                        ╱    │  │
│  │                                    ╱         │  │
│  │                               ╱              │  │
│  │  ─────────────────────────────────────────  │  │
│  │  Jan 15   Jan 22   Jan 29   Feb 5   Feb 12  │  │
│  └────────────────────────────────────────────────┘  │
│                                                         │
│  💡 解读:                                               │
│  您的策略产生了显著超额收益(Alpha +8.5%),风险敞口     │
│  低于市场(Beta 0.75),表现优秀。                        │
│                                                         │
│  [导出PDF报告]  [查看详情]                             │
└────────────────────────────────────────────────────────┘
```

#### 组件结构
```vue
<template>
  <div class="alpha-panel">
    <!-- 顶部：标题 + 控制器 -->
    <div class="panel-header">
      <h2>Alpha 性能分析</h2>
      <div class="controls">
        <select v-model="benchmark" class="benchmark-selector">
          <option value="SPY">vs SPY</option>
          <option value="QQQ">vs QQQ</option>
          <option value="IWM">vs IWM</option>
        </select>
        <div class="period-tabs">
          <button :class="{active: period === 30}" @click="period = 30">30天</button>
          <button :class="{active: period === 90}" @click="period = 90">90天</button>
          <button :class="{active: period === 180}" @click="period = 180">180天</button>
        </div>
      </div>
    </div>

    <!-- 核心指标卡片网格 -->
    <div class="metrics-grid">
      <MetricCard
        label="Alpha"
        :value="formatPercent(metrics.alpha_annualized)"
        :trend="metrics.alpha_annualized"
        :interpretation="metrics.interpretation.alpha"
        tooltip="超额收益：投资组合相对基准的主动回报"
      />
      <MetricCard
        label="Beta"
        :value="formatNumber(metrics.beta, 2)"
        :risk-level="getBetaRiskLevel(metrics.beta)"
        :interpretation="metrics.interpretation.beta"
        tooltip="系统性风险：相对市场的波动敏感度"
      />
      <MetricCard
        label="Sharpe Ratio"
        :value="formatNumber(metrics.sharpe_ratio, 2)"
        :trend="metrics.sharpe_ratio"
        :interpretation="metrics.interpretation.sharpe"
        tooltip="夏普比率：每单位风险获得的超额收益"
      />
      <MetricCard
        label="Information Ratio"
        :value="formatNumber(metrics.information_ratio, 2)"
        :trend="metrics.information_ratio"
        tooltip="信息比率：衡量主动管理能力"
      />
      <MetricCard
        label="Active Return"
        :value="formatPercent(metrics.active_return)"
        :trend="metrics.active_return"
        tooltip="主动收益：投资组合收益 - 基准收益"
      />
      <MetricCard
        label="Tracking Error"
        :value="formatPercent(metrics.tracking_error_annualized)"
        :stability="getTrackingErrorLevel(metrics.tracking_error_annualized)"
        tooltip="跟踪误差：相对基准的波动性"
      />
    </div>

    <!-- 累计收益对比图表 -->
    <div class="chart-container">
      <h3>📈 累计收益对比</h3>
      <LineChart
        :data="chartData"
        :series="[
          { name: 'Portfolio', color: '#C9D1D9', value: portfolioReturn },
          { name: benchmark, color: '#6E7681', value: benchmarkReturn },
          { name: 'Active', color: '#00C853', value: activeReturn }
        ]"
        height="240px"
      />
    </div>

    <!-- 解读说明 -->
    <div class="interpretation-box">
      <div class="icon">💡</div>
      <div class="content">
        <strong>解读:</strong>
        <p>{{ generateInterpretation() }}</p>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <button class="btn-secondary" @click="exportPDF">
        <i class="icon-download"></i>
        导出PDF报告
      </button>
      <button class="btn-primary" @click="showDetails">
        查看详情
      </button>
    </div>
  </div>
</template>

<style scoped>
.alpha-panel {
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border: 1px solid var(--border-default);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.panel-header h2 {
  font-size: var(--fs-lg);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
}

.controls {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.benchmark-selector {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: var(--fs-sm);
  cursor: pointer;
}

.period-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-secondary);
  padding: 4px;
  border-radius: var(--radius-sm);
}

.period-tabs button {
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--fs-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.period-tabs button.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

.chart-container {
  margin-bottom: var(--space-lg);
}

.chart-container h3 {
  font-size: var(--fs-md);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.interpretation-box {
  display: flex;
  gap: var(--space-md);
  background: rgba(88, 166, 255, 0.1);
  border: 1px solid rgba(88, 166, 255, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.interpretation-box .icon {
  font-size: 24px;
}

.interpretation-box .content strong {
  color: var(--text-highlight);
  font-weight: var(--fw-semibold);
}

.interpretation-box .content p {
  color: var(--text-primary);
  margin-top: var(--space-xs);
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.btn-primary {
  background: var(--text-highlight);
  border: none;
  color: #FFFFFF;
}

.btn-primary:hover {
  background: #4A9DE9;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-primary);
}

.btn-secondary:hover {
  border-color: var(--border-emphasis);
  background: var(--bg-elevated);
}
</style>
```

#### MetricCard 子组件
```vue
<template>
  <div class="metric-card" :class="cardClass">
    <div class="card-header">
      <span class="label">{{ label }}</span>
      <Tooltip v-if="tooltip" :content="tooltip">
        <i class="icon-info"></i>
      </Tooltip>
    </div>
    <div class="card-value">
      <span class="value">{{ value }}</span>
      <TrendIcon v-if="trend !== undefined" :value="trend" />
    </div>
    <div class="card-footer">
      <StatusBadge
        v-if="interpretation"
        :label="interpretation"
        :level="getStatusLevel()"
      />
      <RiskBadge
        v-if="riskLevel"
        :label="riskLevel"
      />
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: all 0.2s;
}

.metric-card:hover {
  border-color: var(--border-emphasis);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.card-header .label {
  font-size: var(--fs-sm);
  color: var(--text-secondary);
  font-weight: var(--fw-medium);
}

.card-value {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.card-value .value {
  font-size: var(--fs-xl);
  font-family: var(--font-number);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
}

.card-footer {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}
</style>
```

---

### 2.2 SignalQualityDashboard 组件

**组件定位**：信号质量全景监控

#### 视觉布局
```
┌────────────────────────────────────────────────────────┐
│  信号质量仪表盘                          [30天 ▼]      │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────── 整体表现 ──────────┐                      │
│  │  信号总数     124            │                      │
│  │  已执行       98  (78.9%)    │                      │
│  │  已平仓       86  (87.8%)    │                      │
│  │                              │                      │
│  │  ┌─────────────────────┐    │                      │
│  │  │      胜率            │    │                      │
│  │  │     58.1%           │    │                      │
│  │  │   ⭐⭐⭐⭐          │    │                      │
│  │  └─────────────────────┘    │                      │
│  │                              │                      │
│  │  盈亏比     2.3:1  ⬆️        │                     │
│  │  期望值     +1.8%             │                      │
│  │  平均持仓   3.2天             │                      │
│  └─────────────────────────────┘                      │
│                                                         │
│  ┌────────── 按策略分组 ──────────────────────────┐   │
│  │                                                 │   │
│  │  动量策略                                       │   │
│  │  ████████████████████ 62%  ⭐⭐⭐⭐⭐        │   │
│  │  盈亏比 2.8:1  |  期望值 +2.1%                 │   │
│  │                                                 │   │
│  │  价值策略                                       │   │
│  │  ██████████████ 54%  ⭐⭐⭐⭐               │   │
│  │  盈亏比 1.9:1  |  期望值 +1.2%                 │   │
│  │                                                 │   │
│  │  趋势策略                                       │   │
│  │  ████████████ 51%  ⭐⭐⭐                   │   │
│  │  盈亏比 1.6:1  |  期望值 +0.8%                 │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ⚠️ 发现与建议:                                         │
│  • 价值策略信号衰减较快,建议24小时内执行              │
│  • 动量策略表现优异,可考虑增加仓位                    │
│                                                         │
│  [导出报告]  [查看明细]                                │
└────────────────────────────────────────────────────────┘
```

#### 组件结构
```vue
<template>
  <div class="signal-quality-dashboard">
    <div class="dashboard-header">
      <h2>信号质量仪表盘</h2>
      <select v-model="period" class="period-selector">
        <option value="30">30天</option>
        <option value="90">90天</option>
        <option value="180">180天</option>
      </select>
    </div>

    <!-- 整体表现 -->
    <div class="overall-performance">
      <h3>整体表现</h3>
      <div class="stats-grid">
        <StatItem label="信号总数" :value="stats.total_signals" />
        <StatItem 
          label="已执行" 
          :value="stats.executed_signals"
          :percentage="stats.execution_rate"
        />
        <StatItem 
          label="已平仓" 
          :value="stats.closed_signals"
          :percentage="stats.close_rate"
        />
      </div>

      <!-- 胜率环形图 -->
      <div class="win-rate-donut">
        <DonutChart
          :value="stats.win_rate"
          :segments="[
            { value: stats.winning_signals, label: '盈利', color: '#00C853' },
            { value: stats.losing_signals, label: '亏损', color: '#FF1744' }
          ]"
        />
        <div class="win-rate-display">
          <div class="percentage">{{ formatPercent(stats.win_rate) }}</div>
          <StarRating :score="getRatingFromWinRate(stats.win_rate)" />
        </div>
      </div>

      <div class="key-metrics">
        <MetricRow 
          label="盈亏比" 
          :value="`${stats.profit_loss_ratio.toFixed(1)}:1`"
          :trend="stats.profit_loss_ratio"
        />
        <MetricRow 
          label="期望值" 
          :value="formatPercent(stats.expectancy)"
        />
        <MetricRow 
          label="平均持仓" 
          :value="`${stats.avg_holding_days.toFixed(1)}天`"
        />
      </div>
    </div>

    <!-- 按策略分组 -->
    <div class="strategy-breakdown">
      <h3>按策略分组</h3>
      <div class="strategy-list">
        <StrategyCard
          v-for="strategy in strategyStats"
          :key="strategy.id"
          :name="strategy.name"
          :win-rate="strategy.win_rate"
          :profit-loss-ratio="strategy.profit_loss_ratio"
          :expectancy="strategy.expectancy"
          @click="showStrategyDetails(strategy)"
        />
      </div>
    </div>

    <!-- 发现与建议 -->
    <AlertBox
      v-if="recommendations.length > 0"
      type="warning"
      :items="recommendations"
    />

    <!-- 操作按钮 -->
    <div class="actions">
      <button class="btn-secondary" @click="exportReport">导出报告</button>
      <button class="btn-primary" @click="showDetails">查看明细</button>
    </div>
  </div>
</template>

<style scoped>
.signal-quality-dashboard {
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border: 1px solid var(--border-default);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.overall-performance {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.overall-performance h3 {
  font-size: var(--fs-md);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.win-rate-donut {
  position: relative;
  height: 200px;
  margin-bottom: var(--space-lg);
}

.win-rate-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.win-rate-display .percentage {
  font-size: 36px;
  font-family: var(--font-number);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
}

.key-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.strategy-breakdown {
  margin-bottom: var(--space-lg);
}

.strategy-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}
</style>
```

---

### 2.3 VaRRiskMonitor 组件

**组件定位**：实时风险监控

#### 视觉布局（紧凑版，下文继续）

由于篇幅限制，我现在开始实现后端核心功能，然后补充完整的前端代码。

---

## 三、完整实现规划

### 后端实现顺序
1. ✅ Alpha/Beta计算引擎（已完成基础）
2. ✅ 信号胜率追踪（已完成模型改造）
3. VaR/CVaR风险计算器
4. 智能订单路由IOR
5. API路由开发

### 前端实现顺序
1. Alpha性能面板组件
2. 信号质量仪表盘组件
3. VaR风险监控组件
4. API Service集成
5. Dashboard页面整合

让我继续完成实现...
