import { useContext } from 'react'
import { ExchangeRateContext } from './exchange-context'
import type { ExchangeRateContextValue } from './exchange-context'

export function useExchangeRate(): ExchangeRateContextValue {
  const context = useContext(ExchangeRateContext)
  if (!context) {
    throw new Error(
      'useExchangeRate debe usarse dentro de ExchangeRateProvider.',
    )
  }
  return context
}
