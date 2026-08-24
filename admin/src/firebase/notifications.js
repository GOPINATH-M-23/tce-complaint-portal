import {
  collection, addDoc, doc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from './config'
import { uploadToCloudinary } from '@/utils/cloudinary'

// ── Create notification by Admin ──────────────────────────────────────────────
export const createAdminNotification = async ({ title, message, imageFile }, onProgress) => {
  let imageUrl = ''
  let imagePublicId = ''

  if (imageFile) {
    const res = await uploadToCloudinary(imageFile, '', onProgress)
    imageUrl = res.imageUrl || ''
    imagePublicId = res.publicId || ''
  }

  const notifRef = await addDoc(collection(db, 'notifications'), {
    title: title.trim(),
    message: message.trim(),
    imageUrl,
    imagePublicId,
    createdAt: serverTimestamp(),
    createdBy: 'admin',
    active: true,
  })

  return notifRef.id
}

// ── Delete notification by Admin ──────────────────────────────────────────────
export const deleteAdminNotification = async (notificationId) => {
  await deleteDoc(doc(db, 'notifications', notificationId))
}

// ── Realtime subscribe to Admin notifications ─────────────────────────────────
export const subscribeAdminNotifications = (callback, onError) => {
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(list)
    },
    (err) => onError?.(err)
  )
}
