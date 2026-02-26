import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Phone, Mail, MapPin, User, Sparkles } from 'lucide-react'
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
  const [aiResult, setAiResult]       = useState(null)
  const [aiError, setAiError]         = useState(null)

  // ─── Fetch full lead with notes ──────────────────────────────────────────
  const { data: lead = initialLead } = useQuery({
    queryKey: ['lead', initialLead.id, apiBase],
    queryFn: () => api.get(`${apiBase}/leads/${initialLead.id}`)
      .then(r => r.data?.data || r.data),
    // Refetch every time window focuses
    refetchOnWindowFocus: true,
  })

  // ─── Sync localStatus & localScore when server data arrives ─────────────
  useEffect(() => {
    if (lead?.status) setLocalStatus(lead.status)
  }, [lead?.status])

  useEffect(() => {
    if (lead?.score !== undefined) setLocalScore(lead.score || 0)
  }, [lead?.score])

  // ─── Update status ───────────────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: (status) => api.put(`${apiBase}/leads/${lead.id}`, { status }),
    onMutate: (status) => {
      // Optimistic update — change UI immediately
      setLocalStatus(status)
    },
    onSuccess: (res) => {
      // Update query cache directly with new data
      const updated = res.data?.data || res.data
      if (updated) {
        qc.setQueryData(['lead', initialLead.id, apiBase], updated)
      }
      // Invalidate list queries so table + kanban update too
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['leads-kanban'] })
      qc.invalidateQueries({ queryKey: ['lead-stats'] })
    },
    onError: (err, status, context) => {
      // Revert on error
      setLocalStatus(initialLead.status)
      console.error('Status update failed:', err.response?.data)
    },
  })

  // ─── Update score ────────────────────────────────────────────────────────
  const updateScore = useMutation({
    mutationFn: (score) => api.put(`${apiBase}/leads/${lead.id}`, { score }),
    onSuccess: (res) => {
      const updated = res.data?.data || res.data
      if (updated) {
        qc.setQueryData(['lead', initialLead.id, apiBase], updated)
      }
      setScoreSaved(true)
      setTimeout(() => setScoreSaved(false), 2000)
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (err) => {
      console.error('Score update failed:', err.response?.data)
    },
  })

  // ─── Add note ────────────────────────────────────────────────────────────
  // ─── AI Score ─────────────────────────────────────────────────────────────
  const aiScore = useMutation({
    mutationFn: () => api.post(`/agency/leads/${lead.id}/ai-score`),
    onSuccess: (res) => {
      const data = res.data?.data
      setAiResult(data)
      setAiError(null)
      setLocalScore(data.score)
      qc.invalidateQueries({ queryKey: ['lead', lead.id] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['notes', lead.id] })
    },
    onError: (err) => {
      const status  = err.response?.status
      const message = err.response?.data?.message

      // Translate technical errors into user-friendly messages
      if (status === 404) {
        setAiError('AI scoring route not found. Please ask your developer to register the route: POST api/v1/agency/leads/{lead}/ai-score')
      } else if (status === 422 && message?.includes('not enabled')) {
        setAiError('AI scoring is not enabled. Go to Settings → OpenAI Integration → turn on "Enable AI Scoring".')
      } else if (status === 422 && message?.includes('API key')) {
        setAiError('No OpenAI API key found. Go to Settings → OpenAI Integration → add your API key.')
      } else if (status === 401) {
        setAiError('Invalid OpenAI API key. Go to Settings and check your key is correct.')
      } else if (status === 429) {
        setAiError('OpenAI rate limit reached. Please wait a moment and try again.')
      } else if (status === 500) {
        setAiError('Server error while scoring. Check your backend logs for details.')
      } else if (message) {
        setAiError(message)
      } else {
        setAiError('AI scoring failed. Please check your Settings and try again.')
      }
      setAiResult(null)
    },
  })

  const addNote = useMutation({
    mutationFn: () => api.post(`${apiBase}/leads/${lead.id}/notes`, {
      content: noteContent,
      type: noteType,
    }),
    onSuccess: (res) => {
      // Refetch lead to get updated notes list
      qc.invalidateQueries({ queryKey: ['lead', initialLead.id, apiBase] })
      setNoteContent('')
      setNoteType('note')
    },
    onError: (err) => {
      console.error('Add note failed:', err.response?.data)
    },
  })

  const statusCfg  = LEAD_STATUS_CONFIG[localStatus] || LEAD_STATUS_CONFIG.new
  const notes      = lead.notes || []
  const scoreColor = localScore >= 70 ? '#10B981' : localScore >= 40 ? '#F59E0B' : '#EF4444'

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
                <span style={{ fontSize: 12, color: '#94A3B8' }}>via {lead.source}</span>
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
            const isActive = localStatus === status
            return (
              <button
                key={status}
                onClick={() => {
                  if (isActive || updateStatus.isPending) return
                  updateStatus.mutate(status)
                }}
                disabled={updateStatus.isPending}
                style={{
                  flex: 1, minWidth: 80, padding: '7px 8px', borderRadius: 8,
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

          {/* OVERVIEW TAB */}
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

                {/* Score Editor */}
                <div style={{ padding: '14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Lead Score
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: scoreColor }}>{localScore}/100</div>
                      {/* AI Score button */}
                      <button
                        onClick={() => { setAiResult(null); setAiError(null); aiScore.mutate() }}
                        disabled={aiScore.isPending}
                        title="Score with AI"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 20, border: 'none',
                          background: aiScore.isPending
                            ? '#E2E8F0'
                            : 'linear-gradient(135deg, #2563EB, #7C3AED)',
                          color: aiScore.isPending ? '#94A3B8' : '#fff',
                          fontSize: 11, fontWeight: 700, cursor: aiScore.isPending ? 'not-allowed' : 'pointer',
                          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                        }}
                      >
                        <Sparkles size={11} />
                        {aiScore.isPending ? 'Scoring...' : 'AI Score'}
                      </button>
                    </div>
                  </div>

                  {/* AI Error */}
                  {aiError && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                      background: '#FEF2F2', border: '1px solid #FECACA',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 3 }}>
                          AI Scoring Failed
                        </div>
                        <div style={{ fontSize: 12, color: '#7F1D1D', lineHeight: 1.6 }}>
                          {aiError}
                        </div>
                        {(aiError.includes('Settings') || aiError.includes('route')) && (
                          <button
                            onClick={() => window.open('/agency/settings', '_blank')}
                            style={{
                              marginTop: 8, padding: '4px 12px', borderRadius: 6,
                              border: '1px solid #FECACA', background: '#fff',
                              fontSize: 11, fontWeight: 600, color: '#DC2626',
                              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            Go to Settings →
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setAiError(null)}
                        style={{
                          border: 'none', background: 'none', cursor: 'pointer',
                          color: '#94A3B8', fontSize: 16, lineHeight: 1, flexShrink: 0,
                          padding: 0,
                        }}
                      >×</button>
                    </div>
                  )}

                  {/* AI Result panel */}
                  {aiResult && (
                    <div style={{
                      padding: '12px', borderRadius: 10, marginBottom: 12,
                      background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
                      border: '1px solid #BFDBFE',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>
                          🤖 AI Analysis
                        </span>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                          background: aiResult.priority === 'hot' ? '#FEF3C7'
                            : aiResult.priority === 'warm' ? '#ECFDF5' : '#F1F5F9',
                          color: aiResult.priority === 'hot' ? '#D97706'
                            : aiResult.priority === 'warm' ? '#059669' : '#64748B',
                        }}>
                          {aiResult.priority === 'hot' ? '🔥 Hot' : aiResult.priority === 'warm' ? '🌤 Warm' : '❄️ Cold'}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, margin: '0 0 8px' }}>
                        {aiResult.reason}
                      </p>
                      {aiResult.factors?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {aiResult.factors.map((f, i) => (
                            <span key={i} style={{
                              fontSize: 10, padding: '2px 8px', borderRadius: 20,
                              background: '#E0E7FF', color: '#3730A3', fontWeight: 600,
                            }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

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
                      <button key={btn.label}
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

          {/* NOTES TAB */}
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
                  <Button size="sm"
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