import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Check, X, RefreshCw, Star, Users, TrendingUp } from 'lucide-react'
import api from '../../lib/axios'

const INTERVAL_LABELS = { monthly: 'month', yearly: 'year' }

function Badge({ children, color = '#2563EB', bg = '#EFF6FF' }) {
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 20,
      background: bg, color, fontWeight: 700,
    }}>
      {children}
    </span>
  )
}

function FeatureRow({ label, enabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
        background: enabled ? '#ECFDF5' : '#F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {enabled
          ? <Check size={10} color="#059669" strokeWidth={3} />
          : <X size={10} color="#94A3B8" strokeWidth={3} />}
      </div>
      <span style={{ fontSize: 12, color: enabled ? '#374151' : '#94A3B8' }}>{label}</span>
    </div>
  )
}

// ── Plan Form Modal ────────────────────────────────────────────────────────────
function PlanModal({ plan, onClose, onSaved }) {
  const isEdit = !!plan
  const [form, setForm] = useState({
    name:            plan?.name            || '',
    slug:            plan?.slug            || '',
    description:     plan?.description    || '',
    price_myr:       plan ? plan.price_myr / 100 : '',   // display in RM
    interval:        plan?.interval        || 'monthly',
    stripe_price_id: plan?.stripe_price_id || '',
    max_agents:      plan?.max_agents      || 5,
    max_leads:       plan?.max_leads       || 500,
    max_properties:  plan?.max_properties  || 100,
    ai_scoring:      plan?.ai_scoring      || false,
    whatsapp:        plan?.whatsapp        || false,
    web_widget:      plan?.web_widget      || false,
    analytics:       plan?.analytics       || false,
    is_active:       plan?.is_active       ?? true,
    is_popular:      plan?.is_popular      || false,
    sort_order:      plan?.sort_order      || 0,
    create_on_stripe: false,
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = useMutation({
    mutationFn: (data) => isEdit
      ? api.put(`/super-admin/plans/${plan.id}`, data)
      : api.post('/super-admin/plans', data),
    onSuccess: () => onSaved(),
    onError: (e) => setErrors(e.response?.data?.errors || {}),
  })

  const handleSubmit = () => {
    setErrors({})
    save.mutate({
      ...form,
      price_myr: Math.round(parseFloat(form.price_myr) * 100),  // convert RM to sen
    })
  }

  const inputStyle = {
    width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, color: '#0F172A',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC',
  }
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }
  const errStyle   = { fontSize: 11, color: '#DC2626', marginTop: 3 }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {isEdit ? 'Edit Plan' : 'Create Plan'}
          </h3>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
            background: '#F8FAFC', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} color="#64748B" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name + Slug */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Plan Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Starter" style={inputStyle} />
                {errors.name && <div style={errStyle}>{errors.name[0]}</div>}
              </div>
              <div>
                <label style={labelStyle}>Slug *</label>
                <input value={form.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="starter" style={inputStyle} disabled={isEdit} />
                {errors.slug && <div style={errStyle}>{errors.slug[0]}</div>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={2} placeholder="Perfect for small agencies..."
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* Price + Interval */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Price (RM) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 13, fontWeight: 600, color: '#64748B',
                  }}>RM</span>
                  <input type="number" value={form.price_myr}
                    onChange={e => set('price_myr', e.target.value)}
                    placeholder="99.00" style={{ ...inputStyle, paddingLeft: 36 }} />
                </div>
                {errors.price_myr && <div style={errStyle}>{errors.price_myr[0]}</div>}
              </div>
              <div>
                <label style={labelStyle}>Billing Interval *</label>
                <select value={form.interval} onChange={e => set('interval', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {/* Stripe Price ID */}
            <div>
              <label style={labelStyle}>Stripe Price ID</label>
              <input value={form.stripe_price_id}
                onChange={e => set('stripe_price_id', e.target.value)}
                placeholder="price_xxxxxxxxxxxx (or auto-create below)"
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }} />
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                Leave blank and check "Create on Stripe" to auto-create
              </div>
            </div>

            {/* Limits */}
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: '#F8FAFC', border: '1px solid #F1F5F9',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Limits
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { key: 'max_agents',     label: 'Max Agents' },
                  { key: 'max_leads',      label: 'Max Leads' },
                  { key: 'max_properties', label: 'Max Properties' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>
                      {f.label}
                    </label>
                    <input type="number" value={form[f.key]}
                      onChange={e => set(f.key, parseInt(e.target.value))}
                      style={inputStyle} />
                  </div>
                ))}
              </div>
            </div>

            {/* Feature toggles */}
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: '#F8FAFC', border: '1px solid #F1F5F9',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Features
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { key: 'ai_scoring', label: '🤖 AI Lead Scoring' },
                  { key: 'whatsapp',   label: '📱 WhatsApp Integration' },
                  { key: 'web_widget', label: '🌐 Web Chat Widget' },
                  { key: 'analytics',  label: '📊 Analytics Dashboard' },
                ].map(f => (
                  <label key={f.key} style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    padding: '8px 12px', borderRadius: 8,
                    border: `1px solid ${form[f.key] ? '#BFDBFE' : '#E2E8F0'}`,
                    background: form[f.key] ? '#EFF6FF' : '#fff',
                  }}>
                    <input type="checkbox" checked={form[f.key]}
                      onChange={e => set(f.key, e.target.checked)}
                      style={{ accentColor: '#2563EB', width: 14, height: 14 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: form[f.key] ? '#1D4ED8' : '#374151' }}>
                      {f.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Meta toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { key: 'is_active',  label: '✅ Active' },
                { key: 'is_popular', label: '⭐ Popular' },
              ].map(f => (
                <label key={f.key} style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
                  background: form[f.key] ? '#F0FDF4' : '#fff',
                }}>
                  <input type="checkbox" checked={form[f.key]}
                    onChange={e => set(f.key, e.target.checked)}
                    style={{ accentColor: '#059669', width: 14, height: 14 }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{f.label}</span>
                </label>
              ))}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Sort Order</label>
                <input type="number" value={form.sort_order}
                  onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
                  style={inputStyle} />
              </div>
            </div>

            {/* Auto-create on Stripe */}
            {!isEdit && (
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                padding: '12px 14px', borderRadius: 10,
                border: `1.5px solid ${form.create_on_stripe ? '#2563EB' : '#E2E8F0'}`,
                background: form.create_on_stripe ? '#EFF6FF' : '#F8FAFC',
              }}>
                <input type="checkbox" checked={form.create_on_stripe}
                  onChange={e => set('create_on_stripe', e.target.checked)}
                  style={{ accentColor: '#2563EB', width: 14, height: 14, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>
                    Auto-create Product &amp; Price on Stripe
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Requires Stripe Secret Key in Super Admin Settings
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 8, border: '1px solid #E2E8F0',
            background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", color: '#374151',
          }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={save.isPending} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: save.isPending ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif", opacity: save.isPending ? 0.7 : 1,
          }}>
            {save.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Plans Page ────────────────────────────────────────────────────────────
export default function PlansPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editPlan, setEditPlan]   = useState(null)
  const [delId, setDelId]         = useState(null)

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['super-admin-plans'],
    queryFn: () => api.get('/super-admin/plans').then(r => r.data.data || []),
  })

  const deletePlan = useMutation({
    mutationFn: (id) => api.delete(`/super-admin/plans/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['super-admin-plans'] }); setDelId(null) },
  })

  const syncStripe = useMutation({
    mutationFn: (id) => api.post(`/super-admin/plans/${id}/sync-stripe`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin-plans'] }),
  })

  const refresh = () => {
    setShowModal(false)
    setEditPlan(null)
    qc.invalidateQueries({ queryKey: ['super-admin-plans'] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Plans</h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
            Manage subscription plans for agencies
          </p>
        </div>
        <button onClick={() => { setEditPlan(null); setShowModal(true) }} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 16px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
          color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
        }}>
          <Plus size={14} /> New Plan
        </button>
      </div>

      {/* Plans grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8', fontSize: 13 }}>
          Loading plans...
        </div>
      ) : plans.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>No plans yet</div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Create your first pricing plan</div>
          <button onClick={() => setShowModal(true)} style={{
            padding: '9px 20px', borderRadius: 10, border: 'none',
            background: '#2563EB', color: '#fff', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            <Plus size={13} style={{ marginRight: 6 }} /> Create Plan
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {plans.map(plan => (
            <div key={plan.id} style={{
              background: '#fff', borderRadius: 16,
              border: plan.is_popular ? '2px solid #2563EB' : '1px solid #E2E8F0',
              overflow: 'hidden', position: 'relative',
              boxShadow: plan.is_popular ? '0 4px 20px rgba(37,99,235,0.12)' : 'none',
            }}>

              {/* Popular badge */}
              {plan.is_popular && (
                <div style={{
                  position: 'absolute', top: 0, right: 20,
                  background: '#2563EB', color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '3px 10px',
                  borderRadius: '0 0 8px 8px',
                }}>
                  ⭐ POPULAR
                </div>
              )}

              <div style={{ padding: '20px 20px 16px' }}>
                {/* Plan name + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{plan.description}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <Badge
                      color={plan.is_active ? '#059669' : '#DC2626'}
                      bg={plan.is_active ? '#ECFDF5' : '#FEF2F2'}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* Price */}
                <div style={{ margin: '12px 0' }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A' }}>
                    {plan.price_formatted}
                  </span>
                  <span style={{ fontSize: 13, color: '#64748B', marginLeft: 4 }}>
                    / {INTERVAL_LABELS[plan.interval]}
                  </span>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B' }}>
                    <Users size={11} />
                    {plan.active_subscribers} subscribers
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B' }}>
                    <TrendingUp size={11} />
                    {plan.interval}
                  </div>
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
                  {plan.features.map((f, i) => (
                    <FeatureRow key={i} label={f.label} enabled={f.enabled} />
                  ))}
                </div>

                {/* Stripe status */}
                <div style={{
                  padding: '8px 10px', borderRadius: 8,
                  background: plan.stripe_price_id ? '#F0FDF4' : '#FFF7ED',
                  border: `1px solid ${plan.stripe_price_id ? '#BBF7D0' : '#FDE68A'}`,
                  fontSize: 11, fontWeight: 600,
                  color: plan.stripe_price_id ? '#059669' : '#D97706',
                  marginBottom: 14,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>
                    {plan.stripe_price_id
                      ? `✅ Stripe: ${plan.stripe_price_id.slice(0, 20)}...`
                      : '⚠️ Not synced to Stripe'}
                  </span>
                  {!plan.stripe_price_id && (
                    <button
                      onClick={() => syncStripe.mutate(plan.id)}
                      disabled={syncStripe.isPending}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 5, border: 'none',
                        background: '#D97706', color: '#fff', fontSize: 10,
                        fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <RefreshCw size={9} />
                      Sync
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setEditPlan(plan); setShowModal(true) }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 6, padding: '8px', borderRadius: 8,
                      border: '1px solid #E2E8F0', background: '#F8FAFC',
                      fontSize: 12, fontWeight: 600, color: '#374151',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setDelId(plan.id)}
                    style={{
                      width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} color="#DC2626" />
                  </button>
                </div>

                {/* Delete confirm */}
                {delId === plan.id && (
                  <div style={{
                    marginTop: 10, padding: '10px 12px', borderRadius: 8,
                    background: '#FEF2F2', border: '1px solid #FECACA',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#DC2626', marginBottom: 8 }}>
                      Delete "{plan.name}"?
                      {plan.active_subscribers > 0 && (
                        <div style={{ fontWeight: 400, marginTop: 2 }}>
                          ⚠️ {plan.active_subscribers} active subscribers
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setDelId(null)} style={{
                        flex: 1, padding: '5px', borderRadius: 6, border: '1px solid #E2E8F0',
                        background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>Cancel</button>
                      <button onClick={() => deletePlan.mutate(plan.id)} style={{
                        flex: 1, padding: '5px', borderRadius: 6, border: 'none',
                        background: '#DC2626', color: '#fff', fontSize: 11,
                        fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PlanModal
          plan={editPlan}
          onClose={() => { setShowModal(false); setEditPlan(null) }}
          onSaved={refresh}
        />
      )}
    </div>
  )
}