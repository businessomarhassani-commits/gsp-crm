import Sidebar from './Sidebar'
import ImpersonationBanner from './ImpersonationBanner'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { isImpersonating, user, exitImpersonation } = useAuth()

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
      {isImpersonating && (
        <ImpersonationBanner userName={user?.name} onExit={exitImpersonation} />
      )}
      <Sidebar />
      <main className={`ml-[240px] flex-1 min-h-screen overflow-y-auto ${isImpersonating ? 'pt-[44px]' : ''}`}>
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
