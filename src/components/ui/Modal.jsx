import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'

export function Modal({ open, onClose, title, children, size = 'md', description }) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              >
                <Dialog.Content asChild onInteractOutside={onClose}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 12 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative w-full ${widths[size]} rounded-2xl p-6 ${isDark ? 'glass' : 'glass-light'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <Dialog.Title className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {title}
                        </Dialog.Title>
                        {description && (
                          <Dialog.Description className={`text-sm mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                      <button
                        onClick={onClose}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-white/8 text-white/50 hover:text-white' : 'hover:bg-black/6 text-slate-400 hover:text-slate-600'}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {children}
                  </motion.div>
                </Dialog.Content>
              </motion.div>
            </Dialog.Overlay>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
