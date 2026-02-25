import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '../../lib/axios'
import Button from '../ui/Button'
import Input from '../ui/Input'

const TYPE_OPTIONS = [
  { value: 'site_visit', label: '🏠 Site Visit' },
  { value: 'call',       label: '📞 Call' },
  { value: 'meeting',    label: '🤝 Meeting' },
  { value: 'follow_up',  label: '🔔 Follow Up' },
  { value: 'other',      label: '📌 Other' },
]

export default function AppointmentModal({ appointment, initialDate, isAgent, apiBase = '/agency', onClose, onSaved }) {
  const isEdit = !!appointment

  const toLocalInput = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const defaultStart = initialDate
    ? `${initialDate}T10:00`
    : toLocalInput(new Date(Date.now() + 3600000).toISOString())

  const defaultEnd = initialDate
    ? `${initialDate}T11:00`
    : toLocalInput(new Date(Date.now() + 7200000).toISOString())

  const [form, setForm] = useState({
    title:        appointment?.title        || '',
    description:  appointment?.description  || '',
    type:         appointment?.type         || 'meeting',
    status:       appointment?.status       || 'scheduled',
    starts_at:    isEdit ? toLocalInput(appointment.starts_at) : defaultStart,
    ends_at:      isEdit ? toLocalInput(appointment.ends_at)   : defaultEnd,
    location:     appointment?.location     || '',
    meeting_link: appointment?.meeting_link || '',
    notes:        appointment?.notes        || '',
    assigned_to:  appointment?.assigned_to?.id  || '',
    lead_id:      appointment?.lead?.id         || '',
    property_id:  appointment?.property?.id     || '',
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Load agents
  const { data: agents = [] } = useQuery({
    queryKey: ['agents-dropdown'],
    queryFn: () => api.get('/agency/users', { params: { role: 'agent', per_page: 100 } })
      .then(r => r.data?.data || []),
    enabled: !isAgent,
  })

  // Load leads
  const { data: leads = [] } = useQuery({
    queryKey: ['leads-dropdown'],
    queryFn: () => api.get(`${apiBase}/leads`, { params: { per_page: 100 } })
      .then(r => r.data?.data || []),
  })

  // Load properties
  const { data: properties = [] } = useQuery({
    queryKey: ['properties-dropdown'],
    queryFn: () => api.get(`${apiBase}/properties`, { params: { per_page: 100 } })
      .then(r => r.data?.data || []),
  })

  const save = useMutation({
    mutationFn: (data) => isEdit
      ? api.put(`/agency/appointments/${appointment.id}`, data)
      : api.post('/agency/appointments', data),
    onSuccess: (res) => onSaved(res.data?.data),
    onError: (err) => setErrors(err.response?.data?.errors || {}),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    const cleaned = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    )
    save.mutate(cleaned)
  }

  const selectStyle = {
    border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px',
    fontSize: 14, color: '#0F172A', background: '#fff', outline: 'none',
    cursor: 'pointer', width: '100%', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  }

  const labelStyle = {
    fontSize: 13, fontWeight: 600, color: '#374151',
    marginBottom: 6, display: 'block',
  }

  const sectionStyle = {
    fontSize: 11, fontWeight: 700, color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 1,
    paddingTop: 16, marginTop: 4, borderTop: '1px solid #F1F5F9',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 580,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              {isEdit ? 'Edit Appointment' : 'New Appointment'}
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0' }}>
              {isEdit ? 'Update the appointment details' : 'Schedule a new appointment'}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
            background: '#F8FAFC', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} color="#64748B" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <form onSubmit={handleSubmit} id="appt-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Title */}
              <Input
                label="Title *"
                placeholder="e.g. Site visit with Priya at Bandra project"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                error={errors.title?.[0]}
              />

              {/* Type + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Type *</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} style={selectStyle}>
                    {TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>
              </div>

              {/* Start + End time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={e => set('starts_at', e.target.value)}
                    style={{ ...selectStyle, border: errors.starts_at ? '1px solid #FCA5A5' : '1px solid #E2E8F0' }}
                  />
                  {errors.starts_at && (
                    <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{errors.starts_at[0]}</div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>End Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={e => set('ends_at', e.target.value)}
                    style={{ ...selectStyle, border: errors.ends_at ? '1px solid #FCA5A5' : '1px solid #E2E8F0' }}
                  />
                  {errors.ends_at && (
                    <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{errors.ends_at[0]}</div>
                  )}
                </div>
              </div>

              {/* Location + Meeting link */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Input
                  label="Location"
                  placeholder="Office / Site address"
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                />
                <Input
                  label="Meeting Link"
                  placeholder="https://meet.google.com/..."
                  value={form.meeting_link}
                  onChange={e => set('meeting_link', e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="What is this appointment about?"
                  rows={2}
                  style={{
                    width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
                    padding: '10px 12px', fontSize: 14, color: '#0F172A',
                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>

              {/* Links section */}
              <div style={sectionStyle}>Links & Assignment</div>

              {/* Lead */}
              <div>
                <label style={labelStyle}>Link to Lead</label>
                <select value={form.lead_id} onChange={e => set('lead_id', e.target.value)} style={selectStyle}>
                  <option value="">No lead linked</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.phone ? `· ${l.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Property */}
              <div>
                <label style={labelStyle}>Link to Property</label>
                <select value={form.property_id} onChange={e => set('property_id', e.target.value)} style={selectStyle}>
                  <option value="">No property linked</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Assign agent */}
              {!isAgent && (
                <div>
                  <label style={labelStyle}>Assign To Agent</label>
                  <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} style={selectStyle}>
                    <option value="">Assign to myself</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label style={labelStyle}>Internal Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Any internal notes about this appointment..."
                  rows={2}
                  style={{
                    width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
                    padding: '10px 12px', fontSize: 14, color: '#0F172A',
                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0,
        }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            loading={save.isPending}
          >
            {isEdit ? 'Save Changes' : 'Create Appointment'}
          </Button>
        </div>
      </div>
    </div>
  )
}