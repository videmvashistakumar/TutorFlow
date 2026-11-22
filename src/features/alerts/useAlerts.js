// Live alerts hook: recomputes the alert list from stored data on mount, on data changes, cross-tab storage edits and window focus.
import { useEffect, useState } from 'react'
import { loadInvoices, STORAGE_KEY as INVOICES_KEY } from '../invoices/invoiceStorage.js'
import { loadBills, STORAGE_KEY as BILLS_KEY } from '../bills/billStorage.js'
import { loadStudents, STORAGE_KEY as STUDENTS_KEY } from '../students/studentStorage.js'
import { CASH_SETTINGS_KEY } from '../cashForecast/cashSettingsStorage.js'
import { todayISO } from '../../lib/format.js'
import { buildAlerts } from './alertUtils.js'

export const DATA_CHANGED_EVENT = 'tutorflow:data-changed'

const WATCHED_KEYS = [INVOICES_KEY, BILLS_KEY, STUDENTS_KEY, CASH_SETTINGS_KEY]

function computeAlerts() {
  return buildAlerts({
    invoices: loadInvoices(),
    bills: loadBills(),
    students: loadStudents(),
    today: todayISO(),
  })
}

export default function useAlerts() {
  const [alerts, setAlerts] = useState(() => computeAlerts())

  useEffect(() => {
    const refresh = () => setAlerts(computeAlerts())
    const handleStorage = (event) => {
      if (event.key === null || WATCHED_KEYS.includes(event.key)) refresh()
    }

    window.addEventListener(DATA_CHANGED_EVENT, refresh)
    window.addEventListener('storage', handleStorage)
    window.addEventListener('focus', refresh)
    refresh()

    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return alerts
}
