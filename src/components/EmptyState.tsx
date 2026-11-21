import { Inbox } from 'lucide-react'

type EmptyStateProps = {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
      <Inbox className="h-6 w-6 text-slate-400" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}
