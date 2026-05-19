import Modal from './Modal'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="400px">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={danger
            ? 'px-5 py-2 rounded-full text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors border-0 cursor-pointer'
            : 'btn-primary'
          }
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
