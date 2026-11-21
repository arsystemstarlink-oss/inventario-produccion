import { createContext } from 'react'

export type ExchangeRateContextValue = {
  rate: number | null
  updatedAt: string | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export const ExchangeRateContext =
  createContext<ExchangeRateContextValue | null>(null)
