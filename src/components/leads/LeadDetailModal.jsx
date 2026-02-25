import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Phone, Mail, MapPin, User } from 'lucide-react'
import api from '../../lib/axios'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { formatDate, formatDateTime, formatCurrency, LEAD_STATUS_CONFIG } from '../../utils/helpers'

const NOTE_TYPES = [
  { value: 'note',  label: '📝 Note' },
  { value: 'call',  label: '📞 Call' },
  { value: 'email', label: '📧 Email' },
  { value: 'visit', label: '🏠 Visit' },
]

export default function LeadDetailModal({ lead: initialLead, onClose, apiBase = '/agency' }) {
  const qc = useQueryClient()
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType]       = useState('note')
  const [activeTab, setActiveTab]     = useState('overview')
  const [localStatus, setLocalStatus] = useState(initialLead.status)
  const [localScore, setLocalScore]   = useState(initialLead.score || 0)
  const [scoreSaved, setScoreSaved]   = useState(false)

  // ─── Fetch full lead with notes ──────────────────────────────────────────
  const { data: leadData, refetch } = useQuery({
    queryKey: ['lead', initialLead.id, apiBase],
    queryFn: () => api.get(`${apiBase}/leads/${initialLead.id}`)
      .then(r => {
        // Handle both {data: {...}} and direct object
        const lead = r.data?.data || r.data
        return lead
      }),
  })

  const lead = leadData || initialLead

  // ─── Update status ───────────────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: (status) => api.put(`${apiBase}/leads/${lead.id}`, { status }),
    onSuccess: () => {
      // Just refetch — don't try to parse response
      refetch()
      qc.invalidateQueries(['leads'])
      qc.invalidateQueries(['leads-kanban'])
      qc.invalidateQueries(['lead-stats'])
    },
    onError: (err) => {
      // Revert local status
      setLocalStatus(lead.status)
      console.error('Status update error:', err.response?.status, err.response?.data)
    },
  })

  // ─── Update score ────────────────────────────────────────────────────────
  const updateScore = useMutation({
    mutationFn: (score) => api.put(`${apiBase}/leads/${lead.id}`, { score }),
    onSuccess: () => {
      setScoreSaved(true)
      setTimeout(() => setScoreSaved(false), 2000)
      refetch()
      qc.invalidateQueries(['leads'])
    },
    onError: (err) => {
      console.error('Score update error:', err.response?.status, err.response?.data)
    },
  })

  // ─── Add note ────────────────────────────────────────────────────────────
  const addNote = useMutation({
    mutationFn: () => api.post(`${apiBase}/leads/${lead.id}/notes`, {
      content: noteContent,
      type: noteType,
    }),
    onSuccess: () => {
      refetch()
      setNoteContent('')
      setNoteType('note')
    },
    onError: (err) => {
      console.error('Add note error:', err.response?.status, err.response?.data)
    },
  })

  // Sync localStatus when lead data refreshes
  const currentStatus = localStatus
  const statusCfg     = LEAD_STATUS_CONFIG[currentStatus] || LEAD_STATUS_CONFIG.new
  const notes         = lead.notes || []
  const scoreColor    = localScore >= 70 ? '#10B981' : localScore >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 720,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {lead.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                {lead.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Badge color={statusCfg.color} bg={statusCfg.bg}>
                  {statusCfg.label}
                </Badge>
                <span style={{ fontSize: 12, color: scoreColor, fontWeight: 600 }}>
                  Score: {localScore}/100
                </span>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>
                  via {lead.source}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
            background: '#F8FAFC', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} color="#64748B" />
          </button>
        </div>

        {/* ── Status Pipeline Bar ── */}
        <div style={{
          padding: '12px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', gap: 6, flexShrink: 0, overflowX: 'auto',
        }}>
          {Object.entries(LEAD_STATUS_CONFIG).map(([status, cfg]) => {
            const isActive = currentStatus === status
            return (
              <button
                key={status}
                onClick={() => {
                  if (isActive || updateStatus.isPending) return
                  setLocalStatus(status)
                  updateStatus.mutate(status)
                }}
                disabled={updateStatus.isPending}
                style={{
                  flex: 1, minWidth: 80, padding: '7px 8px',
                  borderRadius: 8,
                  border: `1.5px solid ${isActive ? cfg.color : '#E2E8F0'}`,
                  background: isActive ? cfg.bg : '#fff',
                  color: isActive ? cfg.color : '#94A3B8',
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  cursor: updateStatus.isPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                  opacity: updateStatus.isPending && !isActive ? 0.5 : 1,
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={e => {
                  if (!isActive && !updateStatus.isPending) {
                    e.currentTarget.style.borderColor = cfg.color
                    e.currentTarget.style.color = cfg.color
                    e.currentTarget.style.background = cfg.bg
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#E2E8F0'
                    e.currentTarget.style.color = '#94A3B8'
                    e.currentTarget.style.background = '#fff'
                  }
                }}
              >
                {updateStatus.isPending && isActive ? '...' : cfg.label}
              </button>
            )
          })}
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', gap: 4, padding: '0 24px',
          borderBottom: '1px solid #E2E8F0', flexShrink: 0,
        }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'notes',    label: `Notes (${notes.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: activeTab === tab.id ? '#2563EB' : '#64748B',
                borderBottom: activeTab === tab.id ? '2px solid #2563EB' : '2px solid transparent',
                transition: 'all 0.15s', marginBottom: -1,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Contact */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Contact
                </div>
                {[
                  { icon: Phone,  label: 'Phone',    value: lead.phone },
                  { icon: Mail,   label: 'Email',    value: lead.email },
                  { icon: MapPin, label: 'Location', value: lead.preferred_location },
                  { icon: User,   label: 'Source',   value: lead.source },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10,
                    background: '#F8FAFC', border: '1px solid #F1F5F9',
                  }}>
                    <item.icon size={14} color="#94A3B8" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>
                        {item.value || '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Qualification */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Qualification
                </div>

                {[
                  {
                    label: 'Budget Range',
                    value: lead.budget_min || lead.budget_max
                      ? `${lead.budget_min ? formatCurrency(lead.budget_min) : '?'} — ${lead.budget_max ? formatCurrency(lead.budget_max) : '?'}`
                      : null,
                  },
                  { label: 'Property Type', value: lead.property_type },
                  { label: 'Timeline',      value: lead.timeline?.replace(/_/g, ' ') },
                  { label: 'Assigned To',   value: lead.assigned_to?.name },
                  { label: 'Last Contact',  value: lead.last_contacted_at ? formatDate(lead.last_contacted_at) : null },
                  { label: 'Created',       value: formatDate(lead.created_at) },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: '#F8FAFC', border: '1px solid #F1F5F9',
                  }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{item.value || '—'}</div>
                  </div>
                ))}

                {/* ── Score Editor ── */}
                <div style={{
                  padding: '14px', borderRadius: 10,
                  background: '#F8FAFC', border: '1px solid #F1F5F9',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Lead Score
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: scoreColor }}>
                      {localScore}/100
                    </div>
                  </div>

                  <div style={{ background: '#E2E8F0', borderRadius: 999, height: 8, marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999, width: `${localScore}%`,
                      background: scoreColor, transition: 'width 0.3s, background 0.3s',
                    }} />
                  </div>

                  <input
                    type="range" min={0} max={100} step={5}
                    value={localScore}
                    onChange={e => { setLocalScore(Number(e.target.value)); setScoreSaved(false) }}
                    style={{ width: '100%', marginBottom: 10, cursor: 'pointer', accentColor: scoreColor }}
                  />

                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {[
                      { label: '❄️ Cold', value: 20,  color: '#EF4444', bg: '#FEF2F2' },
                      { label: '🌤 Warm', value: 50,  color: '#F59E0B', bg: '#FFF7ED' },
                      { label: '🔥 Hot',  value: 80,  color: '#10B981', bg: '#ECFDF5' },
                      { label: '🏆 Won',  value: 100, color: '#2563EB', bg: '#EFF6FF' },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        onClick={() => { setLocalScore(btn.value); setScoreSaved(false) }}
                        style={{
                          flex: 1, padding: '4px', borderRadius: 6,
                          border: `1px solid ${localScore === btn.value ? btn.color : '#E2E8F0'}`,
                          background: localScore === btn.value ? btn.bg : '#fff',
                          color: localScore === btn.value ? btn.color : '#64748B',
                          fontSize: 10, fontWeight: 600, cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => updateScore.mutate(localScore)}
                    disabled={updateScore.isPending || scoreSaved}
                    style={{
                      width: '100%', padding: '8px', borderRadius: 8, border: 'none',
                      background: scoreSaved ? '#10B981'
                        : updateScore.isPending ? '#93C5FD'
                        : localScore === (lead.score || 0) ? '#F1F5F9'
                        : '#2563EB',
                      color: !scoreSaved && localScore === (lead.score || 0) ? '#94A3B8' : '#fff',
                      fontSize: 13, fontWeight: 600,
                      cursor: localScore === (lead.score || 0) && !scoreSaved ? 'default' : 'pointer',
                      transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {scoreSaved ? '✓ Score Saved!'
                      : updateScore.isPending ? 'Saving...'
                      : localScore === (lead.score || 0) ? 'No Changes'
                      : 'Save Score'}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ── NOTES TAB ── */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', background: '#FAFAFA' }}>
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Write a note, log a call, or record a visit..."
                  rows={3}
                  style={{
                    width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
                    padding: '10px 12px', fontSize: 14, color: '#0F172A',
                    outline: 'none', resize: 'none', background: '#fff',
                    fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', marginBottom: 10,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {NOTE_TYPES.map(t => (
                      <button key={t.value} onClick={() => setNoteType(t.value)} style={{
                        padding: '5px 12px', borderRadius: 20, border: '1px solid',
                        fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        borderColor: noteType === t.value ? '#2563EB' : '#E2E8F0',
                        background: noteType === t.value ? '#EFF6FF' : '#fff',
                        color: noteType === t.value ? '#2563EB' : '#64748B',
                        fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                      }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => noteContent.trim() && addNote.mutate()}
                    loading={addNote.isPending}
                    disabled={!noteContent.trim()}
                  >
                    Add Note
                  </Button>
                </div>
              </div>

              {notes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 14 }}>
                  No notes yet. Add your first note above.
                </div>
              )}

              {notes.map(note => {
                const typeEmoji = { note: '📝', call: '📞', email: '📧', visit: '🏠', system: '⚙️' }
                const isSystem = note.type === 'system'
                return (
                  <div key={note.id} style={{ display: 'flex', gap: 12, opacity: isSystem ? 0.65 : 1 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: isSystem ? '#F1F5F9' : '#EFF6FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}>
                      {typeEmoji[note.type] || '📝'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                          {note.user?.name || 'System'}
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                          {formatDateTime(note.created_at)}
                        </span>
                      </div>
                      <div style={{
                        padding: '10px 14px', borderRadius: 10,
                        background: isSystem ? '#F8FAFC' : '#fff',
                        border: '1px solid #E2E8F0',
                        fontSize: 13, color: '#374151', lineHeight: 1.6,
                      }}>
                        {note.content}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            Lead ID #{lead.id} · Created {formatDate(lead.created_at)}
          </span>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>

      </div>
    </div>
  )
}