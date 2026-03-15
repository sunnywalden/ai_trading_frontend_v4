import { isLoggedIn } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import type { RouteAccessMeta } from '@/types/auth'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  { path: '/forbidden', name: 'Forbidden', component: () => import('../views/ForbiddenPage.vue'), meta: { title: '无权限访问' } },
  { path: '/auth/change-password', name: 'ChangePassword', component: () => import('../views/ChangePasswordPage.vue'), meta: { title: '修改密码' } },

  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/DashboardV2Page.vue'), meta: { title: 'Dashboard' } },
  { path: '/research', name: 'ResearchHome', component: () => import('../views/ResearchHomePage.vue'), meta: { title: 'Research Workbench' } },
  { path: '/trading', name: 'TradingHome', component: () => import('../views/TradingHomePage.vue'), meta: { title: 'Trading Workbench' } },
  { path: '/executive', name: 'ExecutiveHome', component: () => import('../views/ExecutiveHomePage.vue'), meta: { title: 'Executive Workbench' } },
  { path: '/admin', name: 'AdminHome', component: () => import('../views/AdminHomePage.vue'), meta: { title: 'Admin Workbench' } },
  { path: '/admin/users', name: 'AdminUsers', component: () => import('../views/AdminUsersPage.vue'), meta: { title: '用户管理' } },
  { path: '/admin/roles', name: 'AdminRoles', component: () => import('../views/AdminRolesPage.vue'), meta: { title: '角色管理' } },
  { path: '/admin/permissions', name: 'AdminPermissions', component: () => import('../views/AdminPermissionsPage.vue'), meta: { title: '权限目录' } },
  { path: '/admin/audit', name: 'AdminAudit', component: () => import('../views/AdminAuditPage.vue'), meta: { title: '授权审计' } },
  { path: '/reports/executive', name: 'ExecutiveReport', component: () => import('../views/ExecutiveReportsPage.vue'), meta: { title: '经营总览报表' } },
  { path: '/reports/risk', name: 'ExecutiveRiskReport', component: () => import('../views/ExecutiveReportsPage.vue'), meta: { title: '风险报表' } },
  { path: '/reports/performance', name: 'ExecutivePerformanceReport', component: () => import('../views/ExecutiveReportsPage.vue'), meta: { title: '绩效报表' } },

  { path: '/autonomy', name: 'Autonomy', component: () => import('../views/AutonomyPage.vue'), meta: { title: 'AI 自主中枢' } },
  { path: '/regime', name: 'Regime', component: () => import('../views/RegimePage.vue'), meta: { title: '市场体制感知' } },
  { path: '/events', name: 'EventCalendar', component: () => import('../views/EventCalendarPage.vue'), meta: { title: '事件日历' } },
  { path: '/copilot', name: 'Copilot', component: () => import('../views/CopilotPage.vue'), meta: { title: 'AI 助手' } },
  { path: '/quant-loop', name: 'QuantLoop', component: () => import('../views/QuantLoopDashboard.vue'), meta: { title: '量化闭环' } },

  { path: '/opportunities', name: 'Opportunities', component: () => import('../views/OpportunitiesPage.vue'), meta: { title: '机会扫描' } },
  { path: '/macro', name: 'Macro', component: () => import('../views/MacroRiskPage.vue'), meta: { title: '宏观风险' } },
  { path: '/strategies', name: 'Strategies', component: () => import('../views/StrategiesPage.vue'), meta: { title: '策略库' } },
  { path: '/etf-pool', name: 'EtfPool', component: () => import('../views/EtfPoolPage.vue'), meta: { title: 'ETF 标的池' } },
  { path: '/options', name: 'OptionsAnalysis', component: () => import('../views/OptionsAnalysisPage.vue'), meta: { title: '期权分析' } },
  { path: '/strategies/:id', name: 'StrategyDetail', component: () => import('../views/StrategyDetailPage.vue'), meta: { title: '策略详情' } },

  { path: '/backtest', name: 'Backtest', component: () => import('../views/BacktestPage.vue'), meta: { title: '回测引擎' } },
  { path: '/alpha-lab', name: 'AlphaLab', component: () => import('../views/AlphaLabPage.vue'), meta: { title: 'Alpha Lab' } },
  { path: '/portfolio', name: 'Portfolio', component: () => import('../views/PortfolioPage.vue'), meta: { title: 'Portfolio Construction' } },

  { path: '/positions', name: 'Positions', component: () => import('../views/PositionsPage.vue'), meta: { title: '持仓监控' } },
  { path: '/position-evaluation', name: 'PositionEvaluation', component: () => import('../views/PositionEvaluationPage.vue'), meta: { title: '持仓评估' } },
  { path: '/paper', name: 'PaperTrading', component: () => import('../views/PaperTradingPage.vue'), meta: { title: '模拟盘' } },

  { path: '/journal', name: 'Journal', component: () => import('../views/JournalPage.vue'), meta: { title: '交易日志' } },
  { path: '/attribution', name: 'Attribution', component: () => import('../views/AttributionPage.vue'), meta: { title: '交易归因' } },
  { path: '/evolution', name: 'Evolution', component: () => import('../views/EvolutionPage.vue'), meta: { title: 'AI 自我进化' } },
  { path: '/alerts', name: 'Alerts', component: () => import('../views/AlertsPage.vue'), meta: { title: '告警中心' } },

  { path: '/system-monitor', name: 'SystemMonitor', component: () => import('../views/SystemMonitorPage.vue'), meta: { title: '系统监控' } },
  { path: '/task-management', name: 'TaskManagement', component: () => import('../views/SystemMonitorPage.vue'), meta: { title: '任务管理' } },

  { path: '/api-monitoring', redirect: () => ({ path: '/system-monitor', query: { tab: 'api' } }) },
  { path: '/service-health', redirect: () => ({ path: '/system-monitor', query: { tab: 'health' } }) },
  { path: '/observability/execution-microscope', redirect: '/observability/execution' },
  { path: '/observability/signal-intelligence', redirect: '/observability/signal' },
  { path: '/observability/risk-cluster', redirect: '/observability/risk' },
  { path: '/ai-hub/factor-weights', redirect: '/ai-hub/weights' },
  { path: '/ai-hub/post-mortems', redirect: '/ai-hub/post-mortem' },

  { path: '/trade-lifecycle', name: 'TradeLifecycle', component: () => import('../views/TradeLifecycleCenterPage.vue'), meta: { title: '持仓生命周期中心' } },
  { path: '/order-book', name: 'OrderBook', component: () => import('../views/IntelligentOrderBookPage.vue'), meta: { title: '智能订单簿' } },
  { path: '/observability/execution', name: 'ExecutionMicroscope', component: () => import('../views/ExecutionMicroscopePage.vue'), meta: { title: '执行显微镜' } },
  { path: '/execution-policy', name: 'ExecutionPolicy', component: () => import('../views/ExecutionPolicyPage.vue'), meta: { title: '执行策略控制台' } },
  { path: '/observability/signal', name: 'SignalIntelligence', component: () => import('../views/SignalIntelligencePage.vue'), meta: { title: '信号观测台' } },
  { path: '/observability/risk', name: 'RiskCluster', component: () => import('../views/RiskClusterPage.vue'), meta: { title: '风险拓扑聚类' } },

  { path: '/ai-hub/agents', name: 'MultiAgent', component: () => import('../views/MultiAgentPage.vue'), meta: { title: '多 Agent 协同' } },
  { path: '/ai-hub/calibration', name: 'Calibration', component: () => import('../views/CalibrationPage.vue'), meta: { title: '置信度校准' } },
  { path: '/ai-hub/weights', name: 'FactorWeights', component: () => import('../views/FactorWeightsPage.vue'), meta: { title: '自适应因子权重' } },
  { path: '/ai-hub/post-mortem', name: 'PostMortem', component: () => import('../views/PostMortemPage.vue'), meta: { title: '决策事后剖析' } },

  { path: '/war-room', name: 'WarRoom', component: () => import('../views/WarRoomPage.vue'), meta: { title: 'War Room 作战室' } },
  { path: '/governance/pipeline', name: 'GovernancePipeline', component: () => import('../views/GovernancePipelinePage.vue'), meta: { title: 'Promotion Pipeline' } },
  { path: '/live-safety', name: 'LiveSafety', component: () => import('../views/LiveSafetyPage.vue'), meta: { title: 'AI 安全' } },

  { path: '/signal-watchtower', name: 'SignalWatchtower', component: () => import('../views/SignalWatchtowerPage.vue'), meta: { title: '信号哨所 · Signal Watchtower' } },
  { path: '/system', redirect: '/system-monitor' },
  { path: '/monitoring', redirect: '/system-monitor' },
  { path: '/advice', redirect: '/copilot' },
  { path: '/login', name: 'Login', component: () => import('../views/LoginPage.vue'), meta: { title: '登录' } },
]

const ACCESS_RULES: Array<{ pattern: RegExp } & RouteAccessMeta> = [
  { pattern: /^\/research$/, roles: ['RESEARCHER', 'ADMINISTRATOR'], permissions: ['research.home.read'], accessMode: 'standard', workbenchDomain: 'research', featureFlag: 'ROLE_HOME_V1121_ENABLED' },
  { pattern: /^\/(alpha-lab|opportunities|macro|regime|events|backtest|etf-pool|options|signal-watchtower)$/, roles: ['RESEARCHER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'research' },
  { pattern: /^\/strategies(\/.*)?$/, roles: ['RESEARCHER', 'TRADER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'research' },
  { pattern: /^\/portfolio$/, roles: ['RESEARCHER', 'SUPERVISOR', 'ADMINISTRATOR'], accessMode: 'summary', workbenchDomain: 'research' },

  { pattern: /^\/trading$/, roles: ['TRADER', 'ADMINISTRATOR'], permissions: ['trading.home.read'], accessMode: 'standard', workbenchDomain: 'trading', featureFlag: 'ROLE_HOME_V1121_ENABLED' },
  { pattern: /^\/(order-book|execution-policy|trade-lifecycle|positions|position-evaluation|paper|journal|alerts)$/, roles: ['TRADER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'trading' },
  { pattern: /^\/attribution$/, roles: ['TRADER', 'SUPERVISOR', 'ADMINISTRATOR'], accessMode: 'summary', workbenchDomain: 'trading' },
  { pattern: /^\/observability\/execution$/, roles: ['TRADER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'trading' },
  { pattern: /^\/observability\/risk$/, roles: ['TRADER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'trading' },
  { pattern: /^\/observability\/signal$/, roles: ['RESEARCHER', 'ADMINISTRATOR'], accessMode: 'readonly', workbenchDomain: 'research' },

  { pattern: /^\/executive$/, roles: ['SUPERVISOR', 'ADMINISTRATOR'], permissions: ['executive.home.read'], accessMode: 'summary', workbenchDomain: 'executive', featureFlag: 'ROLE_HOME_V1121_ENABLED' },
  { pattern: /^\/reports\/(executive|risk|performance)$/, roles: ['SUPERVISOR', 'ADMINISTRATOR'], accessMode: 'summary', workbenchDomain: 'executive', featureFlag: 'EXECUTIVE_REPORTS_V1121_ENABLED' },

  { pattern: /^\/admin$/, roles: ['ADMINISTRATOR'], permissions: ['admin.home.read'], accessMode: 'standard', workbenchDomain: 'admin', featureFlag: 'ROLE_HOME_V1121_ENABLED' },
  { pattern: /^\/admin\/(users|roles|permissions|audit)$/, roles: ['ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'admin', featureFlag: 'ADMIN_CONSOLE_V1121_ENABLED' },
  { pattern: /^\/(system-monitor|task-management)$/, roles: ['ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'admin' },
  { pattern: /^\/live-safety$/, roles: ['ADMINISTRATOR'], permissions: ['admin.system.read'], accessMode: 'standard', workbenchDomain: 'admin', featureFlag: 'ADMIN_CONSOLE_V1121_ENABLED' },

  { pattern: /^\/dashboard$/, roles: ['RESEARCHER', 'TRADER', 'SUPERVISOR', 'ADMINISTRATOR'], accessMode: 'summary', workbenchDomain: 'common' },
  { pattern: /^\/copilot$/, roles: ['RESEARCHER', 'TRADER', 'SUPERVISOR', 'ADMINISTRATOR'], permissions: ['common.copilot.read'], accessMode: 'summary', workbenchDomain: 'common' },
  { pattern: /^\/autonomy$/, roles: ['TRADER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'trading' },
  { pattern: /^\/quant-loop$/, roles: ['TRADER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'trading' },
  { pattern: /^\/war-room$/, roles: ['TRADER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'trading' },
  { pattern: /^\/governance\/pipeline$/, roles: ['RESEARCHER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'research' },
  { pattern: /^\/ai-hub\/agents$/, roles: ['RESEARCHER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'research' },
  { pattern: /^\/ai-hub\/(calibration|weights)$/, roles: ['RESEARCHER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'research' },
  { pattern: /^\/ai-hub\/post-mortem$/, roles: ['RESEARCHER', 'TRADER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'research' },
  { pattern: /^\/evolution$/, roles: ['RESEARCHER', 'ADMINISTRATOR'], accessMode: 'standard', workbenchDomain: 'research' },
]

export function resolveRouteAccess(path: string): RouteAccessMeta {
  return ACCESS_RULES.find((rule) => rule.pattern.test(path)) ?? {}
}

function updateDocumentTitle(to: any) {
  if (!to.meta.title) return
  const routeTitle = typeof to.meta.title === 'string' ? to.meta.title : 'AI 量化自主交易系统'
  document.title = `${routeTitle} - AI 量化自主交易系统`
}

async function ensureProfileReady(authStore: ReturnType<typeof useAuthStore>) {
  if (!authStore.user) {
    await authStore.refreshProfile()
  }
}

async function resolvePreAccessNavigation(
  to: any,
  authStore: ReturnType<typeof useAuthStore>,
  loggedIn: boolean,
) {
  if (to.path === '/') {
    if (!loggedIn) return { path: '/login' }
    await authStore.refreshProfile()
    return { path: authStore.homePath }
  }

  if (to.path === '/login') {
    if (!loggedIn) return null
    await authStore.refreshProfile()
    return { path: authStore.homePath }
  }

  if (to.path === '/auth/change-password') {
    if (!loggedIn) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    await ensureProfileReady(authStore)
    return true
  }

  if (!loggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  await ensureProfileReady(authStore)
  if (to.path === '/forbidden') return true
  return null
}

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  updateDocumentTitle(to)

  const authStore = useAuthStore()
  if (!authStore.initialized) {
    authStore.hydrateFromToken()
  }

  const loggedIn = isLoggedIn()

  const preAccessResult = await resolvePreAccessNavigation(
    to,
    authStore,
    loggedIn,
  )
  if (preAccessResult === true) {
    return next()
  }
  if (preAccessResult) {
    return next(preAccessResult)
  }

  const access = resolveRouteAccess(to.path)
  if (!authStore.canAccessRoute(access)) {
    return next({ path: '/forbidden', query: { from: to.fullPath, previous: from.fullPath } })
  }

  return next()
})

export default router
