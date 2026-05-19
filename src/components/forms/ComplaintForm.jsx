import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitComplaint } from '@/firebase/complaints'
import { validateImage } from '@/utils/cloudinary'
import { useAuth } from '@/context/AuthContext'
import { CATEGORIES, CATEGORY_ICONS } from '@/utils/constants'
import toast from 'react-hot-toast'

export default function ComplaintForm() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], description: '' })
  const [imageFile,  setImageFile]  = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [uploadPct,  setUploadPct]  = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [errors,     setErrors]     = useState({})

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.title.trim())           e.title       = 'Title is required'
    if (form.title.length > 120)      e.title       = 'Title must be under 120 characters'
    if (!form.description.trim())     e.description = 'Description is required'
    if (form.description.length < 20) e.description = 'Please describe in at least 20 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const err = validateImage(file)
    if (err) { toast.error(err); return }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const err = validateImage(file)
    if (err) { toast.error(err); return }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setUploadPct(0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    if (imageFile) setUploading(true)
    try {
      await submitComplaint(
        {
          ...form,
          studentId:    user.studentId || user.uid,
          studentName:  user.name,
          studentEmail: user.email,
          dept:         user.dept || '',
        },
        imageFile,
        (pct) => setUploadPct(pct),
      )
      toast.success('Complaint submitted successfully!')
      navigate('/student/complaints')
    } catch (err) {
      toast.error(err.message || 'Failed to submit complaint')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <label className="form-label">Complaint Title *</label>
        <input className="form-input" placeholder="Brief description of the issue"
          value={form.title} onChange={(e) => set('title', e.target.value)} />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="form-label">Category *</label>
        <select className="form-input" value={form.category}
          onChange={(e) => set('category', e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="form-label">Detailed Description *</label>
        <textarea className="form-input resize-y" rows={5}
          placeholder="Describe the issue in detail — location, duration, impact…"
          value={form.description} onChange={(e) => set('description', e.target.value)} />
        <div className="flex justify-between mt-1">
          {errors.description
            ? <p className="text-red-500 text-xs">{errors.description}</p>
            : <span />}
          <span className="text-xs text-gray-400">{form.description.length} chars</span>
        </div>
      </div>

      {/* Image upload with drag-and-drop + preview */}
      <div>
        <label className="form-label">Image Proof (Optional)</label>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !preview && document.getElementById('img-upload').click()}
          className={`border-2 border-dashed rounded-xl transition-colors ${
            preview
              ? 'border-tce-green/40 dark:border-tce-green/30 cursor-default'
              : 'border-tce-dark/20 dark:border-gray-600 cursor-pointer hover:border-tce-green dark:hover:border-tce-green'
          }`}
        >
          {preview ? (
            <div className="relative p-3">
              <img src={preview} alt="preview"
                className="max-h-48 mx-auto rounded-lg object-contain" />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex flex-col items-center justify-center gap-2">
                  <div className="w-3/4 bg-white/30 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${uploadPct}%` }} />
                  </div>
                  <span className="text-white text-xs font-medium">Uploading {uploadPct}%</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-3xl mb-2 text-gray-400">📸</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Click or drag an image here
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                JPG, PNG, WEBP — max 5 MB
              </div>
            </div>
          )}
        </div>
        <input id="img-upload" type="file" accept="image/*" className="hidden" onChange={handleImage} />
        {preview && (
          <button type="button" onClick={removeImage}
            className="text-xs text-red-500 mt-1.5 hover:underline bg-transparent border-0 cursor-pointer">
            Remove image
          </button>
        )}
      </div>

      {/* Smart priority notice */}
      <div className="flex gap-3 items-start p-3.5 bg-tce-dark/5 dark:bg-tce-dark/20 rounded-xl">
        <span className="text-base shrink-0 mt-0.5">ℹ</span>
        <div>
          <div className="font-semibold text-tce-dark dark:text-white text-xs mb-0.5">Smart Priority System</div>
          <div className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
            Priority is set automatically based on similar complaints. Urgent issues like{' '}
            <strong>Ragging</strong> or <strong>Student Safety</strong> are escalated immediately.
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-ghost px-6" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="btn-primary px-8 disabled:opacity-60 min-w-[140px]">
          {loading ? (uploading ? `Uploading ${uploadPct}%…` : 'Submitting…') : 'Submit Complaint'}
        </button>
      </div>
    </form>
  )
}
