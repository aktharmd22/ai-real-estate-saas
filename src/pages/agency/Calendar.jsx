import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Calendar, List, Clock, Pencil, Trash2 } from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import AppointmentModal from '../../components/calendar/AppointmentModal'
import AppointmentDetailModal from '../../components/calendar/AppointmentDetailModal'

const TYPE_CONFIG = {
  site_visit: { label: 'Site Visit', color: '#2563EB', bg: '#EFF6FF', icon: '🏠' },
  call:       { label: 'Call',       color: '#059669', bg: '#ECFDF5', icon: '📞' },
  meeting:    { label: 'Meeting',    color: '#7C3AED', bg: '#F5F3FF', icon: '🤝' },
  follow_up:  { label: 'Follow Up', color: '#D97706', bg: '#FFF7ED', icon: '🔔' },
  other:      { label: 'Other',     color: '#64748B', bg: '#F1F5F9', icon: '📌' },
}

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: '#2563EB', bg: '#EFF6FF' },
  completed: { label: 'Completed', color: '#059669', bg: '#ECFDF5' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2' },
  no_show:   { label: 'No Show',  color: '#D97706', bg: '#FFF7ED' },
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function formatDatetime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) + ' · ' + formatTime(dateStr)
}

// ─── Appointment Pill (used in calendar cells) ───────────────────────────────
function ApptPill({ appt, onClick }) {
  const cfg = TYPE_CONFIG[appt.type] || TYPE_CONFIG.other
  const isDone = appt.status === 'completed' || appt.status === 'cancelled'
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(appt) }}
      style={{
        padding: '2px 7px', borderRadius: 5, marginBottom: 2,
        background: isDone ? '#F1F5F9' : cfg.bg,
        color: isDone ? '#94A3B8' : cfg.color,
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
        textDecoration: isDone ? 'line-through' : 'none',
        opacity: isDone ? 0.6 : 1,
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = isDone ? '0.6' : '1'}
    >
      <span>{cfg.icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {formatTime(appt.starts_at)} {appt.title}
      </span>
    </div>
  )
}

export default function CalendarPage() {
  const { user }  = useAuthStore()
  const isAgent   = user?.role === 'agent'
  const apiBase   = isAgent ? '/agent' : '/agency'
  const qc        = useQueryClient()

  const today     = new Date()
  const [view, setView]         = useState('month')  // month | list
  const [year, setYear]         = useState(today.getFullYear())
  const [month, setMonth]       = useState(today.getMonth() + 1)
  const [showCreate, setCreate]         = useState(false)
  const [createDate, setCreateDate]     = useState(null)
  const [selected, setSelected]         = useState(null)
  const [editAppt, setEditAppt]         = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // ─── Fetch appointments ───────────────────────────────────────────────────
  const { data: apptData, isLoading } = useQuery({
    queryKey: ['appointments', apiBase, year, month],
    queryFn: () => api.get(`${apiBase}/appointments`, { params: { year, month } })
      .then(r => r.data.data || []),
  })

  // ─── Stats ────────────────────────────────────────────────────────────────
  const { data: statsData } = useQuery({
    queryKey: ['appt-stats', apiBase],
    queryFn: () => api.get(`${apiBase}/appointments/stats`).then(r => r.data.data),
  })

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteAppt = useMutation({
    mutationFn: (id) => api.delete(`/agency/appointments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['appt-stats'] })
      setSelected(null)
    },
  })

  // ─── Update status ────────────────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`/agency/appointments/${id}`, { status }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      const updated = res.data?.data
      if (updated) setSelected(updated)
    },
  })

  const appointments = apptData || []
  const stats        = statsData || {}

  // ─── Build calendar grid ──────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const prevDays = new Date(year, month - 1, 0).getDate()
    const days = []

    // Prev month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: prevDays - i, currentMonth: false, full: null })
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const full = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      days.push({ date: d, currentMonth: true, full })
    }
    // Next month padding to fill 6 rows
    let next = 1
    while (days.length % 7 !== 0) {
      days.push({ date: next++, currentMonth: false, full: null })
    }
    return days
  }, [year, month])

  // Group appointments by date — handles "2026-02-25 10:00:00" and "2026-02-25T10:00:00"
  const apptByDate = useMemo(() => {
    const map = {}
    appointments.forEach(a => {
      if (!a.starts_at) return
      // Always take just the date part before any T or space
      const d = a.starts_at.substring(0, 10)
      if (!map[d]) map[d] = []
      map[d].push(a)
    })
    return map
  }, [appointments])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1) }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const [hoveredDay, setHoveredDay] = useState(null)

  const getCellBg = (day, index) => {
    const isToday = day.full === todayStr
    const hovered = hoveredDay === index && day.currentMonth && !isAgent
    if (isToday && hovered)   return '#FEF9C3'
    if (isToday)              return '#FEFCE8'
    if (hovered)              return '#F0F7FF'
    if (day.currentMonth)     return '#fff'
    return '#FAFAFA'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {[
          { label: 'Total',     value: stats.total     || 0, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Scheduled', value: stats.scheduled || 0, color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Completed', value: stats.completed || 0, color: '#059669', bg: '#ECFDF5' },
          { label: 'Cancelled', value: stats.cancelled || 0, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Today',     value: stats.today     || 0, color: '#D97706', bg: '#FFF7ED' },
          { label: 'Upcoming',  value: stats.upcoming  || 0, color: '#0891B2', bg: '#ECFEFF' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #E2E8F0', padding: '14px 16px',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Calendar header ── */}
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0',
        overflow: 'hidden',
      }}>

        {/* Toolbar */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={prevMonth} style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
              background: '#F8FAFC', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronLeft size={16} color="#64748B" />
            </button>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0, minWidth: 160, textAlign: 'center' }}>
              {MONTHS[month - 1]} {year}
            </h3>
            <button onClick={nextMonth} style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
              background: '#F8FAFC', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronRight size={16} color="#64748B" />
            </button>
            <button onClick={goToday} style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
              background: '#F8FAFC', fontSize: 12, fontWeight: 600,
              color: '#374151', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              Today
            </button>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3, gap: 2 }}>
              {[
                { id: 'month', icon: Calendar },
                { id: 'list',  icon: List },
              ].map(v => (
                <button key={v.id} onClick={() => setView(v.id)} style={{
                  padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  background: view === v.id ? '#fff' : 'transparent',
                  color: view === v.id ? '#2563EB' : '#64748B',
                  boxShadow: view === v.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  <v.icon size={15} />
                </button>
              ))}
            </div>
            <button
              onClick={() => { setCreateDate(null); setCreate(true) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none',
                background: '#2563EB', color: '#fff', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Plus size={14} /> New Appointment
            </button>
          </div>
        </div>

        {/* ── MONTH VIEW ── */}
        {view === 'month' && (
          <>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #E2E8F0' }}>
              {DAYS.map(d => (
                <div key={d} style={{
                  padding: '8px 0', textAlign: 'center',
                  fontSize: 11, fontWeight: 700, color: '#94A3B8',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {calendarDays.map((day, i) => {
                const isToday   = day.full === todayStr
                const dayAppts  = day.full ? (apptByDate[day.full] || []) : []
                const isLastRow = i >= calendarDays.length - 7

                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (day.currentMonth && !isAgent) {
                        setCreateDate(day.full)
                        setCreate(true)
                      }
                    }}
                    onMouseEnter={() => setHoveredDay(i)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      minHeight: 100, padding: '6px 6px',
                      borderRight: (i + 1) % 7 !== 0 ? '1px solid #F1F5F9' : 'none',
                      borderBottom: !isLastRow ? '1px solid #F1F5F9' : 'none',
                      background: getCellBg(day, i),
                      cursor: day.currentMonth && !isAgent ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Date number */}
                    <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: isToday ? 700 : 500,
                        background: isToday ? '#2563EB' : 'transparent',
                        color: isToday ? '#fff' : day.currentMonth ? '#374151' : '#CBD5E1',
                      }}>
                        {day.date}
                      </span>
                    </div>

                    {/* Appointment pills */}
                    {dayAppts.slice(0, 3).map(a => (
                      <ApptPill key={a.id} appt={a} onClick={setSelected} />
                    ))}
                    {dayAppts.length > 3 && (
                      <div style={{ fontSize: 10, color: '#94A3B8', paddingLeft: 4 }}>
                        +{dayAppts.length - 3} more
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div style={{ padding: 20 }}>
            {isLoading && (
              <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px 0' }}>
                Loading appointments...
              </div>
            )}
            {!isLoading && appointments.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94A3B8', padding: '60px 0' }}>
                <Calendar size={40} color="#E2E8F0" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  No appointments in {MONTHS[month - 1]} {year}
                </div>
                <div style={{ fontSize: 13 }}>Click "New Appointment" to schedule one</div>
              </div>
            )}
            {appointments.map(appt => {
              const typeCfg   = TYPE_CONFIG[appt.type]    || TYPE_CONFIG.other
              const statusCfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled
              const isDeleting = deleteConfirmId === appt.id

              return (
                <div key={appt.id}>
                  <div
                    style={{
                      display: 'flex', gap: 14, padding: '14px 16px',
                      borderRadius: isDeleting ? '12px 12px 0 0' : 12,
                      border: '1px solid',
                      borderColor: isDeleting ? '#FECACA' : '#E2E8F0',
                      borderBottom: isDeleting ? 'none' : '1px solid #E2E8F0',
                      marginBottom: isDeleting ? 0 : 10,
                      transition: 'all 0.15s', background: '#fff',
                      alignItems: 'center',
                    }}
                  >
                    {/* Type icon */}
                    <div
                      onClick={() => setSelected(appt)}
                      style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: typeCfg.bg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 20, cursor: 'pointer',
                      }}
                    >
                      {typeCfg.icon}
                    </div>

                    {/* Content — clickable */}
                    <div
                      onClick={() => setSelected(appt)}
                      style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>
                          {appt.title}
                        </div>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: statusCfg.bg, color: statusCfg.color, fontWeight: 600,
                        }}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} />
                          {formatDatetime(appt.starts_at)}
                          {appt.ends_at && ` — ${formatTime(appt.ends_at)}`}
                        </span>
                        {appt.location && (
                          <span style={{ fontSize: 12, color: '#64748B' }}>📍 {appt.location}</span>
                        )}
                        {appt.lead && (
                          <span style={{ fontSize: 12, color: '#7C3AED' }}>🎯 {appt.lead.name}</span>
                        )}
                        {appt.property && (
                          <span style={{ fontSize: 12, color: '#2563EB' }}>🏠 {appt.property.title}</span>
                        )}
                        {appt.assigned_to && (
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>→ {appt.assigned_to.name}</span>
                        )}
                      </div>
                    </div>

                    {/* ── Edit + Delete buttons ── */}
                    {!isAgent && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={e => { e.stopPropagation(); setEditAppt(appt) }}
                          title="Edit appointment"
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: '1px solid #E2E8F0', background: '#F8FAFC',
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#EFF6FF'
                            e.currentTarget.style.borderColor = '#BFDBFE'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = '#F8FAFC'
                            e.currentTarget.style.borderColor = '#E2E8F0'
                          }}
                        >
                          <Pencil size={13} color="#2563EB" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setDeleteConfirmId(isDeleting ? null : appt.id)
                          }}
                          title="Delete appointment"
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: `1px solid ${isDeleting ? '#FECACA' : '#E2E8F0'}`,
                            background: isDeleting ? '#FEF2F2' : '#F8FAFC',
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#FEF2F2'
                            e.currentTarget.style.borderColor = '#FECACA'
                          }}
                          onMouseLeave={e => {
                            if (!isDeleting) {
                              e.currentTarget.style.background = '#F8FAFC'
                              e.currentTarget.style.borderColor = '#E2E8F0'
                            }
                          }}
                        >
                          <Trash2 size={13} color="#DC2626" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Delete confirm row ── */}
                  {isDeleting && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 16px', marginBottom: 10,
                      background: '#FEF2F2', border: '1px solid #FECACA',
                      borderTop: 'none', borderRadius: '0 0 12px 12px',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>
                        🗑️ Delete "{appt.title}"?
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          style={{
                            padding: '5px 14px', borderRadius: 7,
                            border: '1px solid #E2E8F0', background: '#fff',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            deleteAppt.mutate(appt.id)
                            setDeleteConfirmId(null)
                          }}
                          style={{
                            padding: '5px 14px', borderRadius: 7, border: 'none',
                            background: '#DC2626', color: '#fff',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          Yes, Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <AppointmentModal
          initialDate={createDate}
          isAgent={isAgent}
          apiBase={apiBase}
          onClose={() => { setCreate(false); setCreateDate(null) }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['appointments'] })
            qc.invalidateQueries({ queryKey: ['appt-stats'] })
            setCreate(false)
          }}
        />
      )}

      {/* Edit from list view */}
      {editAppt && (
        <AppointmentModal
          appointment={editAppt}
          isAgent={isAgent}
          apiBase={apiBase}
          onClose={() => setEditAppt(null)}
          onSaved={(updated) => {
            qc.invalidateQueries({ queryKey: ['appointments'] })
            qc.invalidateQueries({ queryKey: ['appt-stats'] })
            setEditAppt(null)
            // Also update detail modal if it's open
            if (selected?.id === editAppt.id) setSelected(updated)
          }}
        />
      )}

      {selected && (
        <AppointmentDetailModal
          appointment={selected}
          isAgent={isAgent}
          onClose={() => setSelected(null)}
          onEdit={(updated) => {
            setSelected(updated)
            qc.invalidateQueries({ queryKey: ['appointments'] })
            qc.invalidateQueries({ queryKey: ['appt-stats'] })
          }}
          onDelete={(id) => deleteAppt.mutate(id)}
          onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
        />
      )}
    </div>
  )
}