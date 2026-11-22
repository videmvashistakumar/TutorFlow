// PageHeader. Props: eyebrow (optional small label above), title (required, renders the page h1),
// description (optional), actions (node, optional, right side on desktop, stacks below on mobile), className.
import { cx } from './cx.js'

export function PageHeader({ eyebrow, title, description, actions = null, className }) {
  return (
    <header className={cx('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
    </header>
  )
}
