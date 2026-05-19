import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, maxWidth = '580px' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth }}>
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-tce-dark dark:text-white">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none bg-transparent border-0 cursor-pointer">✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
