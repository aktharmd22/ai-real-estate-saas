import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_CONFIG } from '../../utils/helpers'

export default function Topbar({ title }) {
  const { user } = useAuth()
  const roleConfig = ROLE_CONFIG[user?.role] || {}

  return (
    <header style={{
      height: 64, background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16,
      position: 'sticky', top: 0, zIndex: 30,
    }}>

      {/* Page Title */}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>
          {title}
        </h1>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#F8FAFC', border: '1px solid #E2E8F0',
        borderRadius: 8, padding: '7px 14px', width: 220,
      }}>
        <Search size={14} color="#94A3B8" />
        <input
          placeholder="Search..."
          style={{
            border: 'none', background: 'transparent', outline: 'none',
            fontSize: 13, color: '#0F172A', width: '100%',
          }}
        />
      </div>

      {/* Notification bell */}
      <button style={{
        width: 36, height: 36, borderRadius: 8,
        border: '1px solid #E2E8F0', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative',
      }}>
        <Bell size={16} color="#475569" />
        <span style={{
          position: 'absolute', top: 6, right: 6,
          width: 7, height: 7, borderRadius: '50%',
          background: '#EF4444', border: '1.5px solid #fff',
        }} />
      </button>

      {/* Role badge */}
      <span style={{
        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
        color: roleConfig.color, background: roleConfig.bg,
      }}>
        {roleConfig.label}
      </span>

    </header>
  )
}