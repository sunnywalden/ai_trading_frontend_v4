export type MonitorStatus = 'HEALTHY' | 'WARN' | 'CRITICAL' | 'UNKNOWN'
export type SeverityLevel = 'info' | 'warning' | 'critical'
export type FsmType = 'PLAN' | 'POSITION'
export type FlowTrend = 'up' | 'flat' | 'down'
export type ServiceKind = 'internal' | 'external' | 'infrastructure' | 'job' | 'stream'

export interface MonitorResponseMeta {
  generated_at: string
  window_minutes: number
  source: string
  refresh_interval_seconds: number
}

export interface LifecycleHeadlineMetrics {
  active_intents: number
  stuck_intents: number
  exception_count: number
  p95_stage_seconds: number
  warn_stage_count: number
  critical_stage_count: number
}

export interface LifecycleStageMetric {
  stage_id: number
  stage_key: string
  stage_label: string
  active_count: number
  stuck_count: number
  warn_count: number
  critical_count: number
  avg_seconds: number | null
  p50_seconds: number | null
  p95_seconds: number | null
  oldest_entered_at: string | null
  last_event_at: string | null
}

export interface LifecycleFsmStateMetric {
  state_key: string
  state_label: string
  count: number
  status: MonitorStatus
}

export interface LifecycleExceptionItem {
  intent_id: number
  plan_id: number | null
  symbol: string | null
  action: string | null
  signal_type: string | null
  current_stage_id: number | null
  current_stage_key: string | null
  current_stage_label: string | null
  stayed_seconds: number
  severity: SeverityLevel
  execution_path: string | null
  last_error_code: string | null
  last_error_message: string | null
  last_event_at: string | null
  owner_service: string | null
}

export interface LifecycleOverviewResponse {
  meta: MonitorResponseMeta
  headline: LifecycleHeadlineMetrics
  pipeline: LifecycleStageMetric[]
  plan_fsm: LifecycleFsmStateMetric[]
  position_fsm: LifecycleFsmStateMetric[]
  exceptions: LifecycleExceptionItem[]
}

export interface LifecycleTimelineEvent {
  seq: number
  stage_id: number
  stage_key: string
  stage_label: string
  fsm_type: FsmType | null
  fsm_from: string | null
  fsm_to: string | null
  status: MonitorStatus
  entered_at: string | null
  exited_at: string | null
  duration_seconds: number | null
  source_service: string | null
  message: string | null
  metadata: Record<string, unknown>
}

export interface LifecycleIntentDetailResponse {
  meta: MonitorResponseMeta
  intent_id: number
  idempotency_key: string | null
  plan_id: number | null
  symbol: string | null
  action: string | null
  signal_type: string | null
  execution_path: string | null
  autonomy_level: string | null
  current_stage_id: number | null
  current_stage_key: string | null
  current_stage_label: string | null
  plan_fsm_state: string | null
  position_fsm_state: string | null
  started_at: string | null
  updated_at: string | null
  timeline: LifecycleTimelineEvent[]
  latest_errors: LifecycleExceptionItem[]
}

export interface DataFlowNodeStatus {
  node_key: string
  node_label: string
  status: MonitorStatus
  heartbeat_at: string | null
  last_success_at: string | null
  lag_seconds: number | null
  queue_depth: number | null
  throughput_1m: number | null
  throughput_5m: number | null
  error_count_1h: number
  error_count_24h: number
  degraded: boolean
  last_error_code: string | null
  last_error_message: string | null
  upstream_nodes: string[]
  downstream_nodes: string[]
}

export interface DataFlowFailureSample {
  sample_id: string
  payload_id: string | null
  stage_key: string | null
  node_key: string
  error_code: string | null
  error_message: string | null
  occurred_at: string
  recovered_at: string | null
  retry_count: number
  metadata: Record<string, unknown>
}

export interface DataFlowSummary {
  flow_name: string
  flow_label: string
  status: MonitorStatus
  nodes: DataFlowNodeStatus[]
  total_nodes: number
  critical_nodes: number
  warn_nodes: number
  avg_lag_seconds: number | null
  max_lag_seconds: number | null
  trend: FlowTrend
}

export interface DataFlowOverviewResponse {
  meta: MonitorResponseMeta
  flows: DataFlowSummary[]
}

export interface DataFlowDetailResponse {
  meta: MonitorResponseMeta
  flow_name: string
  flow_label: string
  status: MonitorStatus
  nodes: DataFlowNodeStatus[]
  failures: DataFlowFailureSample[]
}

export interface ServiceModuleSummary {
  module_key: string
  module_label: string
  status: MonitorStatus
  total_services: number
  healthy_count: number
  warn_count: number
  critical_count: number
  unknown_count: number
  degraded_count: number
  error_count_24h: number
  p95_latency_ms: number | null
}

export interface ServiceHealthItem {
  service_key: string
  service_label: string
  module_key: string
  service_kind: ServiceKind
  status: MonitorStatus
  degraded: boolean
  latency_ms: number | null
  p95_latency_ms: number | null
  error_count_1h: number
  error_count_24h: number
  last_heartbeat_at: string | null
  last_success_at: string | null
  last_error_code: string | null
  last_error_message: string | null
  last_recovered_at: string | null
  dependencies: string[]
  owners: string[]
  tags: string[]
}

export interface ServiceOverviewResponse {
  meta: MonitorResponseMeta
  modules: ServiceModuleSummary[]
  services: ServiceHealthItem[]
}

export interface ServiceHealthTimelineEvent {
  occurred_at: string
  status: MonitorStatus
  message: string | null
  latency_ms: number | null
  degraded: boolean
}

export interface ServiceDetailResponse {
  meta: MonitorResponseMeta
  service: ServiceHealthItem
  timeline: ServiceHealthTimelineEvent[]
  recent_failures: DataFlowFailureSample[]
}
