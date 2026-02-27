import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Users, Calendar, MessageSquare, Target,
  ArrowRight, CheckCircle, Clock, TrendingUp, Star
} from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'

function MetricPill({ label, value, color, bg }) {
  return (
    <div style={{
      flex: 1, padding: '14px 16px', borderRadius: 12, background: bg,
      border: `1px solid ${color}20`,
    }}>
      <div style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value ?? '—'}</div>
      <div style={{ fontSize: 11, color: color + 'BB', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
    </div>
  )
}

function TaskRow({ icon, title, sub, badge, badgeColor, badgeBg, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 10,
        background: hov ? '#F8FAFF' : '#fff',
        border: `1px solid ${hov ? '#DBEAFE' : '#F3F4F6'}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s', marginBottom: 8,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17, background: '#F3F4F6',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0F1E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{sub}</div>
      </div>
      {badge && (
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 20,
          background: badgeBg || '#F3F4F6',
          color: badgeColor || '#374151',
          fontWeight: 700, flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
      {onClick && <ArrowRight size={13} color="#9CA3AF" />}
    </div>
  )
}

function ScoreRing({ score = 0 }) {
  const r = 28, circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 70 ? '#059669' : score >= 40 ? '#D97706' : '#DC2626'
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="#F3F4F6" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={circ - fill}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 600 }}>AVG</div>
      </div>
    </div>
  )
}

export default function AgentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [greeting, setGreeting] = useState('')
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  const { data: leadStats } = useQuery({ queryKey: ['agent-lead-stats'],  queryFn: () => api.get('/agent/leads/stats').then(r => r.data.data) })
  const { data: apptStats } = useQuery({ queryKey: ['agent-appt-stats'],  queryFn: () => api.get('/agent/appointments/stats').then(r => r.data.data) })
  const { data: convStats } = useQuery({ queryKey: ['agent-conv-stats'],  queryFn: () => api.get('/agent/conversations/stats').then(r => r.data.data) })
  const { data: leads }     = useQuery({ queryKey: ['agent-leads-recent'], queryFn: () => api.get('/agent/leads', { params: { per_page: 5, sort: 'created_at', dir: 'desc' } }).then(r => r.data.data || []) })
  const { data: appts }     = useQuery({ queryKey: ['agent-appts-today'],  queryFn: () => api.get('/agent/appointments', { params: { per_page: 5 } }).then(r => r.data.data || []) })

  const avgScore = leads?.length
    ? Math.round((leads.reduce((s, l) => s + (l.score || 0), 0)) / leads.length)
    : 0

  const today = new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })

  const STATUS_COLORS = {
    new: { color: '#6366F1', bg: '#EEF2FF' },
    contacted: { color: '#7C3AED', bg: '#F5F3FF' },
    qualified: { color: '#2563EB', bg: '#EFF6FF' },
    visiting: { color: '#0891B2', bg: '#ECFEFF' },
    negotiating: { color: '#D97706', bg: '#FFF7ED' },
    closed: { color: '#059669', bg: '#ECFDF5' },
    lost: { color: '#DC2626', bg: '#FEF2F2' },
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 22,
      opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease',
    }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
        borderRadius: 18, padding: '24px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 4, letterSpacing: 0.3 }}>
            {today}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
            {greeting}, {user?.name?.split(' ')[0] || 'Agent'} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '6px 0 0' }}>
            You have <strong style={{ color: '#60A5FA' }}>{apptStats?.today ?? 0} appointments</strong> and{' '}
            <strong style={{ color: '#F87171' }}>{convStats?.unread ?? 0} unread messages</strong> today.
          </p>
        </div>

        {/* Score ring */}
        <div style={{ textAlign: 'center' }}>
          <ScoreRing score={avgScore} />
          <div style={{ fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: 600 }}>
            AVG LEAD SCORE
          </div>
        </div>
      </div>

      {/* ── My stats ── */}
      <div style={{ display: 'flex', gap: 12 }}>
        <MetricPill label="My Leads"      value={leadStats?.total}     color="#2563EB" bg="#EFF6FF" />
        <MetricPill label="Qualified"     value={leadStats?.qualified} color="#7C3AED" bg="#F5F3FF" />
        <MetricPill label="Closed"        value={leadStats?.closed}    color="#059669" bg="#ECFDF5" />
        <MetricPill label="Appointments"  value={apptStats?.total}     color="#D97706" bg="#FFF7ED" />
        <MetricPill label="Unread"        value={convStats?.unread}    color="#DC2626" bg="#FEF2F2" />
      </div>

      {/* ── Two columns: leads + appointments ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* My recent leads */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8ECF0', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0F1E' }}>My Leads</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Recently assigned</div>
            </div>
            <button onClick={() => navigate('/agent/leads')} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 600, color: '#2563EB',
              border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              All leads <ArrowRight size={11} />
            </button>
          </div>

          {(leads || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF', fontSize: 13 }}>
              No leads assigned yet
            </div>
          ) : (
            (leads || []).slice(0, 5).map(lead => {
              const sc = STATUS_COLORS[lead.status] || STATUS_COLORS.new
              return (
                <TaskRow
                  key={lead.id}
                  icon="👤"
                  title={lead.name}
                  sub={`${lead.source || 'unknown'} · ${lead.location || 'no location'}`}
                  badge={lead.status}
                  badgeColor={sc.color}
                  badgeBg={sc.bg}
                  onClick={() => navigate('/agent/leads')}
                />
              )
            })
          )}
        </div>

        {/* Today's appointments */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8ECF0', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0F1E' }}>My Appointments</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Upcoming schedule</div>
            </div>
            <button onClick={() => navigate('/agent/calendar')} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 600, color: '#7C3AED',
              border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Calendar <ArrowRight size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Today',    value: apptStats?.today     ?? 0, color: '#7C3AED', bg: '#F5F3FF' },
              { label: 'Upcoming', value: apptStats?.upcoming  ?? 0, color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Done',     value: apptStats?.completed ?? 0, color: '#059669', bg: '#ECFDF5' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '10px 8px', borderRadius: 10,
                background: s.bg, textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: s.color + 'BB', fontWeight: 600, marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {(appts || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>
              No upcoming appointments
            </div>
          ) : (
            (appts || []).slice(0, 3).map(appt => (
              <TaskRow
                key={appt.id}
                icon={appt.type === 'site_visit' ? '🏠' : appt.type === 'call' ? '📞' : '🤝'}
                title={appt.title}
                sub={appt.starts_at?.substring(0, 16).replace('T', ' ') || '—'}
                badge={appt.status}
                badgeColor={appt.status === 'completed' ? '#059669' : appt.status === 'cancelled' ? '#DC2626' : '#7C3AED'}
                badgeBg={appt.status === 'completed' ? '#ECFDF5' : appt.status === 'cancelled' ? '#FEF2F2' : '#F5F3FF'}
                onClick={() => navigate('/agent/calendar')}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Bottom: Performance + Inbox ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Performance card */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #E8ECF0', padding: 22,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0F1E', marginBottom: 16 }}>My Performance</div>
          {[
            { label: 'New leads',        value: leadStats?.new         ?? 0, total: leadStats?.total || 1, color: '#6366F1' },
            { label: 'Qualified',        value: leadStats?.qualified   ?? 0, total: leadStats?.total || 1, color: '#2563EB' },
            { label: 'Appts completed',  value: apptStats?.completed   ?? 0, total: apptStats?.total || 1, color: '#059669' },
            { label: 'Closed deals',     value: leadStats?.closed      ?? 0, total: leadStats?.total || 1, color: '#D97706' },
          ].map((item, i) => {
            const pct = Math.round((item.value / item.total) * 100)
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0A0F1E' }}>
                    {item.value} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({pct}%)</span>
                  </span>
                </div>
                <div style={{ height: 5, background: '#F3F4F6', borderRadius: 99 }}>
                  <div style={{
                    height: '100%', width: `${pct}%`, background: item.color,
                    borderRadius: 99, transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Inbox quick view */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #E8ECF0', padding: 22,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0F1E' }}>Inbox</div>
            <button onClick={() => navigate('/agent/inbox')} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 600, color: '#D97706',
              border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Open inbox <ArrowRight size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total',    value: convStats?.total    ?? 0, color: '#374151',  bg: '#F9FAFB' },
              { label: 'Open',     value: convStats?.open     ?? 0, color: '#D97706',  bg: '#FFF7ED' },
              { label: 'Unread',   value: convStats?.unread   ?? 0, color: '#DC2626',  bg: '#FEF2F2' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '12px 8px', borderRadius: 10,
                background: s.bg, textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {convStats?.unread > 0 ? (
            <div style={{
              marginTop: 'auto', padding: '12px 14px', borderRadius: 10,
              background: '#FEF2F2', border: '1px solid #FECACA',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
                  {convStats.unread} unread message{convStats.unread > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 11, color: '#F87171', marginTop: 1 }}>Needs attention</div>
              </div>
              <button onClick={() => navigate('/agent/inbox')} style={{
                padding: '6px 14px', borderRadius: 7, border: 'none',
                background: '#DC2626', color: '#fff', fontSize: 11,
                fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>
                Reply
              </button>
            </div>
          ) : (
            <div style={{
              marginTop: 'auto', padding: '14px', borderRadius: 10,
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              textAlign: 'center', fontSize: 13, color: '#059669', fontWeight: 600,
            }}>
              ✅ All caught up!
            </div>
          )}
        </div>
      </div>

    </div>
  )
}