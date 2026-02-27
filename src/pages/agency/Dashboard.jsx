import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Users, Home, Calendar, MessageSquare,
  TrendingUp, Target, ArrowRight, Plus,
  Clock, CheckCircle, AlertCircle, Zap
} from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'

// ─── Tiny sparkline using SVG ─────────────────────────────────────────────────
function Sparkline({ data = [], color = '#2563EB', height = 36 }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const w = 80, h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop().split(',')[0]}
        cy={pts.split(' ').pop().split(',')[1]}
        r="3" fill={color} />
    </svg>
  )
}

// ─── Stat card with sparkline + trend ─────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, bg, spark, trend, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: `1px solid ${hov && onClick ? color + '40' : '#E8ECF0'}`,
        padding: '20px 22px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s',
        transform: hov && onClick ? 'translateY(-2px)' : 'none',
        boxShadow: hov && onClick ? `0 8px 24px ${color}18` : '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={19} color={color} strokeWidth={2} />
        </div>
        {spark && <Sparkline data={spark} color={color} />}
      </div>

      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0A0F1E', letterSpacing: '-0.5px', lineHeight: 1 }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4, fontWeight: 500 }}>{label}</div>
        {sub && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            marginTop: 6, fontSize: 11, fontWeight: 600,
            color: trend === 'up' ? '#059669' : trend === 'down' ? '#DC2626' : color,
            background: trend === 'up' ? '#ECFDF5' : trend === 'down' ? '#FEF2F2' : bg,
            padding: '2px 8px', borderRadius: 20,
          }}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''}  {sub}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Activity item ─────────────────────────────────────────────────────────────
function ActivityItem({ icon, title, sub, time, color, bg }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '10px 0', borderBottom: '1px solid #F3F4F6',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0F1E', lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', flexShrink: 0 }}>{time}</div>
    </div>
  )
}

// ─── Pipeline bar ──────────────────────────────────────────────────────────────
function PipelineBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0A0F1E' }}>{count} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

// ─── Quick action button ────────────────────────────────────────────────────────
function QuickAction({ icon, label, color, bg, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '16px 12px', borderRadius: 14,
        border: `1px solid ${hov ? color + '50' : '#E8ECF0'}`,
        background: hov ? bg : '#fff',
        cursor: 'pointer', transition: 'all 0.15s',
        transform: hov ? 'translateY(-1px)' : 'none',
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: hov ? `0 4px 12px ${color}18` : 'none',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <icon.type size={18} color={color} strokeWidth={2} {...icon.props} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
    </button>
  )
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function AgencyDashboard() {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  const [greeting, setGreeting] = useState('')
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  const { data: leadStats }  = useQuery({ queryKey: ['lead-stats'],  queryFn: () => api.get('/agency/leads/stats').then(r => r.data.data) })
  const { data: apptStats }  = useQuery({ queryKey: ['appt-stats'],  queryFn: () => api.get('/agency/appointments/stats').then(r => r.data.data) })
  const { data: convStats }  = useQuery({ queryKey: ['conv-stats'],  queryFn: () => api.get('/agency/conversations/stats').then(r => r.data.data) })
  const { data: analytics }  = useQuery({ queryKey: ['analytics-overview-dash'], queryFn: () => api.get('/agency/analytics/overview').then(r => r.data.data) })
  const { data: trends }     = useQuery({ queryKey: ['analytics-trends-dash'],   queryFn: () => api.get('/agency/analytics/lead-trends', { params: { months: 6 } }).then(r => r.data.data || []) })
  const { data: funnel }     = useQuery({ queryKey: ['analytics-funnel-dash'],   queryFn: () => api.get('/agency/analytics/lead-funnel').then(r => r.data.data || []) })

  const sparkData = (trends || []).map(t => t.total)

  const pipelineColors = {
    new: '#6366F1', contacted: '#8B5CF6', qualified: '#2563EB',
    visiting: '#0891B2', negotiating: '#D97706', closed: '#059669', lost: '#DC2626',
  }

  const today = new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 24,
      opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease',
    }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500, marginBottom: 4 }}>{today}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A0F1E', margin: 0, letterSpacing: '-0.5px' }}>
            {greeting}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0', fontWeight: 400 }}>
            Here's what's happening with your agency today.
          </p>
        </div>

        <button
          onClick={() => navigate('/agency/leads')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', borderRadius: 11, border: 'none',
            background: 'linear-gradient(135deg, #1D4ED8, #4F46E5)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 4px 14px rgba(29,78,216,0.3)',
          }}
        >
          <Plus size={14} /> Add Lead
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard
          label="Total Leads"
          value={leadStats?.total ?? '—'}
          sub={`${leadStats?.this_month ?? 0} this month`}
          trend="up"
          icon={Users}
          color="#2563EB" bg="#EFF6FF"
          spark={sparkData}
          onClick={() => navigate('/agency/leads')}
        />
        <StatCard
          label="Conversion Rate"
          value={analytics?.leads?.conversion_rate != null ? `${analytics.leads.conversion_rate}%` : '—'}
          sub={`${analytics?.leads?.closed ?? 0} closed`}
          trend="up"
          icon={Target}
          color="#059669" bg="#ECFDF5"
          onClick={() => navigate('/agency/leads')}
        />
        <StatCard
          label="Appointments"
          value={apptStats?.total ?? '—'}
          sub={`${apptStats?.today ?? 0} today`}
          icon={Calendar}
          color="#7C3AED" bg="#F5F3FF"
          onClick={() => navigate('/agency/calendar')}
        />
        <StatCard
          label="Open Conversations"
          value={convStats?.open ?? '—'}
          sub={`${convStats?.unread ?? 0} unread`}
          trend={convStats?.unread > 0 ? 'up' : null}
          icon={MessageSquare}
          color="#D97706" bg="#FFF7ED"
          onClick={() => navigate('/agency/inbox')}
        />
      </div>

      {/* ── Second row KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="New Leads"      value={leadStats?.new ?? '—'}       icon={TrendingUp}    color="#6366F1" bg="#EEF2FF" />
        <StatCard label="Qualified"      value={leadStats?.qualified ?? '—'} icon={CheckCircle}   color="#0891B2" bg="#ECFEFF" />
        <StatCard label="Completed Appts" value={apptStats?.completed ?? '—'} icon={CheckCircle}  color="#059669" bg="#ECFDF5" />
        <StatCard label="Properties"     value={analytics?.properties?.total ?? '—'} icon={Home}  color="#DC2626" bg="#FEF2F2" onClick={() => navigate('/agency/properties')} />
      </div>

      {/* ── Middle row: Pipeline + Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Pipeline funnel */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #E8ECF0',
          padding: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0A0F1E' }}>Lead Pipeline</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Distribution across stages</div>
            </div>
            <button onClick={() => navigate('/agency/leads')} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600, color: '#2563EB',
              border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              View all <ArrowRight size={12} />
            </button>
          </div>

          {(funnel || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF', fontSize: 13 }}>
              No pipeline data yet
            </div>
          ) : (
            (funnel || []).map(stage => (
              <PipelineBar
                key={stage.status}
                label={stage.label}
                count={stage.count}
                total={leadStats?.total || 1}
                color={pipelineColors[stage.status] || '#6366F1'}
              />
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #E8ECF0',
          padding: 24,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0A0F1E', marginBottom: 4 }}>Quick Actions</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 18 }}>Jump to common tasks</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: <Plus />, label: 'New Lead',        color: '#2563EB', bg: '#EFF6FF', path: '/agency/leads' },
              { icon: <Calendar />, label: 'Schedule',    color: '#7C3AED', bg: '#F5F3FF', path: '/agency/calendar' },
              { icon: <MessageSquare />, label: 'Inbox',  color: '#D97706', bg: '#FFF7ED', path: '/agency/inbox' },
              { icon: <Home />, label: 'Properties',      color: '#059669', bg: '#ECFDF5', path: '/agency/properties' },
              { icon: <TrendingUp />, label: 'Analytics', color: '#0891B2', bg: '#ECFEFF', path: '/agency/analytics' },
              { icon: <Users />, label: 'Agents',         color: '#6366F1', bg: '#EEF2FF', path: '/agency/agents' },
            ].map((a, i) => (
              <button key={i} onClick={() => navigate(a.path)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                border: '1px solid #F3F4F6', background: '#FAFAFA',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = a.color + '40' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#F3F4F6' }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8, background: a.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {a.icon.type ? <a.icon.type size={14} color={a.color} strokeWidth={2} /> : a.icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row: Today's summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

        {/* Today's appointments */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8ECF0', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0F1E' }}>Today's Appointments</div>
            <button onClick={() => navigate('/agency/calendar')} style={{
              display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
              color: '#7C3AED', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              View <ArrowRight size={11} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Today',     value: apptStats?.today     ?? 0, color: '#7C3AED', bg: '#F5F3FF' },
              { label: 'Upcoming',  value: apptStats?.upcoming  ?? 0, color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Completed', value: apptStats?.completed ?? 0, color: '#059669', bg: '#ECFDF5' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '12px 10px', borderRadius: 10, background: s.bg, textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: s.color + 'CC', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Inbox summary */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8ECF0', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0F1E' }}>Inbox Status</div>
            <button onClick={() => navigate('/agency/inbox')} style={{
              display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
              color: '#D97706', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Open <ArrowRight size={11} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Total',    value: convStats?.total    ?? 0, color: '#374151',  bg: '#F9FAFB' },
              { label: 'Open',     value: convStats?.open     ?? 0, color: '#D97706',  bg: '#FFF7ED' },
              { label: 'Unread',   value: convStats?.unread   ?? 0, color: '#DC2626',  bg: '#FEF2F2' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '12px 10px', borderRadius: 10, background: s.bg, textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Goal tracker */}
        <div style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #4F46E5 100%)', borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Monthly Goal</div>
          <div style={{ fontSize: 12, color: '#BFDBFE', marginBottom: 16 }}>Lead conversions this month</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>
            {analytics?.leads?.closed ?? 0}
          </div>
          <div style={{ fontSize: 12, color: '#BFDBFE', marginTop: 4 }}>
            / {Math.max((analytics?.leads?.closed ?? 0) + 5, 10)} target
          </div>
          <div style={{ marginTop: 16, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 99 }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${Math.min(((analytics?.leads?.closed ?? 0) / Math.max((analytics?.leads?.closed ?? 0) + 5, 10)) * 100, 100)}%`,
              background: '#fff',
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#BFDBFE', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={11} /> {analytics?.leads?.conversion_rate ?? 0}% conversion rate
          </div>
        </div>
      </div>

    </div>
  )
}