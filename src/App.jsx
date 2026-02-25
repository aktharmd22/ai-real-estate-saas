import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './lib/queryClient'
import ProtectedRoute, { GuestRoute } from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

// Auth
import LoginPage from './pages/auth/LoginPage'

// Super Admin
import SuperAdminDashboard from './pages/super-admin/Dashboard'
import AgenciesPage from './pages/super-admin/Agencies'

// Agency Admin
import AgencyDashboard from './pages/agency/Dashboard'
import AgentsPage from './pages/agency/Agents'
import LeadsPage from './pages/agency/Leads'
import PropertiesPage from './pages/agency/Properties'

// Agent
import AgentDashboard from './pages/agent/Dashboard'

import InboxPage from './pages/agency/Inbox'

import CalendarPage from './pages/agency/Calendar'

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
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="agencies"  element={<AgenciesPage />} />
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
            <Route path="inbox" element={<InboxPage />} />
            <Route path="calendar" element={<CalendarPage />} />
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
            <Route path="inbox" element={<InboxPage />} />
            <Route path="calendar" element={<CalendarPage />} />
          </Route>

          {/* ─── Fallback ─── */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App