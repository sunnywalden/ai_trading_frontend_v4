import type { AccessibleAccount, AuthUser } from '@/types/auth'
import { api } from './client'

function normalizeAccessibleAccounts(raw?: any[]): AccessibleAccount[] {
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

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get('/v1/auth/me')
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    role: data.role,
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    permissionsVersion: data.permissions_version ?? 1,
    status: data.status ?? 'ACTIVE',
    isSystemSeed: Boolean(data.is_system_seed),
    mustChangePassword: Boolean(data.must_change_password),
    featureFlags: data.feature_flags ?? {},
    accessibleAccounts: normalizeAccessibleAccounts(data.accessible_accounts),
    defaultAccountId: data.default_account_id ?? null,
    accountGrants: data.account_grants ?? {},
  }
}

export async function changeCurrentPassword(payload: {
  currentPassword: string
  newPassword: string
}): Promise<AuthUser> {
  const { data } = await api.post('/v1/auth/change-password', {
    current_password: payload.currentPassword,
    new_password: payload.newPassword,
  })

  const user = data.user ?? {}
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
    permissionsVersion: user.permissions_version ?? 1,
    status: user.status ?? 'ACTIVE',
    isSystemSeed: Boolean(user.is_system_seed),
    mustChangePassword: Boolean(user.must_change_password),
    featureFlags: user.feature_flags ?? {},
    accessibleAccounts: normalizeAccessibleAccounts(user.accessible_accounts),
    defaultAccountId: user.default_account_id ?? null,
    accountGrants: user.account_grants ?? {},
  }
}

export async function fetchMyAccounts(): Promise<{
  accounts: AccessibleAccount[]
  accessibleAccountIds: string[]
  defaultAccountId: string | null
  accountGrants: Record<string, string>
}> {
  const { data } = await api.get('/v1/auth/my-accounts')
  return {
    accounts: normalizeAccessibleAccounts(data.accounts),
    accessibleAccountIds: Array.isArray(data.accessible_account_ids)
      ? data.accessible_account_ids.map(String)
      : [],
    defaultAccountId: data.default_account_id ?? null,
    accountGrants: data.account_grants ?? {},
  }
}

export async function fetchCurrentPermissions(): Promise<{
  role: string
  permissions: string[]
  permissionsVersion: number
}> {
  const { data } = await api.get('/v1/auth/permissions')
  return {
    role: data.role,
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    permissionsVersion: data.permissions_version ?? 1,
  }
}
