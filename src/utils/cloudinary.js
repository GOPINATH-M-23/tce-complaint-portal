/**
 * Frontend Cloudinary upload utility — SIGNED upload flow.
 *
 * Architecture change from v1 (unsigned) → v2 (signed):
 *
 * OLD (insecure):
 *   Client → Cloudinary directly with unsigned preset in VITE_ variable
 *   Problem: Anyone reading your JS bundle can upload to your account
 *
 * NEW (secure):
 *   Step 1: Client → POST /api/upload-signature (Netlify Function)
 *            Function verifies Firebase token, rate-limits, generates signature
 *   Step 2: Client → Cloudinary directly with the server-generated signature
 *            Cloudinary validates signature (HMAC) server-side
 *   Result: API_SECRET never leaves the server. Signature is time-bound (~1hr).
 *
 * Why two-step instead of full server upload?
 *   Full server upload (base64 through Netlify) is limited by:
 *   - Netlify free: 10 MB request body limit
 *   - Netlify free: 10 second timeout
 *   The two-step approach uploads the binary directly from browser → Cloudinary
 *   while the signature ensures only authenticated users can do so.
 *   For files > ~3 MB, this is the recommended production pattern.
 */

import { auth } from '@/firebase/config'

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const MAX_SIZE_MB   = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// ── Validation ───────────────────────────────────────────────────────────────

/** Validate file type and size before uploading */
export const validateImage = (file) => {
  if (!file)                             return 'No file selected.'
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, WEBP, or GIF images are allowed.'
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Image must be under ${MAX_SIZE_MB} MB.`
  return null
}

// ── Compression ──────────────────────────────────────────────────────────────

/**
 * Compress image client-side before upload.
 * Reduces upload time and Cloudinary storage usage.
 * Target: ≤ 1200px wide, quality 0.82
 */
export const compressImage = (file) =>
  new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX_W  = 1200
      const scale  = img.width > MAX_W ? MAX_W / img.width : 1
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => resolve(blob || file), file.type, 0.82)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })

// ── Get Firebase ID token ─────────────────────────────────────────────────────

const getIdToken = async () => {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated.')
  return user.getIdToken()
}

// ── Signed upload ─────────────────────────────────────────────────────────────

/**
 * Upload an image to Cloudinary using a server-generated signature.
 *
 * @param {File}     file        - The image File object from <input type="file">
 * @param {string}   complaintId - Firestore complaint document ID (for naming)
 * @param {Function} onProgress  - Optional callback(percent: number)
 * @returns {Promise<{imageUrl: string, publicId: string}>}
 */
export const uploadToCloudinary = async (file, complaintId, onProgress) => {
  // 1. Client-side validation
  const validationError = validateImage(file)
  if (validationError) throw new Error(validationError)

  if (!CLOUD_NAME) {
    throw new Error('VITE_CLOUDINARY_CLOUD_NAME is not configured.')
  }

  // 2. Compress before upload
  const compressed = await compressImage(file)

  // 3. Get Firebase ID token
  const idToken = await getIdToken()

  // 4. Request signed params from our Netlify function
  const sigRes = await fetch('/.netlify/functions/upload-signature', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ complaintId }),
  })

  if (!sigRes.ok) {
    const err = await sigRes.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to get upload signature.')
  }

  const { data: sigData } = await sigRes.json()
  // sigData = { signature, timestamp, apiKey, cloudName, folder, allowedFormats }

  // 5. Build FormData for direct Cloudinary upload
  const formData = new FormData()
  formData.append('file',            compressed)
  formData.append('timestamp',       sigData.timestamp)
  formData.append('signature',       sigData.signature)
  formData.append('api_key',         sigData.apiKey)
  formData.append('folder',          sigData.folder)
  formData.append('allowed_formats', sigData.allowedFormats)
  formData.append('tags',            'tce-complaint,user-upload')

  // 6. Upload directly to Cloudinary with progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`)

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve({ imageUrl: data.secure_url, publicId: data.public_id })
      } else {
        let msg = 'Upload failed.'
        try {
          const errData = JSON.parse(xhr.responseText)
          msg = errData.error?.message || msg
        } catch { /* ignore */ }
        reject(new Error(msg))
      }
    }

    xhr.onerror  = () => reject(new Error('Network error during upload.'))
    xhr.onabort  = () => reject(new Error('Upload was cancelled.'))
    xhr.send(formData)
  })
}
