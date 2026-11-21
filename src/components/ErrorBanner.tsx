import { TriangleAlert, X } from 'lucide-react'
import { Button } from './Button'

type ErrorBannerProps = {
  message: string
  onDismiss?: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <TriangleAlert
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
