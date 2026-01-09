import axios from "axios";

// 开发环境使用代理，生产环境使用环境变量
const api = axios.create({
  baseURL: import.meta.env.DEV ? "/api" : (import.meta.env.VITE_BACKEND_URL || "http://localhost:8088"),
  timeout: 30000
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
  const { data } = await api.get<HealthResponse>("/health");
  return data;
}

export async function runAutoHedgeOnce(): Promise<{ status: string; detail: string }> {
  const { data } = await api.post("/run-auto-hedge-once");
  return data;
}

export async function fetchAiState(window_days?: number): Promise<AiStateResponse> {
  const { data } = await api.get<AiStateResponse>("/ai/state", {
    params: window_days ? { window_days } : undefined
  });
  return data;
}

export default api;

export interface BehaviorRebuildResponse {
  status: string;
  account_id: string;
  window_days: number;
  symbols_processed: string[];
}

export async function rebuildBehavior(window_days: number): Promise<BehaviorRebuildResponse> {
  const { data } = await api.post<BehaviorRebuildResponse>("/admin/behavior/rebuild", {
    window_days
  });
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
  technical_score: number;
  fundamental_score: number;
  sentiment_score: number;
  overall_score: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'REDUCE' | 'SELL';
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

export async function fetchPositionsAssessment(window_days?: number): Promise<PositionsAssessmentResponse> {
  const { data } = await api.get<PositionsAssessmentResponse>("/v1/positions/assessment", {
    params: window_days ? { window_days } : undefined
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

export async function refreshPositions(symbols?: string[], force?: boolean): Promise<{
  status: string;
  refreshed: string[];
  timestamp: string;
  message?: string;
}> {
  const { data } = await api.post("/v1/positions/refresh", 
    symbols || [],  // 直接传递数组，空数组表示刷新全部
    { params: force ? { force } : undefined }
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
  recommendations: string;
  ai_analysis: string;
  recent_events: any[];
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

export async function fetchMacroRiskOverview(): Promise<MacroRiskOverviewResponse> {
  const { data } = await api.get<MacroRiskOverviewResponse>("/v1/macro/risk/overview");
  return data;
}

export async function fetchMonetaryPolicy(): Promise<MonetaryPolicyResponse> {
  const { data } = await api.get<MonetaryPolicyResponse>("/v1/macro/monetary-policy");
  return data;
}

export async function fetchGeopoliticalEvents(days?: number): Promise<GeopoliticalEventsResponse> {
  const { data } = await api.get<GeopoliticalEventsResponse>("/v1/macro/geopolitical-events", {
    params: days ? { days } : undefined
  });
  return data;
}

export async function refreshMacroData(): Promise<{
  status: string;
  refreshed_components: string[];
  message: string;
  timestamp: string;
}> {
  const { data } = await api.post("/v1/macro/refresh");
  return data;
}

export async function fetchSchedulerJobs(): Promise<SchedulerJobsResponse> {
  const { data } = await api.get<SchedulerJobsResponse>("/admin/scheduler/jobs");
  return data;
}

export async function pauseScheduler(): Promise<{ status: string; message: string }> {
  const { data } = await api.post("/admin/scheduler/pause");
  return data;
}

export async function resumeScheduler(): Promise<{ status: string; message: string }> {
  const { data } = await api.post("/admin/scheduler/resume");
  return data;
}

// ========== 潜在机会 API ==========

export interface OpportunityItem {
  rank: number;
  symbol: string;
  current_price: number;
  technical_score: number;
  fundamental_score: number;
  sentiment_score: number;
  overall_score: number;
  recommendation: string;
  reason: string;
}

export interface MacroRisk {
  overall_score: number;
  risk_level: string;
  risk_summary: string;
}

export interface OpportunityRun {
  run_id: number;
  run_key: string;
  status: string;
  as_of: string;
  universe_name: string;
  min_score: number;
  max_results: number;
  force_refresh: boolean;
  macro_risk: MacroRisk;
  total_symbols: number;
  qualified_symbols: number;
  elapsed_ms: number;
  items: OpportunityItem[];
  notes?: {
    idempotent?: boolean;
    macro_adjustment?: {
      before_threshold: number;
      after_threshold: number;
    };
    universe?: {
      cache_hit?: boolean;
      fallback_used?: boolean;
    };
  };
}

export interface OpportunityRunSummary {
  run_id: number;
  universe_name: string;
  as_of: string;
  qualified_symbols: number;
  total_symbols: number;
  elapsed_ms: number;
  macro_risk_level: string;
}

export interface ScanOpportunitiesRequest {
  universe_name?: string;
  min_score?: number;
  max_results?: number;
  force_refresh?: boolean;
}

export interface ScanOpportunitiesResponse extends OpportunityRun {}

export interface LatestOpportunitiesResponse {
  status: string;
  latest: OpportunityRun | null;
}

export interface RunHistoryResponse {
  status?: string;
  total_runs: number;
  runs: OpportunityRunSummary[];
}

export async function fetchLatestOpportunities(universeName?: string): Promise<LatestOpportunitiesResponse> {
  const { data } = await api.get<LatestOpportunitiesResponse>("/v1/opportunities/latest", {
    params: universeName ? { universe_name: universeName } : undefined
  });
  return data;
}

export async function scanOpportunities(request: ScanOpportunitiesRequest): Promise<ScanOpportunitiesResponse> {
  const { data } = await api.post<ScanOpportunitiesResponse>("/v1/opportunities/scan", request);
  return data;
}

export async function fetchOpportunityRuns(limit?: number, universeName?: string): Promise<RunHistoryResponse> {
  const { data } = await api.get<RunHistoryResponse>("/v1/opportunities/runs", {
    params: {
      limit: limit || 20,
      universe_name: universeName
    }
  });
  return data;
}

export async function fetchOpportunityRunDetail(runId: number): Promise<OpportunityRun> {
  const { data } = await api.get<OpportunityRun>(`/v1/opportunities/runs/${runId}`);
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
  const { data } = await api.get<SchedulerJobsListResponse>('/admin/scheduler/jobs');
  return data;
}

export async function pauseSchedulerJob(jobId: string): Promise<{ status: string; message: string }> {
  const { data } = await api.post(`/admin/scheduler/jobs/${jobId}/pause`);
  return data;
}

export async function resumeSchedulerJob(jobId: string): Promise<{ status: string; message: string }> {
  const { data } = await api.post(`/admin/scheduler/jobs/${jobId}/resume`);
  return data;
}

export async function updateJobSchedule(
  jobId: string,
  request: UpdateJobScheduleRequest
): Promise<UpdateJobScheduleResponse> {
  const { data } = await api.put<UpdateJobScheduleResponse>(
    `/admin/scheduler/jobs/${jobId}/schedule`,
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
  monitoring_enabled: boolean;
  redis_enabled: boolean;
  timestamp: string;
}

export async function fetchMonitoringStats(timeRange: 'day' | 'hour' | 'minute' = 'day'): Promise<ApiStats[]> {
  const { data } = await api.get<ApiStats[]>('/v1/monitoring/stats', {
    params: { time_range: timeRange }
  });
  return data;
}

export async function fetchMonitoringReport(): Promise<MonitoringReport> {
  const { data } = await api.get<MonitoringReport>('/v1/monitoring/report');
  return data;
}

export async function checkRateLimitStatus(provider: string): Promise<RateLimitStatus> {
  const { data } = await api.get<RateLimitStatus>(`/v1/monitoring/rate-limit/${provider}`);
  return data;
}

export async function fetchRateLimitPolicies(): Promise<Record<string, RateLimitPolicy>> {
  const { data } = await api.get<Record<string, RateLimitPolicy>>('/v1/monitoring/policies');
  return data;
}

export async function fetchMonitoringHealth(): Promise<MonitoringHealthResponse> {
  const { data } = await api.get<MonitoringHealthResponse>('/v1/monitoring/health');
  return data;
}

