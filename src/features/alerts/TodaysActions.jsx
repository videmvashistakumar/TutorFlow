// Today's actions list for the dashboard: the most urgent alerts, each with a button to its page.
import useAlerts from './useAlerts.js'
import { getTodaysActions } from './alertUtils.js'
import {
  Badge,
  Button,
  EmptyState,
  SectionCard,
  AlertTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
} from '../../components/ui/index.js'

const SEVERITY_STYLES = {
  danger: { label: 'Urgent', tone: 'danger', icon: AlertTriangleIcon, chip: 'bg-red-50 text-red-600' },
  warning: { label: 'Due soon', tone: 'warning', icon: ClockIcon, chip: 'bg-amber-50 text-amber-700' },
  info: { label: 'Info', tone: 'info', icon: ClockIcon, chip: 'bg-sky-50 text-sky-700' },
}

export default function TodaysActions({ onNavigate }) {
  const actions = getTodaysActions(useAlerts())

  return (
    <SectionCard title="Today's actions" description="Most urgent items first." padded={false}>
      {actions.length === 0 ? (
        <div className="p-5 sm:p-6">
          <EmptyState
            icon={<CheckCircleIcon className="h-6 w-6" />}
            title="All clear for today"
            description="Nothing needs your attention today."
          />
        </div>
      ) : (
        <ul className="divide-y divide-navy-100">
          {actions.map((item) => {
            const style = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.info
            const Icon = style.icon
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.chip}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words text-sm font-medium text-navy-900">{item.title}</p>
                      <Badge tone={style.tone}>{style.label}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-navy-500">{item.detail}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate(item.page)}
                  className="w-full sm:w-auto"
                >
                  {item.actionLabel}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
