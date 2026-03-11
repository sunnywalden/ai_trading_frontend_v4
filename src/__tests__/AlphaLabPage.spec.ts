import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/v1051Service', () => ({
  v1051Api: {
    getAlphaLabSnapshot: vi.fn().mockResolvedValue({
      data: {
        lookback_days: 90,
        summary: {
          generated: 12,
          executed: 8,
          evaluated: 6,
          win_rate: 0.5,
          gross_return: 0.08,
          net_return: 0.05,
          after_cost_return: 0.04,
          after_turnover_return: 0.03,
          data_quality: 'REAL',
          avg_execution_slippage: 0.01,
          avg_expected_return: 0.08,
          avg_actual_return: 0.05,
          avg_pnl_pct: 0.03,
          avg_confidence: 0.72,
        },
        origin_breakdown: [
          { mode: 'REAL', count: 8, ratio: 0.6667 },
          { mode: 'SYNTHETIC', count: 4, ratio: 0.3333 },
        ],
        signal_integrity: {
          sample_size: 12,
          origin_breakdown: [
            { mode: 'REAL', count: 8, ratio: 0.6667 },
            { mode: 'SYNTHETIC', count: 4, ratio: 0.3333 },
          ],
          origin_known: 12,
          origin_known_ratio: 1,
          canonical_payload_ready: 10,
          canonical_payload_ratio: 0.8333,
          native_transition_ready: 9,
          native_transition_ratio: 0.75,
        },
        rollout: {
          stage: 'SHADOW',
          flags: {
            signal_pipeline_v1054_enabled: true,
            autonomous_control_plane_v1054_enabled: false,
          },
          recommended_next_step: '开启原生审计与控制面灰度',
        },
        current_regime: {
          regime: 'BULL',
          confidence: 0.8,
          classification_date: null,
          reasoning: 'test',
        },
        regime_tape: [{ id: 1, regime: 'BULL', confidence: 0.8, classification_date: null }],
        strategy_scorecards: [],
        decay_monitor: [],
        shadow_book: {
          total: 4,
          closed: 3,
          win_rate: 0.5,
          false_reject_rate: 0.25,
          missed_alpha_pct: 0.1,
          avoided_loss_pct: 0.04,
          protection_benefit_pct: -0.06,
          avg_pnl_pct: 0.02,
          rejection_breakdown: [],
        },
        recent_signals: [
          {
            signal_id: 'sig-1',
            symbol: 'AAPL',
            direction: 'LONG',
            status: 'EXECUTED',
            strategy_name: 'Trend',
            confidence: 0.8,
            expected_return: 0.07,
            actual_return: 0.04,
            origin_mode: 'REAL',
            signal_payload_version: 'v10.5.4',
            signal_transition_count: 2,
            data_quality: 'REAL',
            generated_at: null,
          },
        ],
      },
    }),
  },
}))

import AlphaLabPage from '@/views/AlphaLabPage.vue'

describe('AlphaLabPage', () => {
  it('renders rollout and origin integrity information', async () => {
    const { findByText } = render(AlphaLabPage)

    expect(await findByText('V10.5.4 SHADOW')).toBeTruthy()
    expect(await findByText('Origin Mix')).toBeTruthy()
    expect(await findByText('Payload Ready')).toBeTruthy()
    expect(await findByText('Signal Integrity')).toBeTruthy()
  })
})
