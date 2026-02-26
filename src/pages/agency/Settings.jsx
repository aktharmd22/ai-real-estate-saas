import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Eye, EyeOff, Key, Trash2, Check, AlertCircle,
  Zap, MessageSquare, Globe, Copy, ExternalLink
} from 'lucide-react'
import api from '../../lib/axios'

const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Fast & cheap — recommended', badge: 'Recommended' },
  { value: 'gpt-4o',      label: 'GPT-4o',      desc: 'Most capable, higher cost',  badge: 'Best Quality' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: 'Balanced performance & cost', badge: null },
]

const WIDGET_COLORS = [
  '#2563EB', '#7C3AED', '#059669', '#DC2626',
  '#D97706', '#0891B2', '#DB2777', '#374151',
]

function Toggle({ value, onChange, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onChange}
      style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative',
        background: value ? '#059669' : '#E2E8F0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s', opacity: disabled ? 0.5 : 1, flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: value ? 23 : 3,
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
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%', border: '1px solid #E2E8F0', borderRadius: 10,
          padding: '11px 44px 11px 14px', fontSize: 13, color: '#0F172A',
          outline: 'none', boxSizing: 'border-box',
          fontFamily: 'monospace', background: '#F8FAFC',
        }}
        onFocus={e => e.target.style.borderColor = '#2563EB'}
        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
      />
      <button onClick={() => setShow(p => !p)} type="button" style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8',
        display: 'flex', alignItems: 'center',
      }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
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
      fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
    }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('openai')
  const [saved, setSaved] = useState(false)

  // OpenAI form state
  const [newOpenAIKey, setNewOpenAIKey] = useState('')
  const [delOpenAI, setDelOpenAI]       = useState(false)

  // WhatsApp form state
  const [waToken, setWaToken]   = useState('')
  const [waPhoneId, setWaPhoneId]   = useState('')
  const [waWabaid, setWaWabaid]     = useState('')
  const [waVerify, setWaVerify]     = useState('')
  const [delWA, setDelWA]           = useState(false)

  // Widget state
  const [widgetColor, setWidgetColor]       = useState('#2563EB')
  const [widgetGreeting, setWidgetGreeting] = useState('')

  const { data: settings, isLoading } = useQuery({
    queryKey: ['agency-settings'],
    queryFn: () => api.get('/agency/settings').then(r => r.data.data),
    onSuccess: (d) => {
      setWidgetColor(d.widget_color || '#2563EB')
      setWidgetGreeting(d.widget_greeting || '')
      setWaPhoneId(d.whatsapp_phone_id || '')
      setWaWabaid(d.whatsapp_business_account_id || '')
      setWaVerify(d.whatsapp_verify_token || '')
    },
  })

  const save = useMutation({
    mutationFn: (data) => api.put('/agency/settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency-settings'] })
      setSaved(true)
      setNewOpenAIKey('')
      setWaToken('')
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const deleteOpenAI = useMutation({
    mutationFn: () => api.delete('/agency/settings/openai-key'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agency-settings'] }); setDelOpenAI(false) },
  })

  const deleteWA = useMutation({
    mutationFn: () => api.delete('/agency/settings/whatsapp-token'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agency-settings'] }); setDelWA(false) },
  })

  const agencyId  = settings ? (() => {
    // Extract agency id from the masked token or from the url
    const url = window.location.hostname
    return url  // fallback — will be replaced by actual id below
  })() : null

  // Get actual agency id from auth store
  const user = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user
  const actualAgencyId = user?.agency_id || 1

  const webhookUrl = `${import.meta.env.VITE_API_URL}/webhook/whatsapp/${actualAgencyId}`
  const widgetScript = `<script src="${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/widget.js" data-agency="${actualAgencyId}"></script>`

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8', fontSize: 13 }}>
      Loading settings...
    </div>
  )

  const TABS = [
    { id: 'openai',    label: '🤖 AI Scoring',   },
    { id: 'whatsapp',  label: '📱 WhatsApp',      },
    { id: 'widget',    label: '🌐 Web Widget',    },
  ]

  return (
    <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Settings</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
          Configure your integrations and preferences
        </p>
      </div>

      {/* Tabs */}
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

      {/* ══ OPENAI TAB ══ */}
      {tab === 'openai' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{
            padding: '18px 24px', borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>OpenAI Integration</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>AI-powered lead scoring</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: settings?.ai_scoring_enabled ? '#059669' : '#94A3B8' }}>
                {settings?.ai_scoring_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <Toggle
                value={settings?.ai_scoring_enabled}
                disabled={!settings?.has_openai_key}
                onChange={() => save.mutate({ ai_scoring_enabled: !settings?.ai_scoring_enabled })}
              />
            </div>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Key status */}
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: settings?.has_openai_key ? '#ECFDF5' : '#FFF7ED',
              border: `1px solid ${settings?.has_openai_key ? '#A7F3D0' : '#FDE68A'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Key size={15} color={settings?.has_openai_key ? '#059669' : '#D97706'} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: settings?.has_openai_key ? '#065F46' : '#92400E' }}>
                    {settings?.has_openai_key ? 'API Key Configured' : 'No API Key Set'}
                  </div>
                  {settings?.masked_openai_key && (
                    <div style={{ fontSize: 11, color: '#059669', fontFamily: 'monospace' }}>
                      {settings.masked_openai_key}
                    </div>
                  )}
                </div>
              </div>
              {settings?.has_openai_key && !delOpenAI && (
                <button onClick={() => setDelOpenAI(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                  borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2',
                  color: '#DC2626', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  <Trash2 size={11} /> Remove
                </button>
              )}
            </div>

            {delOpenAI && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, background: '#FEF2F2',
                border: '1px solid #FECACA', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>Remove OpenAI key?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setDelOpenAI(false)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                  <button onClick={() => deleteOpenAI.mutate()} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    {deleteOpenAI.isPending ? 'Removing...' : 'Yes, Remove'}
                  </button>
                </div>
              </div>
            )}

            {/* New key input */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                {settings?.has_openai_key ? 'Replace API Key' : 'Add API Key'}
              </label>
              <SecretInput
                value={newOpenAIKey}
                onChange={e => setNewOpenAIKey(e.target.value)}
                placeholder="sk-proj-..."
              />
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>
                Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>platform.openai.com/api-keys</a>. Stored encrypted.
              </div>
            </div>

            {/* Model */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Model</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {MODEL_OPTIONS.map(opt => (
                  <div key={opt.value} onClick={() => save.mutate({ openai_model: opt.value })} style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${settings?.openai_model === opt.value ? '#2563EB' : '#E2E8F0'}`,
                    background: settings?.openai_model === opt.value ? '#EFF6FF' : '#fff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${settings?.openai_model === opt.value ? '#2563EB' : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {settings?.openai_model === opt.value && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{opt.desc}</div>
                      </div>
                    </div>
                    {opt.badge && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: '#EFF6FF', color: '#2563EB' }}>{opt.badge}</span>}
                  </div>
                ))}
              </div>
            </div>

            <SaveRow saved={saved} pending={save.isPending} onSave={() => {
              const payload = {}
              if (newOpenAIKey.trim()) payload.openai_api_key = newOpenAIKey.trim()
              save.mutate(payload)
            }} />
          </div>
        </div>
      )}

      {/* ══ WHATSAPP TAB ══ */}
      {tab === 'whatsapp' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{
            padding: '18px 24px', borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>WhatsApp Business API</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Meta Cloud API integration</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: settings?.whatsapp_enabled ? '#059669' : '#94A3B8' }}>
                {settings?.whatsapp_enabled ? 'Active' : 'Inactive'}
              </span>
              <Toggle
                value={settings?.whatsapp_enabled}
                disabled={!settings?.has_whatsapp_token}
                onChange={() => save.mutate({ whatsapp_enabled: !settings?.whatsapp_enabled })}
              />
            </div>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Setup guide */}
            <div style={{ padding: '14px 16px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Setup Steps
              </div>
              {[
                'Go to Meta for Developers → Create a WhatsApp app',
                'Get your Access Token from the app dashboard',
                'Copy your Phone Number ID and Business Account ID',
                'Set a custom Verify Token (any random string)',
                'Add webhook URL below to your Meta app',
                'Subscribe to "messages" webhook field',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 5 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#059669', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: '#065F46', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>

            {/* Webhook URL */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Webhook URL <span style={{ fontSize: 11, color: '#94A3B8' }}>(paste this in Meta Developer Console)</span>
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: '#F8FAFC', border: '1px solid #E2E8F0',
              }}>
                <code style={{ flex: 1, fontSize: 11, color: '#374151', wordBreak: 'break-all' }}>
                  {webhookUrl}
                </code>
                <CopyButton text={webhookUrl} />
              </div>
            </div>

            {/* Token status */}
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: settings?.has_whatsapp_token ? '#ECFDF5' : '#FFF7ED',
              border: `1px solid ${settings?.has_whatsapp_token ? '#A7F3D0' : '#FDE68A'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Key size={15} color={settings?.has_whatsapp_token ? '#059669' : '#D97706'} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: settings?.has_whatsapp_token ? '#065F46' : '#92400E' }}>
                    {settings?.has_whatsapp_token ? 'Access Token Set' : 'No Access Token'}
                  </div>
                  {settings?.masked_whatsapp_token && (
                    <div style={{ fontSize: 11, color: '#059669', fontFamily: 'monospace' }}>
                      {settings.masked_whatsapp_token}
                    </div>
                  )}
                </div>
              </div>
              {settings?.has_whatsapp_token && !delWA && (
                <button onClick={() => setDelWA(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  <Trash2 size={11} /> Remove
                </button>
              )}
            </div>

            {delWA && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>Remove WhatsApp token?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setDelWA(false)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                  <button onClick={() => deleteWA.mutate()} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    {deleteWA.isPending ? 'Removing...' : 'Yes, Remove'}
                  </button>
                </div>
              </div>
            )}

            {/* Form fields */}
            <Field label="Access Token (Permanent)" required>
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
            <Field label="Verify Token" required hint="Any random string — paste same in Meta webhook settings">
              <TextInput value={waVerify} onChange={e => setWaVerify(e.target.value)} placeholder="my-secret-verify-token-2024" />
            </Field>

            <SaveRow saved={saved} pending={save.isPending} onSave={() => {
              const payload = {
                whatsapp_phone_id:            waPhoneId,
                whatsapp_business_account_id: waWabaid,
                whatsapp_verify_token:        waVerify,
              }
              if (waToken.trim()) payload.whatsapp_access_token = waToken.trim()
              save.mutate(payload)
            }} />
          </div>
        </div>
      )}

      {/* ══ WIDGET TAB ══ */}
      {tab === 'widget' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{
            padding: '18px 24px', borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(135deg, #F5F3FF, #EFF6FF)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Web Chat Widget</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Embed a chat bubble on your website</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: settings?.widget_enabled ? '#059669' : '#94A3B8' }}>
                {settings?.widget_enabled ? 'Live' : 'Disabled'}
              </span>
              <Toggle
                value={settings?.widget_enabled}
                onChange={() => save.mutate({ widget_enabled: !settings?.widget_enabled })}
              />
            </div>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Color picker */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Widget Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {WIDGET_COLORS.map(c => (
                  <div
                    key={c}
                    onClick={() => { setWidgetColor(c) }}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', background: c,
                      cursor: 'pointer', border: `3px solid ${widgetColor === c ? '#0F172A' : 'transparent'}`,
                      transition: 'border 0.15s',
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={widgetColor}
                  onChange={e => setWidgetColor(e.target.value)}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }}
                  title="Custom color"
                />
              </div>
            </div>

            {/* Greeting */}
            <Field label="Greeting Message">
              <TextInput
                value={widgetGreeting}
                onChange={e => setWidgetGreeting(e.target.value)}
                placeholder="Hi! How can we help you today?"
              />
            </Field>

            {/* Widget preview */}
            <div style={{ position: 'relative', height: 160, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                Preview
              </div>
              {/* Bubble */}
              <div style={{
                position: 'absolute', bottom: 16, right: 16,
                width: 48, height: 48, borderRadius: '50%',
                background: widgetColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 20px ${widgetColor}60`, cursor: 'pointer',
              }}>
                <MessageSquare size={22} color="#fff" />
              </div>
              {/* Greeting popup */}
              <div style={{
                position: 'absolute', bottom: 72, right: 16,
                background: '#fff', borderRadius: '12px 12px 4px 12px',
                padding: '10px 14px', maxWidth: 200,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                fontSize: 12, color: '#374151', lineHeight: 1.5,
                border: '1px solid #E2E8F0',
              }}>
                {widgetGreeting || 'Hi! How can we help you today?'}
                <div style={{ position: 'absolute', bottom: -6, right: 16, width: 12, height: 12, background: '#fff', transform: 'rotate(45deg)', border: '0 0 1px 1px solid #E2E8F0' }} />
              </div>
            </div>

            {/* Embed code */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Embed Code <span style={{ fontSize: 11, color: '#94A3B8' }}>(paste before {'</body>'} on your website)</span>
              </label>
              <div style={{ background: '#1E293B', borderRadius: 10, padding: '14px 16px', position: 'relative' }}>
                <code style={{ fontSize: 11, color: '#A5F3FC', wordBreak: 'break-all', lineHeight: 1.7 }}>
                  {widgetScript}
                </code>
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <CopyButton text={widgetScript} />
                </div>
              </div>
            </div>

            <SaveRow saved={saved} pending={save.isPending} onSave={() => {
              save.mutate({ widget_color: widgetColor, widget_greeting: widgetGreeting })
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reusable helpers ─────────────────────────────────────────────────────────
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

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
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

function SaveRow({ saved, pending, onSave }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, paddingTop: 4 }}>
      {saved && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#059669', fontSize: 13, fontWeight: 600 }}>
          <Check size={14} /> Saved!
        </span>
      )}
      <button onClick={onSave} disabled={pending} style={{
        padding: '10px 24px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
        color: '#fff', fontSize: 14, fontWeight: 700,
        cursor: pending ? 'not-allowed' : 'pointer',
        fontFamily: "'DM Sans', sans-serif", opacity: pending ? 0.7 : 1,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Zap size={14} />
        {pending ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}