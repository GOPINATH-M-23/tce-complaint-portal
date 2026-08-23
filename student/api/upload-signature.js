import crypto from 'crypto'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!apiSecret || !apiKey || !cloudName) {
      return res.status(500).json({ error: 'Cloudinary credentials not configured on server.' })
    }

    const timestamp = Math.round(Date.now() / 1000)
    const folder = 'tce-complaints'
    const allowedFormats = 'jpg,jpeg,png,webp,gif'

    const params = {
      allowed_formats: allowedFormats,
      folder: folder,
      tags: 'tce-complaint,user-upload',
      timestamp: timestamp,
    }

    const paramsStr = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&')

    const signature = crypto
      .createHash('sha256')
      .update(paramsStr + apiSecret)
      .digest('hex')

    return res.status(200).json({
      data: {
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
        allowedFormats,
      }
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
