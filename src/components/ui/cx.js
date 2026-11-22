// Tiny class-name joiner used by the shared UI components. Falsy values are dropped.
export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}
