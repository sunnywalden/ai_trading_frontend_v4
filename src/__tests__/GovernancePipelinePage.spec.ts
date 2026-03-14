import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/v1051Service', () => ({
  v1051Api: {
    getGovernancePipeline: vi.fn().mockResolvedValue({
      data: {
        rollout: {
          stage: 'SEMI',
          flags: {
            signal_pipeline_v1054_enabled: true,
            autonomous_control_plane_v1054_enabled: true,
            native_audit_v1054_enabled: true,
          },
          recommended_next_step: '验证治理硬门后进入 FULL',
        },
        funnel: {
          discovery: 5,
          limited: 1,
          retired: 1,
          paper: 4,
          shadow_live: 3,
          challenger: 2,
          production: 1,
        },
        hard_gate_candidates: 2,
        pipeline: [
          {
            strategy_id: 's1',
            name: 'Momentum',
            style: 'Trend',
            version: 3,
            is_active: true,
            last_run_status: 'SUCCESS',
            last_run_at: null,
            run_count: 12,
            stage: 'CHALLENGER',
            governance_note: '继续观察 2 周后再进 FULL',
            evidence_chain: {
              backtest: true,
              paper: true,
              shadow: true,
              execution: true,
              calibration: true,
              rollback_ready: true,
            },
            promotion_blockers: [],
            rollback_suggestion: 'HOLD_CURRENT_STAGE',
            hard_gate_ready: true,
            hit_rate: 0.61,
            avg_signal_strength: 0.8,
            scanned_total: 100,
            hits: 20,
          },
        ],
        experiments: [],
        insight_summary: {
          total: 0,
          validated: 0,
          active: 0,
        },
        recent_insights: [],
        recent_runs: [],
      },
    }),
  },
}))

import GovernancePipelinePage from '@/views/GovernancePipelinePage.vue'

describe('GovernancePipelinePage', () => {
  it('renders rollout and hard gate readiness', async () => {
    const { findByText } = render(GovernancePipelinePage)

    expect(await findByText('验证治理硬门后进入 FULL')).toBeTruthy()
    expect(await findByText('Hard Gate Ready')).toBeTruthy()
    expect(await findByText('READY')).toBeTruthy()
    expect(await findByText('Limited')).toBeTruthy()
    expect(await findByText('Retired')).toBeTruthy()
  })
})
