import { useNavigate } from 'react-router-dom'
import { logout } from '@/firebase/auth'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintContext'
import toast from 'react-hot-toast'

export default function StudentProfile() {
  const { user, setUser } = useAuth()
  const { complaints }   = useComplaints()
  const navigate        = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      setUser(null)
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (err) {
      toast.error('Logout failed. Please try again.')
    }
  }

  const fields = [
    ['Full Name',            user?.name],
    ['Student ID',           user?.studentId],
    ['Registration Number',  user?.regNo   || '—'],
    ['Phone Number',         user?.phone   || '—'],
    ['Email',                user?.email],
    ['Department',           user?.dept],
    ['Year',                 `Year ${user?.year}`],
    ['Status',               'Active'],
  ]

  return (
    <div className="max-w-xl space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl md:text-2xl font-bold text-tce-dark dark:text-white">My Profile</h1>
      </div>

      {/* Avatar card */}
      <div className="card flex items-center gap-4 md:gap-5">
        {user?.photoURL ? (
          <img src={user.photoURL} alt={user.name}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-tce-green/30 shrink-0" />
        ) : (
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-tce-dark dark:bg-tce-green flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user?.name?.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-display text-lg md:text-xl font-bold text-tce-dark dark:text-white truncate">
            {user?.name}
          </div>
          <div className="text-tce-green dark:text-tce-green/80 text-sm truncate">
            {user?.studentId} · {user?.dept}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{user?.email}</div>
        </div>
      </div>

      {/* Detail rows */}
      <div className="card divide-y divide-tce-dark/[0.06] dark:divide-gray-700/50">
        {fields.map(([k, v]) => (
          <div key={k} className="flex justify-between items-center py-3 text-sm gap-2">
            <span className="text-gray-500 dark:text-gray-400 shrink-0">{k}</span>
            <span className="font-medium text-tce-dark dark:text-white text-right truncate max-w-[60%]">{v}</span>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Total',    v: complaints.length },
          { l: 'Resolved', v: complaints.filter((c) => c.status === 'Resolved').length },
          { l: 'Pending',  v: complaints.filter((c) => !['Resolved', 'Rejected'].includes(c.status)).length },
        ].map((s) => (
          <div key={s.l} className="card text-center py-4">
            <div className="font-display text-2xl font-bold text-tce-dark dark:text-white">{s.v}</div>
            <div className="text-xs text-tce-muted dark:text-gray-400 mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Mobile-only Logout Section */}
      <div className="pt-2 md:hidden">
        <button
          onClick={handleLogout}
          className="btn-outline w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        To update your profile details, please contact the college admin.
      </p>
    </div>
  )
}
