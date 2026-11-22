// Bad Day Mode: shown on the dashboard when 3 or more invoices are overdue. Lists overdue invoices by priority,
// drafts a WhatsApp reminder for each and walks through them one by one. Never sends messages automatically.
import { useEffect, useState } from 'react'
import { loadInvoices } from '../invoices/invoiceStorage.js'
import { loadStudents } from '../students/studentStorage.js'
import { loadBills } from '../bills/billStorage.js'
import { loadCashSettings } from '../cashForecast/cashSettingsStorage.js'
import { formatCurrency, todayISO } from '../../lib/format.js'
import { BAD_DAY_THRESHOLD, buildRecoveryImpact, buildRecoveryQueue, getOverdueInvoices } from './badDayUtils.js'
import { Badge, Button, AlertTriangleIcon, ChevronRightIcon } from '../../components/ui/index.js'

function loadBadDayData() {
  return {
    today: todayISO(),
    invoices: loadInvoices(),
    students: loadStudents(),
    bills: loadBills(),
    settings: loadCashSettings(),
  }
}

function formatScore(n) {
  return Math.round(n).toLocaleString('en-IN')
}

const LINK_PRIMARY =
  'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 w-full sm:w-auto'

export default function BadDayMode() {
  const [data, setData] = useState(loadBadDayData)
  const [reviewing, setReviewing] = useState(false)
  const [index, setIndex] = useState(0)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    const refresh = () => setData(loadBadDayData())
    window.addEventListener('tutorflow:data-changed', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('tutorflow:data-changed', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const overdueCount = getOverdueInvoices(data.invoices, data.today).length
  if (overdueCount < BAD_DAY_THRESHOLD) return null

  const queue = buildRecoveryQueue({ invoices: data.invoices, students: data.students, today: data.today })
  const recoverable = queue.reduce((sum, item) => sum + item.remaining, 0)
  const impact = buildRecoveryImpact({
    invoices: data.invoices,
    bills: data.bills,
    today: data.today,
    opening: data.settings.opening,
    buffer: data.settings.buffer,
    delayDays: data.settings.delayDays,
  })
  const position = Math.min(index, queue.length - 1)
  const current = queue[position]

  async function copyMessage(item) {
    try {
      await navigator.clipboard.writeText(item.message)
      setCopiedId(item.invoice.id)
    } catch {
      setCopiedId(null)
    }
  }

  return (
    <section
      aria-labelledby="bad-day-heading"
      className="overflow-hidden rounded-xl border-2 border-red-300 bg-white shadow-card"
    >
      <div className="flex flex-col gap-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
            <AlertTriangleIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="bad-day-heading" className="text-base font-semibold text-navy-900">Bad Day Mode</h2>
              <Badge tone="danger">{overdueCount} overdue</Badge>
            </div>
            <p className="mt-1 text-sm text-navy-700">
              {overdueCount} invoices are overdue. Potentially recoverable:{' '}
              <span className="font-semibold text-navy-900 tabular-nums">{formatCurrency(recoverable)}</span>
            </p>
          </div>
        </div>
        <Button
          variant={reviewing ? 'secondary' : 'danger'}
          icon={<ChevronRightIcon className="h-4 w-4" />}
          onClick={() => {
            setReviewing((v) => !v)
            setIndex(0)
            setCopiedId(null)
          }}
          className="w-full sm:w-auto"
        >
          {reviewing ? 'Close review' : 'Start one-by-one review'}
        </Button>
      </div>

      <div className="space-y-6 px-5 py-5 sm:px-6">
        <div>
          <h3 className="text-sm font-semibold text-navy-900">Overdue invoices by priority</h3>
          <p className="mt-0.5 text-xs text-navy-500">Priority = outstanding amount × days overdue.</p>
          <ol className="mt-3 divide-y divide-navy-100 overflow-hidden rounded-lg border border-navy-100">
            {queue.map((item, i) => (
              <li
                key={item.invoice.id}
                className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0 break-words font-medium text-navy-900">
                  {i + 1}. {item.studentName} <span className="font-normal text-navy-500">({item.invoice.number})</span>
                </span>
                <span className="flex flex-wrap items-center gap-2 text-navy-700">
                  <Badge tone="danger">{item.daysOverdue} days overdue</Badge>
                  <span className="font-semibold tabular-nums text-navy-900">{formatCurrency(item.remaining)}</span>
                  <span className="text-xs text-navy-500">score {formatScore(item.priority)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {reviewing && current && (
          <div className="space-y-3 rounded-lg border border-navy-100 bg-navy-50/40 p-4">
            <p className="text-sm text-navy-700">
              Reminder {position + 1} of {queue.length}: {current.studentName}, {current.invoice.number}
            </p>
            <pre className="whitespace-pre-wrap break-words rounded-md border border-navy-100 bg-white p-3 font-sans text-sm text-navy-900">
              {current.message}
            </pre>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button variant="secondary" onClick={() => copyMessage(current)} className="w-full sm:w-auto">
                {copiedId === current.invoice.id ? 'Copied' : 'Copy message'}
              </Button>
              {current.whatsappLink ? (
                <a href={current.whatsappLink} target="_blank" rel="noopener noreferrer" className={LINK_PRIMARY}>
                  Open in WhatsApp
                </a>
              ) : (
                <p className="text-sm text-navy-600">Add a WhatsApp number for this student in Students to open WhatsApp.</p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={position === 0}
                onClick={() => setIndex(position - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={position >= queue.length - 1}
                onClick={() => setIndex(position + 1)}
              >
                Next
              </Button>
            </div>
            <p className="text-xs text-navy-500">
              Nothing is sent automatically. Opening WhatsApp does not record a reminder in the invoice history.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-navy-100 p-4">
          <h3 className="text-sm font-semibold text-navy-900">Potential cash impact (not guaranteed income)</h3>
          <p className="mt-1 text-xs text-navy-500">
            From the 30-day cash forecast. Assumes the overdue invoices are collected as the forecast counts them.
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-navy-50/60 p-3">
              <dt className="text-xs font-medium text-navy-500">Lowest balance without recovery</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-navy-900">{formatCurrency(impact.withoutRecovery.lowestBalance)}</dd>
            </div>
            <div className="rounded-lg bg-emerald-50/60 p-3">
              <dt className="text-xs font-medium text-navy-500">Lowest balance with potential recovery</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-emerald-700">{formatCurrency(impact.withRecovery.lowestBalance)}</dd>
            </div>
            <div className="rounded-lg bg-navy-50/60 p-3">
              <dt className="text-xs font-medium text-navy-500">End of 30 days without recovery</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-navy-900">{formatCurrency(impact.withoutRecovery.endBalance)}</dd>
            </div>
            <div className="rounded-lg bg-emerald-50/60 p-3">
              <dt className="text-xs font-medium text-navy-500">End of 30 days with potential recovery</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-emerald-700">{formatCurrency(impact.withRecovery.endBalance)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
