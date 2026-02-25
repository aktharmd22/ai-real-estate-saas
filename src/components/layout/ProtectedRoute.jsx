import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

// Separate component to redirect logged-in users away from /login
export function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    const role = user.role
    if (role === 'super_admin')  return <Navigate to="/super-admin/dashboard" replace />
    if (role === 'agency_admin') return <Navigate to="/agency/dashboard" replace />
    if (role === 'agent')        return <Navigate to="/agent/dashboard" replace />
  }

  return children
}