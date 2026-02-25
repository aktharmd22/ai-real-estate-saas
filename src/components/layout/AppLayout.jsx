import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { Outlet, useLocation } from 'react-router-dom'

// Map path to page title
const TITLES = {
  '/super-admin/dashboard': 'Dashboard',
  '/super-admin/agencies':  'Agencies',
  '/super-admin/plans':     'Subscription Plans',
  '/super-admin/analytics': 'Analytics',
  '/agency/dashboard':      'Dashboard',
  '/agency/leads':          'Leads',
  '/agency/properties':     'Properties',
  '/agency/inbox':          'Inbox',
  '/agency/agents':         'Team Members',
  '/agency/billing':        'Billing',
  '/agent/dashboard':       'Dashboard',
  '/agent/leads':           'My Leads',
  '/agent/inbox':           'Inbox',
  '/agent/calendar':        'Calendar',
}

export default function AppLayout() {
  const location = useLocation()
  const title = TITLES[location.pathname] || 'RE Closer'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column' }}>
        <Topbar title={title} />
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}