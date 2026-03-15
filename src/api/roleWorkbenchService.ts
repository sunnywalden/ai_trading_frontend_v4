import { api } from './client'

export async function fetchResearchHome() {
  const { data } = await api.get('/v1/research/home')
  return data
}

export async function fetchTradingHome() {
  const { data } = await api.get('/v1/trading/home')
  return data
}

export async function fetchExecutiveSummary() {
  const { data } = await api.get('/v1/executive/summary')
  return data
}

export async function fetchExecutiveRiskReport() {
  const { data } = await api.get('/v1/executive/risk-report')
  return data
}

export async function fetchExecutivePerformanceReport() {
  const { data } = await api.get('/v1/executive/performance-report')
  return data
}

export async function fetchAdminOverview() {
  const { data } = await api.get('/v1/admin/overview')
  return data
}
