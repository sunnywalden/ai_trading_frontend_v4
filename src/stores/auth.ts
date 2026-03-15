import { fetchCurrentUser } from '@/api/authService'
import {
    logout as clearAuth,
    getAuthToken,
    getCurrentAccountId,
    getTokenPayload,
    setCurrentAccountId,
} from '@/api/client'
import type {
    AccessibleAccount,
    AccessMode,
    AuthUser,
    FeatureFlagName,
    FeatureFlags,
    RoleCode,
    RouteAccessMeta,
} from '@/types/auth'
import { ROLE_HOME_PATH } from '@/types/auth'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  RBAC_V1121_ENABLED: true,
  ROLE_HOME_V1121_ENABLED: true,
  ROLE_NAV_GATING_V1121_ENABLED: true,
  ROLE_ACTION_GATING_V1121_ENABLED: true,
  EXECUTIVE_REPORTS_V1121_ENABLED: true,
  ADMIN_CONSOLE_V1121_ENABLED: true,
  MULTI_ACCOUNT_V1131_ENABLED: false,
  BROKER_ACCOUNT_REGISTRY_V1131_ENABLED: false,
  ACCOUNT_DATA_ISOLATION_V1131_ENABLED: false,
  ACCOUNT_ADMIN_UI_V1131_ENABLED: false,
}

function normalizeFeatureFlags(raw?: Partial<FeatureFlags> | null): FeatureFlags {
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...raw,
  }
}

function normalizeRole(raw?: string | null): RoleCode {
  const value = String(raw || '').toUpperCase()
  if (
    value === 'RESEARCHER'
    || value === 'TRADER'
    || value === 'SUPERVISOR'
    || value === 'ADMINISTRATOR'
  ) {
    return value
  }
  return 'ADMINISTRATOR'
}

function inferLegacyPermissions(username?: string | null): string[] {
  if (!username) return []
  if (username === 'admin') return ['*']
  return []
}

function normalizeAccessibleAccounts(raw?: any[] | null): AccessibleAccount[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => ({
      id: item?.id ?? null,
      accountId: String(item?.account_id ?? item?.accountId ?? ''),
      displayName: item?.display_name ?? item?.displayName ?? null,
      accountType: item?.account_type ?? item?.accountType ?? null,
      market: item?.market ?? null,
      grantLevel: String(item?.grant_level ?? item?.grantLevel ?? 'VIEW'),
      isActive: item?.is_active ?? item?.isActive ?? true,
    }))
    .filter((item) => Boolean(item.accountId))
}

function synthesizeAccessibleAccounts(
  accountIds: string[],
  grants: Record<string, string>,
): AccessibleAccount[] {
  return accountIds.map((accountId) => ({
    accountId,
    displayName: accountId,
    accountType: 'LIVE',
    market: 'US',
    grantLevel: grants[accountId] ?? 'VIEW',
    isActive: true,
  }))
}

function userFromToken(): AuthUser | null {
  const payload = getTokenPayload() as Record<string, any> | null
  if (!payload) return null

  const accountGrants = payload.account_grants && typeof payload.account_grants === 'object'
    ? payload.account_grants as Record<string, string>
    : {}
  const accessibleAccountIds = Array.isArray(payload.accessible_account_ids)
    ? payload.accessible_account_ids.map(String)
    : []
  const accessibleAccounts = normalizeAccessibleAccounts(payload.accessible_accounts)

  return {
    id: payload.uid ?? null,
    username: String(payload.sub || ''),
    displayName: payload.display_name ?? payload.sub ?? null,
    role: normalizeRole(payload.role),
    permissions: Array.isArray(payload.permissions)
      ? payload.permissions.map(String)
      : inferLegacyPermissions(payload.sub),
    permissionsVersion: Number(payload.permissions_version ?? 1),
    status: String(payload.status ?? 'ACTIVE'),
    mustChangePassword: Boolean(payload.must_change_password),
    featureFlags: normalizeFeatureFlags(payload.feature_flags),
    accessibleAccounts: accessibleAccounts.length
      ? accessibleAccounts
      : synthesizeAccessibleAccounts(accessibleAccountIds, accountGrants),
    defaultAccountId: payload.default_account_id ?? null,
    accountGrants,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(userFromToken())
  const initialized = ref(false)
  const currentAccountId = ref<string | null>(getCurrentAccountId())

  const loggedIn = computed(() => Boolean(getAuthToken()))
  const role = computed<RoleCode>(() => user.value?.role ?? 'ADMINISTRATOR')
  const permissions = computed(() => user.value?.permissions ?? [])
  const accessibleAccounts = computed<AccessibleAccount[]>(
    () => user.value?.accessibleAccounts ?? [],
  )
  const accountGrants = computed<Record<string, string>>(
    () => user.value?.accountGrants ?? {},
  )

  function syncCurrentAccount(profile: AuthUser | null) {
    const accounts = profile?.accessibleAccounts ?? []
    const validIds = accounts.map((item) => item.accountId)
    const next = (() => {
      const remembered = currentAccountId.value || getCurrentAccountId()
      if (remembered && validIds.includes(remembered)) return remembered
      if (
        profile?.defaultAccountId
        && validIds.includes(profile.defaultAccountId)
      ) {
        return profile.defaultAccountId
      }
      return validIds[0] ?? null
    })()
    currentAccountId.value = next
    setCurrentAccountId(next)
  }

  function applyProfile(profile: AuthUser | null) {
    user.value = profile
    initialized.value = true
    syncCurrentAccount(profile)
    return user.value
  }

  const homePath = computed(() => {
    if (user.value?.mustChangePassword) return '/auth/change-password'
    if (!isFeatureEnabled('ROLE_HOME_V1121_ENABLED')) return '/dashboard'
    return ROLE_HOME_PATH[role.value] ?? '/admin'
  })

  function hydrateFromToken() {
    applyProfile(userFromToken())
  }

  async function refreshProfile() {
    if (!getAuthToken()) {
      applyProfile(null)
      return null
    }
    try {
      const profile = await fetchCurrentUser()
      return applyProfile(profile)
    } catch {
      hydrateFromToken()
      return user.value
    }
  }

  function isFeatureEnabled(flag: FeatureFlagName) {
    const flags = normalizeFeatureFlags(user.value?.featureFlags)
    return Boolean(flags[flag])
  }

  function hasRole(roles?: RoleCode[]) {
    if (!roles || roles.length === 0) return true
    return roles.includes(role.value)
  }

  function hasPermission(required?: string | string[]) {
    if (!required || (Array.isArray(required) && required.length === 0)) return true
    if (permissions.value.includes('*')) return true
    const requiredList = Array.isArray(required) ? required : [required]
    return requiredList.some((permission) => permissions.value.includes(permission))
  }

  function hasAccessMode(requiredMode?: AccessMode) {
    if (!requiredMode) return true
    const rank: Record<AccessMode, number> = {
      summary: 0,
      readonly: 1,
      standard: 2,
    }
    const currentMode: AccessMode = role.value === 'SUPERVISOR'
      ? 'summary'
      : 'standard'
    return rank[currentMode] >= rank[requiredMode]
  }

  function canOperateAccount(accountId: string) {
    const level = accountGrants.value[accountId]
    return level === 'OPERATE' || level === 'ADMIN'
  }

  function canViewAccount(accountId: string) {
    return accessibleAccounts.value.some((item) => item.accountId === accountId)
      || Boolean(accountGrants.value[accountId])
  }

  function canAccess(meta?: RouteAccessMeta) {
    if (!meta) return true
    if (meta.featureFlag && !isFeatureEnabled(meta.featureFlag)) return false
    if (!isFeatureEnabled('ROLE_NAV_GATING_V1121_ENABLED')) return true
    return hasRole(meta.roles)
      && hasPermission(meta.permissions)
      && hasAccessMode(meta.accessMode)
  }

  function canAccessRoute(meta?: RouteAccessMeta) {
    return canAccess(meta)
  }

  function canPerform(meta?: RouteAccessMeta) {
    if (!meta) return true
    if (meta.featureFlag && !isFeatureEnabled(meta.featureFlag)) return false
    if (!isFeatureEnabled('ROLE_ACTION_GATING_V1121_ENABLED')) return true
    return hasRole(meta.roles)
      && hasPermission(meta.permissions)
      && hasAccessMode(meta.accessMode)
  }

  function selectAccount(accountId: string | null) {
    currentAccountId.value = accountId
    setCurrentAccountId(accountId)
  }

  function signOut() {
    clearAuth()
    user.value = null
    initialized.value = true
    currentAccountId.value = null
    setCurrentAccountId(null)
  }

  return {
    user,
    initialized,
    loggedIn,
    role,
    permissions,
    accessibleAccounts,
    currentAccountId,
    accountGrants,
    homePath,
    applyProfile,
    hydrateFromToken,
    refreshProfile,
    isFeatureEnabled,
    hasRole,
    hasPermission,
    hasAccessMode,
    canOperateAccount,
    canViewAccount,
    canAccess,
    canAccessRoute,
    canPerform,
    selectAccount,
    signOut,
  }
})
