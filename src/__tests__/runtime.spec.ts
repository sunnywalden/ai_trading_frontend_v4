import { describe, expect, it } from 'vitest'

import { shouldPreferSameOriginBackend } from '@/config/runtime'

describe('runtime api origin preference', () => {
  it('prefers same-origin api when backend url only differs by leading www', () => {
    const current = new URL(window.location.href)
    const baseHost = current.hostname.replace(/^www\./i, '')
    const wwwVariant = current.hostname.startsWith('www.')
      ? baseHost
      : `www.${baseHost}`

    expect(
      shouldPreferSameOriginBackend(`${current.protocol}//${wwwVariant}${current.port ? `:${current.port}` : ''}`),
    ).toBe(true)
  })

  it('does not force same-origin for dedicated api subdomains', () => {
    const current = new URL(window.location.href)
    const baseHost = current.hostname.replace(/^www\./i, '')
    const apiHost = `api.${baseHost}`

    expect(
      shouldPreferSameOriginBackend(`${current.protocol}//${apiHost}${current.port ? `:${current.port}` : ''}`),
    ).toBe(false)
  })
})
