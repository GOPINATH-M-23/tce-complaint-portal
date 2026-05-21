/**
 * In-memory rate limiter for Netlify Functions.
 *
 * Architecture note:
 *   Netlify serverless functions are stateless — each warm instance has its
 *   own memory. This rate limiter works per-instance, which provides "soft"
 *   rate limiting suitable for abuse deterrence. For hard distributed limits
 *   across all instances you would need an external store like Upstash Redis.
 *   For a college portal, per-instance limits are sufficient.
 *
 * Usage:
 *   import { rateLimiter } from './_middleware/rateLimit.js'
 *   const result = rateLimiter.check(ip, 'upload', { max: 10, windowMs: 900000 })
 *   if (!result.allowed) return tooManyRequests(result.retryAfter, origin)
 *
 * Limits:
 *   - Upload:    10 requests per 15 minutes per IP
 *   - Complaint: 5  submissions per 10 minutes per IP
 *   - Auth:      20 requests per 5 minutes per IP (brute-force protection)
 */

import { logger } from '../_utils/logger.js'

class RateLimiter {
  constructor() {
    // Map<key, { count, resetAt }>
    this._store = new Map()

    // Periodically clean up expired entries to prevent memory growth
    this._cleanupInterval = setInterval(() => this._cleanup(), 5 * 60 * 1000)
    // Allow the process to exit even if this interval is running
    if (this._cleanupInterval.unref) this._cleanupInterval.unref()
  }

  /**
   * Check if the given key is within its rate limit.
   * @param {string} ip        - Client IP address
   * @param {string} action    - Identifier for the action (e.g. 'upload', 'submit')
   * @param {object} opts
   * @param {number} opts.max        - Maximum requests allowed in the window
   * @param {number} opts.windowMs   - Window duration in milliseconds
   * @returns {{ allowed: boolean, remaining: number, retryAfter: number }}
   */
  check(ip, action, { max, windowMs }) {
    const key  = `${action}:${ip}`
    const now  = Date.now()
    const entry = this._store.get(key)

    if (!entry || now > entry.resetAt) {
      // New window
      this._store.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, remaining: max - 1, retryAfter: 0 }
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      logger.warn('Rate limit exceeded', { ip, action, count: entry.count, retryAfter })
      return { allowed: false, remaining: 0, retryAfter }
    }

    entry.count++
    return { allowed: true, remaining: max - entry.count, retryAfter: 0 }
  }

  /** Remove all expired entries */
  _cleanup() {
    const now = Date.now()
    for (const [key, entry] of this._store) {
      if (now > entry.resetAt) this._store.delete(key)
    }
    logger.debug('Rate limiter cleanup', { remainingKeys: this._store.size })
  }
}

// Singleton — shared across warm invocations of the same function instance
export const rateLimiter = new RateLimiter()

/**
 * Extract the real client IP from Netlify headers.
 * Netlify sets x-forwarded-for; take the first (leftmost) address.
 */
export const getClientIp = (event) => {
  const xff = event.headers?.['x-forwarded-for'] || ''
  return xff.split(',')[0].trim() || event.headers?.['x-real-ip'] || 'unknown'
}

/**
 * Pre-configured limit configs for each action type.
 */
export const LIMITS = {
  upload: {
    max:      parseInt(process.env.RATE_LIMIT_MAX_UPLOADS || '10', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS   || '900000', 10),
  },
  complaint: {
    max:      5,
    windowMs: 10 * 60 * 1000, // 10 minutes
  },
  auth: {
    max:      20,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
  signature: {
    max:      15,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
}
