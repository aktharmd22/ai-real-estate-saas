import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './lib/queryClient'
import ProtectedRoute, { GuestRoute } from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

// Auth
import LoginPage from './pages/auth/LoginPage'

// Super Admin
import SuperAdminDashboard    from './pages/super-admin/Dashboard'
import AgenciesPage           from './pages/super-admin/Agencies'
import PlansPage              from './pages/super-admin/Plans'
import SuperAdminSettingsPage from './pages/super-admin/SuperAdminSettings'

// Agency Admin + Agent (shared pages)
import AgencyDashboard from './pages/agency/Dashboard'
import AgentDashboard  from './pages/agent/Dashboard'
import AgentsPage      from './pages/agency/Agents'
import LeadsPage       from './pages/agency/Leads'
import PropertiesPage  from './pages/agency/Properties'
import InboxPage       from './pages/agency/Inbox'
import CalendarPage    from './pages/agency/Calendar'
import AnalyticsPage   from './pages/agency/Analytics'
import SettingsPage    from './pages/agency/Settings'
import BillingPage     from './pages/agency/Billing'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* ─── Public ─── */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={
            <GuestRoute><LoginPage /></GuestRoute>
          } />

          {/* ─── Super Admin ─── */}
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"  element={<SuperAdminDashboard />} />
            <Route path="agencies"   element={<AgenciesPage />} />
            <Route path="plans"      element={<PlansPage />} />
            <Route path="settings"   element={<SuperAdminSettingsPage />} />
          </Route>

          {/* ─── Agency Admin ─── */}
          <Route path="/agency" element={
            <ProtectedRoute allowedRoles={['agency_admin']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"  element={<AgencyDashboard />} />
            <Route path="agents"     element={<AgentsPage />} />
            <Route path="leads"      element={<LeadsPage />} />
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="inbox"      element={<InboxPage />} />
            <Route path="calendar"   element={<CalendarPage />} />
            <Route path="analytics"  element={<AnalyticsPage />} />
            <Route path="settings"   element={<SettingsPage />} />
            <Route path="billing"    element={<BillingPage />} />
          </Route>

          {/* ─── Agent ─── */}
          <Route path="/agent" element={
            <ProtectedRoute allowedRoles={['agent']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"  element={<AgentDashboard />} />
            <Route path="leads"      element={<LeadsPage />} />
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="inbox"      element={<InboxPage />} />
            <Route path="calendar"   element={<CalendarPage />} />
          </Route>

          {/* ─── Fallback ─── */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App