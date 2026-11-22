// StatCard. Props: label, value (string or number), hint (optional small text), icon (node, optional),
// tone ('default' | 'success' | 'warning' | 'danger' | 'info', default 'default' tints the icon chip only),
// className. The value uses text-2xl font-semibold tabular-nums.
import { cx } from './cx.js'

const CHIP_TONES = {
  default: 'bg-navy-50 text-navy-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-700',
}

export function StatCard({ label, value, hint, icon = null, tone = 'default', className }) {
  return (
    <div
      className={cx(
        'flex min-w-0 flex-col rounded-xl border border-navy-100 bg-white p-5 shadow-card transition-shadow duration-150 hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-navy-500">{label}</p>
        {icon && (
          <span
            className={cx(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              CHIP_TONES[tone] || CHIP_TONES.default,
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-navy-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-navy-500">{hint}</p>}
    </div>
  )
}
