// Card and SectionCard.
// Card props: padding ('none' | 'sm' | 'md', default 'md'), className, children, plus native div props.
// SectionCard props: title, description, actions (node), padded (default true), className, bodyClassName, children.
//   Renders a Card with an optional header (title, description, right-side actions) above the body.
import { cx } from './cx.js'

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
}

export function Card({ padding = 'md', className, children, ...rest }) {
  return (
    <div
      className={cx('rounded-xl border border-navy-100 bg-white shadow-card', PADDING[padding] || PADDING.md, className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export function SectionCard({
  title,
  description,
  actions = null,
  padded = true,
  className,
  bodyClassName,
  children,
}) {
  const hasHeader = Boolean(title || description || actions)
  return (
    <Card padding="none" className={className}>
      {hasHeader && (
        <div className="flex flex-col gap-3 border-b border-navy-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-navy-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-navy-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cx(padded && 'p-5 sm:p-6', bodyClassName)}>{children}</div>
    </Card>
  )
}
