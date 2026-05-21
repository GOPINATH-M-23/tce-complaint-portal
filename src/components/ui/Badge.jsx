import { getStatusClass, getPriorityClass } from '@/utils/helpers'

export function StatusBadge({ status }) {
  return <span className={`tag ${getStatusClass(status)}`}>{status}</span>
}

export function PriorityBadge({ priority }) {
  return <span className={`tag ${getPriorityClass(priority)}`}>{priority}</span>
}

export function CategoryBadge({ category }) {
  return <span className="tag bg-tce-dark/10 dark:bg-tce-green/15 text-tce-dark dark:text-tce-green">{category}</span>
}
