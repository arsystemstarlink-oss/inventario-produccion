import { ArrowRight, Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type GuideBannerProps = {
  title: string
  children: ReactNode
  action?: { to: string; label: string }
}

export function GuideBanner({ title, children, action }: GuideBannerProps) {
  return (
    <div className="rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
      <p className="flex items-center gap-1.5 font-medium">
        <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
        {title}
      </p>
      <div className="mt-1 text-indigo-800">{children}</div>
      {action ? (
        <Link
          to={action.to}
          className="mt-2 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
        >
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  )
}
