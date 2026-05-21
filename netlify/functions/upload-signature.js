/**
 * Netlify Function: upload-signature
 * POST /.netlify/functions/upload-signature
 * (proxied as POST /api/upload-signature via netlify.toml)
 *
 * Purpose:
 *   Generate a signed Cloudinary upload signature so the frontend can upload
 *   images DIRECTLY to Cloudinary without proxying binary data through Netlify.
 *   The API secret never leaves this function.
 *
 * Flow:
 *   1. Client gets a Firebase ID token (already in AuthContext)
 *   2. Client POSTs { complaintId } + Authorization: Bearer <token>
 *   3. This function verifies the token, rate-limits, generates signature
 *   4. Returns { signature, timestamp, apiKey, cloudName, folder } to client
 *   5. Client uses these params to upload directly to Cloudinary
 *   6. Cloudinary validates the signature server-side — rejects tampered uploads
 *
 * Why this approach:
 *   - Binary image never passes through Netlify (faster, no bandwidth charge)
 *   - API_SECRET never reaches the browser
 *   - Only authenticated, rate-limited users can get signatures
 *   - Each signature is time-bound (valid ~1 hour)
 */

import { requireAuth }       from './_middleware/auth.js'
import { rateLimiter, getClientIp, LIMITS } from './_middleware/rateLimit.js'
import { generateSignature } from './_utils/cloudinarySigned.js'
import { preflight, ok, badRequest, serverError, tooManyRequests } from './_utils/response.js'
import { logger }            from './_utils/logger.js'

export const handler = async (event, context) => {
  const origin = event.headers?.origin || ''
  const start  = Date.now()

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') return preflight(origin)

  // Method check
  if (event.httpMethod !== 'POST') {
    return badRequest('Method not allowed.', origin)
  }

  logger.request(event, context)

  try {
    // ── 1. Authenticate ──────────────────────────────────────────────────────
    const user = await requireAuth(event, origin)

    // ── 2. Rate limit — per IP ───────────────────────────────────────────────
    const ip     = getClientIp(event)
    const limit  = rateLimiter.check(ip, 'signature', LIMITS.signature)
    if (!limit.allowed) return tooManyRequests(limit.retryAfter, origin)

    // ── 3. Parse body ────────────────────────────────────────────────────────
    let body = {}
    try {
      body = JSON.parse(event.body || '{}')
    } catch {
      return badRequest('Invalid JSON body.', origin)
    }

    const complaintId = String(body.complaintId || '').trim().slice(0, 100)
    if (!complaintId) {
      return badRequest('complaintId is required.', origin)
    }

    // ── 4. Generate signature ────────────────────────────────────────────────
    const signatureData = generateSignature(complaintId)

    logger.info('Signature generated', {
      uid:         user.uid,
      complaintId,
      ip,
      durationMs:  Date.now() - start,
    })

    return ok(signatureData, origin)

  } catch (err) {
    // Re-throw response objects (from requireAuth)
    if (err.statusCode) return err

    logger.error('upload-signature error', {
      error:     err.message,
      durationMs: Date.now() - start,
    })
    return serverError(origin)
  }
}
