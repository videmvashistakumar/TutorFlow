// Form controls: Label, Input, Select, Textarea, FormField.
// Input / Select / Textarea props: invalid (boolean, red border), className, plus native props (forwarded ref).
//   Select renders a native <select> with a chevron; pass <option> children.
// Label props: htmlFor, required (adds an asterisk), className, children.
// FormField props: label, htmlFor (should match the control's id), hint, error, required, className, children (the control).
//   When error is set it replaces the hint and is announced via role="alert".
import { forwardRef } from 'react'
import { cx } from './cx.js'
import { ChevronDownIcon } from './icons.jsx'

const CONTROL_BASE =
  'w-full rounded-lg border bg-white text-sm text-navy-900 shadow-sm placeholder:text-navy-400 ' +
  'transition-colors duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-navy-50 disabled:text-navy-500'

function controlTone(invalid) {
  return invalid
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
    : 'border-navy-200 focus:border-emerald-500 focus:ring-emerald-500/30'
}

export function Label({ htmlFor, required = false, className, children }) {
  return (
    <label htmlFor={htmlFor} className={cx('block text-sm font-medium text-navy-800', className)}>
      {children}
      {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
    </label>
  )
}

export const Input = forwardRef(function Input({ invalid = false, className, type = 'text', ...rest }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cx(CONTROL_BASE, 'h-10 px-3', controlTone(invalid), className)}
      {...rest}
    />
  )
})

export const Select = forwardRef(function Select({ invalid = false, className, children, ...rest }, ref) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(CONTROL_BASE, 'h-10 appearance-none py-0 pl-3 pr-9', controlTone(invalid), className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-500" />
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ invalid = false, className, rows = 3, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cx(CONTROL_BASE, 'min-h-[88px] px-3 py-2', controlTone(invalid), className)}
      {...rest}
    />
  )
})

export function FormField({ label, htmlFor, hint, error, required = false, className, children }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-navy-500">{hint}</p>
      )}
    </div>
  )
}
