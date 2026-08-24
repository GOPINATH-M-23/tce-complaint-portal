import { useState, useRef } from 'react'
import { createAdminNotification } from '@/firebase/notifications'
import { validateImage } from '@/utils/cloudinary'
import toast from 'react-hot-toast'

export default function NotificationForm({ onNotificationSent }) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setValidationError('')

    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      return
    }

    const err = validateImage(file)
    if (err) {
      setValidationError(err)
      toast.error(err)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
    setValidationError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.')
      return
    }

    setSubmitting(true)
    setUploadProgress(0)

    try {
      await createAdminNotification(
        { title, message, imageFile },
        (progress) => setUploadProgress(progress)
      )
      toast.success('Notification sent successfully!')
      setTitle('')
      setMessage('')
      handleRemoveImage()
      if (onNotificationSent) onNotificationSent()
    } catch (err) {
      console.error('[NotificationForm submit error]', err)
      toast.error(err.message || 'Failed to send notification.')
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📢</span>
        <div>
          <h2 className="font-display text-base font-bold text-tce-dark dark:text-white">
            Send Broadcast Notification
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Publish an announcement with an optional image to all students
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">
            Notification Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. System Maintenance Notice"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="form-label">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            className="form-input min-h-[100px] resize-y"
            placeholder="Write details of the notification here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        {/* Optional Image Upload */}
        <div>
          <label className="form-label">
            Attach Photo/Image <span className="text-xs text-gray-400 font-normal">(Optional, max 5MB - JPG, PNG, WEBP, GIF)</span>
          </label>

          {!imagePreview ? (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={submitting}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-xs file:font-semibold
                file:bg-tce-green/10 file:text-tce-green
                hover:file:bg-tce-green/20
                cursor-pointer"
            />
          ) : (
            <div className="relative mt-2 inline-block rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 p-2">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="max-h-48 max-w-full rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={submitting}
                className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-md cursor-pointer transition-colors"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          )}

          {validationError && (
            <p className="text-xs text-red-500 mt-1">{validationError}</p>
          )}
        </div>

        {/* Upload Progress Bar */}
        {submitting && imageFile && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span>Uploading image to Cloudinary...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-tce-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Send Notification</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
