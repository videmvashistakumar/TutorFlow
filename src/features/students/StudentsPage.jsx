// Students page: header with count and add action, summary stats, search, student table,
// empty states, and add-student / log-session dialogs.
import { useState, useEffect } from 'react'
import { loadStudents, saveStudents } from './studentStorage.js'
import {
  getOutstanding,
  matchesSearch,
  createId,
  getChargeForSession,
} from './studentUtils.js'
import { formatCurrency } from '../../lib/format.js'
import {
  PageHeader,
  Button,
  Input,
  StatCard,
  EmptyState,
  Modal,
  PlusIcon,
  SearchIcon,
  UsersIcon,
  WalletIcon,
  ReceiptIcon,
} from '../../components/ui/index.js'
import StudentTable from './StudentTable.jsx'
import AddStudentForm from './AddStudentForm.jsx'
import LogSessionDialog from './LogSessionDialog.jsx'

export default function StudentsPage() {
  const [students, setStudents] = useState(() => loadStudents())
  const [query, setQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [sessionStudentId, setSessionStudentId] = useState(null)

  useEffect(() => {
    saveStudents(students)
  }, [students])

  const filtered = students.filter((s) => matchesSearch(s, query))
  const sessionStudent = students.find((s) => s.id === sessionStudentId) || null

  const activeCount = students.filter((s) => s.status === 'active').length
  const totalOutstanding = students.reduce((sum, s) => sum + getOutstanding(s), 0)
  const monthlyCount = students.filter((s) => s.feeType === 'monthly').length

  const handleAddStudent = (fields) => {
    setStudents((prev) => [...prev, { id: createId('stu'), ...fields, sessions: [] }])
    setIsAddOpen(false)
  }

  const handleLogSession = (date) => {
    if (!sessionStudent) return
    const fee = getChargeForSession(sessionStudent)
    setStudents((prev) =>
      prev.map((s) =>
        s.id === sessionStudent.id
          ? { ...s, sessions: [...(s.sessions || []), { id: createId('ses'), date, fee, paid: false }] }
          : s
      )
    )
    setSessionStudentId(null)
  }

  const handleTogglePaid = (studentId, sessionId) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              sessions: s.sessions.map((ss) => (ss.id === sessionId ? { ...ss, paid: !ss.paid } : ss)),
            }
          : s
      )
    )
  }

  const hasStudents = students.length > 0
  const hasMatches = filtered.length > 0
  const countLabel = `${students.length} ${students.length === 1 ? 'student' : 'students'}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={`${countLabel} · ${activeCount} active`}
        actions={
          <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setIsAddOpen(true)}>
            Add student
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active students"
          value={activeCount}
          tone="success"
          icon={<UsersIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Total outstanding"
          value={formatCurrency(totalOutstanding)}
          hint={totalOutstanding > 0 ? 'Unpaid session fees' : 'All fees settled'}
          tone={totalOutstanding > 0 ? 'danger' : 'success'}
          icon={<WalletIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Monthly students"
          value={monthlyCount}
          tone="info"
          icon={<ReceiptIcon className="h-4 w-4" />}
        />
      </div>

      <div className="relative w-full sm:max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        <Input
          type="search"
          aria-label="Search students"
          placeholder="Search by name, parent, subject or WhatsApp"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {!hasStudents ? (
        <EmptyState
          icon={<UsersIcon className="h-6 w-6" />}
          title="No students yet"
          description="Add your first student to start logging sessions and tracking fees."
          action={
            <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setIsAddOpen(true)}>
              Add student
            </Button>
          }
        />
      ) : !hasMatches ? (
        <EmptyState
          icon={<SearchIcon className="h-6 w-6" />}
          title="No students match your search"
          description="Try a different name, parent, subject or WhatsApp number."
          action={
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <StudentTable
          students={filtered}
          onLogSession={(s) => setSessionStudentId(s.id)}
          onToggleSessionPaid={handleTogglePaid}
        />
      )}

      <Modal title="Add student" isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <AddStudentForm onSave={handleAddStudent} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <Modal
        title="Log session"
        isOpen={!!sessionStudent}
        onClose={() => setSessionStudentId(null)}
      >
        {sessionStudent && (
          <LogSessionDialog
            student={sessionStudent}
            onLog={handleLogSession}
            onCancel={() => setSessionStudentId(null)}
          />
        )}
      </Modal>
    </div>
  )
}
