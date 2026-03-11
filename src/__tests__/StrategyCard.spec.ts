import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import StrategyCard from '@/components/StrategyCard.vue'

describe('StrategyCard', () => {
  it('shows pending-trigger copy when the strategy has no run history', () => {
    const { getAllByText } = render(StrategyCard, {
      props: {
        strategy: {
          id: 'strategy-1',
          name: '布林带均值回归',
          style: '均值回归',
          description: 'test',
          is_builtin: true,
          is_active: true,
          tags: ['mean_reversion']
        }
      }
    })

    expect(getAllByText('待触发').length).toBeGreaterThanOrEqual(2)
  })
})