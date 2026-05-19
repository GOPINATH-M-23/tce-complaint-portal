import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { logout } from '@/firebase/auth'
import tceLogo from '@/assets/tce-logo.png'
import toast from 'react-hot-toast'

export default function MobileHeader({ title }) {
  const { user, setUser } = useAuth()
  const { dark, toggle }  = useTheme()
  const navigate          = useNavigate()

  const handleLogout = async () => {
    await logout()
    setUser(null)
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700/50 sticky top-0 z-30 min-w-0 overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
        {/* Logo: tight fit, no extra transparent padding */}
        <div className="w-8 h-8 rounded-full border border-tce-dark/20 dark:border-tce-green/30 overflow-hidden shrink-0 flex items-center justify-center bg-tce-cream dark:bg-gray-800">
          <img
            src={tceLogo}
            alt="TCE"
            className="w-full h-full object-cover"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
        <span className="font-display text-[15px] font-bold text-tce-dark dark:text-white truncate">
          {title || 'TCE Portal'}
        </span>
      </div>

      {/* Actions — fixed width, no overflow */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {/* Dark mode toggle — pill switch style, no overflow */}
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="relative flex items-center justify-between w-14 h-7 rounded-full px-1 border-0 cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-tce-green/40"
          style={{ background: dark ? '#1f4d3a' : '#e5e7eb' }}
        >
          {/* Sun icon */}
          <span className="text-[11px] leading-none select-none" aria-hidden>☀</span>
          {/* Moon icon */}
          <span className="text-[11px] leading-none select-none" aria-hidden>☽</span>
          {/* Sliding knob */}
          <span
            className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform duration-300"
            style={{ transform: dark ? 'translateX(28px)' : 'translateX(1px)' }}
          />
        </button>

        {/* Avatar / logout */}
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.name}
            onClick={handleLogout}
            title="Tap to logout"
            className="w-8 h-8 rounded-full object-cover border-2 border-tce-green/30 cursor-pointer shrink-0"
          />
        ) : (
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-8 h-8 rounded-full bg-tce-dark dark:bg-tce-green flex items-center justify-center text-white text-sm font-bold cursor-pointer border-0 shrink-0"
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </button>
        )}
      </div>
    </div>
  )
}
