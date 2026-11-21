import { CircleCheck, X } from 'lucide-react'
import { Button } from './Button'

type SuccessBannerProps = {
  message: string
  onDismiss?: () => void
}

export function SuccessBanner({ message, onDismiss }: SuccessBannerProps) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <CircleCheck
        className="mt-0.5 h-4 w-4 shrink-0"
        aria-hidden="true"
      />
      <p className="min-w-0 flex-1 break-words">{message}</p>
      {onDismiss ? (
        <Button
          variant="ghost"
          className="shrink-0 px-2 py-1"
          aria-label="Cerrar aviso"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  )
}
