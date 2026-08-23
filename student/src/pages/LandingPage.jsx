import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import tceLogo   from '@/assets/tcenew.png'
import tceCampus from '@/assets/tceai.png'
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebase/config"

const HERO_STATS = [
  { n: '6,500+', l: 'Students' },
  { n: '18',     l: 'Departments' },
  { n: '1957',   l: 'Founded' },
  { n: '95%',    l: 'Placement' },
]

const WHY = [
  { icon: '🔒', title: 'Safe & Private',     desc: 'Your complaints are completely private. Only you and admins can see your grievances.' },
  { icon: '⚡', title: 'Fast Resolution',    desc: 'Smart priority system ensures urgent issues like ragging are handled immediately.' },
  { icon: '📊', title: 'Real-time Tracking', desc: 'Track your complaint from submission to resolution — live updates every step.' },
  { icon: '🤖', title: 'Smart Priority',     desc: 'Auto-escalates priority when multiple students report the same issue.' },
]

const FEATURES = [
  { icon: '📱', t: 'Real-time Updates',  d: 'Instant status notifications' },
  { icon: '🏷️', t: '18 Categories',      d: 'Organised complaint types' },
  { icon: '📸', t: 'Image Proof',        d: 'Upload evidence photos' },
  { icon: '💬', t: 'Admin Replies',      d: 'Direct communication' },
  { icon: '📈', t: 'Analytics',          d: 'Visual complaint insights' },
  { icon: '🔔', t: 'Notifications',      d: 'Never miss an update' },
]

const CONTACT = [
  { icon: '📍', t: 'Address', v: 'Thiruparankundram, Madurai – 625 015, Tamil Nadu' },
  { icon: '📞', t: 'Phone',   v: '+91 452 248 2240' },
  { icon: '📧', t: 'Email',   v: 'principal@tce.edu' },
  { icon: '🌐', t: 'Website', v: 'www.tce.edu' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])
  const [totalComplaints, setTotalComplaints] = useState(0)
  const [resolvedComplaints, setResolvedComplaints] = useState(0)
  const [progressComplaints, setProgressComplaints] = useState(0)
  const [highComplaints, setHighComplaints] = useState(0)

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const snapshot = await getDocs(collection(db, "complaints"))
        const data = snapshot.docs.map(doc => doc.data())

        setTotalComplaints(data.length)
        setResolvedComplaints(
          data.filter(c => c.status === "Resolved").length
        )
        setProgressComplaints(
          data.filter(c => c.status === "In Progress").length
        )
        setHighComplaints(
          data.filter(c => c.priority === "High").length
        )
      } catch (e) {
        console.error("Error loading complaint counts", e)
      }
    }

    fetchComplaints()
  }, [])

  const PREVIEW_STATS = [
    { n: totalComplaints,     l: "Total Complaints", c: "#7dd3b0" },
    { n: resolvedComplaints,  l: "Resolved",         c: "#86efac" },
    { n: progressComplaints,  l: "In Progress",      c: "#fcd34d" },
    { n: highComplaints,      l: "High Priority",    c: "#f87171" }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <img src={tceCampus} alt="TCE Campus"
          className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2319cc] via-[#1f4d3aa6] to-[#00000080]" />

        <div className={`relative z-10 text-center px-5 max-w-3xl w-full transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <img src={tceLogo} alt="TCE"
            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-full border-[3px] border-white/50 mx-auto mb-5 animate-float shadow-2xl" />
          <h1 className="font-display text-[clamp(28px,6vw,64px)] font-bold text-white leading-tight mb-4 drop-shadow-lg">
            TCE Smart<br />
            <span className="text-[#7dd3b0]">Complaint Portal</span>
          </h1>
          <p className="text-[clamp(13px,2vw,18px)] text-white/80 mb-8 leading-relaxed">
            Thiagarajar College of Engineering, Madurai<br />
            A safe, smart and transparent platform for student grievances
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              className="btn-primary text-sm md:text-[15px] px-7 md:px-9 py-3 md:py-3.5 shadow-xl shadow-tce-dark/40"
              onClick={() => navigate('/login')}
            >
               Student Login
            </button>
            <button
              className="text-sm md:text-[15px] px-7 md:px-9 py-3 md:py-3.5 rounded-full font-semibold border border-white/50 text-white bg-white/15 backdrop-blur-sm transition-all hover:bg-white/25"
              onClick={() => navigate('/signup')}
            >
               Sign Up Free
            </button>
          </div>

          {/* Floating stat cards */}
          <div className="flex gap-3 md:gap-4 justify-center mt-10 flex-wrap">
            {HERO_STATS.map((s) => (
              <div key={s.l} className="glass px-4 md:px-5 py-2.5 md:py-3 text-center min-w-[72px]">
                <div className="font-display text-xl md:text-2xl font-bold text-white">{s.n}</div>
                <div className="text-[10px] md:text-xs text-white/70 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────── */}
      <section id="about" className="py-16 md:py-20 px-5 md:px-[5%] bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div>
            <div className="text-tce-green text-xs font-semibold tracking-[2px] uppercase mb-3">About TCE</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-tce-dark dark:text-white leading-tight mb-5">
              Excellence in<br />Engineering Education
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-5 text-[15px]">
              Thiagarajar College of Engineering was founded in <strong>1957</strong> by Late Shri Karumuttu Thiagarajan Chettiar.
              Located in the cultural capital of Tamil Nadu, <strong>Madurai</strong>, TCE is an autonomous institution
              affiliated to Anna University, known for its CDIO-based learning and industry collaboration.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {['Autonomous Institution', 'CDIO Accredited', '95%+ Placement', 'Industry Collaboration', 'Innovation Hub', 'NBA Accredited'].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-tce-green font-bold">✓</span> {f}
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img src={tceCampus} alt="TCE"
              className="w-full rounded-2xl object-cover h-64 md:h-80 shadow-2xl shadow-tce-dark/20" />
            <div className="glass-white absolute -bottom-4 -left-4 md:-bottom-5 md:-left-5 px-4 py-3 md:px-5 md:py-3.5">
              <div className="font-display text-2xl md:text-3xl font-bold text-tce-dark dark:text-tce-dark">67+</div>
              <div className="text-xs text-tce-green font-medium mt-0.5">Years of Excellence</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY USE PORTAL ───────────────────────────────────── */}
      <section className="py-16 md:py-20 px-5 md:px-[5%] bg-tce-cream dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <div className="text-tce-green text-xs font-semibold tracking-[2px] uppercase mb-3">Why Use Portal</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-tce-dark dark:text-white">
              Smart Complaint Management
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {WHY.map((f) => (
              <div key={f.title} className="glass-white p-6 md:p-7 text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-display text-[16px] md:text-[17px] font-bold text-tce-dark dark:text-tce-dark mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-16 md:py-20 px-5 md:px-[5%] bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <div className="text-tce-green text-xs font-semibold tracking-[2px] uppercase mb-3">Features</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-tce-dark dark:text-white">
              Everything You Need
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {FEATURES.map((f) => (
              <div key={f.t}
                className="flex items-center gap-4 p-4 md:p-5 rounded-2xl border-[1.5px] border-tce-dark/10 dark:border-gray-700 bg-tce-cream dark:bg-gray-900 hover:border-tce-green dark:hover:border-tce-green transition-colors">
                <div className="text-3xl shrink-0">{f.icon}</div>
                <div>
                  <div className="font-semibold text-tce-dark dark:text-white text-sm">{f.t}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANALYTICS PREVIEW ────────────────────────────────── */}
      <section className="py-16 md:py-20 px-5 md:px-[5%] bg-tce-dark relative overflow-hidden">
        <img src={tceCampus} className="absolute inset-0 w-full h-full object-cover opacity-[0.07]" alt="" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">Analytics at a Glance</h2>
            <p className="text-white/60 text-[15px]">Real-time insights into campus complaint trends</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {PREVIEW_STATS.map((s) => (
              <div key={s.l} className="glass p-5 md:p-6 text-center">
                <div className="font-display text-3xl md:text-4xl font-bold" style={{ color: s.c }}>{s.n}</div>
                <div className="text-sm text-white/70 mt-1.5">{s.l}</div>
              </div>
            ))}
          </div>
          {/* CTA */}
          <div className="text-center mt-10">
            <p className="text-white/70 text-sm mb-4">Join thousands of students using the portal</p>
            <button
              className="btn-primary px-8 py-3 text-base shadow-xl"
              onClick={() => navigate('/signup')}
            >
              ✨ Create Your Account
            </button>
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────── */}
      <section id="contact" className="py-16 md:py-20 px-5 md:px-[5%] bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-tce-dark dark:text-white mb-6 md:mb-7">
              Get In Touch
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
                Thiagarajar College
              </div>
              <div className="font-display text-lg md:text-xl font-bold text-tce-dark dark:text-white">
                of Engineering
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
          <span className="font-semibold text-white text-sm">TCE Smart Complaint Portal</span>
        </div>
        <p className="text-white/50 text-xs">
          © {new Date().getFullYear()} Thiagarajar College of Engineering, Madurai. All rights reserved.
        </p>
      </footer>
    </div>
  )
}