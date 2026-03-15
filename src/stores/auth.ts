import { fetchCurrentUser } from '@/api/authService'
import { logout as clearAuth, getAuthToken, getTokenPayload } from '@/api/client'
import type {
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
}

function normalizeFeatureFlags(raw?: Partial<FeatureFlags> | null): FeatureFlags {
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...(raw ?? {}),
  }
}

function normalizeRole(raw?: string | null): RoleCode {
  const value = String(raw || '').toUpperCase()
  if (value === 'RESEARCHER' || value === 'TRADER' || value === 'SUPERVISOR' || value === 'ADMINISTRATOR') {
    return value
  }
  return 'ADMINISTRATOR'
}

function inferLegacyPermissions(username?: string | null): string[] {
  if (!username) return []
  if (username === 'admin') return ['*']
  return []
}

function userFromToken(): AuthUser | null {
  const payload = getTokenPayload() as Record<string, any> | null
  if (!payload) return null
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
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(userFromToken())
  const initialized = ref(false)

  const loggedIn = computed(() => Boolean(getAuthToken()))
  const role = computed<RoleCode>(() => user.value?.role ?? 'ADMINISTRATOR')
  const permissions = computed(() => user.value?.permissions ?? [])
  function applyProfile(profile: AuthUser | null) {
    user.value = profile
    initialized.value = true
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
    const currentMode: AccessMode = role.value === 'SUPERVISOR' ? 'summary' : 'standard'
    return rank[currentMode] >= rank[requiredMode]
  }

  function canAccess(meta?: RouteAccessMeta) {
    if (!meta) return true
    if (meta.featureFlag && !isFeatureEnabled(meta.featureFlag)) return false
    if (!isFeatureEnabled('ROLE_NAV_GATING_V1121_ENABLED')) return true
    return hasRole(meta.roles) && hasPermission(meta.permissions) && hasAccessMode(meta.accessMode)
  }

  function canAccessRoute(meta?: RouteAccessMeta) {
    return canAccess(meta)
  }

  function canPerform(meta?: RouteAccessMeta) {
    if (!meta) return true
    if (meta.featureFlag && !isFeatureEnabled(meta.featureFlag)) return false
    if (!isFeatureEnabled('ROLE_ACTION_GATING_V1121_ENABLED')) return true
    return hasRole(meta.roles) && hasPermission(meta.permissions) && hasAccessMode(meta.accessMode)
  }

  function signOut() {
    clearAuth()
    user.value = null
    initialized.value = true
  }

  return {
    user,
    initialized,
    loggedIn,
    role,
    permissions,
    homePath,
    applyProfile,
    hydrateFromToken,
    refreshProfile,
    isFeatureEnabled,
    hasRole,
    hasPermission,
    hasAccessMode,
    canAccess,
    canAccessRoute,
    canPerform,
    signOut,
  }
})
