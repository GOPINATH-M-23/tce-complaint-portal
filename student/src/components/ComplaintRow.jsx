import { StatusBadge, PriorityBadge } from './ui/Badge'
import { formatDateTime } from '@/utils/helpers'

export default function ComplaintRow({ complaint, onClick }) {
  const handleClick = () => {
    if (onClick) onClick(complaint)
  }

  return (
    <div className="complaint-row cursor-pointer" onClick={handleClick}>
      <div className="flex items-start justify-between gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!complaint.read && (
              <span className="w-2 h-2 rounded-full bg-tce-green shrink-0 animate-pulse-dot" />
            )}
            <span className="font-semibold text-tce-dark dark:text-white text-[14px] md:text-[15px] line-clamp-2">
              {complaint.title}
            </span>
          </div>
          <div className="text-xs text-tce-green dark:text-tce-green/70 mt-0.5 truncate">
            {`${complaint.category} · ${formatDateTime(complaint.createdAt)}`}
          </div>
          {complaint.adminReply && (
            <div className="mt-2 text-xs text-gray-700 dark:text-gray-300 px-3 py-2 bg-tce-dark/5 dark:bg-tce-dark/20 rounded-lg border-l-2 border-tce-green line-clamp-2">
              <span className="font-semibold">Admin:</span> {complaint.adminReply}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 items-end shrink-0">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
        </div>
      </div>
    </div>
  )
}
