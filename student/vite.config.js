import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import crypto from 'crypto'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'api-upload-signature-dev-plugin',
        configureServer(server) {
          server.middlewares.use('/api/upload-signature', (req, res) => {
            if (req.method === 'OPTIONS') {
              res.statusCode = 200
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
              res.end()
              return
            }

            if (req.method !== 'POST') {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }

            let bodyStr = ''
            req.on('data', (chunk) => { bodyStr += chunk })
            req.on('end', () => {
              try {
                const cloudName = env.CLOUDINARY_CLOUD_NAME || env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
                const apiKey    = env.CLOUDINARY_API_KEY || env.VITE_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY
                const apiSecret = env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET

                if (!apiSecret || !apiKey || !cloudName) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: 'Cloudinary credentials missing in .env' }))
                  return
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

                res.statusCode = 200
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  data: {
                    signature,
                    timestamp,
                    apiKey,
                    cloudName,
                    folder,
                    allowedFormats,
                  }
                }))
              } catch (err) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message || 'Error generating signature' }))
              }
            })
          })
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
