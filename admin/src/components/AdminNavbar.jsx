import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import tceLogo from '@/assets/tcenew.png'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'

export default function AdminNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen]  = useState(false)
  const { dark, toggle } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = ['Home', 'About', 'Features', 'Contact']

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-[5%] h-16 flex items-center justify-between"
      style={{
        background: scrolled ? 'rgba(31,77,58,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
      }}
    >
      {/* Brand */}
      <Link to="/" className="flex items-center gap-3 no-underline">
        <img
          src={tceLogo}
          alt="TCE Logo"
          className="w-11 h-11 object-cover rounded-full border-2 border-white/40"
        />
        <div>
          <div className="font-display text-[15px] font-bold text-white leading-tight">TCE Admin</div>
          <div className="text-[11px] text-white/60 tracking-widest uppercase">Portal</div>
        </div>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-7">
        {links.map((l) => (
          <a key={l} className="nav-link text-white/80 hover:text-white" href={`#${l.toLowerCase()}`}>{l}</a>
        ))}
        <button
          onClick={toggle}
          className="text-white/70 hover:text-white text-lg transition-colors bg-transparent border-0 cursor-pointer"
          aria-label="Toggle theme"
        >
          {dark ? '☀️' : '🌙'}
        </button>
        {user ? (
          <button className="btn-primary text-sm px-6 py-2" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        ) : (
          <button className="btn-primary text-sm px-6 py-2" onClick={() => navigate('/login')}>
            Admin Login
          </button>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden text-white text-2xl bg-transparent border-0 cursor-pointer"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-tce-dark/97 backdrop-blur-md px-5 py-4 flex flex-col gap-3 md:hidden border-t border-white/10">
          {links.map((l) => (
            <a key={l} className="nav-link text-base py-1" href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{l}</a>
          ))}
          <div className="h-px bg-white/10 my-1" />
          {user ? (
            <button className="btn-primary text-sm w-full py-2.5" onClick={() => { navigate('/dashboard'); setMenuOpen(false) }}>
              Go to Dashboard
            </button>
          ) : (
            <button className="btn-primary text-sm w-full py-2.5" onClick={() => { navigate('/login'); setMenuOpen(false) }}>
              Admin Login
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
