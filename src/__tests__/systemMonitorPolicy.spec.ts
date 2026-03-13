import { describe, expect, it } from 'vitest'

import type { ServiceHealthItem } from '@/types/systemMonitor'
import { parseNonRealtimePolicySummary } from '@/utils/systemMonitorPolicy'

function makeService(overrides: Partial<ServiceHealthItem> = {}): ServiceHealthItem {
  return {
    service_key: 'non_realtime_data_policy',
    service_label: 'Non-Realtime Data Policy',
    module_key: 'market_data',
    service_kind: 'internal',
    status: 'HEALTHY',
    degraded: false,
    latency_ms: null,
    p95_latency_ms: null,
    error_count_1h: 0,
    error_count_24h: 0,
    last_heartbeat_at: null,
    last_success_at: null,
    last_error_code: null,
    last_error_message: null,
    last_recovered_at: null,
    dependencies: [],
    owners: [],
    tags: [],
    ...overrides,
  }
}

describe('system monitor policy parser', () => {
  it('parses cache-only flags and job tags from service tags', () => {
    const summary = parseNonRealtimePolicySummary(
      makeService({
        tags: [
          'policy',
          'runtime-signal-cache-only:true',
          'runtime-advisory-cache-only:false',
          'historical_bars_cache:ok:succ=12:fail=0',
          'key_statistics_cache:fail:succ=4:fail=2',
        ],
      }),
    )

    expect(summary?.runtimeSignalCacheOnly).toBe(true)
    expect(summary?.runtimeAdvisoryCacheOnly).toBe(false)
    expect(summary?.jobs).toHaveLength(2)
    expect(summary?.jobs[0]).toMatchObject({
      jobKey: 'historical_bars_cache',
      status: 'ok',
      successCount: 12,
      failureCount: 0,
    })
    expect(summary?.jobs[1]).toMatchObject({
      jobKey: 'key_statistics_cache',
      status: 'fail',
      successCount: 4,
      failureCount: 2,
    })
  })

  it('returns null for unrelated services', () => {
    const summary = parseNonRealtimePolicySummary(
      makeService({ service_key: 'redis_cache', tags: ['cache'] }),
    )

    expect(summary).toBeNull()
  })
})
