import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Mail, Lock, Home } from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'

export default function LoginPage() {
  const navigate  = useNavigate()
  const { setAuth } = useAuthStore()

  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors]     = useState({})

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const login = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.token)
      // Role-based redirect
      const role = data.user.role
      if (role === 'super_admin')  return navigate('/super-admin/dashboard')
      if (role === 'agency_admin') return navigate('/agency/dashboard')
      if (role === 'agent')        return navigate('/agent/dashboard')
    },
    onError: (err) => {
      setErrors(err.response?.data?.errors || {
        email: [err.response?.data?.message || 'Login failed. Please try again.']
      })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    if (!form.email)    return setErrors({ email: ['Email is required.'] })
    if (!form.password) return setErrors({ password: ['Password is required.'] })
    login.mutate(form)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(37,99,235,0.3)',
          }}>
            <Home size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
            RE Closer
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: 32,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#94A3B8" style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px 10px 38px',
                    border: `1px solid ${errors.email ? '#FCA5A5' : '#E2E8F0'}`,
                    borderRadius: 10, fontSize: 14, color: '#0F172A',
                    outline: 'none', background: errors.email ? '#FEF2F2' : '#fff',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563EB'}
                  onBlur={e => e.target.style.borderColor = errors.email ? '#FCA5A5' : '#E2E8F0'}
                />
              </div>
              {errors.email && (
                <p style={{ fontSize: 12, color: '#EF4444', margin: 0 }}>{errors.email[0]}</p>
              )}
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  Password
                </label>
                <span style={{ fontSize: 12, color: '#2563EB', cursor: 'pointer', fontWeight: 500 }}>
                  Forgot password?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#94A3B8" style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  style={{
                    width: '100%', padding: '10px 40px 10px 38px',
                    border: `1px solid ${errors.password ? '#FCA5A5' : '#E2E8F0'}`,
                    borderRadius: 10, fontSize: 14, color: '#0F172A',
                    outline: 'none', background: errors.password ? '#FEF2F2' : '#fff',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563EB'}
                  onBlur={e => e.target.style.borderColor = errors.password ? '#FCA5A5' : '#E2E8F0'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: '#94A3B8', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: 12, color: '#EF4444', margin: 0 }}>{errors.password[0]}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={login.isPending}
              style={{
                width: '100%', padding: '12px',
                background: login.isPending
                  ? '#93C5FD'
                  : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: login.isPending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
                boxShadow: login.isPending ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
                marginTop: 4,
              }}
            >
              {login.isPending ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : 'Sign In →'}
            </button>

          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '24px 0 20px',
          }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>TEST ACCOUNTS</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          {/* Quick login buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              {
                label: '👑 Super Admin',
                email: 'superadmin@recloser.com',
                password: 'SuperAdmin@123',
                color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE',
              },
            ].map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setForm({ email: acc.email, password: acc.password })
                  setErrors({})
                }}
                style={{
                  width: '100%', padding: '10px 16px',
                  background: acc.bg, border: `1px solid ${acc.border}`,
                  borderRadius: 10, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: acc.color }}>
                  {acc.label}
                </span>
                <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                  {acc.email}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 20 }}>
          © 2026 RE Closer · AI Real Estate SaaS
        </p>

      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}