import type { AuthUser } from '@/types/auth'
import { api } from './client'

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
