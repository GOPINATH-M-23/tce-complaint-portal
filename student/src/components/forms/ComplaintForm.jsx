import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitComplaint } from '@/firebase/complaints'
import { validateImage } from '@/utils/cloudinary'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintContext'
import { CATEGORIES, CATEGORY_ICONS } from '@/utils/constants'
import { getWeeklyComplaintCount } from '@/utils/helpers'
import toast from 'react-hot-toast'
import { Camera, ClipboardList, ChevronDown, Check } from 'lucide-react'

export default function ComplaintForm() {
  const { user } = useAuth()
  const { complaints } = useComplaints()
  const navigate  = useNavigate()

  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], description: '' })
  const [imageFile,  setImageFile]  = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [uploadPct,  setUploadPct]  = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [errors,     setErrors]     = useState({})
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)

  const weeklySubmittedCount = getWeeklyComplaintCount(complaints)
  const remainingCount = Math.max(0, 3 - weeklySubmittedCount)
  const isLimitReached = weeklySubmittedCount >= 3

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
    if (isLimitReached) {
      toast.error('You have reached the maximum of 3 complaints for this week. You can submit a new complaint next week.')
      return
    }
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
      navigate('/complaints')
    } catch (err) {
      toast.error(err.message || 'Failed to submit complaint')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const SelectedCategoryIcon = CATEGORY_ICONS[form.category]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Remaining Complaints Box */}
      <div className={`p-4 rounded-xl border transition-colors flex items-start gap-3 ${
        isLimitReached
          ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200'
          : 'bg-tce-green/10 dark:bg-tce-green/15 border-tce-green/30 text-tce-dark dark:text-white'
      }`}>
        <ClipboardList className={`w-5 h-5 shrink-0 mt-0.5 ${isLimitReached ? 'text-amber-600 dark:text-amber-400' : 'text-tce-green'}`} />
        <div className="flex-1 text-sm min-w-0">
          <div className="flex items-center justify-between font-semibold mb-0.5 gap-2">
            <span className="truncate">Complaints Remaining This Week</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
              isLimitReached
                ? 'bg-amber-600 text-white dark:bg-amber-500'
                : 'bg-tce-green text-white dark:bg-tce-green dark:text-white'
            }`}>
              {remainingCount} / 3
            </span>
          </div>
          {isLimitReached ? (
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              You have reached the maximum of 3 complaints for this week. You can submit a new complaint next week.
            </p>
          ) : (
            <p className="text-xs text-tce-muted dark:text-gray-400 mt-0.5">
              Each student can submit a maximum of 3 complaints per calendar week (Monday to Sunday).
            </p>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="form-label">Complaint Title *</label>
        <input className="form-input" placeholder="Brief description of the issue"
          value={form.title} onChange={(e) => set('title', e.target.value)} />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Category */}
      <div className="relative">
        <label className="form-label">Category *</label>
        <button
          type="button"
          onClick={() => setCatDropdownOpen((prev) => !prev)}
          className="form-input flex items-center justify-between w-full text-left cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {SelectedCategoryIcon && (
              <SelectedCategoryIcon className="w-4 h-4 text-tce-green shrink-0" />
            )}
            <span className="truncate text-sm text-tce-dark dark:text-white">{form.category}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {catDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setCatDropdownOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1">
              {CATEGORIES.map((c) => {
                const IconComp = CATEGORY_ICONS[c]
                const isSel = form.category === c
                return (
                  <div
                    key={c}
                    onClick={() => {
                      set('category', c)
                      setCatDropdownOpen(false)
                    }}
                    className={`flex items-center justify-between px-3.5 py-2 text-sm cursor-pointer transition-colors ${
                      isSel
                        ? 'bg-tce-green/10 dark:bg-tce-green/20 text-tce-green font-medium'
                        : 'text-tce-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {IconComp && <IconComp className="w-4 h-4 text-tce-green shrink-0" />}
                      <span className="truncate">{c}</span>
                    </div>
                    {isSel && <Check className="w-4 h-4 text-tce-green shrink-0" />}
                  </div>
                )
              })}
            </div>
          </>
        )}
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
              <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
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

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-ghost px-6" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button type="submit" disabled={loading || isLimitReached}
          className="btn-primary px-8 disabled:opacity-60 disabled:cursor-not-allowed min-w-[140px]">
          {loading ? (uploading ? `Uploading ${uploadPct}%…` : 'Submitting…') : 'Submit Complaint'}
        </button>
      </div>
    </form>
  )
}

