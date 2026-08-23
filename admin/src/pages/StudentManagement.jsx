import { useState, useEffect } from 'react'
import { getAllStudents, toggleStudentStatus } from '@/firebase/complaints'
import { createStudentAccount } from '@/firebase/auth'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import { DEPARTMENTS } from '@/utils/constants'
import { useStudentStats } from '@/hooks/useStudentStats'
import toast from 'react-hot-toast'

const PHONE_RE = /^[6-9]\d{9}$/
const REGNO_RE = /^[0-9]{2}[A-Z]{2}[0-9]{3}$/i

// ── Student stats panel (shown inside a Modal) ────────────────────────────────
function StudentStatsModal({ student, onClose }) {
  const { stats, loading } = useStudentStats(student?.studentId)

  const stat = (label, value, color) => (
    <div className="text-center p-3 rounded-xl bg-tce-cream dark:bg-gray-800">
      <div className={`font-display text-2xl font-bold ${color}`}>{loading ? '…' : value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  )

  return (
    <Modal open={!!student} onClose={onClose} title="Student Details">
      {student && (
        <div className="space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            {student.photoURL ? (
              <img src={student.photoURL} alt={student.name}
                className="w-14 h-14 rounded-full object-cover border border-tce-green/30 shrink-0" />
            ) : (
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 ${student.active ? 'bg-tce-dark dark:bg-tce-green' : 'bg-gray-400'}`}>
                {student.name?.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-tce-dark dark:text-white truncate">{student.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email}</div>
              <div className="text-xs text-tce-green mt-0.5">
                {student.dept} · Year {student.year}
                {student.regNo ? ` · ${student.regNo}` : ''}
              </div>
            </div>
          </div>

          {/* Complaint statistics */}
          <div>
            <h3 className="font-display text-sm font-bold text-tce-dark dark:text-white mb-3">
              Complaint Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stat('Total',       stats?.total,      'text-tce-dark dark:text-white')}
              {stat('Resolved',    stats?.resolved,   'text-emerald-600 dark:text-emerald-400')}
              {stat('In Progress', stats?.inProgress, 'text-amber-600 dark:text-amber-400')}
              {stat('Pending',     stats?.pending,    'text-blue-600 dark:text-blue-400')}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
              <span>Latest complaint:</span>
              <span className="font-medium text-tce-dark dark:text-white">
                {loading ? '…' : (stats?.latestDate || '—')}
              </span>
            </div>
          </div>

          {/* Profile fields */}
          <div className="divide-y divide-tce-dark/[0.06] dark:divide-gray-700/50">
            {[
              ['Student ID', student.studentId],
              ['Phone',      student.phone  || '—'],
              ['Reg. No.',   student.regNo  || '—'],
              ['Status',     student.active ? 'Active' : 'Inactive'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">{k}</span>
                <span className="font-medium text-tce-dark dark:text-white">{v}</span>
              </div>
            ))}
          </div>

          <button className="btn-ghost w-full" onClick={onClose}>Close</button>
        </div>
      )}
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentManagement() {
  const [students,       setStudents]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [showAdd,        setShowAdd]        = useState(false)
  const [confirmToggle,  setConfirmToggle]  = useState(null)
  const [selectedStudent,setSelectedStudent]= useState(null)
  const [search,         setSearch]         = useState('')
  const [form, setForm] = useState({
    name: '', studentId: '', dept: 'CSE', year: 1,
    password: 'TCE@123', phone: '', regNo: '',
  })
  const [saving,  setSaving]  = useState(false)
  const [formErr, setFormErr] = useState({})

  const load = async () => {
    setLoading(true)
    const data = await getAllStudents()
    setStudents(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const setF = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setFormErr((e) => ({ ...e, [k]: '' }))
  }

  const validateForm = () => {
    const e = {}
    if (!form.name.trim())      e.name      = 'Name is required'
    if (!form.studentId.trim()) e.studentId = 'Student ID is required'
    else if (!/^\d{2}[a-z]{2}\d{3}$/i.test(form.studentId)) e.studentId = 'Format: 23cs001'
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters'
    if (form.phone && !PHONE_RE.test(form.phone)) e.phone = '10-digit Indian mobile'
    if (form.regNo && !REGNO_RE.test(form.regNo)) e.regNo = 'Format: 23CS001'
    setFormErr(e)
    return Object.keys(e).length === 0
  }

  const handleAdd = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      await createStudentAccount(form)
      toast.success(`Account created for ${form.name}`)
      setShowAdd(false)
      setForm({ name: '', studentId: '', dept: 'CSE', year: 1, password: 'TCE@123', phone: '', regNo: '' })
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (student) => {
    try {
      await toggleStudentStatus(student.id, !student.active)
      toast.success(`Account ${student.active ? 'deactivated' : 'activated'}`)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return !q || s.name?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q) || s.dept?.toLowerCase().includes(q)
  })

  if (loading) return <Spinner />

  return (
    <div className="space-y-4 md:space-y-5 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">
            Student Management
          </h1>
          <p className="text-tce-muted dark:text-gray-400 text-sm mt-0.5">
            {students.length} registered students
          </p>
        </div>
        <button className="btn-primary text-sm px-4 py-2" onClick={() => setShowAdd(true)}>
          + Add Student
        </button>
      </div>

      <div className="card p-3 md:p-5">
        <input className="form-input max-w-sm"
          placeholder="Search by name, ID or department…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div key={s.id} className="card flex items-center gap-3 md:gap-4 cursor-pointer hover:border-tce-green dark:hover:border-tce-green transition-colors"
            onClick={() => setSelectedStudent(s)}>
            {s.photoURL ? (
              <img src={s.photoURL} alt={s.name}
                className="w-11 h-11 rounded-full object-cover border border-tce-green/30 shrink-0" />
            ) : (
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 ${s.active ? 'bg-tce-dark dark:bg-tce-green' : 'bg-gray-400 dark:bg-gray-600'}`}>
                {s.name?.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-tce-dark dark:text-white text-sm truncate">{s.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.email}</div>
              <div className="text-xs text-tce-green dark:text-tce-green/70">
                {s.dept} · Year {s.year}
                {s.regNo ? ` · ${s.regNo}` : ''}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              <span className={`tag ${s.active ? 'tag-resolved' : 'tag-rejected'}`}>
                {s.active ? 'Active' : 'Inactive'}
              </span>
              <button
                className="text-[11px] px-2.5 py-1 rounded-lg border border-tce-dark/20 dark:border-gray-600 bg-transparent cursor-pointer text-tce-dark dark:text-gray-300 font-medium hover:bg-tce-dark/5 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setConfirmToggle(s)}>
                {s.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">No students found</div>
      )}

      {/* Student stats modal */}
      <StudentStatsModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Add student modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Student">
        <div className="flex flex-col gap-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input className="form-input" placeholder="Student full name" value={form.name}
              onChange={(e) => setF('name', e.target.value)} />
            {formErr.name && <p className="text-red-500 text-xs mt-1">{formErr.name}</p>}
          </div>
          <div>
            <label className="form-label">Student ID *</label>
            <input className="form-input" placeholder="e.g. 23cs001" value={form.studentId}
              onChange={(e) => setF('studentId', e.target.value)} />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Email: {form.studentId.toLowerCase() || 'id'}@student.tce.edu
            </p>
            {formErr.studentId && <p className="text-red-500 text-xs">{formErr.studentId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Phone (optional)</label>
              <input className="form-input" placeholder="10-digit number" value={form.phone}
                onChange={(e) => setF('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
              {formErr.phone && <p className="text-red-500 text-xs mt-1">{formErr.phone}</p>}
            </div>
            <div>
              <label className="form-label">Reg. No. (optional)</label>
              <input className="form-input" placeholder="e.g. 23CS001" value={form.regNo}
                onChange={(e) => setF('regNo', e.target.value.toUpperCase())} />
              {formErr.regNo && <p className="text-red-500 text-xs mt-1">{formErr.regNo}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Department</label>
              <select className="form-input" value={form.dept}
                onChange={(e) => setF('dept', e.target.value)}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Year</label>
              <select className="form-input" value={form.year}
                onChange={(e) => setF('year', +e.target.value)}>
                {[1, 2, 3, 4].map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Initial Password *</label>
            <input className="form-input" type="text" value={form.password}
              onChange={(e) => setF('password', e.target.value)} />
            {formErr.password && <p className="text-red-500 text-xs mt-1">{formErr.password}</p>}
          </div>
          <div className="p-3 bg-tce-dark/5 dark:bg-tce-dark/30 rounded-xl text-xs text-tce-muted dark:text-gray-400">
            Student should change their password after first login.
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => handleToggle(confirmToggle)}
        title={confirmToggle?.active ? 'Deactivate Account' : 'Activate Account'}
        message={confirmToggle?.active
          ? `Deactivating ${confirmToggle?.name}'s account will prevent them from logging in.`
          : `Activating ${confirmToggle?.name}'s account will restore their access.`}
        confirmLabel={confirmToggle?.active ? 'Deactivate' : 'Activate'}
        danger={confirmToggle?.active}
      />
    </div>
  )
}
