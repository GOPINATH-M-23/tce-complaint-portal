/**
 * Server-side Cloudinary signed upload utility.
 *
 * Why signed uploads?
 *   Unsigned uploads expose your cloud name + upload preset to anyone who reads
 *   your JS bundle. They can upload arbitrary content to your account with no
 *   authentication. Signed uploads require an HMAC-SHA1 signature generated
 *   from your API_SECRET — which never leaves the server.
 *
 * Flow:
 *   1. Client sends Firebase ID token + image data to /.netlify/functions/upload-signature
 *   2. This module generates a signed signature (timestamp + params + secret)
 *   3. Client uses the signature to POST directly to Cloudinary (avoids proxying binary through Netlify)
 *   OR:
 *   1. Client sends Firebase ID token + image data to /.netlify/functions/upload-image
 *   2. Server verifies token, then uploads directly to Cloudinary via REST API
 *   3. Returns { imageUrl, publicId } — secret never leaves server
 *
 * We implement BOTH flows:
 *   - generateSignature() → for client-side direct upload with server signature
 *   - uploadSignedDirect() → for full server-side upload (more secure, slightly slower)
 */

import crypto  from 'crypto'
import https   from 'https'
import { logger } from './logger.js'

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  // 5 MB
const ALLOWED_FORMATS     = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const UPLOAD_FOLDER       = 'tce-complaints'

/** Validate base64-encoded image data */
export const validateBase64Image = (base64Data, mimeType) => {
  if (!base64Data)  throw new Error('No image data provided.')
  if (!mimeType)    throw new Error('No MIME type provided.')

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedMimes.includes(mimeType)) {
    throw new Error('Only JPG, PNG, WEBP, or GIF images are allowed.')
  }

  // Check approximate size from base64 length
  const sizeBytes = Math.ceil((base64Data.length * 3) / 4)
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Image must be under 5 MB. Received ~${Math.round(sizeBytes / 1024 / 1024 * 10) / 10} MB.`)
  }

  return true
}

/**
 * Generate a Cloudinary signed upload signature.
 * The client uses this to upload directly to Cloudinary without exposing secrets.
 *
 * Returns { signature, timestamp, apiKey, cloudName, folder }
 */
export const generateSignature = () => {
  if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary credentials not configured on server.')
  }

  const timestamp = Math.round(Date.now() / 1000)
  const params    = {
    folder:                UPLOAD_FOLDER,
    timestamp,
    // Optional: restrict allowed formats
    allowed_formats:       ALLOWED_FORMATS.join(','),
    // Optional: auto-tag for moderation
    tags:                  'tce-complaint,user-upload',
  }

  // Build signature string: sort params alphabetically, join as key=value pairs
  const paramsStr = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')

  const signature = crypto
    .createHash('sha256')
    .update(paramsStr + CLOUDINARY_API_SECRET)
    .digest('hex')

  return {
    signature,
    timestamp,
    apiKey:    CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME,
    folder:    UPLOAD_FOLDER,
    allowedFormats: ALLOWED_FORMATS.join(','),
  }
}

/**
 * Full server-side signed upload to Cloudinary via their Upload API.
 * The image is base64-encoded and sent as a REST POST.
 * This is more secure because nothing related to Cloudinary touches the client.
 *
 * @param {string} base64Data - raw base64 (no data: prefix)
 * @param {string} mimeType   - e.g. "image/jpeg"
 * @param {string} complaintId - used to name the file in Cloudinary
 * @returns {Promise<{imageUrl: string, publicId: string}>}
 */
export const uploadSignedDirect = async (base64Data, mimeType, complaintId) => {
  if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary credentials not configured on server.')
  }

  validateBase64Image(base64Data, mimeType)

  const timestamp  = Math.round(Date.now() / 1000)
  const publicId   = `${UPLOAD_FOLDER}/${complaintId}-${timestamp}`

  const params = {
    public_id:       publicId,
    folder:          UPLOAD_FOLDER,
    timestamp:       String(timestamp),
    allowed_formats: ALLOWED_FORMATS.join(','),
    tags:            'tce-complaint,user-upload',
  }

  // SHA-256 signature
  const paramsStr = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')

  const signature = crypto
    .createHash('sha256')
    .update(paramsStr + CLOUDINARY_API_SECRET)
    .digest('hex')

  // Build multipart form body
  const boundary  = `----CloudinaryBoundary${Date.now()}`
  const allParams = { ...params, signature, api_key: CLOUDINARY_API_KEY }

  let body = ''
  for (const [key, val] of Object.entries(allParams)) {
    body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`
  }
  // Attach file as base64 data URI — Cloudinary accepts this
  body += `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\n\r\ndata:${mimeType};base64,${base64Data}\r\n`
  body += `--${boundary}--\r\n`

  const bodyBuffer = Buffer.from(body, 'utf8')

  logger.info('Uploading to Cloudinary', { complaintId, timestamp, sizeBytes: bodyBuffer.length })

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudinary.com',
      path:     `/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      method:   'POST',
      headers:  {
        'Content-Type':   `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length,
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (res.statusCode === 200) {
            logger.info('Cloudinary upload success', { publicId: json.public_id })
            resolve({ imageUrl: json.secure_url, publicId: json.public_id })
          } else {
            logger.error('Cloudinary upload failed', { status: res.statusCode, error: json.error?.message })
            reject(new Error(json.error?.message || 'Cloudinary upload failed.'))
          }
        } catch {
          reject(new Error('Invalid Cloudinary response.'))
        }
      })
    })

    req.on('error', (err) => {
      logger.error('Cloudinary request error', { error: err.message })
      reject(new Error('Network error during upload.'))
    })

    req.write(bodyBuffer)
    req.end()
  })
}
