import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, query, where, orderBy, onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ── Get all complaints (admin, real-time, deduplicated by document ID) ───────
export const subscribeAllComplaints = (callback, onError) => {
  const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const map = new Map()
      snap.docs.forEach((d) => {
        map.set(d.id, { id: d.id, ...d.data() })
      })
      callback(Array.from(map.values()))
    },
    (err) => onError?.(err),
  )
}

// ── Get single complaint ──────────────────────────────────────────────────────
export const getComplaint = async (id) => {
  const snap = await getDoc(doc(db, 'complaints', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Admin: update complaint + notify student ──────────────────────────────────
export const updateComplaint = async (id, updates) => {
  await updateDoc(doc(db, 'complaints', id), {
    ...updates,
    updatedAt: serverTimestamp(),
  })

  // Send realtime notification to student when status, reply, or response image changes
  if (updates.status || updates.adminReply || updates.adminResponseImageUrl) {
    const comp = await getComplaint(id)
    if (!comp) return
    const hasReply  = !!(updates.adminReply && updates.adminReply.trim())
    const hasStatus = !!updates.status

    let type    = 'update'
    let message = ''

    if (hasReply && hasStatus) {
      type    = 'reply_and_status'
      message = `Admin replied to "${comp.title}" and updated status to ${updates.status}.`
    } else if (hasReply) {
      type    = 'reply'
      message = `Admin replied to your complaint: "${comp.title}"`
    } else if (hasStatus) {
      type    = 'status_update'
      message = `Your complaint "${comp.title}" status changed to ${updates.status}.`
    }

    if (message) {
      const adminResponseImageUrl = updates.adminResponseImageUrl || comp.adminResponseImageUrl || ''
      const adminResponseImagePublicId = updates.adminResponseImagePublicId || comp.adminResponseImagePublicId || ''

      await addDoc(collection(db, 'notifications'), {
        userId:                 comp.studentId,
        role:                   'student',
        type,
        message,
        complaintId:            id,
        complaintTitle:         comp.title,
        status:                 updates.status || comp.status,
        adminReply:             updates.adminReply || '',
        adminResponseImageUrl,
        imageUrl:               adminResponseImageUrl,
        adminResponseImagePublicId,
        read:                   false,
        createdAt:              serverTimestamp(),
      })
    }
  }
}

// ── Get all students (admin) ──────────────────────────────────────────────────
export const getAllStudents = async () => {
  const snap = await getDocs(collection(db, 'students'))
  const map = new Map()
  snap.docs.forEach((d) => {
    map.set(d.id, { id: d.id, ...d.data() })
  })
  return Array.from(map.values())
}

// ── Fetch detailed student profile + stats for a specific complaint ──────────
export const getStudentDetailsForComplaint = async (complaint) => {
  if (!complaint) return null

  let studentDoc = null

  // 1. Query students collection by UID if available
  if (complaint.studentId) {
    try {
      const snap = await getDoc(doc(db, 'students', complaint.studentId))
      if (snap.exists()) {
        studentDoc = { id: snap.id, ...snap.data() }
      }
    } catch { /* ignore */ }
  }

  // 2. Query students collection by email if not found by ID
  if (!studentDoc && complaint.studentEmail) {
    try {
      const q = query(collection(db, 'students'), where('email', '==', complaint.studentEmail))
      const snap = await getDocs(q)
      if (!snap.empty) {
        studentDoc = { id: snap.docs[0].id, ...snap.docs[0].data() }
      }
    } catch { /* ignore */ }
  }

  // 3. Fallback info from complaint document
  const studentInfo = {
    name:  studentDoc?.name  || complaint.studentName  || 'Unknown Student',
    email: studentDoc?.email || complaint.studentEmail || 'N/A',
    regNo: studentDoc?.regNo || studentDoc?.studentId || complaint.regNo || complaint.studentId || 'N/A',
    phone: studentDoc?.phone || complaint.phone || 'N/A',
    dept:  studentDoc?.dept  || complaint.dept  || 'N/A',
    year:  studentDoc?.year  || complaint.year  || 'N/A',
  }

  // 4. Calculate total, resolved, pending complaints ONLY for this specific student
  let allStudentComplaints = []
  if (complaint.studentEmail || complaint.studentId) {
    try {
      const compQuery = complaint.studentEmail
        ? query(collection(db, 'complaints'), where('studentEmail', '==', complaint.studentEmail))
        : query(collection(db, 'complaints'), where('studentId', '==', complaint.studentId))
      const compSnap = await getDocs(compQuery)
      const map = new Map()
      compSnap.docs.forEach((d) => map.set(d.id, d.data()))
      allStudentComplaints = Array.from(map.values())
    } catch { /* ignore */ }
  }

  const total    = allStudentComplaints.length
  const resolved = allStudentComplaints.filter((c) => c.status === 'Resolved').length
  const pending  = allStudentComplaints.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected').length

  return {
    student: studentInfo,
    stats: {
      total,
      resolved,
      pending,
    },
  }
}

// ── Student complaint statistics (admin use) ──────────────────────────────────
export const getStudentComplaintStats = async (studentId) => {
  const base = query(collection(db, 'complaints'), where('studentId', '==', studentId))

  const [allSnap, resolvedSnap, inProgressSnap] = await Promise.all([
    getDocs(query(base, orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'complaints'), where('studentId', '==', studentId), where('status', '==', 'Resolved'))),
    getDocs(query(collection(db, 'complaints'), where('studentId', '==', studentId), where('status', '==', 'In Progress'))),
  ])

  const latest = allSnap.docs[0]?.data()?.createdAt?.toDate?.() ?? null

  return {
    total:      allSnap.size,
    resolved:   resolvedSnap.size,
    inProgress: inProgressSnap.size,
    pending:    allSnap.size - resolvedSnap.size,
    latestDate: latest ? latest.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
  }
}

// ── Toggle student active/inactive status ─────────────────────────────────────
export const toggleStudentStatus = async (studentDocId, active) => {
  try {
    await updateDoc(doc(db, 'students', studentDocId), {
      active,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('Error updating student status:', error)
    throw new Error('Failed to update student status')
  }
}
