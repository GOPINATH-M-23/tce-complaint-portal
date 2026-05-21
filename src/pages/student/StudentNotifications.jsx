import { useComplaints } from '@/context/ComplaintContext'
import { markNotificationRead, markAllNotificationsRead } from '@/firebase/complaints'
import { useAuth } from '@/context/AuthContext'
import { formatRelative } from '@/utils/helpers'
import EmptyState from '@/components/ui/EmptyState'

const TYPE_META = {
  submitted:        { icon: '✓',  bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
  reply:            { icon: '💬', bg: 'bg-blue-50   dark:bg-blue-950/30',    border: 'border-blue-200   dark:border-blue-800/50',    dot: 'bg-blue-500'   },
  status_update:    { icon: '↻',  bg: 'bg-amber-50  dark:bg-amber-950/30',   border: 'border-amber-200  dark:border-amber-800/50',   dot: 'bg-amber-500'  },
  reply_and_status: { icon: '↻',  bg: 'bg-purple-50 dark:bg-purple-950/30',  border: 'border-purple-200 dark:border-purple-800/50',  dot: 'bg-purple-500' },
  update:           { icon: 'i',  bg: 'bg-gray-50   dark:bg-gray-800/50',    border: 'border-gray-200   dark:border-gray-700/50',    dot: 'bg-gray-400'   },
}

function NotifCard({ n, onRead }) {
  const meta = TYPE_META[n.type] || TYPE_META.update
  return (
    <div
      onClick={() => onRead(n)}
      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
        n.read
          ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700/50'
          : `${meta.bg} ${meta.border}`
      }`}
    >
      {/* Icon dot */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 ${n.read ? 'bg-gray-300 dark:bg-gray-600' : meta.dot}`}>
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${n.read ? 'text-gray-500 dark:text-gray-400' : 'text-tce-dark dark:text-white font-medium'}`}>
          {n.message}
        </p>
        {/* Show admin reply inline if present */}
        {n.adminReply && (
          <div className="mt-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-tce-green/20 dark:border-tce-green/20">
            <p className="text-xs text-tce-green font-semibold mb-0.5">Admin Reply</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{n.adminReply}</p>
          </div>
        )}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
          {formatRelative(n.createdAt)}
        </p>
      </div>

      {!n.read && (
        <span className="w-2 h-2 rounded-full bg-tce-green shrink-0 mt-2 animate-pulse" />
      )}
    </div>
  )
}

export default function StudentNotifications() {
  const { notifications } = useComplaints()
  const { user } = useAuth()

  const handleRead = async (n) => { if (!n.read) await markNotificationRead(n.id) }
  const handleReadAll = async () => {
    await markAllNotificationsRead(user?.studentId || user?.uid)
  }

  const unread = notifications.filter((n) => !n.read)
  const read   = notifications.filter((n) =>  n.read)

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">
            Notifications
          </h1>
          <p className="text-tce-muted dark:text-gray-400 text-sm mt-0.5">{unread.length} unread</p>
        </div>
        {unread.length > 0 && (
          <button onClick={handleReadAll}
            className="text-xs text-tce-green hover:underline bg-transparent border-0 cursor-pointer font-medium">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications yet"
          desc="You'll be notified when your complaint status changes or admin replies."
        />
      ) : (
        <>
          {unread.length > 0 && (
            <div className="card space-y-2.5">
              <h2 className="font-semibold text-tce-dark dark:text-white text-sm">
                Unread ({unread.length})
              </h2>
              {unread.map((n) => <NotifCard key={n.id} n={n} onRead={handleRead} />)}
            </div>
          )}
          {read.length > 0 && (
            <div className="card space-y-2.5">
              <h2 className="font-semibold text-gray-400 dark:text-gray-500 text-sm">Earlier</h2>
              {read.map((n) => <NotifCard key={n.id} n={n} onRead={handleRead} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
