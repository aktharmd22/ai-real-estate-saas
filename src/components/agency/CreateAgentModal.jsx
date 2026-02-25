import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '../../lib/axios'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function CreateAgentModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
  })
  const [errors, setErrors] = useState({})

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const create = useMutation({
    mutationFn: (data) => api.post('/agency/users', data),
    onSuccess: () => {
      qc.invalidateQueries(['agents'])
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
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Add New Agent
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
              Agent will be added to your agency
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <Input
            label="Full Name *"
            placeholder="Priya Mehta"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            error={errors.name?.[0]}
          />
          <Input
            label="Email Address *"
            type="email"
            placeholder="priya@agency.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            error={errors.email?.[0]}
          />
          <Input
            label="Phone Number"
            placeholder="+91 91234 56789"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            error={errors.phone?.[0]}
          />
          <Input
            label="Password *"
            type="password"
            placeholder="Minimum 8 characters"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            error={errors.password?.[0]}
          />

          {/* Info note */}
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: '#EFF6FF', border: '1px solid #BFDBFE',
            fontSize: 12, color: '#2563EB',
          }}>
            💡 The agent will be able to login immediately with these credentials.
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'flex-end',
            marginTop: 8, paddingTop: 16, borderTop: '1px solid #F1F5F9',
          }}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Add Agent
            </Button>
          </div>
        </form>

      </div>
    </div>
  )
}