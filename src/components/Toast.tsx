import { CircleCheck } from 'lucide-react'
import { useEffect } from 'react'

type ToastProps = {
  message: string
  onDismiss: () => void
  duration?: number
  action?: { label: string; onClick: () => void }
}

export function Toast({
  message,
  onDismiss,
  duration = 3500,
  action,
}: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, action ? 6000 : duration)
    return () => window.clearTimeout(timer)
  }, [onDismiss, duration, action])

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-sm items-center gap-2.5 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg sm:inset-x-auto sm:bottom-6 sm:right-6"
    >
      <CircleCheck
        className="h-4 w-4 shrink-0 text-emerald-400"
        aria-hidden="true"
      />
      <p className="min-w-0 flex-1">{message}</p>
      {action ? (
        <button
          type="button"
          className="shrink-0 cursor-pointer rounded-md px-2 py-1 font-semibold text-emerald-300 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}
