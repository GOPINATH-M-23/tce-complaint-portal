import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminNavbar from '@/components/AdminNavbar'
import tceLogo   from '@/assets/tcenew.png'
import tceCampus from '@/assets/tceai.png'
import { collection, getDocs, onSnapshot } from "firebase/firestore"
import { db } from "@/firebase/config"

const ADMIN_FEATURES = [
  { icon: '🛡️', title: 'Secure Admin Access', desc: 'Pre-authorized administrator authentication via Firebase & Google OAuth.' },
  { icon: '⚡', title: 'Real-time Resolution', desc: 'Live snapshot tracking of incoming complaints across 18 campus departments.' },
  { icon: '👤', title: 'Student Identity Verification', desc: 'Direct access to student registration details, department records, and submission history.' },
  { icon: '📊', title: 'Analytics & Trends', desc: 'Comprehensive visual metrics for resolution speed, department workloads, and priority escalations.' },
]

const CONTACT = [
  { icon: '📍', t: 'Address', v: 'Thiruparankundram, Madurai – 625 015, Tamil Nadu' },
  { icon: '📞', t: 'Phone',   v: '+91 452 248 2240' },
  { icon: '📧', t: 'Email',   v: 'principal@tce.edu' },
  { icon: '🌐', t: 'Website', v: 'www.tce.edu' },
]

export default function AdminLandingPage() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)

  const [totalComplaints, setTotalComplaints] = useState(0)
  const [resolvedComplaints, setResolvedComplaints] = useState(0)
  const [pendingComplaints, setPendingComplaints] = useState(0)
  const [criticalComplaints, setCriticalComplaints] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let unsub
    try {
      unsub = onSnapshot(collection(db, "complaints"), (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data())
        setTotalComplaints(data.length)
        setResolvedComplaints(data.filter(c => c.status === "Resolved").length)
        setPendingComplaints(data.filter(c => !["Resolved", "Rejected"].includes(c.status)).length)
        setCriticalComplaints(data.filter(c => ["Critical", "High"].includes(c.priority)).length)
        setLoadingStats(false)
      }, async (err) => {
        console.warn("Realtime listener failed, falling back to getDocs:", err)
        try {
          const snapshot = await getDocs(collection(db, "complaints"))
          const data = snapshot.docs.map(doc => doc.data())
          setTotalComplaints(data.length)
          setResolvedComplaints(data.filter(c => c.status === "Resolved").length)
          setPendingComplaints(data.filter(c => !["Resolved", "Rejected"].includes(c.status)).length)
          setCriticalComplaints(data.filter(c => ["Critical", "High"].includes(c.priority)).length)
        } catch (e) {
          console.error("Error loading admin stats", e)
        } finally {
          setLoadingStats(false)
        }
      })
    } catch (e) {
      console.error("Error setting up stats listener", e)
      setLoadingStats(false)
    }

    return () => { if (unsub) unsub() }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AdminNavbar />

      {/* ── HERO — Matched exactly with Student Home ────────── */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <img src={tceCampus} alt="TCE Campus"
          className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2319cc] via-[#1f4d3aa6] to-[#00000080]" />

        <div className={`relative z-10 text-center px-5 max-w-3xl w-full transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <img src={tceLogo} alt="TCE Admin"
            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-full border-[3px] border-white/50 mx-auto mb-5 animate-float shadow-2xl" />
          <h1 className="font-display text-[clamp(28px,6vw,64px)] font-bold text-white leading-tight mb-4 drop-shadow-lg">
            TCE Admin<br />
            <span className="text-[#7dd3b0]">Complaint Portal</span>
          </h1>
          <p className="text-[clamp(13px,2vw,18px)] text-white/80 mb-8 leading-relaxed">
            Thiagarajar College of Engineering, Madurai<br />
            Official Administrative Gateway for Grievance Management & Resolution
          </p>
          <div className="flex gap-4 justify-center">
            <button
              className="btn-primary text-sm md:text-[15px] px-8 md:px-10 py-3 md:py-3.5 shadow-xl shadow-tce-dark/40 font-semibold"
              onClick={() => navigate('/login')}
            >
              🔐 Admin Login
            </button>
          </div>

          {/* Stats overview */}
          <div className="flex gap-3 md:gap-4 justify-center mt-10 flex-wrap">
            <div className="glass px-4 md:px-5 py-2.5 md:py-3 text-center min-w-[72px]">
              <div className="font-display text-xl md:text-2xl font-bold text-white">
                {loadingStats ? <span className="animate-pulse">...</span> : totalComplaints}
              </div>
              <div className="text-[10px] md:text-xs text-white/70 mt-0.5">Total Received</div>
            </div>
            <div className="glass px-4 md:px-5 py-2.5 md:py-3 text-center min-w-[72px]">
              <div className="font-display text-xl md:text-2xl font-bold text-[#86efac]">
                {loadingStats ? <span className="animate-pulse">...</span> : resolvedComplaints}
              </div>
              <div className="text-[10px] md:text-xs text-white/70 mt-0.5">Resolved</div>
            </div>
            <div className="glass px-4 md:px-5 py-2.5 md:py-3 text-center min-w-[72px]">
              <div className="font-display text-xl md:text-2xl font-bold text-[#fcd34d]">
                {loadingStats ? <span className="animate-pulse">...</span> : pendingComplaints}
              </div>
              <div className="text-[10px] md:text-xs text-white/70 mt-0.5">Pending Action</div>
            </div>
            <div className="glass px-4 md:px-5 py-2.5 md:py-3 text-center min-w-[72px]">
              <div className="font-display text-xl md:text-2xl font-bold text-[#f87171]">
                {loadingStats ? <span className="animate-pulse">...</span> : criticalComplaints}
              </div>
              <div className="text-[10px] md:text-xs text-white/70 mt-0.5">High Priority</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ADMIN PORTAL ────────────────────────────────── */}
      <section id="about" className="py-16 md:py-20 px-5 md:px-[5%] bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div>
            <div className="text-tce-green text-xs font-semibold tracking-[2px] uppercase mb-3">Admin Gateway</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-tce-dark dark:text-white leading-tight mb-5">
              Streamlined Grievance<br />Administration
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-5 text-[15px]">
              The <strong>TCE Admin Portal</strong> equips institutional administrators with real-time tools to review, prioritize, assign, and respond to student complaints.
              Authorized administrators can access full student profiles, track resolution timeframes, and post official responses.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {['Authorized Access Only', 'Real-time Student Data', 'Status & Priority Updates', 'Official Admin Replies', 'Departmental Insights', 'Audit Logging'].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-tce-green font-bold">✓</span> {f}
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img src={tceCampus} alt="TCE Admin"
              className="w-full rounded-2xl object-cover h-64 md:h-80 shadow-2xl shadow-tce-dark/20" />
            <div className="glass-white absolute -bottom-4 -left-4 md:-bottom-5 md:-left-5 px-4 py-3 md:px-5 md:py-3.5">
              <div className="font-display text-2xl md:text-3xl font-bold text-tce-dark dark:text-tce-dark">18</div>
              <div className="text-xs text-tce-green font-medium mt-0.5">Departments Monitored</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-16 md:py-20 px-5 md:px-[5%] bg-tce-cream dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <div className="text-tce-green text-xs font-semibold tracking-[2px] uppercase mb-3">Admin Features</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-tce-dark dark:text-white">
              Administrative Capabilities
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {ADMIN_FEATURES.map((f) => (
              <div key={f.title} className="glass-white p-6 md:p-7 text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-display text-[16px] md:text-[17px] font-bold text-tce-dark dark:text-tce-dark mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────── */}
      <section id="contact" className="py-16 md:py-20 px-5 md:px-[5%] bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-tce-dark dark:text-white mb-6 md:mb-7">
              Administrator Support
            </h2>
            <div className="flex flex-col gap-4">
              {CONTACT.map((c) => (
                <div key={c.t} className="flex gap-4 p-4 rounded-xl bg-tce-cream dark:bg-gray-900">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <div className="font-semibold text-tce-dark dark:text-white text-sm">{c.t}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{c.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <img src={tceLogo} alt="TCE"
                className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-full border-[3px] border-tce-dark/20 dark:border-tce-green/30 mx-auto mb-4" />
              <div className="font-display text-lg md:text-xl font-bold text-tce-dark dark:text-white">
                Thiagarajar College of Engineering
              </div>
              <div className="font-display text-base text-tce-green font-semibold mt-1">
                Admin Control Portal
              </div>
              <div className="text-tce-green dark:text-tce-green mt-2 text-sm">வினையே உயிர்</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-tce-dark py-6 px-5 md:px-[5%] text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src={tceLogo} alt="TCE"
            className="w-7 h-7 object-contain rounded-full border border-white/30" />
          <span className="font-semibold text-white text-sm">TCE Admin Portal</span>
        </div>
        <p className="text-white/50 text-xs">
          © {new Date().getFullYear()} Thiagarajar College of Engineering, Madurai. Authorized Personnel Only.
        </p>
      </footer>
    </div>
  )
}

