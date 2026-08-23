import { Outlet, NavLink } from 'react-router-dom'
import StudentSidebar from '@/components/StudentSidebar'
import MobileHeader from '@/components/MobileHeader'
import { useComplaints } from '@/context/ComplaintContext'

const MOB_NAV = [
  { to: '/student',                 icon: '📊', label: 'Dashboard',  end: true },
  { to: '/student/complaints',      icon: '📋', label: 'Complaints' },
  { to: '/student/complaints/new',  icon: '➕', label: 'New',        fab: true },
  { to: '/student/notifications',   icon: '🔔', label: 'Alerts',    badge: true },
  { to: '/student/profile',         icon: '👤', label: 'Profile' },
]

export default function StudentLayout() {
  const { unreadNotifs } = useComplaints()

  return (
    <div className="flex h-screen overflow-hidden bg-tce-cream dark:bg-gray-950">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex shrink-0 h-full overflow-y-auto">
        <StudentSidebar />
      </div>

      {/* Right side column */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top header */}
        <MobileHeader title="TCE Portal" />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-6xl mx-auto pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="mobile-nav">
        {MOB_NAV.map(({ to, icon, label, end, badge, fab }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-nav-item relative${isActive ? ' active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {fab ? (
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-tce-dark dark:bg-tce-green text-white text-xl -mt-6 shadow-xl border-4 border-tce-cream dark:border-gray-950 shrink-0 z-10">
                    {icon}
                  </span>
                ) : (
                  <span className="text-[20px] leading-none shrink-0">{icon}</span>
                )}
                {badge && unreadNotifs > 0 && (
                  <span className="absolute top-0.5 right-1/2 translate-x-3 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold leading-none z-10">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
                {!fab && (
                  <span className={`text-[10px] font-medium w-full text-center truncate ${isActive ? 'text-tce-dark dark:text-tce-green' : ''}`}>
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
