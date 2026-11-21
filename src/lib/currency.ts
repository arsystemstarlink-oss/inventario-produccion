const moneyFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatUSD(value: number): string {
  return `$${moneyFormatter.format(value)}`
}

export function formatVES(value: number): string {
  return `Bs ${moneyFormatter.format(value)}`
}

export function usdToVes(value: number, rate: number): number {
  return value * rate
}
