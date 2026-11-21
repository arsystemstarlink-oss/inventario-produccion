import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ExchangeRateContext } from './exchange-context'
import {
  fetchOfficialRate,
  isRateFresh,
  loadCachedRate,
  saveCachedRate,
} from './rate'
import type { RateInfo } from './rate'

const RATE_ERROR =
  'No se pudo actualizar la tasa oficial. Se muestra la última tasa disponible si existe.'

export function ExchangeRateProvider({ children }: { children: ReactNode }) {
  const [cached] = useState(loadCachedRate)
  const [rate, setRate] = useState<number | null>(cached?.rate ?? null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(
    cached?.updatedAt ?? null,
  )
  const [loading, setLoading] = useState(!(cached && isRateFresh(cached)))
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef(0)

  const applyRate = useCallback((info: RateInfo | null, requestId: number) => {
    if (requestRef.current !== requestId) return
    if (info) {
      saveCachedRate(info)
      setRate(info.rate)
      setUpdatedAt(info.updatedAt)
      setError(null)
    } else {
      setError(RATE_ERROR)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (cached && isRateFresh(cached)) return
    const requestId = requestRef.current + 1
    requestRef.current = requestId

    void (async () => {
      const info = await fetchOfficialRate().catch(() => null)
      applyRate(info, requestId)
    })()
  }, [cached, applyRate])

  const refresh = useCallback(() => {
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setLoading(true)
    setError(null)

    void (async () => {
      const info = await fetchOfficialRate().catch(() => null)
      applyRate(info, requestId)
    })()
  }, [applyRate])

  return (
    <ExchangeRateContext.Provider
      value={{ rate, updatedAt, loading, error, refresh }}
    >
      {children}
    </ExchangeRateContext.Provider>
  )
}
