// stores/aiHub.ts — V10.3.3 AI 中枢 Pinia Store

import type {
  AgentRunResult,
  AgentRunSummary,
  CalibrationSnapshot,
  FactorMomentum,
  FactorWeightRecord,
  PostMortemPatterns,
  PostMortemReport,
  PostMortemTradeCandidate,
  PostMortemTradePrefill,
} from '@/api/aiHubService'
import {
  getAgentRunSummary,
  getCalibrationHistory,
  getFactorMomentumTyped,
  getFactorWeights,
  getLatestCalibration,
  getPostMortem,
  getPostMortemPatterns,
  getPostMortemTradeCandidates,
  getPostMortemTradePrefill,
  getWeightsHistory,
  listAgentRuns,
  listPostMortems,
  pollAgentRun,
  pollPostMortem,
  triggerAgentRun,
  triggerPostMortem,
} from '@/api/aiHubService'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TriggerAgentRunParams {
  symbol: string
  context: string
  size_usd?: number
}

export interface TriggerPostMortemParams {
  trade_id: string
  symbol: string
  direction: 'long' | 'short'
  entry_price: number
  exit_price: number
  realized_pnl: number
  hold_days: number
  trade_context?: string
}

export const useAiHubStore = defineStore('aiHub', () => {
  // ─── Agent Orchestration ────────────────────────────────────────────────
  const agentRuns = ref<AgentRunSummary[]>([])
  const currentRunResult = ref<AgentRunResult | null>(null)
  const loadingRuns = ref(false)
  const runningAgent = ref(false)
  const pollingStatus = ref<string>('')   // pending / running / completed / failed

  async function fetchAgentRuns(limit = 20) {
    loadingRuns.value = true
    try {
      agentRuns.value = await listAgentRuns(limit)
    } finally {
      loadingRuns.value = false
    }
  }

  async function fetchRunSummary(runId: string): Promise<AgentRunResult> {
    const result = await getAgentRunSummary(runId)
    currentRunResult.value = result
    return result
  }

  async function startAgentRun(params: TriggerAgentRunParams): Promise<AgentRunResult> {
    runningAgent.value = true
    pollingStatus.value = 'pending'
    try {
      // service context param is Record<string,unknown>; wrap plain-string context
      const contextPayload: Record<string, unknown> =
        typeof params.context === 'string' ? { description: params.context } : (params.context as Record<string, unknown>)

      // Step 1: 立即提交，后端返回 run_id + status:pending
      const submitted = await triggerAgentRun(params.symbol, contextPayload, params.size_usd)
      const runId = submitted.run_id

      // 先插入列表占位
      agentRuns.value.unshift({
        run_id: runId,
        symbol: params.symbol,
        status: 'pending',
        final_recommendation: undefined,
        confidence: undefined,
        created_at: new Date().toISOString(),
        message_count: 0,
      })

      // Step 2: 轮询直到完成
      const result = await pollAgentRun(
        runId,
        (status) => { pollingStatus.value = status },
        3000,
        300_000,
      )

      // 规范化 alias 字段
      result.final_recommendation = result.final_recommendation ?? result.final_decision
      result.confidence = result.confidence ?? result.final_confidence
      result.final_reasoning = result.final_reasoning ?? result.orchestrator_summary

      currentRunResult.value = result

      // 更新列表中的占位项
      const idx = agentRuns.value.findIndex((r) => r.run_id === runId)
      if (idx !== -1) {
        agentRuns.value[idx] = {
          run_id: runId,
          symbol: params.symbol,
          status: result.status,
          final_recommendation: result.final_recommendation,
          confidence: result.confidence,
          created_at: agentRuns.value[idx].created_at,
          message_count: result.messages?.length ?? 0,
        }
      }
      return result
    } catch (e: unknown) {
      pollingStatus.value = 'failed'
      const message = e instanceof Error ? e.message : 'Agent run failed'
      throw new Error(`Agent 运行失败：${message}`)
    } finally {
      runningAgent.value = false
    }
  }

  // ─── Confidence Calibration ─────────────────────────────────────────────
  const calibration = ref<CalibrationSnapshot | null>(null)
  const calibrationHistory = ref<CalibrationSnapshot[]>([])
  const loadingCalibration = ref(false)

  async function fetchCalibration() {
    loadingCalibration.value = true
    try {
      const [latest, history] = await Promise.all([
        getLatestCalibration(),
        getCalibrationHistory(90),
      ])
      // getLatestCalibration may return { message: string } when no data yet
      if (latest && 'brier_score' in latest) {
        calibration.value = latest as CalibrationSnapshot
      } else {
        calibration.value = null
      }
      calibrationHistory.value = history
    } finally {
      loadingCalibration.value = false
    }
  }

  // ─── Adaptive Factor Weights ─────────────────────────────────────────────
  const factorWeights = ref<Record<string, number> | null>(null)  // current weights dict
  const weightsHistory = ref<FactorWeightRecord[]>([])
  const factorMomentum = ref<FactorMomentum | null>(null)
  const loadingWeights = ref(false)

  async function fetchFactorWeights() {
    loadingWeights.value = true
    try {
      const [current, history, momentum] = await Promise.all([
        getFactorWeights(),
        getWeightsHistory(60),
        getFactorMomentumTyped(),
      ])
      factorWeights.value = current
      weightsHistory.value = history
      factorMomentum.value = momentum
    } finally {
      loadingWeights.value = false
    }
  }

  // ─── Decision Post-Mortem ────────────────────────────────────────────────
  const postMortems = ref<PostMortemReport[]>([])
  const currentPostMortem = ref<PostMortemReport | null>(null)
  const postMortemPatterns = ref<PostMortemPatterns | null>(null)
  const loadingPostMortems = ref(false)
  const generatingPostMortem = ref(false)
  const postMortemCandidates = ref<PostMortemTradeCandidate[]>([])
  const loadingPostMortemCandidates = ref(false)

  async function fetchPostMortems(limit = 20) {
    loadingPostMortems.value = true
    try {
      const [list, patterns] = await Promise.all([
        listPostMortems(limit),
        getPostMortemPatterns(),
      ])
      postMortems.value = list
      postMortemPatterns.value = patterns
    } finally {
      loadingPostMortems.value = false
    }
  }

  async function fetchPostMortem(tradeId: string): Promise<PostMortemReport> {
    const pm = await getPostMortem(tradeId)
    currentPostMortem.value = pm
    return pm
  }

  async function generatePostMortem(params: TriggerPostMortemParams): Promise<PostMortemReport> {
    generatingPostMortem.value = true
    try {
      const upsertPostMortem = (pm: PostMortemReport) => {
        currentPostMortem.value = pm
        const idx = postMortems.value.findIndex((p) => p.trade_id === params.trade_id)
        if (idx === -1) postMortems.value.unshift(pm)
        else postMortems.value[idx] = pm
      }

      const initial = await triggerPostMortem(
        params.trade_id,
        params.symbol,
        params.direction,
        params.entry_price,
        params.exit_price,
        params.realized_pnl,
        params.hold_days,
        params.trade_context,
      )
      upsertPostMortem(initial)

      if (initial.status === 'completed' || initial.status === 'failed') {
        return initial
      }

      return await pollPostMortem(
        params.trade_id,
        (pm) => {
          upsertPostMortem(pm)
        },
      )
    } finally {
      generatingPostMortem.value = false
    }
  }

  async function fetchPostMortemCandidates(limit = 120, query = '') {
    loadingPostMortemCandidates.value = true
    try {
      postMortemCandidates.value = await getPostMortemTradeCandidates(limit, query)
    } finally {
      loadingPostMortemCandidates.value = false
    }
  }

  async function fetchPostMortemPrefill(tradeId: string): Promise<PostMortemTradePrefill> {
    return await getPostMortemTradePrefill(tradeId)
  }

  // ─── Global error ─────────────────────────────────────────────────────────
  const error = ref<string | null>(null)

  async function fetchAll() {
    error.value = null
    try {
      await Promise.all([
        fetchAgentRuns(),
        fetchCalibration(),
        fetchFactorWeights(),
        fetchPostMortems(),
      ])
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load AI Hub data'
    }
  }

  return {
    // agent
    agentRuns,
    currentRunResult,
    loadingRuns,
    runningAgent,
    pollingStatus,
    fetchAgentRuns,
    fetchRunSummary,
    startAgentRun,
    // calibration
    calibration,
    calibrationHistory,
    loadingCalibration,
    fetchCalibration,
    // weights
    factorWeights,
    weightsHistory,
    factorMomentum,
    loadingWeights,
    fetchFactorWeights,
    // post-mortem
    postMortems,
    currentPostMortem,
    postMortemPatterns,
    loadingPostMortems,
    generatingPostMortem,
    postMortemCandidates,
    loadingPostMortemCandidates,
    fetchPostMortems,
    fetchPostMortem,
    generatePostMortem,
    fetchPostMortemCandidates,
    fetchPostMortemPrefill,
    // global
    error,
    fetchAll,
  }
})
