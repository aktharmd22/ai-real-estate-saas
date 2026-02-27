import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Check, Zap, AlertCircle, ExternalLink } from 'lucide-react'
import api from '../../lib/axios'

function SecretInput({ value, onChange, placeholder, hasExisting, existingLabel }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      {hasExisting && (
        <div style={{
          padding: '7px 12px', borderRadius: 7, marginBottom: 6,
          background: '#ECFDF5', border: '1px solid #A7F3D0',
          fontSize: 11, fontWeight: 600, color: '#059669',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Check size={11} /> {existingLabel || 'Key saved (encrypted)'}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value} onChange={onChange} placeholder={placeholder}
          style={{
            width: '100%', border: '1px solid #E2E8F0', borderRadius: 10,
            padding: '10px 44px 10px 14px', fontSize: 13, color: '#0F172A',
            outline: 'none', boxSizing: 'border-box',
            fontFamily: 'monospace', background: '#F8FAFC',
          }}
          onFocus={e => e.target.style.borderColor = '#2563EB'}
          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
        />
        <button onClick={() => setShow(p => !p)} type="button" style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8',
          display: 'flex', alignItems: 'center', padding: 0,
        }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

export default function SuperAdminSettingsPage() {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    stripe_publishable_key: '',
    stripe_secret_key:      '',
    stripe_webhook_secret:  '',
    stripe_mode:            'test',
    platform_name:          '',
    platform_email:         '',
    trial_days:             '14',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const { data: s, isLoading } = useQuery({
    queryKey: ['super-admin-settings'],
    queryFn: () => api.get('/super-admin/settings').then(r => r.data.data),
  })

  useEffect(() => {
    if (!s) return
    setForm(f => ({
      ...f,
      stripe_publishable_key: s.stripe_publishable_key || '',
      stripe_mode:            s.stripe_mode            || 'test',
      platform_name:          s.platform_name          || '',
      platform_email:         s.platform_email         || '',
      trial_days:             String(s.trial_days      || '14'),
      // Never pre-fill secrets — user must re-enter to change
    }))
  }, [s])

  const doSave = useMutation({
    mutationFn: (data) => api.put('/super-admin/settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-settings'] })
      setSaved(true)
      // Clear sensitive fields after save
      setForm(f => ({ ...f, stripe_secret_key: '', stripe_webhook_secret: '' }))
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const handleSave = () => {
    const payload = { ...form }
    // Only send secret fields if user typed something new
    if (!payload.stripe_secret_key.trim())     delete payload.stripe_secret_key
    if (!payload.stripe_webhook_secret.trim()) delete payload.stripe_webhook_secret
    doSave.mutate(payload)
  }

  const inputStyle = {
    width: '100%', border: '1px solid #E2E8F0', borderRadius: 10,
    padding: '10px 14px', fontSize: 13, color: '#0F172A',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC',
  }

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading settings...</div>
    </div>
  )

  const webhookUrl = `${import.meta.env.VITE_API_URL}/webhook/stripe`

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Platform Settings</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
          Configure Stripe payments and platform defaults
        </p>
      </div>

      {/* ── Stripe Configuration ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #E2E8F0',
          background: 'linear-gradient(135deg, #F5F3FF, #EFF6FF)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#635BFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              💳
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Stripe Configuration</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Malaysian Ringgit (MYR) payments</div>
            </div>
          </div>

          {/* Test / Live toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3, gap: 2 }}>
            {['test', 'live'].map(mode => (
              <button key={mode} onClick={() => set('stripe_mode', mode)} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                background: form.stripe_mode === mode ? '#fff' : 'transparent',
                color: form.stripe_mode === mode
                  ? (mode === 'live' ? '#059669' : '#D97706')
                  : '#64748B',
                boxShadow: form.stripe_mode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                textTransform: 'capitalize', transition: 'all 0.15s',
              }}>
                {mode === 'test' ? '🧪 Test' : '🚀 Live'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Mode warning */}
          {form.stripe_mode === 'live' && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 16 }}>🚀</span>
              <div style={{ fontSize: 12, color: '#065F46', lineHeight: 1.6 }}>
                <strong>Live mode is active.</strong> Real payments will be processed. Make sure your
                Stripe account is fully verified and your Malaysian business details are complete.
              </div>
            </div>
          )}

          {form.stripe_mode === 'test' && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: '#FFF7ED', border: '1px solid #FDE68A',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
                <strong>Test mode.</strong> Use test card <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 3 }}>4242 4242 4242 4242</code> with
                any future expiry. No real charges will occur.
              </div>
            </div>
          )}

          {/* Publishable key */}
          <Field
            label="Publishable Key"
            hint={`Starts with pk_${form.stripe_mode === 'test' ? 'test' : 'live'}_`}
          >
            <input
              value={form.stripe_publishable_key}
              onChange={e => set('stripe_publishable_key', e.target.value)}
              placeholder={`pk_${form.stripe_mode === 'test' ? 'test' : 'live'}_...`}
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }}
              onFocus={e => e.target.style.borderColor = '#635BFF'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </Field>

          {/* Secret key */}
          <Field
            label="Secret Key"
            hint={`Starts with sk_${form.stripe_mode === 'test' ? 'test' : 'live'}_  — stored encrypted`}
          >
            <SecretInput
              value={form.stripe_secret_key}
              onChange={e => set('stripe_secret_key', e.target.value)}
              placeholder={`sk_${form.stripe_mode === 'test' ? 'test' : 'live'}_... (leave blank to keep existing)`}
              hasExisting={s?.has_stripe_secret}
              existingLabel="Secret key saved (encrypted)"
            />
          </Field>

          {/* Webhook */}
          <Field
            label="Webhook Signing Secret"
            hint="Starts with whsec_  — found in Stripe Dashboard → Webhooks → your endpoint"
          >
            <SecretInput
              value={form.stripe_webhook_secret}
              onChange={e => set('stripe_webhook_secret', e.target.value)}
              placeholder="whsec_... (leave blank to keep existing)"
              hasExisting={s?.has_webhook_secret}
              existingLabel="Webhook secret saved (encrypted)"
            />
          </Field>

          {/* Webhook URL */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Your Webhook Endpoint URL
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10,
              background: '#F8FAFC', border: '1px solid #E2E8F0',
            }}>
              <code style={{ flex: 1, fontSize: 12, color: '#374151', wordBreak: 'break-all' }}>
                {webhookUrl}
              </code>
              <button onClick={() => {
                navigator.clipboard.writeText(webhookUrl)
              }} style={{
                padding: '5px 12px', borderRadius: 7, border: '1px solid #E2E8F0',
                background: '#fff', color: '#64748B', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
              }}>
                Copy
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5, lineHeight: 1.6 }}>
              Add this URL in{' '}
              <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer"
                style={{ color: '#635BFF', textDecoration: 'none', fontWeight: 500 }}>
                Stripe Dashboard → Developers → Webhooks
              </a>
              {' '}and subscribe to:{' '}
              <code style={{ fontSize: 10, background: '#F1F5F9', padding: '1px 5px', borderRadius: 4 }}>
                checkout.session.completed
              </code>{' '}
              <code style={{ fontSize: 10, background: '#F1F5F9', padding: '1px 5px', borderRadius: 4 }}>
                invoice.payment_succeeded
              </code>{' '}
              <code style={{ fontSize: 10, background: '#F1F5F9', padding: '1px 5px', borderRadius: 4 }}>
                customer.subscription.updated
              </code>{' '}
              <code style={{ fontSize: 10, background: '#F1F5F9', padding: '1px 5px', borderRadius: 4 }}>
                customer.subscription.deleted
              </code>
            </div>
          </div>

          {/* Quick setup link */}
          <a
            href="https://dashboard.stripe.com/apikeys"
            target="_blank" rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: '#635BFF', fontWeight: 600, textDecoration: 'none',
            }}
          >
            <ExternalLink size={12} />
            Open Stripe API Keys Dashboard →
          </a>
        </div>
      </div>

      {/* ── Platform Settings ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', background: '#FAFBFF' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Platform Defaults</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>General platform configuration</div>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Platform Name">
              <input value={form.platform_name} onChange={e => set('platform_name', e.target.value)}
                placeholder="RE Closer" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </Field>
            <Field label="Support Email">
              <input type="email" value={form.platform_email}
                onChange={e => set('platform_email', e.target.value)}
                placeholder="support@recloser.my" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </Field>
          </div>

          <Field
            label="Free Trial Days"
            hint="Number of days new agencies get for free before billing starts (0 = no trial)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="number" min={0} max={90}
                value={form.trial_days}
                onChange={e => set('trial_days', e.target.value)}
                style={{ ...inputStyle, width: 100 }}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
              <span style={{ fontSize: 13, color: '#64748B' }}>days</span>
              {/* Quick presets */}
              {[0, 7, 14, 30].map(d => (
                <button key={d} onClick={() => set('trial_days', String(d))} style={{
                  padding: '5px 12px', borderRadius: 7,
                  border: `1px solid ${form.trial_days === String(d) ? '#2563EB' : '#E2E8F0'}`,
                  background: form.trial_days === String(d) ? '#EFF6FF' : '#fff',
                  color: form.trial_days === String(d) ? '#2563EB' : '#64748B',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {d === 0 ? 'None' : `${d}d`}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      {/* ── MYR Note ── */}
      <div style={{
        padding: '14px 18px', borderRadius: 12,
        background: '#F0FDF4', border: '1px solid #BBF7D0',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 18 }}>🇲🇾</span>
        <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
          <strong>Malaysian market configuration.</strong> All plans are priced in MYR (Malaysian Ringgit).
          Stripe supports MYR natively — make sure your Stripe account country is set to Malaysia for
          optimal payment method support (FPX, GrabPay, etc. can be enabled via Stripe Dashboard).
        </div>
      </div>

      {/* Save row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: 13, fontWeight: 600 }}>
            <Check size={14} /> Settings saved!
          </span>
        )}
        <button onClick={handleSave} disabled={doSave.isPending} style={{
          padding: '10px 28px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #635BFF, #2563EB)',
          color: '#fff', fontSize: 14, fontWeight: 700,
          cursor: doSave.isPending ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          opacity: doSave.isPending ? 0.7 : 1,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Zap size={14} />
          {doSave.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}