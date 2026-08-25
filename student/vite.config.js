import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import crypto from 'crypto'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Inject server-side environment variables into Node's process.env
  // so local API handlers (e.g., send-otp, update-year) can access them.
  // This does NOT expose them to the client bundle (Vite only bundles VITE_ vars).
  Object.assign(process.env, env)


  return {
    plugins: [
      react(),
      {
        name: 'api-upload-signature-dev-plugin',
        configureServer(server) {
          server.middlewares.use('/api/send-otp', async (req, res) => {
            try {
              const sendOtpHandler = (await import('./api/send-otp.js')).default
              await sendOtpHandler(req, res)
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message || 'Error executing send-otp' }))
            }
          })

          server.middlewares.use('/api/verify-otp', async (req, res) => {
            try {
              const verifyOtpHandler = (await import('./api/verify-otp.js')).default
              await verifyOtpHandler(req, res)
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message || 'Error executing verify-otp' }))
            }
          })

          server.middlewares.use('/api/update-year', async (req, res) => {
            try {
              const updateYearHandler = (await import('./api/update-year.js')).default
              await updateYearHandler(req, res)
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message || 'Error executing update-year' }))
            }
          })

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
