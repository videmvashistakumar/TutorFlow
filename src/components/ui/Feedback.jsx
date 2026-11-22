// Feedback states.
// SkeletonBlock props: className (size it, e.g. 'h-4 w-1/2'). Animated navy-100 block, aria-hidden.
// LoadingState props: message (default 'Loading…'), rows (number of skeleton lines, default 3), className.
//   Renders role="status" with the message as screen-reader text and skeleton lines.
// ErrorState props: title (default 'Something went wrong'), description, action (node, e.g. a retry Button), className.
//   Renders role="alert".
import { cx } from './cx.js'
import { AlertTriangleIcon } from './icons.jsx'

export function SkeletonBlock({ className }) {
  return <div aria-hidden="true" className={cx('animate-pulse rounded-lg bg-navy-100', className)} />
}

export function LoadingState({ message = 'Loading…', rows = 3, className }) {
  return (
    <div role="status" className={cx('flex flex-col gap-3 py-2', className)}>
      <span className="sr-only">{message}</span>
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonBlock key={index} className={cx('h-4', index === rows - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', description, action = null, className }) {
  return (
    <div
      role="alert"
      className={cx(
        'flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/60 px-6 py-8 text-center',
        className,
      )}
    >
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangleIcon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-red-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-red-600">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  )
}
