import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useComplaints } from '@/context/ComplaintContext'
import { getComplaintById, updateComplaintStatus, updateComplaintPriority, addAdminReply } from '@/firebase/complaints'
import Spinner from '@/components/ui/Spinner'
import { StatusBadge, PriorityBadge, CategoryBadge } from '@/components/ui/Badge'
import { formatDate, formatRelative } from '@/utils/helpers'
import { STATUSES, PRIORITIES } from '@/utils/constants'
import toast from 'react-hot-toast'
import { ArrowLeft, User, X } from 'lucide-react'

export default function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { markRead } = useComplaints()

  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Reply form state
  const [replyText, setReplyText] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [replyImage, setReplyImage] = useState(null)
  const [replyImagePreview, setReplyImagePreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Modals & Student info states
  const [showStudentInfo, setShowStudentInfo] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
      if (!c) { toast.error('Complaint not found'); navigate('/admin/complaints'); return }
      setComplaint(c)
      setStatus(c.status)
      setPriority(c.priority)
      setReply(c.adminReply || '')
      setLoading(false)
      if (!c.read) updateComplaint(id, { read: true })
    })
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateComplaint(id, { status, priority, adminReply: reply })
      toast.success('Complaint updated — student notified.')
      navigate('/admin/complaints')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-3xl space-y-5 md:space-y-6 mt-4">
      <button onClick={() => navigate('/admin/complaints')}
        className="text-sm text-tce-green hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer">
        ← Back to All Complaints
      </button>

      {/* Header card */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-tce-muted dark:text-gray-400 mb-1">
              {formatDate(complaint.createdAt)} · {complaint.studentName} ({complaint.studentId})
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

        <CategoryBadge category={complaint.category} />

        <div className="p-4 bg-tce-cream dark:bg-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
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

        {complaint.adminReply && (
          <div className="p-3.5 bg-tce-green/5 dark:bg-tce-green/10 border-l-4 border-tce-green rounded-xl">
            <p className="text-xs font-semibold text-tce-green mb-1">Previous Reply</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{complaint.adminReply}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button className="btn-ghost" onClick={() => navigate('/admin/complaints')}>Cancel</button>
          <button className="btn-primary px-8" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save & Notify Student'}
          </button>
        </div>
      </div>
    </div>
  )
}
