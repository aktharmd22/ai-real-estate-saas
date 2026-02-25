import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/axios'
import {
  LayoutDashboard, Users, Building2, MessageSquare,
  Home, Calendar, Zap, BarChart2, CreditCard,
  Settings, LogOut, ChevronRight,
} from 'lucide-react'

// Nav items per role
const NAV_ITEMS = {
  super_admin: [
    { label: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
    { label: 'Agencies',  path: '/super-admin/agencies',  icon: Building2 },
    { label: 'Plans',     path: '/super-admin/plans',     icon: CreditCard },
    { label: 'Analytics', path: '/super-admin/analytics', icon: BarChart2 },
    { label: 'Settings',  path: '/super-admin/settings',  icon: Settings },
  ],
  agency_admin: [
        { label: 'Dashboard',   path: '/agency/dashboard',   icon: LayoutDashboard },
        { label: 'Leads',       path: '/agency/leads',       icon: Users },      // ← this
        { label: 'Properties',  path: '/agency/properties',  icon: Home },
        { label: 'Inbox',       path: '/agency/inbox',       icon: MessageSquare },
        { label: 'Calendar',    path: '/agency/calendar',    icon: Calendar },
        { label: 'Agents',      path: '/agency/agents',      icon: Users },
        { label: 'Automations', path: '/agency/automations', icon: Zap },
        { label: 'Analytics',   path: '/agency/analytics',   icon: BarChart2 },
        { label: 'Billing',     path: '/agency/billing',     icon: CreditCard },
        { label: 'Settings',    path: '/agency/settings',    icon: Settings },
        ],
  agent: [
    { label: 'Dashboard',  path: '/agent/dashboard',  icon: LayoutDashboard },
    { label: 'My Leads',   path: '/agent/leads',      icon: Users },
    { label: 'Inbox',      path: '/agent/inbox',      icon: MessageSquare },
    { label: 'Calendar',   path: '/agent/calendar',   icon: Calendar },
    { label: 'Properties', path: '/agent/properties', icon: Home },
  ],
}

const ROLE_LABEL = {
  super_admin:  '👑 Super Admin',
  agency_admin: '🏢 Agency Admin',
  agent:        '👤 Agent',
}

export default function Sidebar() {
  const { user, logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const navItems = NAV_ITEMS[user?.role] || []

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // Token already expired — ignore error
    } finally {
      logout()
      navigate('/login')
    }
  }

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      flexShrink: 0,
      background: '#FFFFFF',
      borderRight: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 40,
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #E2E8F0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            🏠
          </div>
          <div>
            <div style={{
              fontWeight: 800, fontSize: 15,
              color: '#0F172A', lineHeight: 1,
            }}>
              RE Closer
            </div>
            <div style={{
              fontSize: 10, color: '#64748B',
              marginTop: 3, fontWeight: 500,
            }}>
              {isSuperAdmin
                ? 'Platform Admin'
                : user?.agency?.name || 'Agency Portal'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1,
        padding: '12px 10px',
        overflowY: 'auto',
      }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              marginBottom: 2,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.15s',
              background: isActive ? '#EFF6FF' : 'transparent',
              color: isActive ? '#2563EB' : '#475569',
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={16}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User Profile + Logout ── */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid #E2E8F0',
      }}>

        {/* Role badge */}
        <div style={{
          padding: '4px 12px',
          borderRadius: 20,
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          fontSize: 11,
          fontWeight: 600,
          color: '#64748B',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          {ROLE_LABEL[user?.role] || 'User'}
        </div>

        {/* User info card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 10,
          background: '#F8FAFC',
          border: '1px solid #F1F5F9',
          marginBottom: 6,
        }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
            flexShrink: 0,
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>

          {/* Name + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#0F172A',
              whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{
              fontSize: 11, color: '#64748B',
              whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.email || ''}
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            color: '#EF4444',
            transition: 'all 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#FEF2F2'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <LogOut size={15} />
          Sign Out
        </button>

      </div>
    </aside>
  )
}