import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, Send, MessageSquare,
  Phone, Pencil, Trash2, X, Check, MoreVertical
} from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import NewConversationModal from '../../components/inbox/NewConversationModal'

const CHANNEL_CONFIG = {
  manual:     { label: 'Direct',   icon: '💬', color: '#2563EB', bg: '#EFF6FF' },
  whatsapp:   { label: 'WhatsApp', icon: '📱', color: '#25D366', bg: '#F0FDF4' },
  web_widget: { label: 'Web',      icon: '🌐', color: '#7C3AED', bg: '#F5F3FF' },
  email:      { label: 'Email',    icon: '📧', color: '#D97706', bg: '#FFF7ED' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function formatMsgDate(dateStr) {
  if (!dateStr) return ''
  const d     = new Date(dateStr)
  const today = new Date()
  if (today.toDateString() === d.toDateString()) return 'Today'
  const yest  = new Date(today)
  yest.setDate(yest.getDate() - 1)
  if (yest.toDateString() === d.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Conversation List Item ───────────────────────────────────────────────────
function ConvItem({ conv, isActive, onClick }) {
  const cfg = CHANNEL_CONFIG[conv.channel] || CHANNEL_CONFIG.manual
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px', cursor: 'pointer', transition: 'background 0.1s',
        background: isActive ? '#EFF6FF' : 'transparent',
        borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent',
        borderBottom: '1px solid #F1F5F9',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F8FAFC' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${cfg.color}25, ${cfg.color}10)`,
            border: `1.5px solid ${cfg.color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: cfg.color, position: 'relative',
          }}>
            {conv.contact_name?.charAt(0).toUpperCase()}
            <div style={{
              position: 'absolute', bottom: -2, right: -2, width: 14, height: 14,
              borderRadius: '50%', background: cfg.bg, border: '1.5px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8,
            }}>
              {cfg.icon}
            </div>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontWeight: 600, fontSize: 13, color: '#0F172A',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {conv.contact_name}
            </div>
            <div style={{
              fontSize: 11, color: conv.unread_count > 0 ? '#374151' : '#94A3B8',
              fontWeight: conv.unread_count > 0 ? 600 : 400,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {conv.last_message || 'No messages yet'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0, marginLeft: 6 }}>
          <span style={{ fontSize: 10, color: '#94A3B8' }}>{timeAgo(conv.last_message_at)}</span>
          {conv.unread_count > 0 && (
            <div style={{
              minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px',
              background: '#2563EB', color: '#fff', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {conv.unread_count > 9 ? '9+' : conv.unread_count}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, marginTop: 4, paddingLeft: 44 }}>
        {conv.status === 'resolved' && (
          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: '#F0FDF4', color: '#059669', fontWeight: 600 }}>
            ✓ Resolved
          </span>
        )}
        {conv.assigned_to && (
          <span style={{ fontSize: 9, color: '#94A3B8' }}>→ {conv.assigned_to.name}</span>
        )}
        {conv.lead && (
          <span style={{ fontSize: 9, color: '#7C3AED' }}>🎯 {conv.lead.name}</span>
        )}
      </div>
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, prevMsg, onEdit, onDelete, isAgent: viewerIsAgent }) {
  const [showMenu, setShowMenu]   = useState(false)
  const [editing, setEditing]     = useState(false)
  const [editText, setEditText]   = useState(msg.content)
  const isAgentMsg  = msg.sender_type === 'agent'
  const isSystem    = msg.sender_type === 'system'
  const canEdit     = isAgentMsg && !viewerIsAgent // only agency admin can edit
  const showDate    = !prevMsg || formatMsgDate(msg.created_at) !== formatMsgDate(prevMsg?.created_at)

  if (isSystem) {
    return (
      <>
        {showDate && (
          <div style={{ textAlign: 'center', margin: '12px 0' }}>
            <span style={{ fontSize: 10, color: '#94A3B8', background: '#F1F5F9', padding: '2px 10px', borderRadius: 20 }}>
              {formatMsgDate(msg.created_at)}
            </span>
          </div>
        )}
        <div style={{ textAlign: 'center', margin: '4px 0' }}>
          <span style={{ fontSize: 11, color: '#94A3B8', background: '#F1F5F9', padding: '3px 10px', borderRadius: 20, fontStyle: 'italic' }}>
            ⚙️ {msg.content}
          </span>
        </div>
      </>
    )
  }

  return (
    <>
      {showDate && (
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <span style={{ fontSize: 10, color: '#94A3B8', background: '#F8FAFC', padding: '2px 10px', borderRadius: 20 }}>
            {formatMsgDate(msg.created_at)}
          </span>
        </div>
      )}
      <div
        style={{ display: 'flex', justifyContent: isAgentMsg ? 'flex-end' : 'flex-start', marginBottom: 4, padding: '0 4px', position: 'relative' }}
        onMouseEnter={() => canEdit && setShowMenu(true)}
        onMouseLeave={() => { setShowMenu(false) }}
      >
        {/* Lead avatar */}
        {!isAgentMsg && (
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: '#E2E8F0', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 10, fontWeight: 700,
            color: '#64748B', marginRight: 8, alignSelf: 'flex-end',
          }}>L</div>
        )}

        <div style={{ maxWidth: '68%' }}>
          {/* Edit/Delete menu — shown on hover for agent messages */}
          {canEdit && showMenu && !editing && (
            <div style={{
              display: 'flex', gap: 4, justifyContent: 'flex-end', marginBottom: 4,
            }}>
              <button
                onClick={() => { setEditing(true); setEditText(msg.content) }}
                style={{
                  width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0',
                  background: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Pencil size={11} color="#2563EB" />
              </button>
              <button
                onClick={() => onDelete(msg.id)}
                style={{
                  width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0',
                  background: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Trash2 size={11} color="#DC2626" />
              </button>
            </div>
          )}

          {/* Message bubble */}
          {editing ? (
            <div>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                autoFocus
                rows={2}
                style={{
                  width: '100%', border: '1.5px solid #2563EB', borderRadius: 10,
                  padding: '8px 12px', fontSize: 13, outline: 'none',
                  resize: 'none', boxSizing: 'border-box',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setEditing(false)} style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid #E2E8F0',
                  background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>Cancel</button>
                <button onClick={() => { onEdit(msg.id, editText); setEditing(false) }} style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: '#2563EB', color: '#fff', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>Save</button>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '10px 14px',
              borderRadius: isAgentMsg ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: isAgentMsg ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : '#fff',
              color: isAgentMsg ? '#fff' : '#0F172A',
              fontSize: 13, lineHeight: 1.5,
              boxShadow: isAgentMsg ? '0 2px 8px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.07)',
              border: isAgentMsg ? 'none' : '1px solid #E2E8F0',
            }}>
              {msg.content}
              {msg.edited && (
                <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 6 }}>(edited)</span>
              )}
            </div>
          )}

          <div style={{
            fontSize: 10, color: '#94A3B8', marginTop: 2,
            textAlign: isAgentMsg ? 'right' : 'left',
            paddingRight: isAgentMsg ? 4 : 0, paddingLeft: isAgentMsg ? 0 : 4,
          }}>
            {isAgentMsg && <span style={{ marginRight: 4 }}>{msg.sender?.name || 'You'}</span>}
            {formatTime(msg.created_at)}
            {isAgentMsg && <span style={{ marginLeft: 4 }}>✓✓</span>}
          </div>
        </div>

        {/* Agent avatar */}
        {isAgentMsg && (
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff', marginLeft: 8, alignSelf: 'flex-end',
          }}>
            {msg.sender?.name?.charAt(0) || 'A'}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Edit Contact Modal ───────────────────────────────────────────────────────
function EditContactModal({ conv, onClose, onSaved }) {
  const [form, setForm] = useState({
    contact_name:  conv.contact_name  || '',
    contact_phone: conv.contact_phone || '',
    contact_email: conv.contact_email || '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = useMutation({
    mutationFn: (data) => api.patch(`/agency/conversations/${conv.id}/contact`, data),
    onSuccess: (res) => onSaved(res.data?.data || res.data),
    onError: (err) => console.error(err.response?.data),
  })

  const inputStyle = {
    width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
    padding: '10px 12px', fontSize: 14, color: '#0F172A',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(15,23,42,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Edit Contact</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={18} color="#64748B" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Name *</label>
            <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Phone</label>
            <input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
            <input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0',
            background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>Cancel</button>
          <button
            onClick={() => save.mutate(form)}
            disabled={save.isPending}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              opacity: save.isPending ? 0.7 : 1,
            }}
          >
            {save.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Inbox Page ──────────────────────────────────────────────────────────
export default function InboxPage() {
  const { user }  = useAuthStore()
  const isAgent   = user?.role === 'agent'
  const apiBase   = isAgent ? '/agent' : '/agency'
  const qc        = useQueryClient()

  const [activeConv, setActiveConv]       = useState(null)
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatus]         = useState('')
  const [showNew, setShowNew]             = useState(false)
  const [showEditContact, setEditContact] = useState(false)
  const [showDeleteConv, setDeleteConv]   = useState(false)
  const [message, setMessage]             = useState('')
  const messagesEndRef                    = useRef(null)
  const textareaRef                       = useRef(null)

  // ─── Conversations list ───────────────────────────────────────────────────
  const { data: convData } = useQuery({
    queryKey: ['conversations', apiBase, search, statusFilter],
    queryFn: () => api.get(`${apiBase}/conversations`, {
      params: { search, status: statusFilter, per_page: 50 }
    }).then(r => r.data),
    refetchInterval: 8000,
  })

  // ─── Stats ────────────────────────────────────────────────────────────────
  const { data: statsData } = useQuery({
    queryKey: ['conv-stats', apiBase],
    queryFn: () => api.get(`${apiBase}/conversations/stats`).then(r => r.data.data),
    refetchInterval: 8000,
  })

  // ─── Messages ─────────────────────────────────────────────────────────────
  const { data: messagesData } = useQuery({
    queryKey: ['messages', activeConv?.id],
    queryFn: () => api.get(`${apiBase}/conversations/${activeConv.id}/messages`)
      .then(r => r.data.data),
    enabled: !!activeConv,
    refetchInterval: 4000,
  })

  // ─── Send message ─────────────────────────────────────────────────────────
  const sendMsg = useMutation({
    mutationFn: (content) => api.post(
      `${apiBase}/conversations/${activeConv.id}/messages`,
      { content, type: 'text' }
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', activeConv.id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setMessage('')
      textareaRef.current?.focus()
    },
  })

  // ─── Edit message ─────────────────────────────────────────────────────────
  const editMsg = useMutation({
    mutationFn: ({ id, content }) => api.put(`/agency/messages/${id}`, { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', activeConv.id] }),
  })

  // ─── Delete message ───────────────────────────────────────────────────────
  const deleteMsg = useMutation({
    mutationFn: (id) => api.delete(`/agency/messages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', activeConv.id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  // ─── Update conversation status ───────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: (status) => api.patch(`/agency/conversations/${activeConv.id}/status`, { status }),
    onSuccess: (res) => {
      const updated = res.data?.data
      if (updated) setActiveConv(updated)
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['conv-stats'] })
    },
  })

  // ─── Delete conversation ──────────────────────────────────────────────────
  const deleteConv = useMutation({
    mutationFn: () => api.delete(`/agency/conversations/${activeConv.id}`),
    onSuccess: () => {
      setActiveConv(null)
      setDeleteConv(false)
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['conv-stats'] })
    },
  })

  // ─── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData])

  const conversations = convData?.data || []
  const messages      = messagesData   || []
  const stats         = statsData      || {}

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed || sendMsg.isPending) return
    sendMsg.mutate(trimmed)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const channelCfg = activeConv
    ? (CHANNEL_CONFIG[activeConv.channel] || CHANNEL_CONFIG.manual)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>

      {/* ── Stats bar ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexShrink: 0 }}>
        {[
          { label: 'Total',    value: stats.total    || 0, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Open',     value: stats.open     || 0, color: '#D97706', bg: '#FFF7ED' },
          { label: 'Resolved', value: stats.resolved || 0, color: '#059669', bg: '#ECFDF5' },
          { label: 'Unread',   value: stats.unread   || 0, color: '#DC2626', bg: '#FEF2F2' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: '#fff', borderRadius: 12,
            border: '1px solid #E2E8F0', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main 2-panel layout ── */}
      <div style={{
        display: 'flex', flex: 1, minHeight: 0,
        background: '#fff', borderRadius: 16,
        border: '1px solid #E2E8F0', overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>

        {/* ══ LEFT PANEL ══ */}
        <div style={{
          width: 290, flexShrink: 0, borderRight: '1px solid #E2E8F0',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* Left header */}
          <div style={{
            padding: '14px 14px', borderBottom: '1px solid #E2E8F0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Inbox</h3>
            {!isAgent && (
              <button onClick={() => setShowNew(true)} style={{
                width: 28, height: 28, borderRadius: 8, background: '#2563EB',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={14} color="#fff" />
              </button>
            )}
          </div>

          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#F8FAFC', borderRadius: 8, padding: '7px 10px',
              border: '1px solid #E2E8F0',
            }}>
              <Search size={12} color="#94A3B8" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 12, color: '#0F172A', flex: 1,
                }}
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', padding: '8px 10px', gap: 5, borderBottom: '1px solid #F1F5F9' }}>
            {[
              { label: 'All', value: '' },
              { label: 'Open', value: 'open' },
              { label: 'Resolved', value: 'resolved' },
            ].map(f => (
              <button key={f.value} onClick={() => setStatus(f.value)} style={{
                flex: 1, padding: '5px 4px', borderRadius: 6, border: 'none',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: statusFilter === f.value ? '#2563EB' : '#F1F5F9',
                color: statusFilter === f.value ? '#fff' : '#64748B',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8' }}>
                <MessageSquare size={28} color="#E2E8F0" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 12 }}>No conversations</div>
                {!isAgent && (
                  <button onClick={() => setShowNew(true)} style={{
                    marginTop: 10, padding: '6px 14px', borderRadius: 8,
                    background: '#2563EB', color: '#fff', border: 'none',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Start one
                  </button>
                )}
              </div>
            )}
            {conversations.map(conv => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isActive={activeConv?.id === conv.id}
                onClick={() => setActiveConv(conv)}
              />
            ))}
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        {!activeConv ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: '#94A3B8',
          }}>
            <MessageSquare size={44} color="#E2E8F0" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Select a conversation</div>
            <div style={{ fontSize: 12 }}>Choose from the list to start messaging</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Thread header */}
            <div style={{
              padding: '12px 18px', borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${channelCfg.color}25, ${channelCfg.color}10)`,
                  border: `2px solid ${channelCfg.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, color: channelCfg.color,
                }}>
                  {activeConv.contact_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      {activeConv.contact_name}
                    </span>
                    {!isAgent && (
                      <button
                        onClick={() => setEditContact(true)}
                        title="Edit contact"
                        style={{
                          width: 22, height: 22, borderRadius: 6,
                          border: '1px solid #E2E8F0', background: '#F8FAFC',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Pencil size={11} color="#2563EB" />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                    {activeConv.contact_phone && (
                      <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Phone size={10} /> {activeConv.contact_phone}
                      </span>
                    )}
                    <span style={{
                      fontSize: 10, padding: '1px 7px', borderRadius: 20,
                      background: channelCfg.bg, color: channelCfg.color, fontWeight: 600,
                    }}>
                      {channelCfg.icon} {channelCfg.label}
                    </span>
                    {activeConv.assigned_to && (
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>
                        → {activeConv.assigned_to.name}
                      </span>
                    )}
                    {activeConv.lead && (
                      <span style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 20,
                        background: '#F5F3FF', color: '#7C3AED', fontWeight: 600,
                      }}>
                        🎯 {activeConv.lead.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Header actions */}
              {!isAgent && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => updateStatus.mutate(activeConv.status === 'open' ? 'resolved' : 'open')}
                    disabled={updateStatus.isPending}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: '1px solid',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      borderColor: activeConv.status === 'open' ? '#059669' : '#D97706',
                      background: activeConv.status === 'open' ? '#ECFDF5' : '#FFF7ED',
                      color: activeConv.status === 'open' ? '#059669' : '#D97706',
                      fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                    }}
                  >
                    {updateStatus.isPending ? '...'
                      : activeConv.status === 'open' ? '✓ Resolve' : '↩ Reopen'}
                  </button>
                  <button
                    onClick={() => setDeleteConv(true)}
                    title="Delete conversation"
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: '1px solid #FECACA', background: '#FEF2F2',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={13} color="#DC2626" />
                  </button>
                </div>
              )}
            </div>

            {/* Delete conversation confirm */}
            {showDeleteConv && (
              <div style={{
                background: '#FEF2F2', borderBottom: '1px solid #FECACA',
                padding: '10px 18px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>
                  🗑️ Delete this entire conversation?
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setDeleteConv(false)} style={{
                    padding: '5px 14px', borderRadius: 7, border: '1px solid #E2E8F0',
                    background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Cancel</button>
                  <button
                    onClick={() => deleteConv.mutate()}
                    disabled={deleteConv.isPending}
                    style={{
                      padding: '5px 14px', borderRadius: 7, border: 'none',
                      background: '#DC2626', color: '#fff', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      opacity: deleteConv.isPending ? 0.7 : 1,
                    }}
                  >
                    {deleteConv.isPending ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            )}

            {/* Messages area */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '14px 16px',
              background: '#F8FAFC', display: 'flex', flexDirection: 'column',
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, marginTop: 40 }}>
                  No messages yet. Start the conversation below.
                </div>
              )}
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  prevMsg={messages[i - 1]}
                  isAgent={isAgent}
                  onEdit={(id, content) => editMsg.mutate({ id, content })}
                  onDelete={(id) => deleteMsg.mutate(id)}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div style={{
              padding: '12px 16px', borderTop: '1px solid #E2E8F0',
              background: '#fff', flexShrink: 0,
            }}>
              {activeConv.status === 'resolved' ? (
                <div style={{
                  textAlign: 'center', padding: '10px',
                  color: '#64748B', fontSize: 13, background: '#F8FAFC',
                  borderRadius: 10, border: '1px solid #E2E8F0',
                }}>
                  Conversation resolved.{' '}
                  {!isAgent && (
                    <button onClick={() => updateStatus.mutate('open')} style={{
                      color: '#2563EB', fontWeight: 600, background: 'none',
                      border: 'none', cursor: 'pointer', fontSize: 13,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      Reopen to reply
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send)"
                    rows={2}
                    style={{
                      flex: 1, border: '1px solid #E2E8F0', borderRadius: 12,
                      padding: '10px 14px', fontSize: 14, color: '#0F172A',
                      outline: 'none', resize: 'none', background: '#F8FAFC',
                      fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
                    }}
                    onFocus={e => e.target.style.borderColor = '#2563EB'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMsg.isPending}
                    style={{
                      width: 42, height: 42, borderRadius: 12, border: 'none',
                      background: message.trim() ? '#2563EB' : '#E2E8F0',
                      cursor: message.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s', flexShrink: 0,
                    }}
                  >
                    <Send size={16} color={message.trim() ? '#fff' : '#94A3B8'} />
                  </button>
                </div>
              )}
              <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 4, textAlign: 'right' }}>
                Enter to send · Shift+Enter for new line
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showNew && (
        <NewConversationModal
          onClose={() => setShowNew(false)}
          onCreated={(conv) => {
            qc.invalidateQueries({ queryKey: ['conversations'] })
            qc.invalidateQueries({ queryKey: ['conv-stats'] })
            setShowNew(false)
            setActiveConv(conv)  // ← auto-open the new conversation
          }}
        />
      )}

      {showEditContact && activeConv && (
        <EditContactModal
          conv={activeConv}
          onClose={() => setEditContact(false)}
          onSaved={(updated) => {
            setActiveConv(prev => ({ ...prev, ...updated }))
            setEditContact(false)
            qc.invalidateQueries({ queryKey: ['conversations'] })
          }}
        />
      )}
    </div>
  )
}