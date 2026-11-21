import { describe, expect, it } from 'vitest'
import { formatUSD, formatVES, usdToVes } from './currency'

describe('currency formatting', () => {
  it('formats USD amounts with two decimals', () => {
    expect(formatUSD(3)).toBe('$3,00')
    expect(formatUSD(1234.5)).toBe('$1.234,50')
  })

  it('formats VES amounts with two decimals', () => {
    expect(formatVES(918.7662)).toBe('Bs 918,77')
    expect(formatVES(1234567.8)).toBe('Bs 1.234.567,80')
  })

  it('converts USD to VES using the official rate', () => {
    expect(usdToVes(2, 918.7662)).toBeCloseTo(1837.5324)
  })
})
