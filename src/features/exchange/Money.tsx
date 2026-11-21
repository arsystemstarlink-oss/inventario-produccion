import { useExchangeRate } from './useExchangeRate'
import { formatUSD, formatVES, usdToVes } from '../../lib/currency'

type MoneyProps = {
  usd: number
  suffix?: string
  className?: string
}

export function Money({ usd, suffix = '', className = '' }: MoneyProps) {
  const { rate } = useExchangeRate()

  return (
    <span className={className}>
      {formatUSD(usd)}
      {suffix ? ` ${suffix}` : ''}
      {rate !== null ? (
        <span className="block text-xs font-normal text-slate-500">
          {formatVES(usdToVes(usd, rate))}
        </span>
      ) : null}
    </span>
  )
}
