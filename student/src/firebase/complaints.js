import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, query, where, orderBy, onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { uploadToCloudinary } from '@/utils/cloudinary'
import { PRIORITY_THRESHOLDS } from '@/utils/constants'
import { getCurrentWeekRange, parseComplaintDate } from '@/utils/helpers'

// ── Check weekly complaint count from Firestore ─────────────────────────────
export const getStudentWeeklyComplaintCount = async (studentId) => {
  if (!studentId) return 0
  const q = query(
    collection(db, 'complaints'),
    where('studentId', '==', studentId),
  )
  const snap = await getDocs(q)
  const { startOfWeek, endOfWeek } = getCurrentWeekRange()
  const startTime = startOfWeek.getTime()
  const endTime = endOfWeek.getTime()

  let count = 0
  snap.docs.forEach((d) => {
    const data = d.data()
    const cDate = parseComplaintDate(data.createdAt)
    if (cDate) {
      const t = cDate.getTime()
      if (t >= startTime && t <= endTime) {
        count++
      }
    }
  })
  return count
}

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
  const currentWeeklyCount = await getStudentWeeklyComplaintCount(data.studentId)
  if (currentWeeklyCount >= 3) {
    throw new Error('You have reached the maximum of 3 complaints for this week. You can submit a new complaint next week.')
  }

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

// ── Get complaints for student (real-time, deduplicated by ID) ────────────────
export const subscribeStudentComplaints = (studentIdentifier, callback, onError) => {
  const identifiers = new Set()
  if (typeof studentIdentifier === 'string') {
    identifiers.add(studentIdentifier)
  } else if (studentIdentifier && typeof studentIdentifier === 'object') {
    if (studentIdentifier.studentId) identifiers.add(studentIdentifier.studentId)
    if (studentIdentifier.regNo)     identifiers.add(studentIdentifier.regNo)
    if (studentIdentifier.uid)       identifiers.add(studentIdentifier.uid)
    if (studentIdentifier.email)     identifiers.add(studentIdentifier.email.split('@')[0])
  }

  const ids = Array.from(identifiers).filter(Boolean)
  if (ids.length === 0) {
    callback([])
    return () => {}
  }

  const compMap = new Map()
  const unsubs = []

  const emitSorted = () => {
    const list = Array.from(compMap.values()).sort((a, b) => {
      const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt || 0)).getTime())
      const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt || 0)).getTime())
      return tB - tA
    })
    callback(list)
  }

  ids.forEach((id) => {
    const q = query(
      collection(db, 'complaints'),
      where('studentId', '==', id),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        snap.docs.forEach((d) => {
          compMap.set(d.id, { id: d.id, ...d.data() })
        })
        emitSorted()
      },
      (err) => onError?.(err),
    )
    unsubs.push(unsub)
  })

  return () => {
    unsubs.forEach((u) => u?.())
  }
}

// ── Get single complaint ──────────────────────────────────────────────────────
export const getComplaint = async (id) => {
  const snap = await getDoc(doc(db, 'complaints', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Notifications (realtime) ──────────────────────────────────────────────────
export const subscribeNotifications = (userId, callback) => {
  const notifMap = new Map()

  const emitSorted = () => {
    const list = Array.from(notifMap.values()).sort((a, b) => {
      const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt || 0)).getTime())
      const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt || 0)).getTime())
      return tB - tA
    })
    callback(list)
  }

  // 1. User specific notifications
  const qUser = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )

  // 2. Admin broadcast notifications
  const qAdmin = query(
    collection(db, 'notifications'),
    where('createdBy', '==', 'admin'),
    orderBy('createdAt', 'desc'),
  )

  const unsub1 = onSnapshot(qUser, (snap) => {
    snap.docs.forEach((d) => notifMap.set(d.id, { id: d.id, ...d.data() }))
    emitSorted()
  }, (err) => console.error('User notif sub error:', err))

  const unsub2 = onSnapshot(qAdmin, (snap) => {
    snap.docs.forEach((d) => notifMap.set(d.id, { id: d.id, ...d.data() }))
    emitSorted()
  }, (err) => console.error('Admin notif sub error:', err))

  return () => {
    unsub1()
    unsub2()
  }
}

export const markNotificationRead = (id) =>
  updateDoc(doc(db, 'notifications', id), { read: true })

export const markAllNotificationsRead = async (userId) => {
  const q    = query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false))
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })))
}
