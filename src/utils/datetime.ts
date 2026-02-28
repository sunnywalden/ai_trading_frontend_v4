export type DateInput = string | number | Date | null | undefined

export const CLIENT_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

export function parseBackendDateTime(input: DateInput): Date | null {
  if (input == null) return null

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input
  }

  if (typeof input === 'number') {
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const raw = String(input).trim()
  if (!raw) return null

  // 后端常见无时区格式：2026-02-28T09:35:50 / 2026-02-28 09:35:50
  // 约定：无时区按 UTC 解释，再转换为客户端本地时区显示
  const normalized = raw.replace(' ', 'T')
  const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(normalized)
  const iso = hasTimezone ? normalized : `${normalized}Z`

  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatClientDateTime(
  input: DateInput,
  opts?: {
    locale?: string
    hour12?: boolean
    withSeconds?: boolean
  },
): string {
  const d = parseBackendDateTime(input)
  if (!d) return '-'

  const locale = opts?.locale ?? 'zh-CN'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: opts?.withSeconds === false ? undefined : '2-digit',
    hour12: opts?.hour12 ?? false,
    timeZone: CLIENT_TIME_ZONE,
  }).format(d)
}

export function formatClientTime(
  input: DateInput,
  opts?: {
    locale?: string
    withSeconds?: boolean
    hour12?: boolean
  },
): string {
  const d = parseBackendDateTime(input)
  if (!d) return '-'

  const locale = opts?.locale ?? 'zh-CN'
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: opts?.withSeconds ? '2-digit' : undefined,
    hour12: opts?.hour12 ?? false,
    timeZone: CLIENT_TIME_ZONE,
  }).format(d)
}
