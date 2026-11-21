import { useCallback, useState } from 'react'

export function useTouchedFields() {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)

  const touch = useCallback((field: string) => {
    setTouched((current) =>
      current[field] ? current : { ...current, [field]: true },
    )
  }, [])

  const isVisible = (field: string) => submitted || touched[field] === true

  return {
    touch,
    isVisible,
    markSubmitted: () => setSubmitted(true),
    reset: () => {
      setTouched({})
      setSubmitted(false)
    },
  }
}

export function pickVisible<T extends object>(
  errors: T,
  isVisible: (field: string) => boolean,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(errors).filter(([field]) => isVisible(field)),
  ) as Partial<T>
}
