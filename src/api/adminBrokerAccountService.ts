import { api } from './client'

export interface BrokerAccountItem {
  id: number
  account_id: string
  display_name?: string | null
  account_type: string
  market: string
  tiger_id?: string | null
  credential_ref?: string | null
  credential_configured: boolean
  key_fingerprint?: string | null
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface UserAccountGrantItem {
  id: number
  user_id: number
  broker_account_id: number
  account_id: string
  display_name?: string | null
  grant_level: string
  is_active: boolean
  granted_at?: string | null
  revoked_at?: string | null
}

export async function listBrokerAccounts(): Promise<BrokerAccountItem[]> {
  const { data } = await api.get('/v1/admin/broker-accounts')
  return data.accounts ?? []
}

export async function createBrokerAccount(payload: {
  account_id: string
  display_name?: string
  account_type: string
  market: string
  tiger_id?: string
}) {
  const { data } = await api.post('/v1/admin/broker-accounts', payload)
  return data
}

export async function updateBrokerAccount(accountId: number, payload: {
  display_name?: string
  account_type?: string
  market?: string
  tiger_id?: string
  is_active?: boolean
}) {
  const { data } = await api.patch(`/v1/admin/broker-accounts/${accountId}`, payload)
  return data
}

export async function deleteBrokerAccount(accountId: number) {
  const { data } = await api.delete(`/v1/admin/broker-accounts/${accountId}`)
  return data
}

export async function uploadBrokerAccountCredentials(accountId: number, payload: {
  tiger_id: string
  private_key_pem: string
}) {
  const { data } = await api.post(`/v1/admin/broker-accounts/${accountId}/credentials`, payload)
  return data
}

export async function listUserAccountGrants(userId: number): Promise<UserAccountGrantItem[]> {
  const { data } = await api.get(`/v1/admin/users/${userId}/account-grants`)
  return data.grants ?? []
}

export async function createUserAccountGrant(userId: number, payload: {
  broker_account_id: number
  grant_level: string
}) {
  const { data } = await api.post(`/v1/admin/users/${userId}/account-grants`, payload)
  return data
}

export async function updateUserAccountGrant(
  userId: number,
  grantId: number,
  payload: { grant_level: string },
) {
  const { data } = await api.patch(`/v1/admin/users/${userId}/account-grants/${grantId}`, payload)
  return data
}

export async function deleteUserAccountGrant(userId: number, grantId: number) {
  const { data } = await api.delete(`/v1/admin/users/${userId}/account-grants/${grantId}`)
  return data
}
