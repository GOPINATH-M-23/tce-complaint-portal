export default function Spinner({ fullscreen = false }) {
  const inner = (
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-tce-dark/20 dark:border-tce-green/20 border-t-tce-dark dark:border-t-tce-green rounded-full animate-spin" />
      <span className="text-sm text-tce-muted dark:text-gray-400 font-medium">Loading…</span>
    </div>
  )
  if (fullscreen) {
    return <div className="fixed inset-0 flex items-center justify-center bg-tce-cream dark:bg-gray-950 z-50">{inner}</div>
  }
  return <div className="flex items-center justify-center py-16">{inner}</div>
}
