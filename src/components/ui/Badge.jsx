// Badge. Props: tone ('neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent', default 'neutral'),
// className, children, plus native span props. Pure presentation; holds no domain logic.
import { cx } from './cx.js'

const TONES = {
  neutral: 'bg-navy-100 text-navy-700',
  info: 'bg-sky-50 text-sky-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  accent: 'bg-emerald-600 text-white',
}

export function Badge({ tone = 'neutral', className, children, ...rest }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone] || TONES.neutral,
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
