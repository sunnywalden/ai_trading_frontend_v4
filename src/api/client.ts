import axios from "axios";

// 后端基础 URL
const BACKEND_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_BACKEND_URL ?? "");

// 业务 API（/api/v1/*）
const api = axios.create({
  baseURL: import.meta.env.DEV ? "/api" : (import.meta.env.VITE_BACKEND_URL ?? "") + "/api",
  timeout: 30000
});

// 系统 API（无前缀，如 /health）
const systemApi = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000
});

// 临时请求/响应拦截器：打印请求信息，便于调试为什么请求被取消或未发出
api.interceptors.request.use((config) => {
  try {
    // 打印最终请求 URL（包含 baseURL + url）和 params
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    // eslint-disable-next-line no-console
    console.debug('[API Request]', fullUrl, config.method, config.params || config.data || {});
  } catch (e) {
    // ignore
  }
  return config;
});

api.interceptors.response.use(
  (resp) => {
    // eslint-disable-next-line no-console
    console.debug('[API Response]', resp.config?.url, resp.status);
    return resp;
  },
  (err) => {
    // eslint-disable-next-line no-console
    console.error('[API Error]', err?.config?.url, err?.message || err);
    return Promise.reject(err);
  }
);

systemApi.interceptors.request.use((config) => {
  try {
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    // eslint-disable-next-line no-console
    console.debug('[System API Request]', fullUrl, config.method, config.params || config.data || {});
  } catch (e) {}
  return config;
});

systemApi.interceptors.response.use(
  (resp) => {
    // eslint-disable-next-line no-console
    console.debug('[System API Response]', resp.config?.url, resp.status);
    return resp;
  },
  (err) => {
    // eslint-disable-next-line no-console
    console.error('[System API Error]', err?.config?.url, err?.message || err);
    // 如果后端返回 401，清除本地 token 并派发登出事件（由前端决定如何导航）
    if (err?.response?.status === 401) {
      try {
        setAuthToken(null);
      } catch (e) {}
      // 由前端应用监听并执行适当的导航（避免硬刷新）
      if (typeof window !== 'undefined') {
        try { window.dispatchEvent(new CustomEvent('auth-logout')); } catch (e) {}
      }
    }
    return Promise.reject(err);
  }
);

// ====== Auth helpers: token storage + auto-inject Authorization header ======
export function setAuthToken(token: string | null, remember: boolean = true) {
  try {
    if (token) {
      if (remember) {
        localStorage.setItem('auth_token', token);
      } else {
        sessionStorage.setItem('auth_token', token);
      }
    } else {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    }
  } catch (e) {}
}

export function getAuthToken(): string | null {
  try {
    // 优先使用 sessionStorage（短期会话），其次是 localStorage（记住登录）
    return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  } catch (e) {
    return null;
  }
}

export function isLoggedIn(): boolean {
  try {
    return !!getAuthToken();
  } catch (e) {
    return false;
  }
}

// 轻量的 JWT 解码（仅在前端展示用途，不验证签名）
export function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const b = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    try {
      return JSON.parse(decodeURIComponent(escape(b)));
    } catch {
      return JSON.parse(b);
    }
  } catch (e) {
    return null;
  }
}

export function getTokenPayload() {
  const t = getAuthToken();
  if (!t) return null;
  return decodeJwt(t) as any | null;
}

export function getCurrentUsername(): string | null {
  const p = getTokenPayload();
  return (p && p.sub) || null;
}

export function getTokenExpiryMs(): number | null {
  const p = getTokenPayload();
  if (!p || !p.exp) return null;
  return Number(p.exp) * 1000;
}

export function getTokenExpiryRelative(): string | null {
  const exp = getTokenExpiryMs();
  if (!exp) return null;
  const diff = exp - Date.now();
  if (diff <= 0) return '已过期';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} 分钟`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时`;
  const days = Math.floor(hours / 24);
  return `${days} 天`;
}

export function isTokenExpired(): boolean {
  // If there is no token, don't consider it 'expired' — callers should check token presence separately.
  const token = getAuthToken();
  if (!token) return false;
  const exp = getTokenExpiryMs();
  if (!exp) return false;
  return Date.now() > exp;
}

export async function loginUser(username: string, password: string, remember: boolean = true) {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  // OAuth2 Password grant returns { access_token, token_type }
  const { data } = await systemApi.post('/api/v1/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  const token = data && data.access_token;
  if (token) {
    setAuthToken(token, remember);
  }
  return data;
}

export function logout() {
  setAuthToken(null);
  try { sessionStorage.removeItem('auth_token'); } catch (e) {}
  try { localStorage.removeItem('auth_token'); } catch (e) {}
  if (typeof window !== 'undefined') {
    // Dispatch an event and let the app handle navigation to avoid full page reloads
    try { window.dispatchEvent(new CustomEvent('auth-logout')); } catch (e) {}
  }
}

// 把 token 自动注入到请求头中（适用于 api 与 systemApi）
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

systemApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface HealthResponse {
  status: string;
  mode: string;
}

export interface LimitsView {
  max_order_notional_usd: number;
  max_total_gamma_pct: number;
  max_total_vega_pct: number;
  max_total_theta_pct: number;
}

export interface ExposureView {
  equity_usd: number;
  total_delta_notional_usd: number;
  total_gamma_usd: number;
  total_vega_usd: number;
  total_theta_usd: number;
  short_dte_gamma_usd: number;
  short_dte_vega_usd: number;
  short_dte_theta_usd: number;
  delta_pct: number;
  gamma_pct: number;
  vega_pct: number;
  theta_pct: number;
  short_dte_gamma_pct: number;
  short_dte_theta_pct: number;
}

export interface SymbolBehaviorView {
  symbol: string;
  tier: "T1" | "T2" | "T3" | "T4";
  behavior_score: number;
  sell_fly_score: number;
  discipline_score: number;
  overtrade_score: number;
  revenge_score: number;
  trade_count: number;
  sell_fly_events: number;
  sell_fly_extra_cost_ratio: number;
  overtrade_index: number;
  revenge_events: number;
}

export interface AiStateResponse {
  trade_mode: string;
  limits: LimitsView;
  exposure: ExposureView;
  symbols: Record<string, SymbolBehaviorView>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await systemApi.get<HealthResponse>("/health");
  return data;
}

export async function runAutoHedgeOnce(): Promise<{ status: string; detail: string }> {
  const { data } = await api.post("/v1/run-auto-hedge-once");
  return data;
}

export async function fetchAiState(window_days?: number): Promise<AiStateResponse> {
  const { data } = await api.get<AiStateResponse>("/v1/ai/state", {
    params: window_days ? { window_days } : undefined
  });
  return data;
}

export interface AiAdviceRequest {
  goal: string;
  account_id?: string;
  time_horizon?: 'INTRADAY' | 'SWING' | 'POSITION';
  risk_preference?: any;
  notes?: string;
}

export interface AiAdviceResponse {
  summary: string;
  reasoning: string;
  suggested_orders: any[];
}

export interface StockSymbol {
  symbol: string;
  name: string;
  market: 'US' | 'HK';
}

export interface SymbolSearchResponse {
  items: StockSymbol[];
}

export interface KlineAnalysisRequest {
  symbol: string;
}

export interface KlineAnalysisResponse {
  symbol: string;
  prediction: string;
  suggestion: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  action: 'BUY' | 'SELL' | 'HOLD' | 'EMPTY' | 'INCREASE';
  details: string;
}

export async function fetchAiAdvice(request: AiAdviceRequest): Promise<AiAdviceResponse> {
  const { data } = await api.post<AiAdviceResponse>("/v1/ai/advice", request);
  return data;
}

export async function fetchAiSymbols(q?: string): Promise<SymbolSearchResponse> {
  const { data } = await api.get<SymbolSearchResponse>("/v1/ai/symbols", {
    params: q ? { q } : undefined
  });
  return data;
}

export async function analyzeStockKline(symbol: string): Promise<KlineAnalysisResponse> {
  const { data } = await api.post<KlineAnalysisResponse>("/v1/ai/analyze-stock", { symbol });
  return data;
}

export default api;

export interface BehaviorRebuildResponse {
  status: string;
  account_id: string;
  window_days: number;
  symbols_processed: string[];
  metrics?: Record<string, any>;
}

export async function rebuildBehavior(
  window_days: number,
  account_id?: string,
  async_run?: boolean
): Promise<BehaviorRebuildResponse> {
  const { data } = await api.post<BehaviorRebuildResponse>("/v1/admin/behavior/rebuild", {
    window_days,
    ...(account_id ? { account_id } : {})
  }, {
    params: async_run ? { async_run } : undefined
  });
  return data;
}

// ========== 交易计划 API ==========

export type PlanStatus = 'ACTIVE' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED';

export interface PlanView {
  id: number;
  account_id: string;
  symbol: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  target_position: number;
  plan_status: PlanStatus;
  plan_tags?: Record<string, any> | null;
  valid_from?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanCreateRequest {
  symbol: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  target_position: number;
  plan_tags?: Record<string, any> | null;
  valid_until?: string | null;
  notes?: string | null;
}

export interface PlanUpdateRequest {
  entry_price?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  target_position?: number | null;
  plan_status?: PlanStatus | null;
  plan_tags?: Record<string, any> | null;
  valid_until?: string | null;
  notes?: string | null;
}

export interface PlanListResponse {
  status: string;
  total: number;
  plans: PlanView[];
}

export async function fetchPlans(params?: { status?: PlanStatus; symbol?: string }): Promise<PlanListResponse> {
  const { data } = await api.get<PlanListResponse>('/v1/plan/list', { params });
  return data;
}

export async function createPlan(request: PlanCreateRequest): Promise<PlanView> {
  const { data } = await api.post<PlanView>('/v1/plan/create', request);
  return data;
}

export async function updatePlan(planId: number, request: PlanUpdateRequest): Promise<PlanView> {
  const { data } = await api.patch<PlanView>(`/v1/plan/${planId}`, request);
  return data;
}

export async function deletePlan(planId: number): Promise<{ status: string } | void> {
  const { data } = await api.delete<{ status: string }>(`/v1/plan/${planId}`);
  return data;
}

// ========== 持仓评估 API ==========

export interface TrendSnapshot {
  symbol: string;
  trend_direction?: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  trend_strength?: number;
  trend_description?: string;
  rsi_value?: number;
  rsi_status?: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  macd_status?: string;
  macd_signal?: number;
  bollinger_position?: string;
  volume_ratio?: number;
  support_levels: number[];
  resistance_levels: number[];
  ai_summary?: string;
  timestamp: string;
}

export interface PositionItem {
  symbol: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  budget_utilization?: number;
  plan_deviation?: number;
  technical_score: number;
  fundamental_score: number;
  sentiment_score: number;
  overall_score: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'REDUCE' | 'SELL' | 'STRONG_SELL';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  target_position?: number;
  stop_loss?: number;
  take_profit?: number;
  trend_snapshot: TrendSnapshot | null;
  ai_advice?: string;
}

export interface PositionsSummary {
  total_positions: number;
  total_value: number;
  total_pnl: number;
  avg_score: number;
  high_risk_count: number;
  buy_recommendation_count?: number;
  recommendations?: {
    strong_buy: number;
    buy: number;
    hold: number;
    sell: number;
    strong_sell: number;
  };
}

export interface PositionsAssessmentResponse {
  positions: PositionItem[];
  summary: PositionsSummary;
  portfolio_analysis?: {
    weighted_score: number;
    total_beta: number;
    sector_ratios: Record<string, number>;
    industry_ratios: Record<string, number>;
    ai_summary?: string;
  };
  ai_recommendations?: Array<{
    type: string;
    action: string;
    reason: string;
  }>;
  timestamp: string;
}

export interface TechnicalAnalysisResponse {
  symbol: string;
  timeframe: string;
  trend_direction: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  trend_strength: number;
  rsi: number;
  macd: number;
  macd_signal: number;
  bollinger_upper: number;
  bollinger_lower: number;
  support: number[];
  resistance: number[];
  volume_ratio: number;
  overall_score: number;
  ai_summary: string;
  timestamp: string;
}

export interface ValuationMetrics {
  pe_ratio: number | null;
  pb_ratio: number | null;
  peg_ratio: number | null;
  score: number;
}

export interface ProfitabilityMetrics {
  roe: number;
  roa: number;
  profit_margin: number;
  score: number;
}

export interface GrowthMetrics {
  revenue_growth: number;
  earnings_growth: number;
  score: number;
}

export interface HealthMetrics {
  current_ratio: number;
  debt_to_equity: number;
  score: number;
}

export interface FundamentalAnalysisResponse {
  symbol: string;
  valuation: ValuationMetrics;
  profitability: ProfitabilityMetrics;
  growth: GrowthMetrics;
  health: HealthMetrics;
  overall_score: number;
  ai_summary: string;
  timestamp: string;
}

export async function fetchPositionsAssessment(
  window_days?: number,
  force_refresh?: boolean
): Promise<PositionsAssessmentResponse> {
  const params: Record<string, any> = {};
  if (window_days) params.window_days = window_days;
  if (force_refresh) params.force_refresh = force_refresh;
  const { data } = await api.get<PositionsAssessmentResponse>("/v1/positions/assessment", {
    params: Object.keys(params).length ? params : undefined
  });
  return data;
}

export async function fetchTechnicalAnalysis(
  symbol: string,
  timeframe?: string,
  force_refresh?: boolean
): Promise<TechnicalAnalysisResponse> {
  const { data } = await api.get<TechnicalAnalysisResponse>(`/v1/positions/${symbol}/technical`, {
    params: { timeframe, force_refresh }
  });
  return data;
}

export async function fetchFundamentalAnalysis(
  symbol: string,
  force_refresh?: boolean
): Promise<FundamentalAnalysisResponse> {
  const { data } = await api.get<FundamentalAnalysisResponse>(`/v1/positions/${symbol}/fundamental`, {
    params: { force_refresh }
  });
  return data;
}

export async function refreshPositions(
  symbols?: string[],
  force?: boolean,
  async_run?: boolean
): Promise<{
  status: string;
  refreshed: string[];
  timestamp: string;
  message?: string;
  results?: {
    technical?: Record<string, any>;
    fundamental?: Record<string, any>;
    scores?: Record<string, any>;
  };
}> {
  const params: Record<string, any> = {};
  if (force) params.force = force;
  if (async_run) params.async_run = async_run;
  const { data } = await api.post(
    "/v1/positions/refresh",
    symbols || [],
    { params: Object.keys(params).length ? params : undefined }
  );
  return data;
}

// ========== 宏观风险 API ==========

export interface RiskScore {
  score: number;
  description: string;
}

export interface OverallRisk {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  confidence: number;
}

export interface RiskAlert {
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  dimension: string;
  message: string;
  recommendation: string;
}

export interface MacroRiskOverviewResponse {
  timestamp: string;
  overall_risk: OverallRisk;
  risk_breakdown: {
    monetary_policy: RiskScore;
    geopolitical: RiskScore;
    sector_bubble: RiskScore;
    economic_cycle: RiskScore;
    market_sentiment: RiskScore;
  };
  alerts: RiskAlert[];
  key_concerns: string[];
  recommendations: string[] | string;
  ai_analysis: string;
  recent_events: any[];
  _meta?: {
    response_time_ms?: number;
    cache_hit?: boolean;
    data_freshness?: string;
  };
}

export interface MonetaryPolicyData {
  fed_funds_rate: number;
  treasury_10y: number;
  treasury_2y: number;
  yield_curve_slope: number;
  inflation_rate: number;
  m2_growth: number;
  policy_stance: string;
  last_updated: string;
}

export interface EconomicCycleData {
  gdp_growth_rate: number;
  unemployment_rate: number;
  industrial_production_growth: number;
  estimated_pmi: number;
  consumer_sentiment: number;
  cycle_phase: string;
  recession_probability: number;
  last_updated: string;
}

export interface MonetaryPolicyResponse {
  monetary_policy: MonetaryPolicyData;
  economic_cycle: EconomicCycleData;
  last_updated: string;
}

export interface GeopoliticalEvent {
  event_id: number;
  title: string;
  category: 'MILITARY_CONFLICT' | 'TRADE_WAR' | 'SANCTIONS' | 'POLITICAL_CRISIS' | 'TERRORISM' | 'CYBER_ATTACK' | 'DIPLOMATIC_TENSION';
  severity: number;
  market_impact: number;
  affected_regions: string[];
  affected_sectors: string[];
  published_at: string;
  source: string;
  summary: string;
}

export interface GeopoliticalRiskAssessment {
  score: number;
  event_count: number;
  avg_severity: number;
  avg_market_impact: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface GeopoliticalEventsResponse {
  total_events: number;
  risk_assessment: GeopoliticalRiskAssessment;
  events: GeopoliticalEvent[];
}

export interface SchedulerJob {
  id: string;
  name: string;
  trigger: string;
  interval_hours?: number;
  cron?: string;
  next_run_time: string;
  status: string;
}

export interface SchedulerJobsResponse {
  total_jobs: number;
  jobs: SchedulerJob[];
}

export async function fetchMacroRiskOverview(force_refresh?: boolean): Promise<MacroRiskOverviewResponse> {
  const { data } = await api.get<MacroRiskOverviewResponse>("/v1/macro/risk/overview", {
    params: force_refresh ? { force_refresh } : undefined
  });
  return data;
}

export async function fetchMonetaryPolicy(): Promise<MonetaryPolicyResponse> {
  const { data } = await api.get<MonetaryPolicyResponse>("/v1/macro/monetary-policy");
  return data;
}

export async function fetchGeopoliticalEvents(
  days?: number,
  category?: string,
  min_impact?: number
): Promise<GeopoliticalEventsResponse> {
  const params: Record<string, any> = {};
  if (days) params.days = days;
  if (category) params.category = category;
  if (min_impact !== undefined) params.min_impact = min_impact;
  const { data } = await api.get<GeopoliticalEventsResponse>("/v1/macro/geopolitical-events", {
    params: Object.keys(params).length ? params : undefined
  });
  return data;
}

export async function refreshMacroData(params?: {
  refresh_indicators?: boolean;
  refresh_events?: boolean;
  refresh_risk?: boolean;
}): Promise<{
  status?: string;
  refreshed_components?: string[];
  message?: string;
  timestamp?: string;
  results?: Record<string, any>;
}> {
  const { data } = await api.post("/v1/macro/refresh", null, { params });
  return data;
}

export async function fetchSchedulerJobs(): Promise<SchedulerJobsResponse> {
  const { data } = await api.get<SchedulerJobsResponse>("/v1/admin/scheduler/jobs");
  return data;
}

export async function pauseScheduler(): Promise<{ status: string; message: string }> {
  const { data } = await api.post("/v1/admin/scheduler/pause");
  return data;
}

export async function resumeScheduler(): Promise<{ status: string; message: string }> {
  const { data } = await api.post("/v1/admin/scheduler/resume");
  return data;
}

// ========== 策略管理 API ==========

export interface StrategySummaryView {
  id: string;
  name: string;
  style?: string | null;
  description?: string | null;
  is_builtin: boolean;
  is_active: boolean;
  tags: string[];
  last_run_status?: string | null;
  last_run_at?: string | null;
}

export interface StrategyDetailView extends StrategySummaryView {
  version: number;
  default_params: Record<string, any>;
  signal_sources: Record<string, any>;
  risk_profile: Record<string, any>;
}

export interface StrategyListResponse {
  status: string;
  strategies: StrategySummaryView[];
}

export interface StrategyDetailResponse {
  status: string;
  strategy: StrategyDetailView;
}

export interface StrategyRunRequest {
  account_id?: string | null;
  direction?: string | null;
  notify_channels?: string[];
  target_universe?: string | null;
  min_score?: number;
  max_results?: number;
  priority?: number | null;
}

export interface StrategyRunResponse {
  status: string;
  run_id: string;
  celery_task_id?: string | null;
}

export interface StrategyTimelineEntry {
  start?: string;
  end?: string;
}

export type StrategyTimeline = Record<string, StrategyTimelineEntry>;

export interface StrategyRunStatusView {
  run_id: string;
  status: string;
  phase?: string | null;
  progress: number;
  attempt: number;
  error_message?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  timeline?: StrategyTimeline | null;
}

export interface StrategyRunLatestResponse {
  status: string;
  run: StrategyRunStatusView | null;
}

export interface StrategyRunHistoryItem {
  run_id: string;
  strategy_id: string;
  status: string;
  started_at?: string | null;
  finished_at?: string | null;
  hits?: number | null;
  hit_rate?: number | null;
  avg_signal_strength?: number | null;
}

export interface StrategyRunHistoryResponse {
  status: string;
  runs: StrategyRunHistoryItem[];
}

export interface StrategyRunAssetView {
  symbol: string;
  signal_strength?: number | null;
  weight?: number | null;
  action?: string | null;
  direction?: string | null;
  risk_flags: string[];
  notes?: string | null;
  signal_dimensions: Record<string, any>;
}

export interface StrategyRunResultsResponse {
  status: string;
  run_id: string;
  strategy_id: string;
  assets: StrategyRunAssetView[];
}

export interface StrategyExportResponse {
  status: string;
  run_id: string;
  download_url: string;
  file_path: string;
}

export interface StrategyListParams {
  style?: string;
  is_builtin?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface StrategyRunListParams {
  limit?: number;
  offset?: number;
  strategy_id?: string;
  account_id?: string;
  status?: string;
}

export async function fetchStrategies(params?: StrategyListParams): Promise<StrategyListResponse> {
  const { data } = await api.get<StrategyListResponse>('/v1/strategies', {
    params: params ? { ...params } : undefined
  });
  return data;
}

export async function fetchStrategyDetail(strategyId: string): Promise<StrategyDetailResponse> {
  const { data } = await api.get<StrategyDetailResponse>(`/v1/strategies/${strategyId}`);
  return data;
}

export async function runStrategy(strategyId: string, request: StrategyRunRequest): Promise<StrategyRunResponse> {
  const { data } = await api.post<StrategyRunResponse>(`/v1/strategies/${strategyId}/run`, request);
  return data;
}

export async function fetchStrategyRunStatus(runId: string): Promise<StrategyRunStatusView> {
  const { data } = await api.get<StrategyRunStatusView>(`/v1/strategy-runs/${runId}/status`);
  return data;
}

export async function fetchLatestStrategyRun(accountId?: string, strategyId?: string): Promise<StrategyRunLatestResponse> {
  const params: Record<string, any> = {};
  if (accountId) params.account_id = accountId;
  if (strategyId) params.strategy_id = strategyId;
  const { data } = await api.get<StrategyRunLatestResponse>('/v1/strategy-runs/latest', {
    params: Object.keys(params).length ? params : undefined
  });
  return data;
}

export async function fetchStrategyRuns(params?: StrategyRunListParams): Promise<StrategyRunHistoryResponse> {
  const { data } = await api.get<StrategyRunHistoryResponse>('/v1/strategy-runs', {
    params: params ? { ...params } : undefined
  });
  return data;
}

export async function fetchStrategyRunResults(runId: string): Promise<StrategyRunResultsResponse> {
  const { data } = await api.get<StrategyRunResultsResponse>(`/v1/strategy-runs/${runId}/results`);
  return data;
}

export async function exportStrategyRun(runId: string): Promise<StrategyExportResponse> {
  const { data } = await api.post<StrategyExportResponse>(`/v1/strategy-runs/${runId}/export`);
  return data;
}

// ========== 定时任务管理 API ==========

export interface SchedulerJobDetail {
  id: string;
  name: string;
  next_run_time: string;
  trigger: string;
  timezone?: string;
  status?: string;
}

export interface SchedulerJobsListResponse {
  status: string;
  total_jobs: number;
  jobs: SchedulerJobDetail[];
}

export interface UpdateJobScheduleRequest {
  hour: number;
  minute: number;
  timezone?: string;
}

export interface UpdateJobScheduleResponse {
  status: string;
  message: string;
  job: SchedulerJobDetail;
}

export async function fetchSchedulerJobsList(): Promise<SchedulerJobsListResponse> {
  const { data } = await api.get<SchedulerJobsListResponse>('/v1/admin/scheduler/jobs');
  return data;
}

export async function pauseSchedulerJob(jobId: string): Promise<{ status: string; message: string }> {
  const { data } = await api.post(`/v1/admin/scheduler/jobs/${jobId}/pause`);
  return data;
}

export async function resumeSchedulerJob(jobId: string): Promise<{ status: string; message: string }> {
  const { data } = await api.post(`/v1/admin/scheduler/jobs/${jobId}/resume`);
  return data;
}

export async function updateJobSchedule(
  jobId: string,
  request: UpdateJobScheduleRequest
): Promise<UpdateJobScheduleResponse> {
  const { data } = await api.put<UpdateJobScheduleResponse>(
    `/v1/admin/scheduler/jobs/${jobId}/schedule`,
    request
  );
  return data;
}

// ========== API 监控 ==========

export interface ApiStats {
  provider: string;
  total_calls: number;
  success_calls: number;
  error_calls: number;
  success_rate: number;
  rate_limit: number;
  usage_percent: number;
  status: string;
  remaining: number;
  suggestion?: string;
}

export interface Alert {
  provider: string;
  message: string;
  remaining: number;
  timestamp?: string;
}

export interface ErrorLog {
  timestamp: string;
  provider: string;
  endpoint: string;
  error_message: string;
  error_details?: any;
}

export interface RateLimitPolicy {
  provider: string;
  daily_limit?: number;
  hourly_limit?: number;
  minute_limit?: number;
  warning_threshold: number;
  critical_threshold: number;
  notes?: string;
}

export interface MonitoringReport {
  generated_at: string;
  summary: {
    total_providers: number;
    critical_alerts: number;
    warnings: number;
    total_errors_today: number;
  };
  daily_stats: ApiStats[];
  critical_alerts: Alert[];
  warnings: Alert[];
  recent_errors: ErrorLog[];
  rate_limit_policies: Record<string, RateLimitPolicy>;
}

export interface RateLimitStatus {
  provider: string;
  can_call: boolean;
  status: string;
  usage_percent: number;
  remaining: number;
  reason?: string;
  suggestion?: string;
}

export interface MonitoringHealthResponse {
  status: string;
  monitoring_active?: boolean;
  monitoring_enabled?: boolean;
  redis_enabled?: boolean;
  timestamp?: string;
  last_updated?: string;
}

export async function fetchMonitoringStats(timeRange: 'day' | 'hour' | 'minute' = 'day'): Promise<ApiStats[]> {
  const { data } = await api.get<ApiStats[]>('/v1/stats', {
    params: { time_range: timeRange }
  });
  return data;
}

export async function fetchMonitoringStatsByProvider(
  provider: string,
  timeRange: 'day' | 'hour' | 'minute' = 'day'
): Promise<ApiStats> {
  const { data } = await api.get<ApiStats>(`/v1/stats/${provider}`, {
    params: { time_range: timeRange }
  });
  return data;
}

export async function fetchMonitoringReport(): Promise<MonitoringReport> {
  const { data } = await api.get<MonitoringReport>('/v1/report');
  return data;
}

export async function checkRateLimitStatus(provider: string): Promise<RateLimitStatus> {
  const { data } = await api.get<RateLimitStatus>(`/v1/rate-limit/${provider}`);
  return data;
}

export async function fetchRateLimitPolicies(): Promise<Record<string, RateLimitPolicy>> {
  const { data } = await api.get<Record<string, RateLimitPolicy>>('/v1/policies');
  return data;
}

export async function fetchRateLimitPolicy(provider: string): Promise<RateLimitPolicy> {
  const { data } = await api.get<RateLimitPolicy>(`/v1/policies/${provider}`);
  return data;
}

export async function fetchMonitoringHealth(): Promise<MonitoringHealthResponse> {
  const { data } = await api.get<MonitoringHealthResponse>('/v1/monitoring/health');
  return data;
}

// ========== 市场热点 API ==========

export interface Hotspot {
  id?: number;
  title: string;
  description: string;
  event_date: string;
  category: string;
  severity: string;
  market_impact_score: number;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  related_symbols?: string[];
  source: string;
  url: string;
}

export interface Category {
  id: string;
  label: string;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/v1/hotspots/categories');
  return data;
}

export async function fetchLatestHotspots(force_refresh: boolean = false): Promise<Hotspot[]> {
  const { data } = await api.get<Hotspot[]>('/v1/hotspots/latest', {
    params: { force_refresh }
  });
  return data;
}


// =====================================================================
// V9: Dashboard / Equity / Journal / Alerts / Orders API
// =====================================================================

// ---------- Dashboard ----------
export interface DashboardExposure {
  delta_pct: number;
  gamma_pct: number;
  vega_pct: number;
  theta_pct: number;
}
export interface DashboardSignal {
  symbol: string;
  signal_type: string;
  message: string;
  timestamp: string;
  severity: string;
}
export interface DashboardAction {
  action_type: string;
  message: string;
  link: string;
}
export interface DashboardSummary {
  account_id: string;
  total_equity: number;
  cash: number;
  market_value: number;
  daily_pnl: number;
  daily_return_pct: number;
  mtd_return_pct: number;
  ytd_return_pct: number;
  plan_execution_rate: number;
  active_plans_count: number;
  risk_level: string;
  exposure: DashboardExposure;
  recent_signals: DashboardSignal[];
  pending_actions: DashboardAction[];
}
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/v1/dashboard/summary');
  return data;
}

// ---------- Equity ----------
export interface EquitySnapshot {
  snapshot_date: string;
  total_equity: number;
  cash: number;
  market_value: number;
  daily_return: number | null;
  cumulative_return: number | null;
  max_drawdown_pct: number | null;
  benchmark_return: number | null;
}
export interface EquitySnapshotsResponse {
  account_id: string;
  snapshots: EquitySnapshot[];
}
export async function fetchEquitySnapshots(days: number = 30): Promise<EquitySnapshotsResponse> {
  const { data } = await api.get<EquitySnapshotsResponse>('/v1/equity/snapshots', { params: { days } });
  return data;
}

export interface PnlAttributionItem {
  label: string;
  pnl: number;
  pct: number;
  trade_count: number;
}
export interface PnlAttributionResponse {
  account_id: string;
  group_by: string;
  total_pnl: number;
  items: PnlAttributionItem[];
}
export async function fetchPnlAttribution(group_by: string = 'symbol', start_date?: string, end_date?: string): Promise<PnlAttributionResponse> {
  const { data } = await api.get<PnlAttributionResponse>('/v1/equity/pnl-attribution', {
    params: { group_by, start_date, end_date }
  });
  return data;
}

export async function createEquitySnapshot(): Promise<any> {
  const { data } = await api.post('/v1/equity/snapshot');
  return data;
}

// ---------- Journal ----------
export interface JournalEntry {
  id: number;
  account_id: string;
  symbol: string;
  direction: string;
  entry_date: string | null;
  exit_date: string | null;
  entry_price: number | null;
  exit_price: number | null;
  quantity: number | null;
  realized_pnl: number | null;
  plan_id: number | null;
  execution_quality: number | null;
  emotion_state: string | null;
  mistake_tags: string[];
  lesson_learned: string | null;
  ai_review: string | null;
  journal_status: string;
  created_at: string;
  updated_at: string;
}
export interface JournalListResponse {
  items: JournalEntry[];
  total: number;
  page: number;
  size: number;
}
export async function fetchJournals(
  page: number = 1,
  size: number = 20,
  symbol?: string,
  status?: string,
  account_id?: string
): Promise<JournalListResponse> {
  const { data } = await api.get<JournalListResponse>('/v1/journal', {
    params: { page, size, symbol, status, account_id }
  });
  return data;
}
export async function createJournal(payload: Partial<JournalEntry>): Promise<JournalEntry> {
  const { data } = await api.post<JournalEntry>('/v1/journal', payload);
  return data;
}
export async function updateJournal(id: number, payload: Partial<JournalEntry>): Promise<JournalEntry> {
  const { data } = await api.put<JournalEntry>(`/v1/journal/${id}`, payload);
  return data;
}
export async function requestAiReview(journalId: number): Promise<{ journal_id: number; ai_review: string }> {
  const { data } = await api.post<{ journal_id: number; ai_review: string }>(`/v1/journal/${journalId}/ai-review`);
  return data;
}
export async function fetchWeeklyReport(week_date?: string): Promise<any> {
  const { data } = await api.get('/v1/journal/weekly-report', { params: { week_date } });
  return data;
}

// ---------- Alerts ----------
export interface AlertRule {
  id: number;
  account_id: string;
  symbol: string;
  condition_type: string;
  threshold: number;
  action: string;
  linked_plan_id: number | null;
  alert_status: string;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface AlertListResponse {
  items: AlertRule[];
  total: number;
}
export async function fetchAlerts(status?: string): Promise<AlertListResponse> {
  const { data } = await api.get<AlertListResponse>('/v1/alerts', { params: { status } });
  return data;
}
export async function createAlert(payload: Partial<AlertRule>): Promise<AlertRule> {
  const { data } = await api.post<AlertRule>('/v1/alerts', payload);
  return data;
}
export async function updateAlert(id: number, payload: Partial<AlertRule>): Promise<AlertRule> {
  const { data } = await api.put<AlertRule>(`/v1/alerts/${id}`, payload);
  return data;
}
export async function deleteAlert(id: number): Promise<void> {
  await api.delete(`/v1/alerts/${id}`);
}

export interface AlertHistoryEntry {
  id: number;
  alert_id: number;
  account_id: string;
  symbol: string;
  trigger_price: number;
  trigger_time: string;
  notification_sent: boolean;
  action_taken: string | null;
  created_at: string;
}
export interface AlertHistoryResponse {
  items: AlertHistoryEntry[];
  total: number;
}
export async function fetchAlertHistory(limit: number = 20): Promise<AlertHistoryResponse> {
  const { data } = await api.get<AlertHistoryResponse>('/v1/alerts/history', { params: { limit } });
  return data;
}

// ---------- Orders ----------
export interface OrderInfo {
  order_id: string;
  symbol: string;
  direction: string;
  quantity: number;
  order_type: string;
  limit_price: number | null;
  status: string;
  filled_quantity: number;
  filled_price: number | null;
  plan_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}
export async function submitOrder(payload: {
  symbol: string;
  direction: string;
  quantity: number;
  order_type?: string;
  limit_price?: number;
  plan_id?: number;
}): Promise<{ status: string; order: OrderInfo }> {
  const { data } = await api.post<{ status: string; order: OrderInfo }>('/v1/orders/submit', payload);
  return data;
}
export async function getOrderStatus(orderId: string): Promise<{ order: OrderInfo }> {
  const { data } = await api.get<{ order: OrderInfo }>(`/v1/orders/${orderId}/status`);
  return data;
}
export async function cancelOrder(orderId: string): Promise<void> {
  await api.post(`/v1/orders/${orderId}/cancel`);
}

// ---------- WebSocket 工具 ----------
export function createWsUrl(): string {
  const token = getAuthToken();
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const base = import.meta.env.DEV
    ? `${wsProtocol}//${window.location.hostname}:8000`
    : `${wsProtocol}//${window.location.host}`;
  return `${base}/api/v1/ws?token=${token}`;
}
