import { Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from './Button'

type EmptyStateProps = {
  message: string
  actionLabel?: string
  onAction?: () => void
  actionTo?: string
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
  actionTo,
}: EmptyStateProps) {
  const showAction = actionLabel !== undefined && (onAction || actionTo)

  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
      <Inbox className="h-6 w-6 text-slate-400" aria-hidden="true" />
      <p>{message}</p>
      {showAction && actionTo ? (
        <Link
          to={actionTo}
          className="inline-flex cursor-pointer items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 max-md:min-h-11"
        >
          {actionLabel}
        </Link>
      ) : null}
      {showAction && !actionTo && onAction ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </div>
  )
}
