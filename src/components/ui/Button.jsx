// Button. Props: variant ('primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'success'),
// size ('sm' | 'md'), type (default 'button'), icon (node, optional), disabled, className, children,
// plus any other native button props (passed through). Icon-only buttons must pass aria-label.
import { cx } from './cx.js'

const VARIANTS = {
  primary: 'bg-navy-800 text-white shadow-sm hover:bg-navy-700 active:bg-navy-900',
  secondary: 'border border-navy-100 bg-white text-navy-800 shadow-sm hover:bg-navy-50',
  accent: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800',
  ghost: 'text-navy-700 hover:bg-navy-50 hover:text-navy-900',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
  success: 'border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
}

const SIZES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  icon = null,
  disabled = false,
  className,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
