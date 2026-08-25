import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '@/firebase/auth'
import { useAuth } from '@/context/AuthContext'
import { useComplaints } from '@/context/ComplaintContext'
import { useTheme } from '@/context/ThemeContext'
import tceLogo from '@/assets/tce-logo.png'
import toast from 'react-hot-toast'
import { Home, LayoutDashboard, ClipboardList, Users, TrendingUp, Settings, Sun, Moon } from 'lucide-react'

const NAV = [
  { to: '/',            label: 'Home',           icon: Home },
  { to: '/dashboard',   label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/complaints', label: 'All Complaints', icon: ClipboardList, badge: true },
  { to: '/students',   label: 'Students',       icon: Users },
  { to: '/analytics',  label: 'Analytics',      icon: TrendingUp },
  { to: '/settings',   label: 'Settings',       icon: Settings },
]

export default function AdminSidebar() {
  const { user, setUser }  = useAuth()
  const { complaints }     = useComplaints()
  const { dark, toggle }   = useTheme()
  const navigate           = useNavigate()
  const unreadCount        = complaints.filter((c) => !c.read).length

  const handleLogout = async () => {
    await logout()
    setUser(null)
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside className="flex flex-col w-60 bg-tce-dark h-full py-5 px-4">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-7 pb-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-full border-2 border-white/30 overflow-hidden shrink-0 bg-tce-cream">
          <img src={tceLogo} alt="TCE" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="font-display text-[13px] font-bold text-white leading-tight">TCE Portal</div>
          <div className="text-[11px] text-white/50">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `sidebar-item sidebar-item-dark ${isActive ? 'sidebar-item-active-dark' : ''}`
            }>
            <Icon className="w-4 h-4 shrink-0 opacity-80" />
            <span className="flex-1 ml-2.5">{label}</span>
            {badge && unreadCount > 0 && (
              <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer User Info & Sidebar Logout Button */}
      <div className="mt-auto pt-5 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="text-[13px] font-semibold text-white truncate">{user?.name || 'Admin'}</div>
            <div className="text-[11px] text-white/50 truncate">Administrator</div>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Theme toggle */}
          <button onClick={toggle} aria-label="Toggle dark mode"
            className="relative flex items-center justify-between w-12 h-6 rounded-full px-1 border-0 cursor-pointer transition-colors duration-300 shrink-0"
            style={{ background: dark ? '#3d8c6a' : 'rgba(255,255,255,0.2)' }}>
            <Sun className="w-3 h-3 text-amber-300 z-10 select-none" />
            <Moon className="w-3 h-3 text-white/70 z-10 select-none" />
            <span className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-300"
              style={{ transform: dark ? 'translateX(20px)' : 'translateX(0px)' }} />
          </button>
          {/* Admin Sidebar Logout Button */}
          <button onClick={handleLogout}
            className="flex-1 text-xs py-1.5 rounded-lg bg-white/10 text-white border-0 cursor-pointer hover:bg-white/20 transition-colors">
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}

