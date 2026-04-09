import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { PageLoader } from '../ui/LoadingSpinner'

export function ProtectedRoute({ children }) {
  const { session, loading } = useAuthStore()
  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace />
  return children
}
