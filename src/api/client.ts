import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000
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

export async function fetchAiState(): Promise<AiStateResponse> {
  const { data } = await api.get<AiStateResponse>("/ai/state");
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
