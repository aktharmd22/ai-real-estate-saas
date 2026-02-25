import useAuthStore from '../store/authStore'

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore()

  const isSuperAdmin  = user?.role === 'super_admin'
  const isAgencyAdmin = user?.role === 'agency_admin'
  const isAgent       = user?.role === 'agent'

  // Where to redirect after login based on role
  const getDashboardPath = () => {
    if (isSuperAdmin)  return '/super-admin/dashboard'
    if (isAgencyAdmin) return '/agency/dashboard'
    if (isAgent)       return '/agent/dashboard'
    return '/login'
  }

  return {
    user,
    token,
    isAuthenticated,
    isSuperAdmin,
    isAgencyAdmin,
    isAgent,
    setAuth,
    logout,
    getDashboardPath,
  }
}