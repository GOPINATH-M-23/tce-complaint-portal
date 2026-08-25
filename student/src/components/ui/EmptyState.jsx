import { ClipboardList } from 'lucide-react'

export default function EmptyState({ icon, title, desc, action }) {
  const renderIcon = () => {
    if (!icon) return <ClipboardList className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
    if (typeof icon === 'string') return <span className="text-5xl">{icon}</span>
    return icon
  }

  return (
    <div className="card text-center py-14">
      <div className="mb-4 flex justify-center">{renderIcon()}</div>
      <h3 className="font-display text-xl font-bold text-tce-dark dark:text-white mb-2">{title}</h3>
      {desc && <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">{desc}</p>}
      {action}
    </div>
  )
}

