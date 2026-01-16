import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/behavior'
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
    meta: { title: '执行列表' }
  },
  {
    path: '/advice',
    name: 'AiAdvice',
    component: () => import('../views/AiAdvicePage.vue'),
    meta: { title: 'AI 建议' }
  },
  {
    path: '/api-monitoring',
    name: 'ApiMonitoring',
    component: () => import('../views/ApiMonitoringPage.vue'),
    meta: { title: 'API 监控' }
  },
  {
    path: '/monitoring',
    name: 'Monitoring',
    component: () => import('../views/SystemHealthPage.vue'),
    meta: { title: '系统健康' }
  },
  {
    path: '/plans',
    name: 'TradingPlans',
    component: () => import('../views/TradingPlanPage.vue'),
    meta: { title: '交易计划' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫 - 更新页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - AI Trading 控制塔`;
  }
  next();
});

export default router;
