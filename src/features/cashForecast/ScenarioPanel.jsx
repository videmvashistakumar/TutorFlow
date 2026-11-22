// What-if panel: student and delay controls, baseline versus delayed comparison, plain-English explanation and a reminder action.
import { formatRupees, getUnpaidInvoicesForStudent, getStudentsWithUnpaidInvoices } from './scenarioUtils.js'
import { buildReminderMessage, buildWhatsAppLink, hasWhatsAppNumber, getDaysOverdue, suggestedTone } from '../followups/followupUtils.js'
import { getRemaining } from '../invoices/invoiceUtils.js'
import { formatDate } from '../../lib/format.js'
import {
  AlertTriangleIcon,
  Badge,
  Input,
  Label,
  SectionCard,
  Select,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
} from '../../components/ui/index.js'

// Renders a signed rupee change, e.g. +₹500, −₹500 or ₹0, with colour matching the direction.
function renderDelta(delta) {
  const sign = delta > 0 ? '+' : delta < 0 ? '\u2212' : ''
  const colour = delta < 0 ? 'text-red-600' : delta > 0 ? 'text-emerald-700' : 'text-navy-900'
  return (
    <span className={`ml-2 text-xs font-medium ${colour}`}>
      {sign}
      {formatRupees(Math.abs(delta))}
    </span>
  )
}

export default function ScenarioPanel({ students, invoices, selectedStudentId, onStudentChange, scenarioDelay, onDelayChange, result }) {
  const withUnpaid = getStudentsWithUnpaidInvoices(invoices, students)
  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null

  if (withUnpaid.length === 0) {
    return (
      <SectionCard
        title="What if? A student pays late"
        description="No student has an unpaid invoice, so there is no late-payment scenario to run."
      />
    )
  }

  const shortfallChanged =
    Boolean(result) &&
    Boolean(result.scenarioShortfall) &&
    (!result.baselineShortfall || result.baselineShortfall.date !== result.scenarioShortfall.date)

  let action = null
  if (selectedStudent && hasWhatsAppNumber(selectedStudent)) {
    const unpaid = getUnpaidInvoicesForStudent(invoices, selectedStudent.id)
    const inv = unpaid[0]
    if (inv) {
      const daysOverdue = getDaysOverdue(inv)
      const message = buildReminderMessage({
        tone: suggestedTone(daysOverdue),
        parentName: selectedStudent.parentName,
        studentName: selectedStudent.name,
        invoiceNumber: inv.number,
        periodLabel: inv.periodLabel,
        amount: getRemaining(inv),
        dueDate: inv.dueDate,
        daysOverdue,
        paymentDetails: '',
      })
      action = (
        <div className="space-y-2">
          <a
            href={buildWhatsAppLink(selectedStudent.parentWhatsApp, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Open payment reminder in WhatsApp
          </a>
          <p className="text-xs text-navy-500">Opening WhatsApp does not record a reminder in the invoice history.</p>
        </div>
      )
    }
  } else if (selectedStudent) {
    action = <p className="text-sm text-navy-500">Add a WhatsApp number in Students to send a reminder.</p>
  }

  return (
    <SectionCard
      title="What if? A student pays late"
      description="See how a late payment changes your projected cash."
      actions={
        shortfallChanged ? (
          <Badge tone="danger">
            <AlertTriangleIcon className="h-3.5 w-3.5" />
            Shortfall moves earlier
          </Badge>
        ) : null
      }
      bodyClassName="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="scenario-student">Student</Label>
          <Select
            id="scenario-student"
            value={selectedStudentId}
            onChange={(e) => onStudentChange(e.target.value)}
          >
            <option value="">Select a student</option>
            {withUnpaid.map((s) => (
              <option key={s.id} value={s.id}>
                {`${s.name} (${getUnpaidInvoicesForStudent(invoices, s.id).length} unpaid invoice(s))`}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="scenario-delay">{`Delay: ${scenarioDelay} days`}</Label>
          <Input
            id="scenario-delay"
            type="range"
            min={0}
            max={30}
            step={1}
            value={scenarioDelay}
            onChange={(e) => onDelayChange(Number(e.target.value))}
            aria-label="Delay in days"
            className="h-6 cursor-pointer border-0 bg-transparent px-0 shadow-none accent-emerald-600 focus:ring-0"
          />
          <div className="flex justify-between text-xs text-navy-500">
            <span>0</span>
            <span>30</span>
          </div>
        </div>
      </div>

      {!result ? (
        <p className="text-sm text-navy-500">Choose a student to run the scenario.</p>
      ) : (
        <>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Measure</Th>
                  <Th>Baseline</Th>
                  <Th>With delay</Th>
                </tr>
              </thead>
              <tbody>
                <Tr>
                  <Td className="text-navy-900">Lowest projected balance</Td>
                  <Td className="text-navy-900">{formatRupees(result.baseline.lowestBalance)}</Td>
                  <Td
                    className={
                      result.lowestDelta < 0 ? 'text-red-600' : result.lowestDelta > 0 ? 'text-emerald-700' : 'text-navy-900'
                    }
                  >
                    {formatRupees(result.scenario.lowestBalance)}
                    {renderDelta(result.lowestDelta)}
                  </Td>
                </Tr>
                <Tr>
                  <Td className="text-navy-900">End of window balance</Td>
                  <Td className="text-navy-900">{formatRupees(result.baseline.endBalance)}</Td>
                  <Td
                    className={
                      result.endDelta < 0 ? 'text-red-600' : result.endDelta > 0 ? 'text-emerald-700' : 'text-navy-900'
                    }
                  >
                    {formatRupees(result.scenario.endBalance)}
                    {renderDelta(result.endDelta)}
                  </Td>
                </Tr>
                <Tr>
                  <Td className="text-navy-900">First cash shortfall</Td>
                  <Td className="text-navy-900">
                    {result.baselineShortfall ? formatDate(result.baselineShortfall.date) : 'None'}
                  </Td>
                  <Td className={shortfallChanged ? 'font-semibold text-red-700' : 'text-navy-900'}>
                    {result.scenarioShortfall ? formatDate(result.scenarioShortfall.date) : 'None'}
                  </Td>
                </Tr>
              </tbody>
            </Table>
          </TableWrap>

          <div className="rounded-lg border border-navy-100 bg-navy-50/60 p-4">
            <p className="text-sm font-medium text-navy-900">{result.explanation}</p>
          </div>

          {action}
        </>
      )}

      <p className="text-xs text-navy-500">This is a what-if only. Your saved invoices and payments are not changed.</p>
    </SectionCard>
  )
}
