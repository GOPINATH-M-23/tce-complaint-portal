import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import tceLogo from '@/assets/tce-logo.png'
import { Sun, Moon } from 'lucide-react'

export default function MobileHeader({ title }) {
  const { user }         = useAuth()
  const { dark, toggle } = useTheme()
  const navigate         = useNavigate()

  const handleProfileClick = () => {
    navigate('/profile')
  }

  return (
    <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700/50 sticky top-0 z-30 min-w-0 overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
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

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="relative flex items-center justify-between w-14 h-7 rounded-full px-1.5 border-0 cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-tce-green/40"
          style={{ background: dark ? '#1f4d3a' : '#e5e7eb' }}
        >
          <Sun className="w-3.5 h-3.5 text-amber-500 z-10 select-none" />
          <Moon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-200 z-10 select-none" />
          <span
            className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform duration-300"
            style={{ transform: dark ? 'translateX(28px)' : 'translateX(1px)' }}
          />
        </button>

        {/* Avatar / Profile link — Clicking ONLY opens Profile page */}
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.name}
            onClick={handleProfileClick}
            title="View Profile"
            className="w-8 h-8 rounded-full object-cover border-2 border-tce-green/30 cursor-pointer shrink-0"
          />
        ) : (
          <button
            onClick={handleProfileClick}
            title="View Profile"
            className="w-8 h-8 rounded-full bg-tce-dark dark:bg-tce-green flex items-center justify-center text-white text-sm font-bold cursor-pointer border-0 shrink-0"
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
          </button>
        )}
      </div>
    </div>
  )
}
