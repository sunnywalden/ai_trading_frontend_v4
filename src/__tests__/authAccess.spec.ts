import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { resolveRouteAccess } from '@/router'
import { useAuthStore } from '@/stores/auth'

describe('auth access rules', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('maps research route to researcher/admin access', () => {
    const rule = resolveRouteAccess('/research')

    expect(rule.roles).toEqual(['RESEARCHER', 'ADMINISTRATOR'])
    expect(rule.permissions).toEqual(['research.home.read'])
  })

  it('allows supervisor executive summary but blocks admin console', () => {
    const store = useAuthStore()
    store.user = {
      username: 'supervisor',
      displayName: 'Supervisor',
      role: 'SUPERVISOR',
      permissions: ['executive.home.read', 'executive.report.risk.read'],
      permissionsVersion: 1,
      status: 'ACTIVE',
      featureFlags: {
        RBAC_V1121_ENABLED: true,
        ROLE_HOME_V1121_ENABLED: true,
        ROLE_NAV_GATING_V1121_ENABLED: true,
        ROLE_ACTION_GATING_V1121_ENABLED: true,
        EXECUTIVE_REPORTS_V1121_ENABLED: true,
        ADMIN_CONSOLE_V1121_ENABLED: true,
      },
    }

    expect(store.canAccessRoute(resolveRouteAccess('/executive'))).toBe(true)
    expect(store.canAccessRoute(resolveRouteAccess('/admin'))).toBe(false)
  })

  it('allows admin wildcard permission to reach admin routes', () => {
    const store = useAuthStore()
    store.user = {
      username: 'admin',
      displayName: 'Admin',
      role: 'ADMINISTRATOR',
      permissions: ['*'],
      permissionsVersion: 1,
      status: 'ACTIVE',
      featureFlags: {
        RBAC_V1121_ENABLED: true,
        ROLE_HOME_V1121_ENABLED: true,
        ROLE_NAV_GATING_V1121_ENABLED: true,
        ROLE_ACTION_GATING_V1121_ENABLED: true,
        EXECUTIVE_REPORTS_V1121_ENABLED: true,
        ADMIN_CONSOLE_V1121_ENABLED: true,
      },
    }

    expect(store.canAccessRoute(resolveRouteAccess('/admin/users'))).toBe(true)
    expect(store.canAccessRoute(resolveRouteAccess('/system-monitor'))).toBe(true)
  })

  it('disables admin console routes when feature flag is off', () => {
    const store = useAuthStore()
    store.user = {
      username: 'admin',
      displayName: 'Admin',
      role: 'ADMINISTRATOR',
      permissions: ['*'],
      permissionsVersion: 1,
      status: 'ACTIVE',
      featureFlags: {
        RBAC_V1121_ENABLED: true,
        ROLE_HOME_V1121_ENABLED: true,
        ROLE_NAV_GATING_V1121_ENABLED: true,
        ROLE_ACTION_GATING_V1121_ENABLED: true,
        EXECUTIVE_REPORTS_V1121_ENABLED: true,
        ADMIN_CONSOLE_V1121_ENABLED: false,
      },
    }

    expect(store.canAccessRoute(resolveRouteAccess('/admin/permissions'))).toBe(false)
  })

  it('gates broker account admin page behind v11.3.1 admin ui flag', () => {
    const store = useAuthStore()
    store.user = {
      username: 'admin',
      displayName: 'Admin',
      role: 'ADMINISTRATOR',
      permissions: ['*', 'admin.broker_account.manage'],
      permissionsVersion: 1,
      status: 'ACTIVE',
      featureFlags: {
        RBAC_V1121_ENABLED: true,
        ROLE_HOME_V1121_ENABLED: true,
        ROLE_NAV_GATING_V1121_ENABLED: true,
        ROLE_ACTION_GATING_V1121_ENABLED: true,
        EXECUTIVE_REPORTS_V1121_ENABLED: true,
        ADMIN_CONSOLE_V1121_ENABLED: true,
        ACCOUNT_ADMIN_UI_V1131_ENABLED: false,
      },
    }

    expect(store.canAccessRoute(resolveRouteAccess('/admin/broker-accounts'))).toBe(false)

    store.user.featureFlags = {
      ...store.user.featureFlags,
      ACCOUNT_ADMIN_UI_V1131_ENABLED: true,
    }

    expect(store.canAccessRoute(resolveRouteAccess('/admin/broker-accounts'))).toBe(true)
  })

  it('blocks supervisor from live safety admin page', () => {
    const store = useAuthStore()
    store.user = {
      username: 'supervisor',
      displayName: 'Supervisor',
      role: 'SUPERVISOR',
      permissions: ['executive.home.read', 'executive.report.risk.read'],
      permissionsVersion: 1,
      status: 'ACTIVE',
      featureFlags: {
        RBAC_V1121_ENABLED: true,
        ROLE_HOME_V1121_ENABLED: true,
        ROLE_NAV_GATING_V1121_ENABLED: true,
        ROLE_ACTION_GATING_V1121_ENABLED: true,
        EXECUTIVE_REPORTS_V1121_ENABLED: true,
        ADMIN_CONSOLE_V1121_ENABLED: true,
      },
    }

    expect(store.canAccessRoute(resolveRouteAccess('/live-safety'))).toBe(false)
    expect(store.canAccessRoute(resolveRouteAccess('/quant-loop'))).toBe(false)
    expect(store.canAccessRoute(resolveRouteAccess('/war-room'))).toBe(false)
    expect(store.canAccessRoute(resolveRouteAccess('/governance/pipeline'))).toBe(false)
    expect(store.canAccessRoute(resolveRouteAccess('/ai-hub/weights'))).toBe(false)
  })

  it('keeps research governance pages with researcher and blocks trader-only operations', () => {
    const store = useAuthStore()
    store.user = {
      username: 'researcher',
      displayName: 'Researcher',
      role: 'RESEARCHER',
      permissions: ['research.home.read', 'common.copilot.read'],
      permissionsVersion: 1,
      status: 'ACTIVE',
      featureFlags: {
        RBAC_V1121_ENABLED: true,
        ROLE_HOME_V1121_ENABLED: true,
        ROLE_NAV_GATING_V1121_ENABLED: true,
        ROLE_ACTION_GATING_V1121_ENABLED: true,
        EXECUTIVE_REPORTS_V1121_ENABLED: true,
        ADMIN_CONSOLE_V1121_ENABLED: true,
      },
    }

    expect(store.canAccessRoute(resolveRouteAccess('/governance/pipeline'))).toBe(true)
    expect(store.canAccessRoute(resolveRouteAccess('/ai-hub/calibration'))).toBe(true)
    expect(store.canAccessRoute(resolveRouteAccess('/quant-loop'))).toBe(false)
    expect(store.canAccessRoute(resolveRouteAccess('/autonomy'))).toBe(false)
  })

  it('allows trader operations but hides research-only ai hub pages', () => {
    const store = useAuthStore()
    store.user = {
      username: 'trader',
      displayName: 'Trader',
      role: 'TRADER',
      permissions: ['trading.home.read', 'common.copilot.read'],
      permissionsVersion: 1,
      status: 'ACTIVE',
      featureFlags: {
        RBAC_V1121_ENABLED: true,
        ROLE_HOME_V1121_ENABLED: true,
        ROLE_NAV_GATING_V1121_ENABLED: true,
        ROLE_ACTION_GATING_V1121_ENABLED: true,
        EXECUTIVE_REPORTS_V1121_ENABLED: true,
        ADMIN_CONSOLE_V1121_ENABLED: true,
      },
    }

    expect(store.canAccessRoute(resolveRouteAccess('/autonomy'))).toBe(true)
    expect(store.canAccessRoute(resolveRouteAccess('/quant-loop'))).toBe(true)
    expect(store.canAccessRoute(resolveRouteAccess('/war-room'))).toBe(true)
    expect(store.canAccessRoute(resolveRouteAccess('/ai-hub/calibration'))).toBe(false)
    expect(store.canAccessRoute(resolveRouteAccess('/evolution'))).toBe(false)
  })

  it('forces home path to change-password when user must rotate password', () => {
    const store = useAuthStore()
    store.user = {
      username: 'researcher',
      displayName: 'Researcher',
      role: 'RESEARCHER',
      permissions: ['research.home.read'],
      permissionsVersion: 1,
      status: 'ACTIVE',
      mustChangePassword: true,
      featureFlags: {
        RBAC_V1121_ENABLED: true,
        ROLE_HOME_V1121_ENABLED: true,
        ROLE_NAV_GATING_V1121_ENABLED: true,
        ROLE_ACTION_GATING_V1121_ENABLED: true,
        EXECUTIVE_REPORTS_V1121_ENABLED: true,
        ADMIN_CONSOLE_V1121_ENABLED: true,
      },
    }

    expect(store.homePath).toBe('/auth/change-password')
  })

  it('evaluates account grants for view and operate helpers', () => {
    const store = useAuthStore()
    store.user = {
      username: 'trader',
      displayName: 'Trader',
      role: 'TRADER',
      permissions: ['trading.home.read'],
      permissionsVersion: 1,
      status: 'ACTIVE',
      accessibleAccounts: [
        {
          accountId: 'acc-001',
          displayName: 'Primary',
          accountType: 'LIVE',
          market: 'US',
          grantLevel: 'OPERATE',
          isActive: true,
        },
      ],
      accountGrants: {
        'acc-001': 'OPERATE',
        'acc-002': 'VIEW',
      },
      featureFlags: {
        RBAC_V1121_ENABLED: true,
        ROLE_HOME_V1121_ENABLED: true,
        ROLE_NAV_GATING_V1121_ENABLED: true,
        ROLE_ACTION_GATING_V1121_ENABLED: true,
        EXECUTIVE_REPORTS_V1121_ENABLED: true,
        ADMIN_CONSOLE_V1121_ENABLED: true,
        MULTI_ACCOUNT_V1131_ENABLED: true,
      },
    }

    expect(store.canOperateAccount('acc-001')).toBe(true)
    expect(store.canOperateAccount('acc-002')).toBe(false)
    expect(store.canViewAccount('acc-001')).toBe(true)
    expect(store.canViewAccount('acc-002')).toBe(true)
    expect(store.canViewAccount('acc-404')).toBe(false)
  })
})
