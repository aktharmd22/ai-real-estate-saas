import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '../../lib/axios'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function NewConversationModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    contact_name:  '',
    contact_phone: '',
    contact_email: '',
    channel:       'manual',
    lead_id:       '',
    assigned_to:   '',
    message:       '',
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Load leads for linking
  const { data: leadsData } = useQuery({
    queryKey: ['leads-dropdown'],
    queryFn: () => api.get('/agency/leads', { params: { per_page: 100 } })
      .then(r => r.data?.data || []),
  })

  // Load agents for assignment
  const { data: agentsData } = useQuery({
    queryKey: ['agents-dropdown'],
    queryFn: () => api.get('/agency/users', { params: { role: 'agent', per_page: 100 } })
      .then(r => r.data?.data || []),
  })

  const create = useMutation({
    mutationFn: (data) => api.post('/agency/conversations', data),
    onSuccess: (res) => {
      onCreated(res.data?.data)
    },
    onError: (err) => setErrors(err.response?.data?.errors || {}),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    const cleaned = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    )
    create.mutate(cleaned)
  }

  const selectStyle = {
    border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px',
    fontSize: 14, color: '#0F172A', background: '#fff', outline: 'none',
    cursor: 'pointer', width: '100%', fontFamily: "'DM Sans', sans-serif",
  }

  const labelStyle = {
    fontSize: 13, fontWeight: 600, color: '#374151',
    marginBottom: 6, display: 'block',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(15,23,42,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
          borderRadius: '20px 20px 0 0',
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              New Conversation
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
              Start a new conversation with a contact
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

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Contact info */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Contact Information
          </div>

          <Input
            label="Contact Name *"
            placeholder="John Kumar"
            value={form.contact_name}
            onChange={e => set('contact_name', e.target.value)}
            error={errors.contact_name?.[0]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input
              label="Phone"
              placeholder="+91 98765 43210"
              value={form.contact_phone}
              onChange={e => set('contact_phone', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@email.com"
              value={form.contact_email}
              onChange={e => set('contact_email', e.target.value)}
            />
          </div>

          {/* Channel */}
          <div>
            <label style={labelStyle}>Channel</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'manual',     label: '💬 Direct' },
                { value: 'whatsapp',   label: '📱 WhatsApp' },
                { value: 'web_widget', label: '🌐 Web' },
                { value: 'email',      label: '📧 Email' },
              ].map(ch => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => set('channel', ch.value)}
                  style={{
                    flex: 1, padding: '8px 6px', borderRadius: 8, border: '1px solid',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    borderColor: form.channel === ch.value ? '#2563EB' : '#E2E8F0',
                    background: form.channel === ch.value ? '#EFF6FF' : '#fff',
                    color: form.channel === ch.value ? '#2563EB' : '#64748B',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                  }}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Link to lead */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
            Optional Links
          </div>

          <div>
            <label style={labelStyle}>Link to Lead</label>
            <select value={form.lead_id} onChange={e => set('lead_id', e.target.value)} style={selectStyle}>
              <option value="">No lead linked</option>
              {(leadsData || []).map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.phone || l.email || 'No contact'})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Assign To Agent</label>
            <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} style={selectStyle}>
              <option value="">Assign to myself</option>
              {(agentsData || []).map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Opening message */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
            Opening Message
          </div>

          <div>
            <label style={labelStyle}>Message (optional)</label>
            <textarea
              value={form.message}
              onChange={e => set('message', e.target.value)}
              placeholder="Hi John, I wanted to follow up on your inquiry..."
              rows={3}
              style={{
                width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
                padding: '10px 12px', fontSize: 14, color: '#0F172A',
                outline: 'none', resize: 'none', boxSizing: 'border-box',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>
              Start Conversation
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}