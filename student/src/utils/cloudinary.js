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
  if (!user) return null
  return user.getIdToken()
}

// ── Signed upload ─────────────────────────────────────────────────────────────

/**
 * Upload an image to Cloudinary using a server-generated signature.
 *
 * @param {File}     file        - The image File object from <input type="file">
 * @param {string}   complaintId - Firestore complaint document ID (optional)
 * @param {Function} onProgress  - Optional callback(percent: number)
 * @returns {Promise<{imageUrl: string, publicId: string}>}
 */
export const uploadToCloudinary = async (file, complaintId = '', onProgress) => {
  // 1. Client-side validation
  const validationError = validateImage(file)
  if (validationError) throw new Error(validationError)

  // 2. Compress before upload
  const compressed = await compressImage(file)

  // 3. Get Firebase ID token if authenticated
  const idToken = await getIdToken().catch(() => null)

  const headers = { 'Content-Type': 'application/json' }
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`

  // 4. Request signed params from server API endpoint
  const sigRes = await fetch('/api/upload-signature', {
    method:  'POST',
    headers,
    body: JSON.stringify({ complaintId }),
  })

  if (!sigRes.ok) {
    const err = await sigRes.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to get upload signature.')
  }

  const { data: sigData } = await sigRes.json()
  // sigData = { signature, timestamp, apiKey, cloudName, folder, allowedFormats }
  const cloudName = sigData?.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || CLOUD_NAME

  if (!cloudName) {
    throw new Error('VITE_CLOUDINARY_CLOUD_NAME is not configured.')
  }

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
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)

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
