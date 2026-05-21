/**
 * Netlify Function: health
 * GET /.netlify/functions/health
 * (proxied as GET /api/health)
 *
 * Purpose:
 *   Simple health check endpoint used by:
 *   - Netlify uptime monitoring
 *   - External monitoring tools (UptimeRobot, BetterUptime)
 *   - CI/CD post-deploy verification
 *
 * Returns service status + dependency reachability.
 * Does NOT expose sensitive config or internal errors.
 */

import { initAdmin }   from './_utils/firebaseAdmin.js'
import { preflight, ok, serverError } from './_utils/response.js'
import { logger }      from './_utils/logger.js'

export const handler = async (event) => {
  const origin = event.headers?.origin || ''

  if (event.httpMethod === 'OPTIONS') return preflight(origin)

  const start  = Date.now()
  const checks = { firebase: false, cloudinary: false }

  // Check Firebase Admin connectivity
  try {
    const { db } = initAdmin()
    // Lightweight read — just check the connection works
    await db.collection('_health').limit(1).get()
    checks.firebase = true
  } catch {
    checks.firebase = false
  }

  // Check Cloudinary credentials are present (don't make a network call)
  checks.cloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY    &&
    process.env.CLOUDINARY_API_SECRET
  )

  const allOk = Object.values(checks).every(Boolean)

  logger.info('Health check', { checks, durationMs: Date.now() - start })

  const payload = {
    status:    allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    version:   process.env.DEPLOY_ID || 'local',
  }

  return allOk
    ? ok(payload, origin)
    : { statusCode: 503, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, data: payload }) }
}
