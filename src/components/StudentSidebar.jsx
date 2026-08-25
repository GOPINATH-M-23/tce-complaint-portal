import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '@/firebase/auth'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintContext'
import { useTheme } from '@/context/ThemeContext'
import tceLogo from '@/assets/tcenew.png'
import toast from 'react-hot-toast'
import { Home, LayoutDashboard, ClipboardList, Plus, Bell, User, Sun, Moon } from 'lucide-react'

const NAV = [
  { to: '/',               icon: Home,            label: 'Home', end: true },
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/complaints',     icon: ClipboardList,   label: 'Past Complaints' },
  { to: '/complaints/new', icon: Plus,            label: 'New Complaint', iconStyle: true },
  { to: '/notifications',  icon: Bell,            label: 'Notifications', badge: true },
  { to: '/profile',        icon: User,            label: 'Profile' },
]

export default function StudentSidebar() {
  const { user, setUser } = useAuth()
  const { unreadNotifs } = useComplaints()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

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

  return (
    <aside className="flex flex-col w-60 bg-white dark:bg-gray-900 border-r border-tce-dark/[0.08] dark:border-gray-700/50 h-full py-5 px-4">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-7 pb-5 border-b border-tce-dark/10 dark:border-gray-700/50">
        <div className="w-9 h-9 rounded-full border-2 border-tce-dark/20 dark:border-tce-green/30 overflow-hidden shrink-0 bg-tce-cream dark:bg-gray-800">
          <img src={tceLogo} alt="TCE" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="font-display text-[13px] font-bold text-tce-dark dark:text-white leading-tight">TCE Portal</div>
          <div className="text-[11px] text-tce-green dark:text-tce-green/80">Student</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ to, icon: Icon, label, badge, iconStyle, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `sidebar-item sidebar-item-light ${isActive ? 'sidebar-item-active-light' : ''}`
            }>
            {iconStyle
              ? <span className="w-5 h-5 flex items-center justify-center rounded-md bg-tce-dark/10 dark:bg-tce-green/20 text-tce-dark dark:text-tce-green font-bold shrink-0"><Icon className="w-3.5 h-3.5" /></span>
              : <Icon className="w-5 h-5 shrink-0 opacity-80" />
            }
            <span className="flex-1 ml-2">{label}</span>
            {badge && unreadNotifs > 0 && (
              <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center font-semibold">
                {unreadNotifs > 9 ? '9+' : unreadNotifs}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer User Info & Sidebar Logout Button */}
      <div className="mt-auto pt-5 border-t border-tce-dark/10 dark:border-gray-700/50">
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 mb-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          title="Open Profile"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-tce-green/30 shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-tce-dark dark:bg-tce-green flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.name?.charAt(0) || 'S'}
            </div>
          )}
          <div className="overflow-hidden min-w-0">
            <div className="text-[13px] font-semibold text-tce-dark dark:text-white truncate">{user?.name}</div>
            <div className="text-[11px] text-tce-green dark:text-tce-green/70 truncate">{user?.studentId} · {user?.dept}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Pill toggle */}
          <button onClick={toggle} aria-label="Toggle dark mode"
            className="flex items-center justify-between w-12 h-6 rounded-full px-1 border-0 cursor-pointer transition-colors duration-300 shrink-0 relative"
            style={{ background: dark ? '#1f4d3a' : '#e5e7eb' }}>
            <Sun className="w-3 h-3 text-amber-500 z-10 select-none" />
            <Moon className="w-3 h-3 text-slate-400 dark:text-slate-200 z-10 select-none" />
            <span className="absolute ml-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-300"
              style={{ transform: dark ? 'translateX(20px)' : 'translateX(0px)' }} />
          </button>
          {/* Sidebar Logout Button */}
          <button onClick={handleLogout} className="btn-outline flex-1 text-xs py-1.5 cursor-pointer">
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
