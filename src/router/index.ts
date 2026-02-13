import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardV2Page.vue'),
    meta: { title: 'Dashboard' }
  },
  {
    path: '/dashboard-v1',
    name: 'DashboardV1',
    component: () => import('../views/DashboardPage.vue'),
    meta: { title: 'Dashboard V1 (旧版)' }
  },
  {
    path: '/equity',
    name: 'Equity',
    component: () => import('../views/EquityPage.vue'),
    meta: { title: '资金曲线' }
  },
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
    meta: { title: '价格告警' }
  },
  {
    path: '/hotspots',
    name: 'MarketHotspots',
    component: () => import('../views/MarketHotspotsPage.vue'),
    meta: { title: '市场热点' }
  },
  {
    path: '/behavior',
    name: 'Behavior',
    component: () => import('../views/BehaviorScorePage.vue'),
    meta: { title: '行为评分' }
  },
  {
    path: '/positions',
    name: 'Positions',
    component: () => import('../views/PositionsPage.vue'),
    meta: { title: '持仓评估' }
  },
  {
    path: '/macro',
    name: 'Macro',
    component: () => import('../views/MacroRiskPage.vue'),
    meta: { title: '宏观风险' }
  },
  {
    path: '/opportunities',
    name: 'Opportunities',
    component: () => import('../views/OpportunitiesPage.vue'),
    meta: { title: '策略筛选' }
  },
  {
    path: '/advice',
    name: 'AiAdvice',
    component: () => import('../views/AiAdvicePage.vue'),
    meta: { title: 'AI 建议' }
  },
  {
    path: '/api-monitoring',
    redirect: '/system'
  },
  {
    path: '/monitoring',
    redirect: '/system'
  },
  {
    path: '/system',
    name: 'SystemMonitor',
    component: () => import('../views/SystemMonitorPage.vue'),
    meta: { title: '系统监控' }
  },
  {
    path: '/ai-advisor',
    name: 'AIAdvisor',
    component: () => import('../views/AIAdvisorPage.vue'),
    meta: { title: 'AI 交易决策' }
  },
  {
    path: '/plans',
    redirect: '/ai-advisor'
  },
  {
    path: '/execution-center',
    redirect: '/ai-advisor'
  },
  {
    path: '/quant-loop',
    name: 'QuantLoop',
    component: () => import('../views/QuantLoopDashboard.vue'),
    meta: { title: '量化交易闭环' }
  },
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
    document.title = `${to.meta.title} - AI Trading 控制塔`;
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
