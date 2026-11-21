import { CircleCheck } from 'lucide-react'
import { useEffect } from 'react'

type ToastProps = {
  message: string
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, onDismiss, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration)
    return () => window.clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-sm items-center gap-2.5 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg sm:inset-x-auto sm:bottom-6 sm:right-6"
    >
      <CircleCheck
        className="h-4 w-4 shrink-0 text-emerald-400"
        aria-hidden="true"
      />
      <p>{message}</p>
    </div>
  )
}
