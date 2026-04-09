import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'

export function ConfirmModal({ open, onClose, onConfirm, title, message, loading = false, danger = true }) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <div className={`flex items-start gap-3 p-3.5 rounded-xl ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
          <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <p className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm} loading={loading}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  )
}
