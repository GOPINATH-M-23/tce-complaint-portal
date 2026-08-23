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

// ── Get complaints for student (real-time, deduplicated by ID) ────────────────
export const subscribeStudentComplaints = (studentId, callback, onError) => {
  const q = query(
    collection(db, 'complaints'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(
    q,
    (snap) => {
      const map = new Map()
      snap.docs.forEach((d) => {
        map.set(d.id, { id: d.id, ...d.data() })
      })
      callback(Array.from(map.values()))
    },
    (err)  => onError?.(err),
  )
}

// ── Get single complaint ──────────────────────────────────────────────────────
export const getComplaint = async (id) => {
  const snap = await getDoc(doc(db, 'complaints', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Notifications (realtime) ──────────────────────────────────────────────────
export const subscribeNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )
  return onSnapshot(q, (snap) => {
    const map = new Map()
    snap.docs.forEach((d) => {
      map.set(d.id, { id: d.id, ...d.data() })
    })
    callback(Array.from(map.values()))
  })
}

export const markNotificationRead = (id) =>
  updateDoc(doc(db, 'notifications', id), { read: true })

export const markAllNotificationsRead = async (userId) => {
  const q    = query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false))
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })))
}
