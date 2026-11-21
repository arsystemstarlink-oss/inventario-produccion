import {
  CalendarDays,
  Landmark,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import { formatDate } from '../../lib/format'
import { formatVES } from '../../lib/currency'
import { useExchangeRate } from './useExchangeRate'

export function ExchangeRateStrip() {
  const { rate, updatedAt, loading, error, refresh } = useExchangeRate()

  return (
    <div
      role="region"
      aria-label="Tasa oficial BCV"
      className="border-b border-slate-800 bg-slate-900 text-slate-300 shadow-[0_2px_6px_rgba(15,23,42,0.18)]"
    >
      <div
        aria-live="polite"
        className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 text-xs sm:px-4"
      >
        <span className="inline-flex items-center gap-1.5 text-slate-100">
          <Landmark className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          <span className="font-medium">Tasa BCV</span>
        </span>
        <span aria-hidden="true" className="text-slate-600">
          ·
        </span>
        {rate === null ? (
          <span className="font-medium text-amber-300">
            {loading ? 'Cargando dólar oficial...' : 'No disponible'}
          </span>
        ) : (
          <strong className="font-semibold text-emerald-300">
            {formatVES(rate)}
          </strong>
        )}
        {rate !== null && updatedAt ? (
          <span className="inline-flex items-center gap-1 text-slate-400">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {formatDate(updatedAt)}
          </span>
        ) : null}
        {error ? (
          <span
            className="inline-flex items-center gap-1 text-amber-300"
            title={error}
          >
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Sin actualizar
          </span>
        ) : null}
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          title="Actualizar tasa BCV"
          className="ml-auto inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 font-medium text-slate-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span className="max-sm:sr-only">
            {loading ? 'Actualizando...' : 'Actualizar'}
          </span>
        </button>
      </div>
    </div>
  )
}
