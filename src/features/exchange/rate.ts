export const OFFICIAL_RATE_URL =
  'https://ve.dolarapi.com/v1/dolares/oficial'
export const EXCHANGE_RATE_STORAGE_KEY = 'exchange:dolar-oficial:v1'
export const RATE_TTL_MS = 60 * 60 * 1000

export type RateInfo = {
  rate: number
  updatedAt: string
  fetchedAt: number
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function parseOfficialRate(
  payload: unknown,
): { rate: number; updatedAt: string } | null {
  if (typeof payload !== 'object' || payload === null) return null

  const data = payload as Record<string, unknown>
  const promedio = isPositiveNumber(data.promedio) ? data.promedio : null
  const compra = isPositiveNumber(data.compra) ? data.compra : null
  const venta = isPositiveNumber(data.venta) ? data.venta : null
  const fallback = compra !== null && venta !== null ? (compra + venta) / 2 : null
  const rate = promedio ?? fallback

  if (rate === null) return null

  const updatedAt =
    typeof data.fechaActualizacion === 'string' &&
    data.fechaActualizacion.trim() !== ''
      ? data.fechaActualizacion
      : new Date().toISOString()

  return { rate, updatedAt }
}

export async function fetchOfficialRate(): Promise<RateInfo> {
  const response = await fetch(OFFICIAL_RATE_URL, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`La API del dólar respondió con estado ${response.status}.`)
  }

  const payload: unknown = await response.json()
  const parsed = parseOfficialRate(payload)
  if (!parsed) {
    throw new Error('La API del dólar no devolvió una tasa válida.')
  }

  return { ...parsed, fetchedAt: Date.now() }
}

export function isRateFresh(info: RateInfo, now = Date.now()): boolean {
  return now - info.fetchedAt < RATE_TTL_MS
}

export function loadCachedRate(): RateInfo | null {
  try {
    const raw = window.localStorage.getItem(EXCHANGE_RATE_STORAGE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null

    const data = parsed as Record<string, unknown>
    if (
      !isPositiveNumber(data.rate) ||
      typeof data.updatedAt !== 'string' ||
      typeof data.fetchedAt !== 'number' ||
      !Number.isFinite(data.fetchedAt)
    ) {
      return null
    }

    return {
      rate: data.rate,
      updatedAt: data.updatedAt,
      fetchedAt: data.fetchedAt,
    }
  } catch {
    return null
  }
}

export function saveCachedRate(info: RateInfo): void {
  try {
    window.localStorage.setItem(EXCHANGE_RATE_STORAGE_KEY, JSON.stringify(info))
  } catch {
    // La tasa se mantiene en memoria aunque no se pueda guardar.
  }
}
