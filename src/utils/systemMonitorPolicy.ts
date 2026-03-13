import type { ServiceHealthItem } from '@/types/systemMonitor'

export interface NonRealtimePolicyJobStatus {
  jobKey: string
  label: string
  status: 'ok' | 'fail' | 'missing'
  successCount: number
  failureCount: number
}

export interface NonRealtimePolicySummary {
  runtimeSignalCacheOnly: boolean | null
  runtimeAdvisoryCacheOnly: boolean | null
  jobs: NonRealtimePolicyJobStatus[]
}

const JOB_LABELS: Record<string, string> = {
  historical_bars_cache: '历史行情预热',
  key_statistics_cache: '关键统计预热',
  fundamental_data_cache: '基本面预热',
}

function parseBooleanTag(tags: string[], prefix: string): boolean | null {
  const hit = tags.find(tag => tag.startsWith(prefix))
  if (!hit) return null
  const raw = hit.slice(prefix.length).trim().toLowerCase()
  if (raw === 'true') return true
  if (raw === 'false') return false
  return null
}

function parseJobTag(tag: string): NonRealtimePolicyJobStatus | null {
  const match = tag.match(/^([a-z_]+):(ok|fail|missing)(?::succ=(\d+))?(?::fail=(\d+))?$/i)
  if (!match) return null
  const [, jobKey, status, successCount, failureCount] = match
  return {
    jobKey,
    label: JOB_LABELS[jobKey] || jobKey,
    status: status.toLowerCase() as NonRealtimePolicyJobStatus['status'],
    successCount: Number(successCount || 0),
    failureCount: Number(failureCount || 0),
  }
}

export function parseNonRealtimePolicySummary(service: ServiceHealthItem | null | undefined): NonRealtimePolicySummary | null {
  if (!service || service.service_key !== 'non_realtime_data_policy') return null

  const tags = service.tags || []
  const jobs = tags
    .map(parseJobTag)
    .filter((item): item is NonRealtimePolicyJobStatus => Boolean(item))

  return {
    runtimeSignalCacheOnly: parseBooleanTag(tags, 'runtime-signal-cache-only:'),
    runtimeAdvisoryCacheOnly: parseBooleanTag(tags, 'runtime-advisory-cache-only:'),
    jobs,
  }
}
