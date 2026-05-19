/**
 * Cloudinary unsigned upload utility (replaces Firebase Storage — free tier).
 *
 * Setup:
 *   1. Create a free Cloudinary account at https://cloudinary.com
 *   2. Dashboard → Settings → Upload → Upload Presets → Add unsigned preset
 *   3. Set preset name (e.g. "tce_portal_unsigned")
 *   4. Add to your .env:
 *        VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *        VITE_CLOUDINARY_UPLOAD_PRESET=tce_portal_unsigned
 */

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const MAX_SIZE_MB  = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** Validate file before upload */
export const validateImage = (file) => {
  if (!file) return 'No file selected.'
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, WEBP, or GIF images are allowed.'
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Image must be under ${MAX_SIZE_MB} MB.`
  return null
}

/**
 * Compress an image client-side before uploading.
 * Returns a Blob at ≤ 1200px wide, quality 0.82.
 */
export const compressImage = (file) =>
  new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX_W = 1200
      const scale = img.width > MAX_W ? MAX_W / img.width : 1
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => resolve(blob || file), file.type, 0.82)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })

/**
 * Upload file to Cloudinary unsigned preset.
 * Returns { imageUrl, publicId }
 */
export const uploadToCloudinary = async (file, onProgress) => {
  const validationError = validateImage(file)
  if (validationError) throw new Error(validationError)

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.',
    )
  }

  const compressed = await compressImage(file)
  const formData   = new FormData()
  formData.append('file',         compressed)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder',        'tce-complaints')

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
        reject(new Error('Upload failed. Please try again.'))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload.'))
    xhr.send(formData)
  })
}
