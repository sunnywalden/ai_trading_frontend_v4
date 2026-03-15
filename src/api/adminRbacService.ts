import { api } from './client'

export interface AdminUserItem {
  id: number
  username: string
  display_name: string
  status: string
  default_role: string
  permissions_version: number
  is_system_seed: boolean
  must_change_password: boolean
  last_login_at?: string | null
  created_at: string
}

export interface AdminRoleItem {
  id: number
  code: string
  name: string
  description?: string | null
  is_system_builtin: boolean
  permissions: string[]
  created_at?: string | null
  updated_at?: string | null
}

export interface AdminAuditItem {
  id: number
  username: string
  event_type: string
  resource: string
  action: string
  decision: string
  reason?: string | null
  target_type?: string | null
  target_id?: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface AdminPermissionItem {
  id: number
  code: string
  resource: string
  action: string
  scope: string
  access_mode: string
  description?: string | null
}

export async function fetchAdminUsers(): Promise<AdminUserItem[]> {
  const { data } = await api.get('/v1/admin/users')
  return data.users ?? []
}

export async function createAdminUser(payload: {
  username: string
  display_name: string
  password: string
  role_code: string
}) {
  const { data } = await api.post('/v1/admin/users', payload)
  return data
}

export async function updateAdminUser(userId: number, payload: {
  display_name?: string
  password?: string
  status?: string
  role_code?: string
}) {
  const { data } = await api.patch(`/v1/admin/users/${userId}`, payload)
  return data
}

export async function assignAdminUserRole(userId: number, roleCode: string) {
  const { data } = await api.post(`/v1/admin/users/${userId}/roles`, { role_code: roleCode })
  return data
}

export async function fetchAdminRoles(): Promise<AdminRoleItem[]> {
  const { data } = await api.get('/v1/admin/roles')
  return data.roles ?? []
}

export async function createAdminRole(payload: { code: string; name: string; description?: string }) {
  const { data } = await api.post('/v1/admin/roles', payload)
  return data
}

export async function updateAdminRole(roleId: number, payload: { code: string; name: string; description?: string }) {
  const { data } = await api.patch(`/v1/admin/roles/${roleId}`, payload)
  return data
}

export async function fetchAdminPermissions(): Promise<AdminPermissionItem[]> {
  const { data } = await api.get('/v1/admin/permissions')
  return data.permissions ?? []
}

export async function fetchAdminAudit(limit = 100): Promise<AdminAuditItem[]> {
  const { data } = await api.get('/v1/admin/audit/authz', { params: { limit } })
  return data.items ?? []
}
