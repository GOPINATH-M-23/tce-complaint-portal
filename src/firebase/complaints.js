import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, query, where, orderBy, onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { uploadToCloudinary } from '@/utils/cloudinary'
import { PRIORITY_THRESHOLDS } from '@/utils/constants'

// ── Auto priority based on category frequency ─────────────────────────────────
export const calculatePriority = async (category) => {
  const q     = query(collection(db, 'complaints'), where('category', '==', category))
  const snap  = await getDocs(q)
  const count = snap.size
  if (count >= PRIORITY_THRESHOLDS.CRITICAL) return 'Critical'
  if (count >= PRIORITY_THRESHOLDS.HIGH)     return 'High'
  if (count >= PRIORITY_THRESHOLDS.MEDIUM)   return 'Medium'
  return 'Low'
}

// ── Submit new complaint ──────────────────────────────────────────────────────
export const submitComplaint = async (data, imageFile, onProgress) => {
  const priority = await calculatePriority(data.category)
  const docRef = await addDoc(collection(db, 'complaints'), {
    title:        data.title,
    category:     data.category,
    description:  data.description,
    status:       'Submitted',
    priority,
    studentId:    data.studentId,
    studentName:  data.studentName,
    studentEmail: data.studentEmail,
    dept:         data.dept,
    adminReply:   '',
    imageUrl:     '',
    imagePublicId:'',
    read:         false,
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp(),
  })

  // Upload to Cloudinary if image provided
  if (imageFile) {
    const { imageUrl, publicId } = await uploadToCloudinary(imageFile, onProgress)
    await updateDoc(docRef, { imageUrl, imagePublicId: publicId })
  }

  // Notify student on submission
  await addDoc(collection(db, 'notifications'), {
    userId:      data.studentId,
    role:        'student',
    type:        'submitted',
    message:     `Your complaint "${data.title}" has been submitted successfully.`,
    complaintId: docRef.id,
    complaintTitle: data.title,
    status:      'Submitted',
    adminReply:  '',
    read:        false,
    createdAt:   serverTimestamp(),
  })

  return docRef.id
}

// ── Get complaints for student (real-time) ────────────────────────────────────
export const subscribeStudentComplaints = (studentId, callback, onError) => {
  const q = query(
    collection(db, 'complaints'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err)  => onError?.(err),
  )
}

// ── Get all complaints (admin, real-time) ─────────────────────────────────────
export const subscribeAllComplaints = (callback, onError) => {
  const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err)  => onError?.(err),
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

  // Send realtime notification to student when status or reply changes
  if (updates.status || updates.adminReply) {
    const comp = await getComplaint(id)
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
      await addDoc(collection(db, 'notifications'), {
        userId:         comp.studentId,
        role:           'student',
        type,
        message,
        complaintId:    id,
        complaintTitle: comp.title,
        status:         updates.status || comp.status,
        adminReply:     updates.adminReply || '',
        read:           false,
        createdAt:      serverTimestamp(),
      })
    }
  }
}

// ── Notifications (realtime) ──────────────────────────────────────────────────
export const subscribeNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
}

export const markNotificationRead = (id) =>
  updateDoc(doc(db, 'notifications', id), { read: true })

export const markAllNotificationsRead = async (userId) => {
  const q    = query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false))
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })))
}

// ── Get all students (admin) ──────────────────────────────────────────────────
export const getAllStudents = async () => {
  const snap = await getDocs(collection(db, 'students'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── Student complaint statistics (admin use) ──────────────────────────────────
// Uses targeted where queries instead of loading all complaints — saves reads.
export const getStudentComplaintStats = async (studentId) => {
  const base = query(collection(db, 'complaints'), where('studentId', '==', studentId))

  // Run all counts in parallel to minimise latency
  const [allSnap, resolvedSnap, inProgressSnap, pendingSnap] = await Promise.all([
    getDocs(query(base, orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'complaints'), where('studentId', '==', studentId), where('status', '==', 'Resolved'))),
    getDocs(query(collection(db, 'complaints'), where('studentId', '==', studentId), where('status', '==', 'In Progress'))),
    getDocs(query(collection(db, 'complaints'), where('studentId', '==', studentId), where('status', 'in', ['Submitted', 'Under Review']))),
  ])

  const latest = allSnap.docs[0]?.data()?.createdAt?.toDate?.() ?? null

  return {
    total:      allSnap.size,
    resolved:   resolvedSnap.size,
    inProgress: inProgressSnap.size,
    pending:    pendingSnap.size,
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
