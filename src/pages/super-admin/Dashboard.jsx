import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, CreditCard, TrendingUp,
  ArrowRight, Plus, DollarSign, Activity,
  CheckCircle, AlertCircle, Package
} from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'

function KpiCard({ label, value, sub, icon: Icon, color, bg, trend, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 16,
        border: `1px solid ${hov && onClick ? color + '40' : '#E8ECF0'}`,
        padding: '22px 22px 18px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s',
        transform: hov && onClick ? 'translateY(-2px)' : 'none',
        boxShadow: hov && onClick ? `0 8px 24px ${color}18` : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} strokeWidth={2} />
        </div>
        {trend && (
          <span style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 700,
            background: trend > 0 ? '#ECFDF5' : '#FEF2F2',
            color: trend > 0 ? '#059669' : '#DC2626',
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#0A0F1E', letterSpacing: '-1px', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 5, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function AgencyRow({ agency, onClick }) {
  const [hov, setHov] = useState(false)
  const STATUS = {
    active:   { color: '#059669', bg: '#ECFDF5', label: 'Active' },
    inactive: { color: '#DC2626', bg: '#FEF2F2', label: 'Inactive' },
    trial:    { color: '#7C3AED', bg: '#F5F3FF', label: 'Trial' },
  }
  const sc = STATUS[agency.status] || STATUS.inactive
  const initials = agency.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['#2563EB','#7C3AED','#059669','#D97706','#0891B2','#DC2626']
  const accentColor = colors[agency.id % colors.length]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px', borderRadius: 12,
        background: hov ? '#F8FAFF' : '#fff',
        border: `1px solid ${hov ? '#DBEAFE' : '#F3F4F6'}`,
        cursor: 'pointer', transition: 'all 0.15s', marginBottom: 8,
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: accentColor + '15',
        border: `1.5px solid ${accentColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, color: accentColor,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0F1E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {agency.name}
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
          {agency.agents_count ?? 0} agents · {agency.leads_count ?? 0} leads
        </div>
      </div>
      <span style={{
        fontSize: 10, padding: '2px 8px', borderRadius: 20,
        background: sc.bg, color: sc.color, fontWeight: 700, flexShrink: 0,
      }}>
        {sc.label}
      </span>
      <ArrowRight size={13} color="#9CA3AF" />
    </div>
  )
}

function PlanBar({ plan }) {
  const maxSubs = 20
  const pct = Math.min((plan.active_subscribers / maxSubs) * 100, 100)
  const colors = ['#2563EB', '#7C3AED', '#059669', '#D97706']
  const color = colors[plan.id % colors.length] || '#2563EB'
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{plan.name}</span>
          {plan.is_popular && (
            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 20, background: '#EFF6FF', color: '#2563EB', fontWeight: 700 }}>
              POPULAR
            </span>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0A0F1E' }}>{plan.active_subscribers}</span>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}> subscribers</span>
        </div>
      </div>
      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99 }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 99, transition: 'width 0.8s ease',
        }} />
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{plan.price_formatted} / {plan.interval}</div>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const { data: agencies } = useQuery({
    queryKey: ['sa-agencies'],
    queryFn: () => api.get('/super-admin/agencies').then(r => r.data.data || []),
  })

  const { data: plans } = useQuery({
    queryKey: ['sa-plans'],
    queryFn: () => api.get('/super-admin/plans').then(r => r.data.data || []),
  })

  const activeAgencies  = (agencies || []).filter(a => a.status === 'active').length
  const trialAgencies   = (agencies || []).filter(a => a.status === 'trial').length
  const totalAgencies   = (agencies || []).length
  const totalSubs       = (plans || []).reduce((s, p) => s + (p.active_subscribers || 0), 0)
  const totalRevMYR     = (plans || []).reduce((s, p) => s + ((p.price_myr / 100) * (p.active_subscribers || 0)), 0)

  const today = new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 24,
      opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease',
    }}>

      {/* ── Hero header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #1D4ED8 100%)',
        borderRadius: 20, padding: '28px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, right: 80,
          width: 140, height: 140, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 6, letterSpacing: 0.5 }}>
            {today}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
            Platform Overview 🚀
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '6px 0 0' }}>
            Welcome back, {user?.name || 'Admin'}. Here's your platform at a glance.
          </p>
        </div>

        <div style={{
          display: 'flex', gap: 20, position: 'relative', zIndex: 1,
        }}>
          {[
            { label: 'Total Agencies', value: totalAgencies, color: '#60A5FA' },
            { label: 'Active Subs',    value: totalSubs,     color: '#34D399' },
            { label: 'MRR (RM)',       value: totalRevMYR.toLocaleString('en-MY', { minimumFractionDigits: 0 }), color: '#FBBF24' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KpiCard
          label="Total Agencies"
          value={totalAgencies}
          sub={`${activeAgencies} active`}
          icon={Building2}
          color="#2563EB" bg="#EFF6FF"
          trend={5}
          onClick={() => navigate('/super-admin/agencies')}
        />
        <KpiCard
          label="Active Subscriptions"
          value={totalSubs}
          sub={`${trialAgencies} on trial`}
          icon={CreditCard}
          color="#7C3AED" bg="#F5F3FF"
          onClick={() => navigate('/super-admin/agencies')}
        />
        <KpiCard
          label="Monthly Revenue"
          value={`RM ${totalRevMYR.toLocaleString('en-MY', { minimumFractionDigits: 0 })}`}
          sub="Current MRR"
          icon={DollarSign}
          color="#059669" bg="#ECFDF5"
          trend={12}
        />
        <KpiCard
          label="Plans Available"
          value={(plans || []).filter(p => p.is_active).length}
          sub={`${(plans || []).length} total plans`}
          icon={Package}
          color="#D97706" bg="#FFF7ED"
          onClick={() => navigate('/super-admin/plans')}
        />
      </div>

      {/* ── Middle: Agencies + Plan breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

        {/* Agencies list */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8ECF0', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0A0F1E' }}>Agencies</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>All registered agencies</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/super-admin/agencies')} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 9,
                border: '1px solid #E8ECF0', background: '#F8FAFC',
                fontSize: 12, fontWeight: 600, color: '#374151',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>
                View all <ArrowRight size={12} />
              </button>
              <button onClick={() => navigate('/super-admin/agencies')} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 9,
                border: 'none', background: '#2563EB',
                fontSize: 12, fontWeight: 600, color: '#fff',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>
                <Plus size={12} /> New
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {(agencies || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>
                No agencies yet
              </div>
            ) : (
              (agencies || []).slice(0, 8).map(agency => (
                <AgencyRow
                  key={agency.id}
                  agency={agency}
                  onClick={() => navigate('/super-admin/agencies')}
                />
              ))
            )}
          </div>
        </div>

        {/* Right col: Plans + Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Plan breakdown */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8ECF0', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0F1E' }}>Plan Breakdown</div>
              <button onClick={() => navigate('/super-admin/plans')} style={{
                fontSize: 11, fontWeight: 600, color: '#2563EB',
                border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                Manage <ArrowRight size={11} />
              </button>
            </div>

            {(plans || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>
                No plans yet
              </div>
            ) : (
              (plans || []).map(plan => <PlanBar key={plan.id} plan={plan} />)
            )}
          </div>

          {/* Platform health */}
          <div style={{
            background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)',
            borderRadius: 16, border: '1px solid #BBF7D0', padding: 22,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46', marginBottom: 14 }}>
              Platform Health
            </div>
            {[
              { label: 'Agency onboarding',   status: 'ok',  text: 'Operational' },
              { label: 'Stripe billing',       status: 'ok',  text: 'Operational' },
              { label: 'WhatsApp webhook',     status: 'ok',  text: 'Operational' },
              { label: 'AI scoring',           status: 'ok',  text: 'Operational' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0',
                borderBottom: i < 3 ? '1px solid #D1FAE5' : 'none',
              }}>
                <span style={{ fontSize: 12, color: '#065F46', fontWeight: 500 }}>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                  <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom: Quick actions for super admin ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8ECF0', padding: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0F1E', marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Add Agency',        icon: '🏢', color: '#2563EB', bg: '#EFF6FF', path: '/super-admin/agencies' },
            { label: 'Create Plan',       icon: '📦', color: '#7C3AED', bg: '#F5F3FF', path: '/super-admin/plans' },
            { label: 'Stripe Settings',   icon: '💳', color: '#059669', bg: '#ECFDF5', path: '/super-admin/settings' },
            { label: 'View All Agencies', icon: '👁', color: '#D97706', bg: '#FFF7ED', path: '/super-admin/agencies' },
          ].map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 8, padding: '16px 12px', borderRadius: 12,
              border: '1px solid #F3F4F6', background: '#FAFAFA',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = a.color + '30' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#F3F4F6' }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 11, background: a.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {a.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'center' }}>
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}