import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { AmbientOrbs } from '../ui/AmbientOrbs'
import { useUIStore } from '../../store/useUIStore'
import { motion } from 'framer-motion'

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="flex min-h-screen">
      <AmbientOrbs />
      <Sidebar />
      <motion.div
        className="flex-1 flex flex-col min-w-0 relative z-10"
        animate={{ marginLeft: sidebarCollapsed ? 64 : 220 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <TopBar />
        <main className="flex-1 p-5 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </motion.div>
    </div>
  )
}
