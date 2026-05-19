export default function StatCard({ label, value, icon, color = '#1f4d3a', subtitle }) {
  return (
    <div className="stat-card" style={{ background: color }}>
      <div className="text-[11px] md:text-xs opacity-80 mb-1 font-medium">{label}</div>
      <div className="font-display text-3xl md:text-4xl font-bold">{value}</div>
      {subtitle && <div className="text-xs opacity-70 mt-1">{subtitle}</div>}
      {icon && (
        <div className="absolute right-3 top-3 text-3xl md:text-4xl opacity-20 select-none">{icon}</div>
      )}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
    </div>
  )
}
