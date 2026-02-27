import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Eye, EyeOff, Key, Trash2, Check,
  Zap, MessageSquare, Copy
} from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'

// ─── Constants ────────────────────────────────────────────────────────────────
const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Fast & cheap — recommended', badge: 'Recommended' },
  { value: 'gpt-4o',      label: 'GPT-4o',      desc: 'Most capable, higher cost',  badge: 'Best Quality' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: 'Balanced performance & cost', badge: null },
]
const WIDGET_COLORS = ['#2563EB','#7C3AED','#059669','#DC2626','#D97706','#0891B2','#DB2777','#374151']

// ─── Small reusable components ────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }) {
  return (
    <div onClick={disabled ? undefined : onChange} style={{
      width: 44, height: 24, borderRadius: 12, position: 'relative',
      background: value ? '#059669' : '#E2E8F0',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background 0.2s', opacity: disabled ? 0.5 : 1, flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

function SecretInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
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
        {show ? <EyeOff size={16}/> : <Eye size={16}/>}
      </button>
    </div>
  )
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} style={{
      width: '100%', border: '1px solid #E2E8F0', borderRadius: 10,
      padding: '10px 14px', fontSize: 13, color: '#0F172A',
      outline: 'none', boxSizing: 'border-box',
      fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC',
    }}
    onFocus={e => e.target.style.borderColor = '#2563EB'}
    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
    />
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {
      // fallback for older browsers
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 7, border: '1px solid #E2E8F0',
      background: copied ? '#ECFDF5' : '#F8FAFC',
      color: copied ? '#059669' : '#64748B',
      fontSize: 11, fontWeight: 600, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
    }}>
      {copied ? <Check size={11}/> : <Copy size={11}/>}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function SaveBtn({ pending, onSave }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
      <button onClick={onSave} disabled={pending} style={{
        padding: '10px 24px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
        color: '#fff', fontSize: 14, fontWeight: 700,
        cursor: pending ? 'not-allowed' : 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        opacity: pending ? 0.7 : 1,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Zap size={14}/>
        {pending ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}

function CardHeader({ title, subtitle, gradient, value, onToggle, disabled }) {
  return (
    <div style={{
      padding: '18px 24px', borderBottom: '1px solid #E2E8F0',
      background: gradient,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: value ? '#059669' : '#94A3B8' }}>
          {value ? 'Enabled' : 'Disabled'}
        </span>
        <Toggle value={value} onChange={onToggle} disabled={disabled} />
      </div>
    </div>
  )
}

// ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const qc       = useQueryClient()
  const { user } = useAuthStore()
  const agencyId = user?.agency_id

  const [tab, setTab]   = useState('openai')
  const [saved, setSaved] = useState(false)

  // OpenAI
  const [newOpenAIKey, setNewOpenAIKey] = useState('')
  const [delOpenAI, setDelOpenAI]       = useState(false)

  // WhatsApp — local form state (pre-filled from server after load)
  const [waToken,   setWaToken]   = useState('')
  const [waPhoneId, setWaPhoneId] = useState('')
  const [waWabaid,  setWaWabaid]  = useState('')
  const [waVerify,  setWaVerify]  = useState('')
  const [delWA, setDelWA]         = useState(false)

  // Widget
  const [widgetColor,    setWidgetColor]    = useState('#2563EB')
  const [widgetGreeting, setWidgetGreeting] = useState('')
  const [previewOpen,    setPreviewOpen]    = useState(false)

  // ── Fetch settings ──────────────────────────────────────────────────────────
  const { data: s, isLoading } = useQuery({
    queryKey: ['agency-settings'],
    queryFn: () => api.get('/agency/settings').then(r => r.data.data),
    staleTime: 30_000,
  })

  // Pre-fill local form state when server data arrives
  // (fixes the "slow loading" issue — useEffect replaces deprecated onSuccess)
  useEffect(() => {
    if (!s) return
    setWaPhoneId(s.whatsapp_phone_id || '')
    setWaWabaid(s.whatsapp_business_account_id || '')
    setWaVerify(s.whatsapp_verify_token || '')
    setWidgetColor(s.widget_color || '#2563EB')
    setWidgetGreeting(s.widget_greeting || '')
  }, [s])

  // ── Mutations ───────────────────────────────────────────────────────────────
  const doSave = useMutation({
    mutationFn: (payload) => api.put('/agency/settings', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency-settings'] })
      setNewOpenAIKey('')
      setWaToken('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const doDelOpenAI = useMutation({
    mutationFn: () => api.delete('/agency/settings/openai-key'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency-settings'] })
      setDelOpenAI(false)
    },
  })

  const doDelWA = useMutation({
    mutationFn: () => api.delete('/agency/settings/whatsapp-token'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency-settings'] })
      setDelWA(false)
    },
  })

  // ── URL helpers ─────────────────────────────────────────────────────────────
  const baseUrl     = import.meta.env.VITE_API_URL || ''           // e.g. https://backend.com/api/v1
  const rootUrl     = baseUrl.replace(/\/api\/v1\/?$/, '')          // e.g. https://backend.com
  const webhookUrl  = `${baseUrl}/webhook/whatsapp/${agencyId}`
  const widgetScript = `<script src="${rootUrl}/widget.js" data-agency="${agencyId}"></script>`

  if (isLoading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '80px 0', flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid #E2E8F0', borderTopColor: '#2563EB',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading settings...</div>
    </div>
  )

  const TABS = [
    { id: 'openai',   label: '🤖 AI Scoring' },
    { id: 'whatsapp', label: '📱 WhatsApp' },
    { id: 'widget',   label: '🌐 Web Widget' },
  ]

  return (
    <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Settings</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
          Manage your integrations and preferences
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 4, gap: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '9px 12px', borderRadius: 8, border: 'none',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: tab === t.id ? '#fff' : 'transparent',
            color: tab === t.id ? '#2563EB' : '#64748B',
            boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════ OPENAI TAB ══════════════ */}
      {tab === 'openai' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <CardHeader
            title="OpenAI Integration"
            subtitle="AI-powered lead scoring"
            gradient="linear-gradient(135deg, #EFF6FF, #F5F3FF)"
            value={s?.ai_scoring_enabled}
            disabled={!s?.has_openai_key}
            onToggle={() => doSave.mutate({ ai_scoring_enabled: !s?.ai_scoring_enabled })}
          />

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Key status badge */}
            <KeyStatus
              hasKey={s?.has_openai_key}
              maskedKey={s?.masked_openai_key}
              onRemove={() => setDelOpenAI(true)}
              showRemove={!delOpenAI}
            />

            {delOpenAI && (
              <ConfirmRow
                message="Remove OpenAI key? AI scoring will be disabled."
                onCancel={() => setDelOpenAI(false)}
                onConfirm={() => doDelOpenAI.mutate()}
                pending={doDelOpenAI.isPending}
              />
            )}

            <Field label={s?.has_openai_key ? 'Replace API Key' : 'Add API Key'}>
              <SecretInput
                value={newOpenAIKey}
                onChange={e => setNewOpenAIKey(e.target.value)}
                placeholder="sk-proj-..."
              />
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>
                Get from{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer"
                  style={{ color: '#2563EB', textDecoration: 'none' }}>
                  platform.openai.com/api-keys
                </a>
                . Stored encrypted.
              </div>
            </Field>

            {/* Model selector */}
            <Field label="Model">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {MODEL_OPTIONS.map(opt => (
                  <div key={opt.value}
                    onClick={() => doSave.mutate({ openai_model: opt.value })}
                    style={{
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${s?.openai_model === opt.value ? '#2563EB' : '#E2E8F0'}`,
                      background: s?.openai_model === opt.value ? '#EFF6FF' : '#fff',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${s?.openai_model === opt.value ? '#2563EB' : '#CBD5E1'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {s?.openai_model === opt.value && (
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{opt.desc}</div>
                      </div>
                    </div>
                    {opt.badge && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: '#EFF6FF', color: '#2563EB' }}>
                        {opt.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Field>

            {saved && <SavedBadge />}
            <SaveBtn pending={doSave.isPending} onSave={() => {
              const p = {}
              if (newOpenAIKey.trim()) p.openai_api_key = newOpenAIKey.trim()
              doSave.mutate(p)
            }} />
          </div>
        </div>
      )}

      {/* ══════════════ WHATSAPP TAB ══════════════ */}
      {tab === 'whatsapp' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <CardHeader
            title="WhatsApp Business API"
            subtitle="Meta Cloud API — receive & send messages"
            gradient="linear-gradient(135deg, #F0FDF4, #ECFDF5)"
            value={s?.whatsapp_enabled}
            disabled={!s?.has_whatsapp_token}
            onToggle={() => doSave.mutate({ whatsapp_enabled: !s?.whatsapp_enabled })}
          />

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Setup steps */}
            <div style={{ padding: '14px 16px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Quick Setup Guide
              </div>
              {[
                'Go to Meta for Developers → create a WhatsApp Business app',
                'Copy Access Token, Phone Number ID, Business Account ID',
                'Choose any Verify Token string (e.g. recloser-2024)',
                'Paste Webhook URL below into Meta → Webhooks → Subscribe to "messages"',
                'Fill in the fields below → Save → toggle Enable',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#059669',
                    color: '#fff', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: '#065F46', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>

            {/* Webhook URL */}
            <Field label="Your Webhook URL" hint="Copy this and paste into Meta Developer Console → Webhooks">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: '#F8FAFC', border: '1px solid #E2E8F0',
              }}>
                <code style={{ flex: 1, fontSize: 11, color: '#374151', wordBreak: 'break-all', lineHeight: 1.6 }}>
                  {webhookUrl}
                </code>
                <CopyBtn text={webhookUrl} />
              </div>
            </Field>

            {/* Token status */}
            <KeyStatus
              hasKey={s?.has_whatsapp_token}
              maskedKey={s?.masked_whatsapp_token}
              label={s?.has_whatsapp_token ? 'Access Token Saved' : 'No Access Token Set'}
              onRemove={() => setDelWA(true)}
              showRemove={!delWA}
            />

            {delWA && (
              <ConfirmRow
                message="Remove WhatsApp token? This will disable WhatsApp."
                onCancel={() => setDelWA(false)}
                onConfirm={() => doDelWA.mutate()}
                pending={doDelWA.isPending}
              />
            )}

            {/* Fields */}
            <Field label="Access Token" required hint="Use a permanent token from Meta System User (not temporary)">
              <SecretInput value={waToken} onChange={e => setWaToken(e.target.value)} placeholder="EAAxxxxxxxxxx..." />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Phone Number ID" required>
                <TextInput value={waPhoneId} onChange={e => setWaPhoneId(e.target.value)} placeholder="1234567890" />
              </Field>
              <Field label="Business Account ID">
                <TextInput value={waWabaid} onChange={e => setWaWabaid(e.target.value)} placeholder="9876543210" />
              </Field>
            </div>

            <Field label="Verify Token" required hint="Any string — must match exactly what you set in Meta webhook settings">
              <TextInput value={waVerify} onChange={e => setWaVerify(e.target.value)} placeholder="recloser-verify-2024" />
            </Field>

            {saved && <SavedBadge />}
            <SaveBtn pending={doSave.isPending} onSave={() => {
              const p = {
                whatsapp_phone_id:            waPhoneId,
                whatsapp_business_account_id: waWabaid,
                whatsapp_verify_token:        waVerify,
              }
              if (waToken.trim()) p.whatsapp_access_token = waToken.trim()
              doSave.mutate(p)
            }} />
          </div>
        </div>
      )}

      {/* ══════════════ WIDGET TAB ══════════════ */}
      {tab === 'widget' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <CardHeader
            title="Web Chat Widget"
            subtitle="Embed a live chat bubble on any website"
            gradient="linear-gradient(135deg, #F5F3FF, #EFF6FF)"
            value={s?.widget_enabled}
            onToggle={() => doSave.mutate({ widget_enabled: !s?.widget_enabled })}
          />

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Color picker */}
            <Field label="Widget Color">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {WIDGET_COLORS.map(c => (
                  <div key={c} onClick={() => setWidgetColor(c)} style={{
                    width: 30, height: 30, borderRadius: '50%', background: c,
                    cursor: 'pointer',
                    boxShadow: widgetColor === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none',
                    transition: 'box-shadow 0.15s', flexShrink: 0,
                  }} />
                ))}
                {/* Custom color input */}
                <div style={{ position: 'relative', width: 30, height: 30 }}>
                  <input type="color" value={widgetColor} onChange={e => setWidgetColor(e.target.value)}
                    style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #E2E8F0', cursor: 'pointer', padding: 0, background: 'none' }}
                    title="Custom color"
                  />
                </div>
              </div>
            </Field>

            {/* Greeting */}
            <Field label="Greeting Message">
              <TextInput
                value={widgetGreeting}
                onChange={e => setWidgetGreeting(e.target.value)}
                placeholder="Hi! How can we help you today?"
              />
            </Field>

            {/* Live preview */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Preview
              </div>
              <div style={{
                position: 'relative', height: 200,
                background: 'linear-gradient(135deg, #F8FAFC, #EFF6FF)',
                borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden',
              }}>
                {/* Mock page content */}
                <div style={{ padding: 20, opacity: 0.3 }}>
                  <div style={{ width: '60%', height: 12, background: '#94A3B8', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: '40%', height: 8, background: '#CBD5E1', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ width: '80%', height: 8, background: '#CBD5E1', borderRadius: 4 }} />
                </div>

                {/* Greeting popup */}
                {previewOpen && (
                  <div style={{
                    position: 'absolute', bottom: 76, right: 20,
                    background: '#fff', borderRadius: '12px 12px 4px 12px',
                    padding: '10px 14px', maxWidth: 200,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    fontSize: 12, color: '#374151', lineHeight: 1.5,
                    border: '1px solid #E2E8F0',
                  }}>
                    {widgetGreeting || 'Hi! How can we help you today?'}
                  </div>
                )}

                {/* Bubble */}
                <div
                  onClick={() => setPreviewOpen(p => !p)}
                  style={{
                    position: 'absolute', bottom: 16, right: 20,
                    width: 48, height: 48, borderRadius: '50%',
                    background: widgetColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 20px ${widgetColor}60`, cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <MessageSquare size={22} color="#fff" />
                </div>

                <div style={{ position: 'absolute', top: 10, left: 14, fontSize: 11, color: '#94A3B8' }}>
                  Click the bubble to preview →
                </div>
              </div>
            </div>

            {/* Embed script */}
            <Field
              label="Embed Code"
              hint="Paste this before the closing </body> tag on your website"
            >
              <div style={{ background: '#1E293B', borderRadius: 10, padding: '14px 16px', position: 'relative' }}>
                <code style={{ fontSize: 11, color: '#A5F3FC', wordBreak: 'break-all', lineHeight: 1.8, display: 'block', paddingRight: 60 }}>
                  {widgetScript}
                </code>
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <CopyBtn text={widgetScript} />
                </div>
              </div>
            </Field>

            {/* How it works */}
            <div style={{ padding: '14px 16px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                How it works
              </div>
              {[
                '🌐 Visitor opens your website → sees the chat bubble',
                '💬 They fill in name + message → click Start Chat',
                '📥 Conversation appears instantly in your Inbox',
                '✅ Lead is auto-created with source = website',
                '↩️ Your agents reply from Inbox → visitor sees replies in real-time',
              ].map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 5, lineHeight: 1.5 }}>{item}</div>
              ))}
            </div>

            {saved && <SavedBadge />}
            <SaveBtn pending={doSave.isPending} onSave={() => {
              doSave.mutate({ widget_color: widgetColor, widget_greeting: widgetGreeting })
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tiny reusable pieces ──────────────────────────────────────────────────────
function KeyStatus({ hasKey, maskedKey, label, onRemove, showRemove }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10,
      background: hasKey ? '#ECFDF5' : '#FFF7ED',
      border: `1px solid ${hasKey ? '#A7F3D0' : '#FDE68A'}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Key size={15} color={hasKey ? '#059669' : '#D97706'} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: hasKey ? '#065F46' : '#92400E' }}>
            {label || (hasKey ? 'API Key Configured' : 'No API Key Set')}
          </div>
          {hasKey && maskedKey && (
            <div style={{ fontSize: 11, color: '#059669', fontFamily: 'monospace', marginTop: 2 }}>
              {maskedKey}
            </div>
          )}
          {!hasKey && (
            <div style={{ fontSize: 11, color: '#D97706', marginTop: 2 }}>
              Fill in the field below and save
            </div>
          )}
        </div>
      </div>
      {hasKey && showRemove && (
        <button onClick={onRemove} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 7,
          border: '1px solid #FECACA', background: '#FEF2F2',
          color: '#DC2626', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <Trash2 size={11}/> Remove
        </button>
      )}
    </div>
  )
}

function ConfirmRow({ message, onCancel, onConfirm, pending }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10,
      background: '#FEF2F2', border: '1px solid #FECACA',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>{message}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          Cancel
        </button>
        <button onClick={onConfirm} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          {pending ? 'Removing...' : 'Yes, Remove'}
        </button>
      </div>
    </div>
  )
}

function SavedBadge() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: 13, fontWeight: 600, justifyContent: 'flex-end' }}>
      <Check size={14}/> Settings saved!
    </div>
  )
}