import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { TrendingUp, Users, Calendar, MessageSquare, Home, Target } from 'lucide-react'
import api from '../../lib/axios'

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
  blue:   '#2563EB',
  purple: '#7C3AED',
  green:  '#059669',
  red:    '#DC2626',
  amber:  '#D97706',
  cyan:   '#0891B2',
  pink:   '#DB2777',
  slate:  '#64748B',
}

const PIE_COLORS = [
  '#2563EB','#7C3AED','#059669','#D97706','#DC2626',
  '#0891B2','#DB2777','#64748B','#16A34A','#EA580C',
]

const STATUS_COLORS = {
  new:          '#64748B',
  contacted:    '#7C3AED',
  qualified:    '#2563EB',
  visiting:     '#0891B2',
  negotiating:  '#D97706',
  closed:       '#059669',
  lost:         '#DC2626',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => typeof n === 'number' ? n.toLocaleString('en-IN') : n

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, bg, icon: Icon }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0',
      padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center',
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
          {fmt(value)}
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: 500 }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: color, marginTop: 3, fontWeight: 600 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0',
      padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: 12, color: '#64748B' }}>{p.name}:</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Analytics Page ──────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [months, setMonths] = useState(6)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })

  const params = { from: dateRange.from, to: dateRange.to, months }

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: overview }  = useQuery({
    queryKey: ['analytics-overview', dateRange],
    queryFn: () => api.get('/agency/analytics/overview', { params: dateRange })
      .then(r => r.data.data),
  })

  const { data: trends } = useQuery({
    queryKey: ['analytics-trends', months],
    queryFn: () => api.get('/agency/analytics/lead-trends', { params: { months } })
      .then(r => r.data.data || []),
  })

  const { data: sources } = useQuery({
    queryKey: ['analytics-sources'],
    queryFn: () => api.get('/agency/analytics/leads-by-source')
      .then(r => r.data.data || []),
  })

  const { data: funnel } = useQuery({
    queryKey: ['analytics-funnel'],
    queryFn: () => api.get('/agency/analytics/lead-funnel')
      .then(r => r.data.data || []),
  })

  const { data: agents } = useQuery({
    queryKey: ['analytics-agents', dateRange],
    queryFn: () => api.get('/agency/analytics/agent-performance', { params: dateRange })
      .then(r => r.data.data || []),
  })

  const { data: apptStats } = useQuery({
    queryKey: ['analytics-appts', months],
    queryFn: () => api.get('/agency/analytics/appointment-stats', { params: { months } })
      .then(r => r.data.data || []),
  })

  const ov = overview || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Analytics
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
            Track performance across leads, agents, and properties
          </p>
        </div>

        {/* Date range + period filter */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Month range toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3, gap: 2 }}>
            {[3, 6, 12].map(m => (
              <button key={m} onClick={() => setMonths(m)} style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                background: months === m ? '#fff' : 'transparent',
                color: months === m ? '#2563EB' : '#64748B',
                boxShadow: months === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              }}>
                {m}M
              </button>
            ))}
          </div>

          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
              style={{
                border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px',
                fontSize: 13, color: '#374151', outline: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <span style={{ color: '#94A3B8', fontSize: 13 }}>to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
              style={{
                border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 10px',
                fontSize: 13, color: '#374151', outline: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Overview stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard
          label="Total Leads"
          value={ov.leads?.total || 0}
          sub={`+${ov.leads?.this_period || 0} this period`}
          color={COLORS.blue} bg="#EFF6FF" icon={Users}
        />
        <StatCard
          label="Conversion Rate"
          value={`${ov.leads?.conversion_rate || 0}%`}
          sub={`${ov.leads?.closed || 0} closed deals`}
          color={COLORS.green} bg="#ECFDF5" icon={Target}
        />
        <StatCard
          label="Appointments"
          value={ov.appointments?.total || 0}
          sub={`${ov.appointments?.completed || 0} completed`}
          color={COLORS.purple} bg="#F5F3FF" icon={Calendar}
        />
        <StatCard
          label="Properties"
          value={ov.properties?.total || 0}
          sub={`${ov.properties?.available || 0} available`}
          color={COLORS.amber} bg="#FFF7ED" icon={Home}
        />
      </div>

      {/* ── Second row stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard
          label="New Leads"
          value={ov.leads?.new || 0}
          sub="In pipeline"
          color={COLORS.slate} bg="#F1F5F9" icon={TrendingUp}
        />
        <StatCard
          label="Qualified"
          value={ov.leads?.qualified || 0}
          sub="Ready to close"
          color={COLORS.cyan} bg="#ECFEFF" icon={Target}
        />
        <StatCard
          label="Conversations"
          value={ov.conversations?.total || 0}
          sub={`${ov.conversations?.open || 0} open`}
          color={COLORS.pink} bg="#FDF2F8" icon={MessageSquare}
        />
        <StatCard
          label="Properties Sold"
          value={ov.properties?.sold || 0}
          sub="All time"
          color={COLORS.green} bg="#ECFDF5" icon={Home}
        />
      </div>

      {/* ── Lead Trends Chart ── */}
      <Section
        title="Lead Trends"
        subtitle={`Monthly lead volume over the last ${months} months`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trends || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Line type="monotone" dataKey="total"     stroke={COLORS.blue}   strokeWidth={2.5} dot={{ r: 4 }} name="Total" />
            <Line type="monotone" dataKey="qualified" stroke={COLORS.green}  strokeWidth={2}   dot={{ r: 3 }} name="Qualified" />
            <Line type="monotone" dataKey="closed"    stroke={COLORS.purple} strokeWidth={2}   dot={{ r: 3 }} name="Closed" />
            <Line type="monotone" dataKey="lost"      stroke={COLORS.red}    strokeWidth={2}   dot={{ r: 3 }} strokeDasharray="4 2" name="Lost" />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Funnel + Sources (side by side) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Lead Funnel */}
        <Section title="Lead Funnel" subtitle="Leads by pipeline stage">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(funnel || []).map(stage => (
              <div key={stage.status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', textTransform: 'capitalize' }}>
                    {stage.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    {stage.count}
                    <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>
                      ({stage.percentage}%)
                    </span>
                  </span>
                </div>
                <div style={{ height: 8, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    width: `${Math.max(stage.percentage, 2)}%`,
                    background: STATUS_COLORS[stage.status] || COLORS.blue,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Leads by Source */}
        <Section title="Leads by Source" subtitle="Where your leads are coming from">
          {(sources || []).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px 0', fontSize: 13 }}>
              No data yet
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={sources}
                    dataKey="count"
                    nameKey="source"
                    cx="50%" cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {(sources || []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      fontSize: 12, borderRadius: 8,
                      border: '1px solid #E2E8F0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(sources || []).slice(0, 8).map((s, i) => (
                  <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: PIE_COLORS[i % PIE_COLORS.length],
                    }} />
                    <span style={{ fontSize: 12, color: '#374151', flex: 1, textTransform: 'capitalize' }}>
                      {s.source}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* ── Appointment Stats Chart ── */}
      <Section
        title="Appointment Activity"
        subtitle={`Monthly appointment breakdown over last ${months} months`}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={apptStats || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar dataKey="total"     name="Total"     fill={COLORS.blue}   radius={[4,4,0,0]} />
            <Bar dataKey="completed" name="Completed" fill={COLORS.green}  radius={[4,4,0,0]} />
            <Bar dataKey="cancelled" name="Cancelled" fill={COLORS.red}    radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Agent Performance Table ── */}
      <Section
        title="Agent Performance"
        subtitle={`Leaderboard from ${dateRange.from} to ${dateRange.to}`}
      >
        {(agents || []).length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px 0', fontSize: 13 }}>
            No agents found. Add agents to see performance data.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Agent', 'Total Leads', 'New (Period)', 'Closed', 'Conv. Rate', 'Avg Score', 'Appointments', 'Completed'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#94A3B8',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(agents || []).map((row, i) => (
                  <tr key={row.agent.id} style={{
                    background: i % 2 === 0 ? '#fff' : '#FAFBFF',
                  }}>
                    {/* Agent name */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: `linear-gradient(135deg, ${PIE_COLORS[i % PIE_COLORS.length]}30, ${PIE_COLORS[i % PIE_COLORS.length]}15)`,
                          border: `1.5px solid ${PIE_COLORS[i % PIE_COLORS.length]}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700,
                          color: PIE_COLORS[i % PIE_COLORS.length],
                        }}>
                          {row.agent.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                          {row.agent.name}
                        </span>
                      </div>
                    </td>

                    {/* Stats */}
                    <td style={tdStyle}>{row.total_leads}</td>
                    <td style={tdStyle}>{row.new_leads}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: row.closed_leads > 0 ? '#ECFDF5' : '#F1F5F9',
                        color: row.closed_leads > 0 ? '#059669' : '#94A3B8',
                      }}>
                        {row.closed_leads}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden', minWidth: 60 }}>
                          <div style={{
                            height: '100%', borderRadius: 999,
                            width: `${Math.min(row.conversion_rate, 100)}%`,
                            background: row.conversion_rate >= 20 ? COLORS.green : row.conversion_rate >= 10 ? COLORS.amber : COLORS.red,
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
                          {row.conversion_rate}%
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: row.avg_score >= 70 ? COLORS.green : row.avg_score >= 40 ? COLORS.amber : COLORS.red,
                      }}>
                        {row.avg_score}
                      </span>
                    </td>
                    <td style={tdStyle}>{row.appointments}</td>
                    <td style={tdStyle}>{row.appts_completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

    </div>
  )
}

const tdStyle = {
  padding: '12px 14px',
  fontSize: 13, color: '#374151',
  borderBottom: '1px solid #F8FAFC',
}