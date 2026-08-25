import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getComplaint, updateComplaint, getStudentDetailsForComplaint } from '@/firebase/complaints'
import { uploadToCloudinary, validateImage } from '@/utils/cloudinary'
import { StatusBadge, PriorityBadge, CategoryBadge } from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { STATUSES, PRIORITIES } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/helpers'
import toast from 'react-hot-toast'
import { ArrowLeft, User, X } from 'lucide-react'

export default function ComplaintDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [complaint, setComplaint] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [status,    setStatus]    = useState('')
  const [priority,  setPriority]  = useState('')
  const [reply,     setReply]     = useState('')

  // Proof / Response Image state
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationError, setValidationError] = useState('')
  const fileInputRef = useRef(null)

  // Show Student state
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [studentDetails,   setStudentDetails]   = useState(null)
  const [loadingStudent,   setLoadingStudent]   = useState(false)

  useEffect(() => {
    getComplaint(id).then((c) => {
      if (!c) { toast.error('Complaint not found'); navigate('/complaints'); return }
      setComplaint(c)
      setStatus(c.status)
      setPriority(c.priority)
      setReply(c.adminReply || '')
      setLoading(false)
      if (!c.read) updateComplaint(id, { read: true })
    })
  }, [id])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setValidationError('')

    if (!file) {
      setProofFile(null)
      setProofPreview(null)
      return
    }

    const err = validateImage(file)
    if (err) {
      setValidationError(err)
      toast.error(err)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setProofFile(file)
    const previewUrl = URL.createObjectURL(file)
    setProofPreview(previewUrl)
  }

  const handleRemoveProof = () => {
    setProofFile(null)
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview)
      setProofPreview(null)
    }
    setValidationError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleShowStudent = async () => {
    setShowStudentModal(true)
    if (!studentDetails && complaint) {
      setLoadingStudent(true)
      try {
        const details = await getStudentDetailsForComplaint(complaint)
        setStudentDetails(details)
      } catch (err) {
        toast.error('Failed to load student details')
      } finally {
        setLoadingStudent(false)
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setUploadProgress(0)

    try {
      let adminResponseImageUrl = complaint.adminResponseImageUrl || ''
      let adminResponseImagePublicId = complaint.adminResponseImagePublicId || ''

      if (proofFile) {
        const uploadRes = await uploadToCloudinary(proofFile, id, (pct) => setUploadProgress(pct))
        adminResponseImageUrl = uploadRes.imageUrl || ''
        adminResponseImagePublicId = uploadRes.publicId || ''
      }

      await updateComplaint(id, {
        status,
        priority,
        adminReply: reply,
        adminResponseImageUrl,
        adminResponseImagePublicId,
      })

      toast.success('Complaint updated — student notified.')
      navigate('/complaints')
    } catch (err) {
      toast.error(err.message || 'Failed to update complaint.')
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-3xl space-y-5 md:space-y-6 mt-4">
      <button onClick={() => navigate('/complaints')}
        className="text-sm text-tce-green hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer">
        <ArrowLeft size={16} /> Back to All Complaints
      </button>

      {/* Header card */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-tce-muted dark:text-gray-400 mb-1">
              Submitted: {formatDateTime(complaint.createdAt)} · {complaint.studentName} ({complaint.studentId})
            </p>
            <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">
              {complaint.title}
            </h1>
          </div>
          <div className="flex flex-col gap-2 items-end shrink-0">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <CategoryBadge category={complaint.category} />
          
          {/* Show Student Button */}
          <button
            type="button"
            onClick={handleShowStudent}
            className="btn-primary text-xs md:text-sm px-4 py-2 flex items-center gap-2 shadow-md"
          >
            <User size={16} /> Show Student
          </button>
        </div>

        <div className="p-4 bg-tce-cream dark:bg-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {complaint.description}
        </div>

        {/* Image proof from Cloudinary */}
        {complaint.imageUrl && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-tce-muted dark:text-gray-400 mb-2">Image Proof</p>
            <a href={complaint.imageUrl} target="_blank" rel="noopener noreferrer"
              className="block group relative w-fit">
              <img
                src={complaint.imageUrl}
                alt="Complaint proof"
                className="rounded-xl max-h-72 object-contain border border-tce-dark/10 dark:border-gray-700 cursor-pointer group-hover:opacity-90 transition-opacity"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                Open full size
              </span>
            </a>
          </div>
        )}
      </div>

      {/* Actions card */}
      <div className="card space-y-5">
        <h2 className="font-display text-lg font-bold text-tce-dark dark:text-white">Admin Actions</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Update Status</label>
            <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Set Priority</label>
            <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Reply to Student</label>
          <textarea className="form-input resize-y" rows={4}
            placeholder="Write your official reply to the student…"
            value={reply} onChange={(e) => setReply(e.target.value)} />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Student will receive a real-time notification when you save.
          </p>
        </div>

        {/* Proof / Response Image (Optional) */}
        <div>
          <label className="form-label">
            Proof / Response Image <span className="text-xs text-gray-400 font-normal">(Optional, max 5MB - JPG, JPEG, PNG, WebP)</span>
          </label>

          {!proofPreview ? (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={saving}
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
                src={proofPreview}
                alt="Response proof preview"
                className="max-h-48 max-w-full rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={handleRemoveProof}
                disabled={saving}
                className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-md cursor-pointer transition-colors"
                title="Remove image"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {validationError && (
            <p className="text-xs text-red-500 mt-1">{validationError}</p>
          )}

          {saving && proofFile && (
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span>Uploading response proof to Cloudinary...</span>
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

          {complaint.adminResponseImageUrl && !proofPreview && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-tce-muted dark:text-gray-400 mb-1.5">Existing Admin Response Proof</p>
              <img
                src={complaint.adminResponseImageUrl}
                alt="Admin response proof"
                className="rounded-xl max-h-48 object-contain border border-tce-green/20"
              />
            </div>
          )}
        </div>

        {complaint.adminReply && (
          <div className="p-3.5 bg-tce-green/5 dark:bg-tce-green/10 border-l-4 border-tce-green rounded-xl">
            <p className="text-xs font-semibold text-tce-green mb-1">Previous Reply</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{complaint.adminReply}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button className="btn-ghost" onClick={() => navigate('/complaints')}>Cancel</button>
          <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save & Notify Student'}
          </button>
        </div>
      </div>

      {/* Show Student Modal */}
      {showStudentModal && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-display text-lg font-bold text-tce-dark dark:text-white">
                  Student Information
                </h2>
                <p className="text-xs text-tce-muted dark:text-gray-400">
                  Grievance Submitter Details & Complaint Metrics
                </p>
              </div>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl bg-transparent border-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {loadingStudent ? (
              <div className="py-8"><Spinner /></div>
            ) : studentDetails ? (
              <div className="space-y-5">
                {/* Student Profile Info */}
                <div className="bg-tce-cream dark:bg-gray-800/80 rounded-xl p-4 border border-tce-dark/10 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-tce-green uppercase tracking-wider mb-3">Student Profile</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Full Name</span>
                      <span className="font-semibold text-tce-dark dark:text-white">{studentDetails.student.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Registration Number</span>
                      <span className="font-semibold text-tce-dark dark:text-white">{studentDetails.student.regNo}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Student Email</span>
                      <span className="font-medium text-tce-dark dark:text-white truncate block">{studentDetails.student.email}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Phone Number</span>
                      <span className="font-medium text-tce-dark dark:text-white">{studentDetails.student.phone}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Department</span>
                      <span className="font-medium text-tce-dark dark:text-white">{studentDetails.student.dept}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">Year</span>
                      <span className="font-medium text-tce-dark dark:text-white">Year {studentDetails.student.year}</span>
                    </div>
                  </div>
                </div>

                {/* Complaint Statistics for THIS specific student */}
                <div className="bg-tce-dark/5 dark:bg-gray-800/50 rounded-xl p-4 border border-tce-dark/10 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-tce-dark dark:text-white uppercase tracking-wider mb-3">
                    Complaint Statistics ({studentDetails.student.name})
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="font-display text-xl font-bold text-tce-dark dark:text-white">{studentDetails.stats.total}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Total Complaints</div>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">{studentDetails.stats.resolved}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Resolved</div>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="font-display text-xl font-bold text-amber-600 dark:text-amber-400">{studentDetails.stats.pending}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Pending / Progress</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No student details found.</p>
            )}

            <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button className="btn-ghost text-sm px-5 py-2" onClick={() => setShowStudentModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
