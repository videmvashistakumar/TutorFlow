import { useEffect, useMemo, useState } from 'react'
import { loadInvoices } from '../invoices/invoiceStorage.js'
import { loadBills } from '../bills/billStorage.js'
import { formatCurrency, formatDate, todayISO } from '../../lib/format.js'
import { loadCashSettings, saveCashSettings, DEFAULT_CASH_SETTINGS } from './cashSettingsStorage.js'
import { buildForecast } from './forecastUtils.js'
import ForecastChart from './ForecastChart.jsx'
import ScenarioPanel from './ScenarioPanel.jsx'
import { getStudentsWithUnpaidInvoices, buildLateScenario } from './scenarioUtils.js'
import { loadStudents } from '../students/studentStorage.js'
import {
  AlertTriangleIcon,
  Badge,
  Button,
  CheckCircleIcon,
  ClockIcon,
  EmptyState,
  InboxIcon,
  Input,
  Label,
  PageHeader,
  ReceiptIcon,
  SectionCard,
  StatCard,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
  TrendingUpIcon,
  WalletIcon,
} from '../../components/ui/index.js'

const HORIZONS = [30, 60, 90]

export default function CashForecastPage() {
  const [invoices] = useState(() => loadInvoices())
  const [bills] = useState(() => loadBills())
  const [settings, setSettings] = useState(() => loadCashSettings())
  const [horizon, setHorizon] = useState(30)
  const [students] = useState(() => loadStudents())
  const [scenarioStudentId, setScenarioStudentId] = useState(null)
  const [scenarioDelay, setScenarioDelay] = useState(15)

  const unpaidStudents = getStudentsWithUnpaidInvoices(invoices, students)
  const activeStudentId =
    scenarioStudentId && unpaidStudents.some((s) => s.id === scenarioStudentId)
      ? scenarioStudentId
      : unpaidStudents[0]
        ? unpaidStudents[0].id
        : ''
  const selectedScenarioStudent = students.find((s) => s.id === activeStudentId) || null

  useEffect(() => {
    saveCashSettings(settings)
  }, [settings])

  const today = todayISO()

  const forecast = useMemo(
    () =>
      buildForecast({
        invoices,
        bills,
        today,
        horizonDays: horizon,
        opening: settings.opening,
        buffer: settings.buffer,
        delayDays: settings.delayDays,
      }),
    [invoices, bills, today, horizon, settings.opening, settings.buffer, settings.delayDays],
  )

  const scenarioResult = useMemo(() => {
    if (!selectedScenarioStudent) return null
    return buildLateScenario({
      invoices,
      bills,
      today,
      horizonDays: horizon,
      opening: settings.opening,
      buffer: settings.buffer,
      delayDays: settings.delayDays,
      studentId: selectedScenarioStudent.id,
      studentName: selectedScenarioStudent.name,
      scenarioDelay,
    })
  }, [invoices, bills, today, horizon, settings, scenarioDelay, selectedScenarioStudent])

  const updateAmount = (field, raw) => {
    const value = Number(raw)
    setSettings((prev) => ({
      ...prev,
      [field]: Number.isNaN(value) ? DEFAULT_CASH_SETTINGS[field] : value,
    }))
  }

  const updateDelay = (raw) => {
    const value = Number(raw)
    setSettings((prev) => ({
      ...prev,
      delayDays: Number.isNaN(value)
        ? DEFAULT_CASH_SETTINGS.delayDays
        : Math.max(0, Math.round(value)),
    }))
  }

  const lowestBelowBuffer = forecast.lowestBalance < settings.buffer
  const endBelowBuffer = forecast.endBalance < settings.buffer
  const daysWithEvents = forecast.days.filter((d) => d.income > 0 || d.bills > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Forecast"
        description={`Projected cash for the next ${horizon} days, starting ${formatDate(today)}`}
        actions={
          <div
            role="group"
            aria-label="Forecast horizon"
            className="inline-flex gap-1 rounded-lg border border-navy-100 bg-navy-50 p-1"
          >
            {HORIZONS.map((days) => {
              const active = horizon === days
              return (
                <Button
                  key={days}
                  size="sm"
                  variant={active ? 'primary' : 'ghost'}
                  aria-pressed={active}
                  onClick={() => setHorizon(days)}
                  className={active ? '' : 'bg-transparent shadow-none'}
                >
                  {days} days
                </Button>
              )
            })}
          </div>
        }
      />

      <SectionCard
        title="Forecast settings"
        description="Adjust these to match your current cash position. Changes are saved automatically."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cash-opening">Opening cash balance</Label>
            <Input
              id="cash-opening"
              type="number"
              step="0.01"
              value={settings.opening}
              onChange={(e) => updateAmount('opening', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cash-buffer">Cash buffer (warn below this)</Label>
            <Input
              id="cash-buffer"
              type="number"
              step="0.01"
              value={settings.buffer}
              onChange={(e) => updateAmount('buffer', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cash-delay">Income arrives (days after due date)</Label>
            <Input
              id="cash-delay"
              type="number"
              min="0"
              step="1"
              value={settings.delayDays}
              onChange={(e) => updateDelay(e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {forecast.firstShortfall ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="min-w-0 space-y-1.5">
            <Badge tone="danger">Shortfall</Badge>
            <p className="text-sm text-red-700">
              First shortfall on {formatDate(forecast.firstShortfall.date)}: projected balance{' '}
              {formatCurrency(forecast.firstShortfall.balance)} is below your buffer of{' '}
              {formatCurrency(settings.buffer)}.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="min-w-0 space-y-1.5">
            <Badge tone="success">On track</Badge>
            <p className="text-sm text-emerald-700">No shortfall in this window.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Expected income"
          value={formatCurrency(forecast.expectedIncome)}
          tone="success"
          icon={<WalletIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Overdue income"
          value={formatCurrency(forecast.overdueIncome)}
          tone="warning"
          icon={<ClockIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Upcoming bills"
          value={formatCurrency(forecast.billsTotal)}
          tone="default"
          icon={<ReceiptIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Projected balance at end"
          value={formatCurrency(forecast.endBalance)}
          hint={endBelowBuffer ? 'Below your buffer' : 'Above your buffer'}
          tone={endBelowBuffer ? 'danger' : 'info'}
          icon={<TrendingUpIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Lowest projected balance"
          value={formatCurrency(forecast.lowestBalance)}
          hint={lowestBelowBuffer ? 'Below your buffer' : 'Above your buffer'}
          tone={lowestBelowBuffer ? 'danger' : 'info'}
          icon={<AlertTriangleIcon className="h-4 w-4" />}
        />
      </div>

      <ScenarioPanel
        students={students}
        invoices={invoices}
        selectedStudentId={activeStudentId}
        onStudentChange={setScenarioStudentId}
        scenarioDelay={scenarioDelay}
        onDelayChange={setScenarioDelay}
        result={scenarioResult}
      />

      <SectionCard
        title="Projected balance"
        description={`Daily projected balance over the next ${horizon} days.`}
      >
        <ForecastChart
          days={forecast.days}
          buffer={settings.buffer}
          scenarioDays={scenarioResult ? scenarioResult.scenario.days : null}
        />
      </SectionCard>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-navy-900">Daily balance</h2>
        {daysWithEvents.length === 0 ? (
          <EmptyState
            icon={<InboxIcon className="h-5 w-5" />}
            title="Nothing due in this window."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Income in</Th>
                  <Th>Bills out</Th>
                  <Th>End balance</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {daysWithEvents.map((d) => (
                  <Tr key={d.date} className={d.belowBuffer ? 'bg-red-50/60' : ''}>
                    <Td className="text-navy-900">{formatDate(d.date)}</Td>
                    <Td className="font-medium text-emerald-700">
                      {d.income > 0 ? `+${formatCurrency(d.income)}` : '—'}
                    </Td>
                    <Td className="font-medium text-red-600">
                      {d.bills > 0 ? `-${formatCurrency(d.bills)}` : '—'}
                    </Td>
                    <Td className={d.belowBuffer ? 'font-semibold text-red-600' : 'text-navy-900'}>
                      {formatCurrency(d.balance)}
                    </Td>
                    <Td>
                      {d.belowBuffer ? (
                        <Badge tone="danger">Shortfall</Badge>
                      ) : (
                        <Badge tone="success">OK</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-navy-900">Upcoming events</h2>
        {forecast.events.length === 0 ? (
          <EmptyState
            icon={<InboxIcon className="h-5 w-5" />}
            title="Nothing due in this window."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Item</Th>
                  <Th>Amount</Th>
                </tr>
              </thead>
              <tbody>
                {forecast.events.map((ev, i) => {
                  const isBill = ev.kind === 'bill'
                  const typeLabel =
                    ev.kind === 'bill' ? 'Bill' : ev.kind === 'overdue' ? 'Overdue income' : 'Income'
                  return (
                    <Tr key={`${ev.kind}-${ev.date}-${i}`}>
                      <Td className="text-navy-900">{formatDate(ev.date)}</Td>
                      <Td>
                        <Badge tone={isBill ? 'danger' : ev.kind === 'overdue' ? 'warning' : 'success'}>
                          {typeLabel}
                        </Badge>
                      </Td>
                      <Td className="text-navy-900">{ev.label}</Td>
                      <Td className={`font-medium ${isBill ? 'text-red-600' : 'text-emerald-700'}`}>
                        {isBill ? '-' : '+'}
                        {formatCurrency(ev.amount)}
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </section>
    </div>
  )
}
