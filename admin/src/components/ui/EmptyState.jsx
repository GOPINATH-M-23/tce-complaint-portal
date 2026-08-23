export default function EmptyState({ icon = '📋', title, desc, action }) {
  return (
    <div className="card text-center py-14">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display text-xl font-bold text-tce-dark dark:text-white mb-2">{title}</h3>
      {desc && <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">{desc}</p>}
      {action}
    </div>
  )
}
