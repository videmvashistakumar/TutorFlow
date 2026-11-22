// Form for adding a new student, grouped into labelled sections with inline validation errors.
import { useState } from 'react'
import { FEE_TYPE_OPTIONS, STATUS_OPTIONS } from './studentUtils.js'
import { Button, FormField, Input, Select } from '../../components/ui/index.js'
import { getCurrencySymbol } from '../../lib/format.js'

function FormSection({ title, children }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-500">{title}</h3>
      {children}
    </section>
  )
}

export default function AddStudentForm({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentWhatsApp, setParentWhatsApp] = useState('')
  const [subject, setSubject] = useState('')
  const [feeType, setFeeType] = useState('monthly')
  const [feeAmount, setFeeAmount] = useState('')
  const [status, setStatus] = useState('active')
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = {}

    if (!name.trim()) next.name = 'Student name is required.'
    if (!parentName.trim()) next.parentName = 'Parent name is required.'
    if ((parentWhatsApp.match(/\d/g) || []).length < 7) {
      next.parentWhatsApp = 'Enter a valid WhatsApp number (at least 7 digits).'
    }
    if (!subject.trim()) next.subject = 'Subject is required.'
    const amount = Number(feeAmount)
    if (!feeAmount || !Number.isFinite(amount) || amount <= 0) {
      next.feeAmount = 'Enter a fee amount greater than 0.'
    }

    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    setErrors({})
    onSave({
      name: name.trim(),
      parentName: parentName.trim(),
      parentWhatsApp: parentWhatsApp.trim(),
      subject: subject.trim(),
      feeType,
      feeAmount: amount,
      status,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormSection title="Student">
        <FormField label="Student name" htmlFor="student-name" required error={errors.name}>
          <Input
            id="student-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={!!errors.name}
          />
        </FormField>
        <FormField label="Subject" htmlFor="subject" required error={errors.subject}>
          <Input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            invalid={!!errors.subject}
          />
        </FormField>
      </FormSection>

      <FormSection title="Parent contact">
        <FormField label="Parent name" htmlFor="parent-name" required error={errors.parentName}>
          <Input
            id="parent-name"
            type="text"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            invalid={!!errors.parentName}
          />
        </FormField>
        <FormField
          label="Parent WhatsApp number"
          htmlFor="parent-whatsapp"
          required
          hint="Include the country code, e.g. +44 7700 900000."
          error={errors.parentWhatsApp}
        >
          <Input
            id="parent-whatsapp"
            type="tel"
            value={parentWhatsApp}
            onChange={(e) => setParentWhatsApp(e.target.value)}
            placeholder="+44 7700 900000"
            invalid={!!errors.parentWhatsApp}
          />
        </FormField>
      </FormSection>

      <FormSection title="Fees and status">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Fee type" htmlFor="fee-type">
            <Select id="fee-type" value={feeType} onChange={(e) => setFeeType(e.target.value)}>
              {FEE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </FormField>
          <FormField label={`Fee amount (${getCurrencySymbol()})`} htmlFor="fee-amount" required error={errors.feeAmount}>
            <Input
              id="fee-amount"
              type="number"
              step="0.01"
              min="0"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              invalid={!!errors.feeAmount}
            />
          </FormField>
        </div>
        <FormField label="Status" htmlFor="student-status">
          <Select id="student-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </FormField>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 border-t border-navy-100 pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save student</Button>
      </div>
    </form>
  )
}
