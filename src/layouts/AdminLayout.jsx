import { Outlet, NavLink } from 'react-router-dom'
import AdminSidebar from '@/components/AdminSidebar'
import MobileHeader from '@/components/MobileHeader'
import { useComplaints } from '@/context/ComplaintContext'
import tceCampus from '@/assets/tce-campus.png'
import { LayoutDashboard, ClipboardList, Users, TrendingUp, Settings } from 'lucide-react'

const ADMIN_MOB_NAV = [
  { to: '/admin',            icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/complaints', icon: ClipboardList,   label: 'Complaints', badge: true },
  { to: '/admin/students',   icon: Users,           label: 'Students' },
  { to: '/admin/analytics',  icon: TrendingUp,      label: 'Analytics' },
  { to: '/admin/settings',   icon: Settings,        label: 'Settings' },
]

export default function AdminLayout() {
  const { complaints } = useComplaints()
  const unread = complaints.filter((c) => !c.read).length

  return (
    <div className="flex h-screen overflow-hidden bg-tce-cream dark:bg-gray-950">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0 h-full overflow-y-auto">
        <AdminSidebar />
      </div>

      {/* Right side column */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top header */}
        <MobileHeader title="Admin Panel" />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {/* Campus glassmorphism banner — shown on both mobile and desktop */}
          <div className="relative mx-3 md:mx-6 mt-3 md:mt-6 mb-0 rounded-2xl overflow-hidden h-16 md:h-24">
            <img src={tceCampus} alt="TCE Campus"
              className="absolute inset-0 w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-r from-tce-dark/80 to-tce-green/60" />
            <div className="relative h-full flex items-center px-4 md:px-6">
              <div className="glass rounded-xl px-4 py-2 md:px-5 md:py-2.5">
                <p className="text-white/80 text-[9px] md:text-xs uppercase tracking-widest font-medium">Admin Panel</p>
                <p className="text-white font-display text-sm md:text-lg font-bold leading-tight">
                  TCE Smart Complaint Portal
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {ADMIN_MOB_NAV.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-nav-item relative${isActive ? ' active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5 shrink-0" />
                {badge && unread > 0 && (
                  <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
                <span className={`text-[10px] font-medium ${isActive ? 'text-tce-dark dark:text-tce-green' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
