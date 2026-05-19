import ComplaintForm from '@/components/forms/ComplaintForm'

export default function NewComplaint() {
  return (
    <div className="max-w-2xl">
      <div className="mb-5 md:mb-6">
        <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">
          New Complaint
        </h1>
        <p className="text-tce-muted dark:text-gray-400 text-sm mt-1">
          Submit a new grievance. Your identity is protected and only visible to admins.
        </p>
      </div>
      <div className="card">
        <ComplaintForm />
      </div>
    </div>
  )
}
