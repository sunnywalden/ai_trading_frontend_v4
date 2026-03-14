import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },

  // ── 主控台 ──────────────────────────────────────────────────
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardV2Page.vue'),
    meta: { title: 'Dashboard' }
  },

  // ── AI 自主引擎 ──────────────────────────────────────────────
  {
    path: '/autonomy',
    name: 'Autonomy',
    component: () => import('../views/AutonomyPage.vue'),
    meta: { title: 'AI 自主中枢' }
  },
  // V10.2-M1: 市场体制感知
  {
    path: '/regime',
    name: 'Regime',
    component: () => import('../views/RegimePage.vue'),
    meta: { title: '市场体制感知' }
  },
  // V10.2-M2: 事件日历 & 盈利围栏
  {
    path: '/events',
    name: 'EventCalendar',
    component: () => import('../views/EventCalendarPage.vue'),
    meta: { title: '事件日历' }
  },
  {
    path: '/copilot',
    name: 'Copilot',
    component: () => import('../views/CopilotPage.vue'),
    meta: { title: 'AI 助手' }
  },
  {
    path: '/quant-loop',
    name: 'QuantLoop',
    component: () => import('../views/QuantLoopDashboard.vue'),
    meta: { title: '量化闭环' }
  },

  // ── 市场 & 策略 ──────────────────────────────────────────────
  {
    path: '/opportunities',
    name: 'Opportunities',
    component: () => import('../views/OpportunitiesPage.vue'),
    meta: { title: '机会扫描' }
  },
  {
    path: '/macro',
    name: 'Macro',
    component: () => import('../views/MacroRiskPage.vue'),
    meta: { title: '宏观风险' }
  },
  {
    path: '/strategies',
    name: 'Strategies',
    component: () => import('../views/StrategiesPage.vue'),
    meta: { title: '策略库' }
  },
  {
    path: '/etf-pool',
    name: 'EtfPool',
    component: () => import('../views/EtfPoolPage.vue'),
    meta: { title: 'ETF 标的池' }
  },
  {
    path: '/options',
    name: 'OptionsAnalysis',
    component: () => import('../views/OptionsAnalysisPage.vue'),
    meta: { title: '期权分析' }
  },
  {
    path: '/strategies/:id',
    name: 'StrategyDetail',
    component: () => import('../views/StrategyDetailPage.vue'),
    meta: { title: '策略详情' }
  },

  // ── 研究 & 回测 ──────────────────────────────────────────────
  {
    path: '/backtest',
    name: 'Backtest',
    component: () => import('../views/BacktestPage.vue'),
    meta: { title: '回测引擎' }
  },
  {
    path: '/alpha-lab',
    name: 'AlphaLab',
    component: () => import('../views/AlphaLabPage.vue'),
    meta: { title: 'Alpha Lab' }
  },
  {
    path: '/portfolio',
    name: 'Portfolio',
    component: () => import('../views/PortfolioPage.vue'),
    meta: { title: 'Portfolio Construction' }
  },

  // ── 持仓 & 执行 ──────────────────────────────────────────────
  {
    path: '/positions',
    name: 'Positions',
    component: () => import('../views/PositionsPage.vue'),
    meta: { title: '持仓监控' }
  },
  {    path: '/position-evaluation',
    name: 'PositionEvaluation',
    component: () => import('../views/PositionEvaluationPage.vue'),
    meta: { title: '持仓评估' }
  },
  {    path: '/paper',
    name: 'PaperTrading',
    component: () => import('../views/PaperTradingPage.vue'),
    meta: { title: '模拟盘' }
  },

  // ── 审计 & 报告 ──────────────────────────────────────────────
  {
    path: '/journal',
    name: 'Journal',
    component: () => import('../views/JournalPage.vue'),
    meta: { title: '交易日志' }
  },
  // V10.2-M5: 交易归因分析
  {
    path: '/attribution',
    name: 'Attribution',
    component: () => import('../views/AttributionPage.vue'),
    meta: { title: '交易归因' }
  },
  // V10.2-M6: AI 自我进化
  {
    path: '/evolution',
    name: 'Evolution',
    component: () => import('../views/EvolutionPage.vue'),
    meta: { title: 'AI 自我进化' }
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('../views/AlertsPage.vue'),
    meta: { title: '告警中心' }
  },

  // ── 系统监控 / AI 安全 / 任务管理 ──────────────────────────
  {
    path: '/system-monitor',
    name: 'SystemMonitor',
    component: () => import('../views/SystemMonitorPage.vue'),
    meta: { title: '系统监控' }
  },
  // V11.1.1: /task-management 合并到 SystemMonitorPage 的 tasks tab
  { path: '/task-management', redirect: () => ({ path: '/system-monitor', query: { tab: 'tasks' } }) },
  // 旧路由重定向（保持后向兼容）
  { path: '/api-monitoring',  redirect: (to) => ({ path: '/system-monitor', query: { tab: 'api'    } }) },
  { path: '/service-health',  redirect: (to) => ({ path: '/system-monitor', query: { tab: 'health' } }) },

  // V10.4.1 设计文档 spec URL → 实现 URL 对齐重定向
  { path: '/observability/execution-microscope', redirect: '/observability/execution' },
  { path: '/observability/signal-intelligence',  redirect: '/observability/signal' },
  { path: '/observability/risk-cluster',         redirect: '/observability/risk' },
  { path: '/ai-hub/factor-weights',              redirect: '/ai-hub/weights' },
  { path: '/ai-hub/post-mortems',                redirect: '/ai-hub/post-mortem' },

  // ── V10.3 交易可观测性 ────────────────────────────────────
  {
    path: '/trade-lifecycle',
    name: 'TradeLifecycle',
    component: () => import('../views/TradeLifecycleCenterPage.vue'),
    meta: { title: '持仓生命周期中心' }
  },
  {
    path: '/order-book',
    name: 'OrderBook',
    component: () => import('../views/IntelligentOrderBookPage.vue'),
    meta: { title: '智能订单簿' }
  },

  // ── V10.3.3 可观测性 2.0 ──────────────────────────────────
  {
    path: '/observability/execution',
    name: 'ExecutionMicroscope',
    component: () => import('../views/ExecutionMicroscopePage.vue'),
    meta: { title: '执行显微镜' }
  },
  {
    path: '/execution-policy',
    name: 'ExecutionPolicy',
    component: () => import('../views/ExecutionPolicyPage.vue'),
    meta: { title: '执行策略控制台' }
  },
  {
    path: '/observability/signal',
    name: 'SignalIntelligence',
    component: () => import('../views/SignalIntelligencePage.vue'),
    meta: { title: '信号观测台' }
  },
  {
    path: '/observability/risk',
    name: 'RiskCluster',
    component: () => import('../views/RiskClusterPage.vue'),
    meta: { title: '风险拓扑聚类' }
  },

  // ── V10.3.3 AI 中枢 2.0 ──────────────────────────────────
  {
    path: '/ai-hub/agents',
    name: 'MultiAgent',
    component: () => import('../views/MultiAgentPage.vue'),
    meta: { title: '多 Agent 协同' }
  },
  {
    path: '/ai-hub/calibration',
    name: 'Calibration',
    component: () => import('../views/CalibrationPage.vue'),
    meta: { title: '置信度校准' }
  },
  {
    path: '/ai-hub/weights',
    name: 'FactorWeights',
    component: () => import('../views/FactorWeightsPage.vue'),
    meta: { title: '自适应因子权重' }
  },
  {
    path: '/ai-hub/post-mortem',
    name: 'PostMortem',
    component: () => import('../views/PostMortemPage.vue'),
    meta: { title: '决策事后剖析' }
  },

  // ── V10.3.3 War Room ──────────────────────────────────────
  {
    path: '/war-room',
    name: 'WarRoom',
    component: () => import('../views/WarRoomPage.vue'),
    meta: { title: 'War Room 作战室' }
  },
  {
    path: '/governance/pipeline',
    name: 'GovernancePipeline',
    component: () => import('../views/GovernancePipelinePage.vue'),
    meta: { title: 'Promotion Pipeline' }
  },
  {
    path: '/live-safety',
    name: 'LiveSafety',
    component: () => import('../views/LiveSafetyPage.vue'),
    meta: { title: 'AI 安全' }
  },

  // ── V10.4.2 Signal Watchtower 信号哨所 ────────────────────
  {
    path: '/signal-watchtower',
    name: 'SignalWatchtower',
    component: () => import('../views/SignalWatchtowerPage.vue'),
    meta: { title: '信号哨所 · Signal Watchtower' }
  },

  // ── 系统类简写 redirect（保留，无对应孤儿文件）────────────
  { path: '/system',           redirect: '/system-monitor' },
  { path: '/monitoring',       redirect: '/system-monitor' },
  // ── 命名演化兼容 redirect（保留）────────────────────────────
  { path: '/advice',           redirect: '/copilot' },

  // ── 认证 ─────────────────────────────────────────────────────
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue'),
    meta: { title: '登录' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫 - 更新页面标题并强制认证（默认后端已启用认证）
import { isLoggedIn } from '../api/client';

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - AI 量化自主交易系统`;
  }

  // 允许匿名访问的页面
  const publicPaths = ['/login', '/system', '/monitoring'];
  if (publicPaths.includes(to.path)) {
    return next();
  }

  // 如果未登录，跳转到登录页
  if (!isLoggedIn()) {
    return next({ path: '/login' });
  }

  next();
});

export default router;
