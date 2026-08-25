import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import tceLogo from '@/assets/tce-logo.png'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Sun, Moon, X, Menu } from 'lucide-react'

export default function Navbar() {
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
          <div className="font-display text-[15px] font-bold text-white leading-tight">TCE Smart</div>
          <div className="text-[11px] text-white/60 tracking-widest uppercase">Complaint Portal</div>
        </div>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-7">
        {links.map((l) => (
          <a key={l} className="nav-link" href={`#${l.toLowerCase()}`}>{l}</a>
        ))}
        <button
          onClick={toggle}
          className="text-white/70 hover:text-white transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
        </button>
        {user ? (
          <button className="btn-primary text-sm px-5 py-2" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
        ) : (
          <>
            <button className="btn-primary text-sm px-5 py-2" onClick={() => navigate('/login')}>
              Student Login
            </button>
            <button
              className="text-sm px-5 py-2 rounded-full font-semibold border border-white/40 text-white bg-white/10 hover:bg-white/20 transition-all"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </button>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden text-white bg-transparent border-0 cursor-pointer p-1"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-tce-dark/97 backdrop-blur-md px-5 py-4 flex flex-col gap-3 md:hidden border-t border-white/10">
          {links.map((l) => (
            <a key={l} className="nav-link text-base py-1" href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{l}</a>
          ))}
          <div className="h-px bg-white/10 my-1" />
          <button className="btn-primary text-sm w-full py-2.5" onClick={() => { navigate('/login/student'); setMenuOpen(false) }}>
            Student Login
          </button>
          <button className="text-sm w-full py-2.5 rounded-full font-semibold border border-white/40 text-white bg-transparent"
            onClick={() => { navigate('/signup'); setMenuOpen(false) }}>
            Sign Up
          </button>
          <button
            className="text-sm w-full py-2.5 rounded-full font-semibold border border-white/20 text-white/70 bg-transparent"
            onClick={() => { navigate('/login/admin'); setMenuOpen(false) }}>
            Admin Login
          </button>
        </div>
      )}
    </nav>
  )
}
