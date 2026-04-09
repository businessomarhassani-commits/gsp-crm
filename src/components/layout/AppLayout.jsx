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
        animate={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <TopBar />
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-x-hidden">
          <Outlet />
        </main>
      </motion.div>
    </div>
  )
}
