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
    path: '/portfolio',
    name: 'Portfolio',
    component: () => import('../views/PortfolioPage.vue'),
    meta: { title: '组合优化' }
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
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('../views/AlertsPage.vue'),
    meta: { title: '告警中心' }
  },

  // ── 系统 ─────────────────────────────────────────────────────
  {
    path: '/system',
    name: 'SystemMonitor',
    component: () => import('../views/SystemMonitorPage.vue'),
    meta: { title: '系统健康' }
  },

  // ── 已合并页面重定向（向后兼容） ────────────────────────────
  { path: '/dashboard-v1',     redirect: '/dashboard' },
  { path: '/hotspots',         redirect: '/opportunities' },
  { path: '/behavior',         redirect: '/opportunities' },
  { path: '/ai-advisor',       redirect: '/autonomy' },
  { path: '/advice',           redirect: '/copilot' },
  { path: '/stress-test',      redirect: '/backtest' },
  { path: '/options',          redirect: '/opportunities' },
  { path: '/execution-algo',   redirect: '/quant-loop' },
  { path: '/execution-center', redirect: '/autonomy' },
  { path: '/plans',            redirect: '/autonomy' },
  { path: '/api-monitoring',   redirect: '/system' },
  { path: '/monitoring',       redirect: '/system' },

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
