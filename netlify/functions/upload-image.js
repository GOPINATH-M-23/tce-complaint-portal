/**
 * Netlify Function: upload-image
 * POST /.netlify/functions/upload-image
 * (proxied as POST /api/upload-image via netlify.toml)
 *
 * Purpose:
 *   Full server-side Cloudinary upload. The client sends a base64-encoded
 *   image; this function verifies the user, validates the image, then uploads
 *   to Cloudinary using the secret API key. No Cloudinary credentials ever
 *   reach the browser.
 *
 * Request body (JSON):
 *   {
 *     imageData:   string  // base64-encoded image (no data: prefix)
 *     mimeType:    string  // e.g. "image/jpeg"
 *     complaintId: string  // Firestore complaint document ID
 *   }
 *
 * Response:
 *   { success: true, data: { imageUrl: string, publicId: string } }
 *
 * Note on file size:
 *   Base64 encoding increases size by ~33%. A 5 MB image becomes ~6.7 MB as
 *   base64. Netlify Functions have a 6 MB body limit. We enforce 4 MB max on
 *   the raw image to stay safely under the limit.
 */

import { requireAuth }                        from './_middleware/auth.js'
import { rateLimiter, getClientIp, LIMITS }   from './_middleware/rateLimit.js'
import { uploadSignedDirect, validateBase64Image } from './_utils/cloudinarySigned.js'
import { initAdmin }                          from './_utils/firebaseAdmin.js'
import { preflight, ok, badRequest, serverError, tooManyRequests, unauthorized } from './_utils/response.js'
import { logger }                             from './_utils/logger.js'

const MAX_BASE64_CHARS = 5_500_000 // ~4 MB raw image

export const handler = async (event, context) => {
  const origin = event.headers?.origin || ''
  const start  = Date.now()

  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  if (event.httpMethod !== 'POST')    return badRequest('Method not allowed.', origin)

  logger.request(event, context)

  try {
    // ── 1. Authenticate ──────────────────────────────────────────────────────
    const user = await requireAuth(event, origin)

    // Only active students can upload
    if (user.role !== 'student') {
      return unauthorized(origin)
    }

    // ── 2. Rate limit ────────────────────────────────────────────────────────
    const ip    = getClientIp(event)
    const limit = rateLimiter.check(ip, 'upload', LIMITS.upload)
    if (!limit.allowed) return tooManyRequests(limit.retryAfter, origin)

    // ── 3. Parse body ────────────────────────────────────────────────────────
    let body = {}
    try {
      body = JSON.parse(event.body || '{}')
    } catch {
      return badRequest('Invalid JSON body.', origin)
    }

    const { imageData, mimeType, complaintId } = body

    if (!imageData || !mimeType || !complaintId) {
      return badRequest('imageData, mimeType, and complaintId are required.', origin)
    }

    // Guard against oversized payloads
    if (imageData.length > MAX_BASE64_CHARS) {
      return badRequest('Image is too large. Maximum 4 MB.', origin)
    }

    // ── 4. Validate image ────────────────────────────────────────────────────
    try {
      validateBase64Image(imageData, mimeType)
    } catch (validationErr) {
      return badRequest(validationErr.message, origin)
    }

    // ── 5. Verify the complaint belongs to this student ──────────────────────
    const { db } = initAdmin()
    const compSnap = await db.collection('complaints').doc(complaintId).get()
    if (!compSnap.exists) {
      return badRequest('Complaint not found.', origin)
    }
    if (compSnap.data().studentId !== user.studentId) {
      logger.warn('Student tried to upload to another student complaint', {
        uid: user.uid, complaintId,
      })
      return unauthorized(origin)
    }

    // ── 6. Upload to Cloudinary (server-side signed) ─────────────────────────
    const { imageUrl, publicId } = await uploadSignedDirect(imageData, mimeType, complaintId)

    // ── 7. Update Firestore with the image URL ───────────────────────────────
    await db.collection('complaints').doc(complaintId).update({
      imageUrl,
      imagePublicId: publicId,
      updatedAt:     new Date(),
    })

    logger.info('Image upload complete', {
      uid:        user.uid,
      complaintId,
      publicId,
      durationMs: Date.now() - start,
    })

    return ok({ imageUrl, publicId }, origin)

  } catch (err) {
    if (err.statusCode) return err

    logger.error('upload-image error', {
      error:      err.message,
      durationMs: Date.now() - start,
    })
    return serverError(origin)
  }
}
