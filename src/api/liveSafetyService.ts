// liveSafetyService.ts — V10.5.1 M4: Live Safety & Model Degradation Guard

import { api } from './client'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Severity = 'OK' | 'WARNING' | 'CRITICAL'

export interface DegradationMetric {
  strategy_id: string | null
  metric_type:
    | 'HIT_RATE_DRIFT'
    | 'ECE_DRIFT'
    | 'EXEC_COST_DRIFT'
    | 'BROKER_REJECT_SPIKE'
    | 'FEATURE_FRESHNESS'
  current_value: number
  baseline_value: number
  drift_magnitude: number
  drift_direction: 'UP' | 'DOWN' | 'NONE'
  severity: Severity
  details: Record<string, unknown>
}

export interface DegradationReport {
  as_of: string
  overall_severity: Severity
  critical_count: number
  warning_count: number
  ok_count: number
  metrics: DegradationMetric[]
}

export interface FreshnessEntry {
  source: string
  last_seen: string | null
  age_hours: number | null
  warn_threshold_hours: number
  crit_threshold_hours: number
  status: Severity
  action_on_critical: string
}

export interface FreshnessMatrix {
  as_of: string
  overall_status: Severity
  critical_count: number
  warning_count: number
  critical_sources: string[]
  freeze_new_open: boolean
  recommended_action: 'NONE' | 'DEGRADE_TO_SEMI' | 'FREEZE_NEW_OPEN'
  matrix: FreshnessEntry[]
}

export interface ThrottleStatus {
  as_of: string
  current_level: string
  recommended_level: 'FULL' | 'SEMI' | 'ADVISORY' | 'FREEZE'
  downgrade_needed: boolean
  upgrade_possible: boolean
  reasons: string[]
  degradation_summary: {
    overall_severity: Severity
    critical_count: number
    warning_count: number
    metrics: DegradationMetric[]
  }
  freshness_summary: {
    overall_status: Severity
    critical_count: number
    warning_count: number
    freeze_new_open: boolean
    matrix: FreshnessEntry[]
  }
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const liveSafetyApi = {
  getDegradation: () =>
    api.get<DegradationReport>('/v1/live-safety/degradation'),

  getFreshness: () =>
    api.get<FreshnessMatrix>('/v1/live-safety/freshness'),

  getThrottle: (currentLevel = 'FULL') =>
    api.get<ThrottleStatus>('/v1/live-safety/throttle', {
      params: { current_level: currentLevel },
    }),
}
