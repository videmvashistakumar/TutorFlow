// EmptyState. Props: icon (node), title, description, action (node), dashed (boolean, default true = dashed border),
// className. Centred, py-10.
import { cx } from './cx.js'

export function EmptyState({ icon = null, title, description, action = null, dashed = true, className }) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center rounded-xl bg-white px-6 py-10 text-center',
        dashed ? 'border border-dashed border-navy-200' : 'border border-navy-100 shadow-card',
        className,
      )}
    >
      {icon && (
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-500">
          {icon}
        </span>
      )}
      {title && <p className="text-base font-semibold text-navy-900">{title}</p>}
      {description && <p className="mt-1 max-w-sm text-sm text-navy-500">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  )
}
