const numberFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 2,
})

export function formatAmount(value: number): string {
  return numberFormatter.format(value)
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
