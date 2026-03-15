export type RoleCode = 'RESEARCHER' | 'TRADER' | 'SUPERVISOR' | 'ADMINISTRATOR'
export type AccessMode = 'standard' | 'readonly' | 'summary'
export type FeatureFlagName =
  | 'RBAC_V1121_ENABLED'
  | 'ROLE_HOME_V1121_ENABLED'
  | 'ROLE_NAV_GATING_V1121_ENABLED'
  | 'ROLE_ACTION_GATING_V1121_ENABLED'
  | 'EXECUTIVE_REPORTS_V1121_ENABLED'
  | 'ADMIN_CONSOLE_V1121_ENABLED'

export type FeatureFlags = Record<FeatureFlagName, boolean>

export interface AuthUser {
  id?: number | null
  username: string
  displayName?: string | null
  role: RoleCode
  permissions: string[]
  permissionsVersion: number
  status: string
  isSystemSeed?: boolean
  mustChangePassword?: boolean
  featureFlags?: Partial<FeatureFlags>
}

export interface RouteAccessMeta {
  roles?: RoleCode[]
  permissions?: string[]
  accessMode?: AccessMode
  workbenchDomain?: 'research' | 'trading' | 'executive' | 'admin' | 'common'
  featureFlag?: FeatureFlagName
}

export const ROLE_HOME_PATH: Record<RoleCode, string> = {
  RESEARCHER: '/research',
  TRADER: '/trading',
  SUPERVISOR: '/executive',
  ADMINISTRATOR: '/admin',
}
