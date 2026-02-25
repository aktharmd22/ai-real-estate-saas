import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '../../lib/axios'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function CreateLeadModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', source: 'manual',
    status: 'new', budget_min: '', budget_max: '',
    preferred_location: '', property_type: '', timeline: '',
    assigned_to: '', notes: '',
  })
  const [errors, setErrors] = useState({})

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  // Load agents for assignment dropdown
  const { data: agentsData } = useQuery({
    queryKey: ['agents-list'],
    queryFn: () => api.get('/agency/users', { params: { role: 'agent', per_page: 100 } }).then(r => r.data),
  })
  const agents = agentsData?.data || []

  const create = useMutation({
    mutationFn: (data) => api.post('/agency/leads', data),
    onSuccess: () => {
      qc.invalidateQueries(['leads'])
      qc.invalidateQueries(['lead-stats'])
      qc.invalidateQueries(['leads-kanban'])
      onClose()
    },
    onError: (err) => setErrors(err.response?.data?.errors || {}),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    // Clean empty strings to null
    const cleaned = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    )
    create.mutate(cleaned)
  }

  const selectStyle = {
    border: '1px solid #E2E8F0', borderRadius: 8,
    padding: '10px 12px', fontSize: 14, color: '#0F172A',
    background: '#fff', outline: 'none', cursor: 'pointer', width: '100%',
    fontFamily: "'DM Sans', sans-serif",
  }

  const labelStyle = {
    fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 1,
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Create New Lead
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
              Add a new lead to your pipeline
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

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>

          {/* Contact Info */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Contact Information
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <Input label="Full Name *" placeholder="John Smith"
              value={form.name} onChange={e => set('name', e.target.value)}
              error={errors.name?.[0]} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Email" type="email" placeholder="john@email.com"
                value={form.email} onChange={e => set('email', e.target.value)}
                error={errors.email?.[0]} />
              <Input label="Phone" placeholder="+91 98765 43210"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Source</label>
                <select value={form.source} onChange={e => set('source', e.target.value)} style={selectStyle}>
                  <option value="manual">Manual Entry</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="web_widget">Web Widget</option>
                  <option value="email">Email</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Initial Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                </select>
              </div>
            </div>
          </div>

          {/* Qualification */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
            Qualification Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Min Budget" type="number" placeholder="500000"
                value={form.budget_min} onChange={e => set('budget_min', e.target.value)} />
              <Input label="Max Budget" type="number" placeholder="1000000"
                value={form.budget_max} onChange={e => set('budget_max', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Preferred Location" placeholder="Mumbai, Bandra"
                value={form.preferred_location} onChange={e => set('preferred_location', e.target.value)} />
              <div>
                <label style={labelStyle}>Property Type</label>
                <select value={form.property_type} onChange={e => set('property_type', e.target.value)} style={selectStyle}>
                  <option value="">Select type</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="plot">Plot</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Timeline</label>
                <select value={form.timeline} onChange={e => set('timeline', e.target.value)} style={selectStyle}>
                  <option value="">Select timeline</option>
                  <option value="immediate">Immediate</option>
                  <option value="1_3_months">1–3 Months</option>
                  <option value="3_6_months">3–6 Months</option>
                  <option value="6_plus_months">6+ Months</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Assign To Agent</label>
                <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} style={selectStyle}>
                  <option value="">Unassigned</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
            Initial Note
          </div>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any initial notes about this lead..."
            rows={3}
            style={{
              width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
              padding: '10px 12px', fontSize: 14, color: '#0F172A',
              outline: 'none', resize: 'vertical', fontFamily: "'DM Sans', sans-serif",
              boxSizing: 'border-box',
            }}
          />

          {/* Footer */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'flex-end',
            marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9',
          }}>
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Create Lead</Button>
          </div>

        </form>
      </div>
    </div>
  )
}