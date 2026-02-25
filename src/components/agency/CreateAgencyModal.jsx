import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '../../lib/axios'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function CreateAgencyModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '', country: 'IN',
    admin_name: '', admin_email: '', admin_password: '',
  })
  const [errors, setErrors] = useState({})

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const create = useMutation({
    mutationFn: (data) => api.post('/super-admin/agencies', data),
    onSuccess: () => {
      qc.invalidateQueries(['agencies'])
      onClose()
    },
    onError: (err) => {
      setErrors(err.response?.data?.errors || {})
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    create.mutate(form)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff',
          borderRadius: '20px 20px 0 0',
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Create New Agency
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
              A 14-day trial will start automatically
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

          {/* Section Label */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#94A3B8',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
          }}>
            Agency Information
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <Input
              label="Agency Name *"
              placeholder="e.g. Prestige Realty"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              error={errors.name?.[0]}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input
                label="Agency Email *"
                type="email"
                placeholder="contact@agency.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                error={errors.email?.[0]}
              />
              <Input
                label="Phone"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input
                label="City"
                placeholder="Mumbai"
                value={form.city}
                onChange={e => set('city', e.target.value)}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Country</label>
                <select
                  value={form.country}
                  onChange={e => set('country', e.target.value)}
                  style={{
                    border: '1px solid #E2E8F0', borderRadius: 8,
                    padding: '10px 12px', fontSize: 14, color: '#0F172A',
                    background: '#fff', outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="IN">🇮🇳 India</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="AE">🇦🇪 UAE</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="SG">🇸🇬 Singapore</option>
                  <option value="AU">🇦🇺 Australia</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section Label */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#94A3B8',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
            paddingTop: 20, borderTop: '1px solid #F1F5F9',
          }}>
            Agency Admin Account
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Admin Full Name *"
              placeholder="Rahul Sharma"
              value={form.admin_name}
              onChange={e => set('admin_name', e.target.value)}
              error={errors.admin_name?.[0]}
            />
            <Input
              label="Admin Email *"
              type="email"
              placeholder="rahul@agency.com"
              value={form.admin_email}
              onChange={e => set('admin_email', e.target.value)}
              error={errors.admin_email?.[0]}
            />
            <Input
              label="Admin Password *"
              type="password"
              placeholder="Minimum 8 characters"
              value={form.admin_password}
              onChange={e => set('admin_password', e.target.value)}
              error={errors.admin_password?.[0]}
            />
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'flex-end',
            marginTop: 28, paddingTop: 20, borderTop: '1px solid #F1F5F9',
          }}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create Agency
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}