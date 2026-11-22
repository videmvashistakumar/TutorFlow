// Table primitives. Compose as: <TableWrap><Table><thead><tr><Th>..</Th></tr></thead><tbody><Tr><Td>..</Td></Tr></tbody></Table></TableWrap>
// TableWrap props: className, children. Horizontal scroll container with rounded border and shadow.
// Table props: className, children. min-w-full, small text. Pass thead/tbody as plain elements.
// Th props: className, children, plus native th props (scope defaults to 'col').
// Td props: className, children, plus native td props.
// Tr props: className, children, plus native tr props. Adds hover tint and row dividers (for tbody rows).
import { cx } from './cx.js'

export function TableWrap({ className, children }) {
  return (
    <div className={cx('w-full overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card', className)}>
      {children}
    </div>
  )
}

export function Table({ className, children }) {
  return <table className={cx('min-w-full text-left text-sm', className)}>{children}</table>
}

export function Th({ className, scope = 'col', children, ...rest }) {
  return (
    <th
      scope={scope}
      className={cx(
        'whitespace-nowrap bg-navy-50/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-navy-500',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  )
}

export function Td({ className, children, ...rest }) {
  return (
    <td className={cx('px-4 py-3 align-middle text-navy-800', className)} {...rest}>
      {children}
    </td>
  )
}

export function Tr({ className, children, ...rest }) {
  return (
    <tr
      className={cx('border-t border-navy-100 transition-colors duration-150 first:border-t-0 hover:bg-navy-50/50', className)}
      {...rest}
    >
      {children}
    </tr>
  )
}
