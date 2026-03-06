import { api } from './client'
import type {
  DataFlowDetailResponse,
  DataFlowFailureSample,
  DataFlowNodeStatus,
  DataFlowOverviewResponse,
  DataFlowSummary,
  LifecycleExceptionItem,
  LifecycleIntentDetailResponse,
  LifecycleOverviewResponse,
  LifecycleTimelineEvent,
  MonitorStatus,
  ServiceDetailResponse,
  ServiceHealthItem,
  ServiceHealthTimelineEvent,
  ServiceModuleSummary,
  ServiceOverviewResponse,
} from '../types/systemMonitor'

export interface MonitorQueryOptions {
  window_minutes?: number
  only_exceptions?: boolean
  only_degraded?: boolean
  only_external?: boolean
}

function nowIso(offsetMinutes = 0): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString()
}

function shouldFallback(error: any): boolean {
  const status = Number(error?.response?.status || 0)
  return status === 404 || status === 501
}

const stageLabels = [
  'Regime Classification',
  'Market Scan',
  'Research',
  'Signal Generation',
  'Signal Fusion',
  'Portfolio Decision',
  'Position Sizing',
  'Risk Gate',
  'Execution',
  'Monitoring',
  'Event Override',
  'Evaluation',
  'TCA Analysis',
  'Backtest Validation',
  'AI Evolution',
  'Adaptive Optimization',
  'Loop Completed',
]

function statusFromIndex(_index: number): MonitorStatus {
  return 'HEALTHY'
}

function buildLifecycleOverview(windowMinutes = 60): LifecycleOverviewResponse {
  return {
    meta: {
      generated_at: nowIso(),
      window_minutes: windowMinutes,
      source: 'system-monitor-fallback',
      refresh_interval_seconds: 30,
    },
    headline: {
      active_intents: 0,
      stuck_intents: 0,
      exception_count: 0,
      p95_stage_seconds: 0,
      warn_stage_count: 0,
      critical_stage_count: 0,
    },
    pipeline: [],
    plan_fsm: [],
    position_fsm: [],
    exceptions: [],
  }
}

function buildLifecycleDetail(intentId: number): LifecycleIntentDetailResponse {
  const timeline: LifecycleTimelineEvent[] = stageLabels.slice(0, 10).map((label, index) => ({
    seq: index + 1,
    stage_id: index,
    stage_key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    stage_label: label,
    fsm_type: index >= 8 ? 'PLAN' : null,
    fsm_from: index === 8 ? 'AI_GENERATED' : null,
    fsm_to: index === 8 ? 'AUTO_EXECUTING' : null,
    status: 'HEALTHY',
    entered_at: nowIso(-(60 - index * 4)),
    exited_at: index < 9 ? nowIso(-(57 - index * 4)) : null,
    duration_seconds: 5 + index * 2,
    source_service: index >= 8 ? 'order_executor' : 'autonomous_engine',
    message: `${label} completed`,
    metadata: {},
  }))

  return {
    meta: {
      generated_at: nowIso(),
      window_minutes: 60,
      source: 'system-monitor-fallback',
      refresh_interval_seconds: 30,
    },
    intent_id: intentId,
    idempotency_key: `intent-${intentId}`,
    plan_id: intentId,
    symbol: null,
    action: null,
    signal_type: null,
    execution_path: null,
    autonomy_level: null,
    current_stage_id: null,
    current_stage_key: null,
    current_stage_label: null,
    plan_fsm_state: null,
    position_fsm_state: null,
    started_at: null,
    updated_at: null,
    timeline: timeline.slice(0, 0),
    latest_errors: [],
  }
}

function buildNode(node_key: string, node_label: string, index: number): DataFlowNodeStatus {
  return {
    node_key,
    node_label,
    status: statusFromIndex(index),
    heartbeat_at: nowIso(-index),
    last_success_at: nowIso(-(index + 1)),
    lag_seconds: index === 0 ? 0 : index,
    queue_depth: index * 2,
    throughput_1m: 8 - index * 0.4,
    throughput_5m: 7.5 - index * 0.3,
    error_count_1h: 0,
    error_count_24h: 0,
    degraded: false,
    last_error_code: null,
    last_error_message: null,
    upstream_nodes: index > 0 ? [`node_${index - 1}`] : [],
    downstream_nodes: index < 6 ? [`node_${index + 1}`] : [],
  }
}

function buildFailures(_flowName: string): DataFlowFailureSample[] {
  return []
}

function buildFlowSummary(flowName: string, flowLabel: string): DataFlowSummary {
  const nodes = [
    buildNode('node_0', 'DataHub', 0),
    buildNode('node_1', 'Signal Generation', 1),
    buildNode('node_2', 'Signal Fusion', 2),
    buildNode('node_3', 'Portfolio Decision', 3),
    buildNode('node_4', 'Risk Gate', 4),
    buildNode('node_5', 'Execution', 5),
    buildNode('node_6', 'Attribution', 6),
  ]
  return {
    flow_name: flowName,
    flow_label: flowLabel,
    status: 'HEALTHY',
    nodes,
    total_nodes: nodes.length,
    critical_nodes: 0,
    warn_nodes: 0,
    avg_lag_seconds: 3,
    max_lag_seconds: 6,
    trend: 'flat',
  }
}

function buildDataFlowOverview(windowMinutes = 60): DataFlowOverviewResponse {
  return {
    meta: {
      generated_at: nowIso(),
      window_minutes: windowMinutes,
      source: 'system-monitor-fallback',
      refresh_interval_seconds: 30,
    },
    flows: [],
  }
}

function buildDataFlowDetail(flowName: string): DataFlowDetailResponse {
  const overview = buildDataFlowOverview()
  const summary = overview.flows.find(item => item.flow_name === flowName) || overview.flows[0]
  return {
    meta: overview.meta,
    flow_name: summary.flow_name,
    flow_label: summary.flow_label,
    status: summary.status,
    nodes: summary.nodes,
    failures: buildFailures(summary.flow_name),
  }
}

function buildServiceOverview(windowMinutes = 60): ServiceOverviewResponse {
  const modules: ServiceModuleSummary[] = [
    {
      module_key: 'autonomy',
      module_label: 'Autonomy',
      status: 'HEALTHY',
      total_services: 3,
      healthy_count: 3,
      warn_count: 0,
      critical_count: 0,
      unknown_count: 0,
      degraded_count: 0,
      error_count_24h: 0,
      p95_latency_ms: 126,
    },
    {
      module_key: 'infrastructure',
      module_label: 'Infrastructure',
      status: 'HEALTHY',
      total_services: 4,
      healthy_count: 4,
      warn_count: 0,
      critical_count: 0,
      unknown_count: 0,
      degraded_count: 0,
      error_count_24h: 0,
      p95_latency_ms: 112,
    },
    {
      module_key: 'market_data',
      module_label: 'Market Data',
      status: 'HEALTHY',
      total_services: 3,
      healthy_count: 3,
      warn_count: 0,
      critical_count: 0,
      unknown_count: 0,
      degraded_count: 0,
      error_count_24h: 0,
      p95_latency_ms: 210,
    },
    {
      module_key: 'observability',
      module_label: 'Observability',
      status: 'HEALTHY',
      total_services: 3,
      healthy_count: 3,
      warn_count: 0,
      critical_count: 0,
      unknown_count: 0,
      degraded_count: 0,
      error_count_24h: 0,
      p95_latency_ms: 145,
    },
  ]

  const services: ServiceHealthItem[] = [
    {
      service_key: 'autonomous_engine',
      service_label: 'AutonomousEngine',
      module_key: 'autonomy',
      service_kind: 'internal',
      status: 'HEALTHY',
      degraded: false,
      latency_ms: 108,
      p95_latency_ms: 126,
      error_count_1h: 0,
      error_count_24h: 0,
      last_heartbeat_at: nowIso(-1),
      last_success_at: nowIso(-1),
      last_error_code: null,
      last_error_message: null,
      last_recovered_at: nowIso(-16),
      dependencies: ['risk_gate_service', 'tiger_gateway'],
      owners: ['quant-loop'],
      tags: ['core', 'trading'],
    },
    {
      service_key: 'risk_gate_service',
      service_label: 'RiskGateService',
      module_key: 'autonomy',
      service_kind: 'internal',
      status: 'HEALTHY',
      degraded: false,
      latency_ms: 94,
      p95_latency_ms: 126,
      error_count_1h: 0,
      error_count_24h: 0,
      last_heartbeat_at: nowIso(-1),
      last_success_at: nowIso(-1),
      last_error_code: null,
      last_error_message: null,
      last_recovered_at: nowIso(-230),
      dependencies: ['redis_cache'],
      owners: ['risk'],
      tags: ['guardrail'],
    },
    {
      service_key: 'tiger_gateway',
      service_label: 'Tiger Gateway',
      module_key: 'market_data',
      service_kind: 'external',
      status: 'HEALTHY',
      degraded: false,
      latency_ms: 185,
      p95_latency_ms: 210,
      error_count_1h: 0,
      error_count_24h: 0,
      last_heartbeat_at: nowIso(-2),
      last_success_at: nowIso(-1),
      last_error_code: null,
      last_error_message: null,
      last_recovered_at: nowIso(-11),
      dependencies: ['internet_egress'],
      owners: ['broker'],
      tags: ['external', 'broker'],
    },
    {
      service_key: 'mysql_primary',
      service_label: 'MySQL Primary',
      module_key: 'infrastructure',
      service_kind: 'infrastructure',
      status: 'HEALTHY',
      degraded: false,
      latency_ms: 24,
      p95_latency_ms: 31,
      error_count_1h: 0,
      error_count_24h: 0,
      last_heartbeat_at: nowIso(-1),
      last_success_at: nowIso(-1),
      last_error_code: null,
      last_error_message: null,
      last_recovered_at: nowIso(-540),
      dependencies: [],
      owners: ['platform'],
      tags: ['db'],
    },
    {
      service_key: 'redis_cache',
      service_label: 'Redis Cache',
      module_key: 'infrastructure',
      service_kind: 'infrastructure',
      status: 'HEALTHY',
      degraded: false,
      latency_ms: 7,
      p95_latency_ms: 10,
      error_count_1h: 0,
      error_count_24h: 0,
      last_heartbeat_at: nowIso(-1),
      last_success_at: nowIso(-1),
      last_error_code: null,
      last_error_message: null,
      last_recovered_at: nowIso(-780),
      dependencies: [],
      owners: ['platform'],
      tags: ['cache'],
    },
    {
      service_key: 'system_monitor_aggregator',
      service_label: 'System Monitor Aggregator',
      module_key: 'observability',
      service_kind: 'internal',
      status: 'HEALTHY',
      degraded: false,
      latency_ms: 110,
      p95_latency_ms: 145,
      error_count_1h: 0,
      error_count_24h: 0,
      last_heartbeat_at: nowIso(-1),
      last_success_at: nowIso(-1),
      last_error_code: null,
      last_error_message: null,
      last_recovered_at: nowIso(-340),
      dependencies: ['mysql_primary', 'redis_cache'],
      owners: ['observability'],
      tags: ['monitoring'],
    },
  ]

  return {
    meta: {
      generated_at: nowIso(),
      window_minutes: windowMinutes,
      source: 'system-monitor-fallback',
      refresh_interval_seconds: 30,
    },
    modules: [],
    services: [],
  }
}

function buildServiceDetail(serviceName: string): ServiceDetailResponse {
  const overview = buildServiceOverview()
  const service = overview.services.find(item => item.service_key === serviceName) || {
    service_key: serviceName,
    service_label: serviceName,
    module_key: 'observability',
    service_kind: 'internal',
    status: 'UNKNOWN' as const,
    degraded: false,
    latency_ms: null,
    p95_latency_ms: null,
    error_count_1h: 0,
    error_count_24h: 0,
    last_heartbeat_at: null,
    last_success_at: null,
    last_error_code: null,
    last_error_message: '后端未提供实时服务详情',
    last_recovered_at: null,
    dependencies: [],
    owners: [],
    tags: ['fallback'],
  }
  const timeline: ServiceHealthTimelineEvent[] = []

  return {
    meta: overview.meta,
    service,
    timeline,
    recent_failures: buildFailures(service.service_key),
  }
}

export async function fetchSystemLifecycleOverview(options: MonitorQueryOptions = {}): Promise<LifecycleOverviewResponse> {
  try {
    const { data } = await api.get<LifecycleOverviewResponse>('/v1/system-monitor/lifecycle', { params: options })
    return data
  } catch (error) {
    if (!shouldFallback(error)) throw error
    return buildLifecycleOverview(options.window_minutes)
  }
}

export async function fetchSystemLifecycleDetail(intentId: number): Promise<LifecycleIntentDetailResponse> {
  try {
    const { data } = await api.get<LifecycleIntentDetailResponse>(`/v1/system-monitor/lifecycle/${intentId}`)
    return data
  } catch (error) {
    if (!shouldFallback(error)) throw error
    return buildLifecycleDetail(intentId)
  }
}

export async function fetchSystemDataFlowOverview(options: MonitorQueryOptions = {}): Promise<DataFlowOverviewResponse> {
  try {
    const { data } = await api.get<DataFlowOverviewResponse>('/v1/system-monitor/data-flows', { params: options })
    return data
  } catch (error) {
    if (!shouldFallback(error)) throw error
    return buildDataFlowOverview(options.window_minutes)
  }
}

export async function fetchSystemDataFlowDetail(flowName: string): Promise<DataFlowDetailResponse> {
  try {
    const { data } = await api.get<DataFlowDetailResponse>(`/v1/system-monitor/data-flows/${flowName}`)
    return data
  } catch (error) {
    if (!shouldFallback(error)) throw error
    return buildDataFlowDetail(flowName)
  }
}

export async function fetchSystemServiceOverview(options: MonitorQueryOptions = {}): Promise<ServiceOverviewResponse> {
  try {
    const { data } = await api.get<ServiceOverviewResponse>('/v1/system-monitor/services', { params: options })
    return data
  } catch (error) {
    if (!shouldFallback(error)) throw error
    return buildServiceOverview(options.window_minutes)
  }
}

export async function fetchSystemServiceDetail(serviceName: string): Promise<ServiceDetailResponse> {
  try {
    const { data } = await api.get<ServiceDetailResponse>(`/v1/system-monitor/services/${serviceName}`)
    return data
  } catch (error) {
    if (!shouldFallback(error)) throw error
    return buildServiceDetail(serviceName)
  }
}
