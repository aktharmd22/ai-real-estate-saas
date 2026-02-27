import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Check, X, CreditCard, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'
import api from '../../lib/axios'

const STATUS_CONFIG = {
  active:     { label: 'Active',     color: '#059669', bg: '#ECFDF5' },
  trialing:   { label: 'Trial',      color: '#7C3AED', bg: '#F5F3FF' },
  past_due:   { label: 'Past Due',   color: '#DC2626', bg: '#FEF2F2' },
  canceled:   { label: 'Cancelled',  color: '#64748B', bg: '#F1F5F9' },
  incomplete: { label: 'Incomplete', color: '#D97706', bg: '#FFF7ED' },
  paused:     { label: 'Paused',     color: '#D97706', bg: '#FFF7ED' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.incomplete
  return (
    <span style={{
      fontSize: 12, padding: '3px 10px', borderRadius: 20,
      fontWeight: 700, background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  )
}

function PlanCard({ plan, currentPlanId, onSelect, loading }) {
  const isCurrent = plan.id === currentPlanId
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 24,
      border: isCurrent
        ? '2px solid #2563EB'
        : plan.is_popular
          ? '2px solid #7C3AED'
          : '1px solid #E2E8F0',
      position: 'relative',
      boxShadow: (isCurrent || plan.is_popular) ? '0 4px 20px rgba(37,99,235,0.1)' : 'none',
      transition: 'all 0.2s',
    }}>
      {/* Badges */}
      {isCurrent && (
        <div style={{
          position: 'absolute', top: -1, right: 20,
          background: '#2563EB', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '3px 10px',
          borderRadius: '0 0 8px 8px',
        }}>
          ✅ CURRENT PLAN
        </div>
      )}
      {plan.is_popular && !isCurrent && (
        <div style={{
          position: 'absolute', top: -1, right: 20,
          background: '#7C3AED', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '3px 10px',
          borderRadius: '0 0 8px 8px',
        }}>
          ⭐ POPULAR
        </div>
      )}

      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
        {plan.name}
      </div>
      {plan.description && (
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>{plan.description}</div>
      )}

      {/* Price */}
      <div style={{ marginBottom: 18 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: '#0F172A' }}>
          {plan.price_formatted}
        </span>
        <span style={{ fontSize: 13, color: '#64748B', marginLeft: 4 }}>
          / {plan.interval === 'yearly' ? 'year' : 'month'}
        </span>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: f.enabled ? '#ECFDF5' : '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {f.enabled
                ? <Check size={10} color="#059669" strokeWidth={3} />
                : <X size={10} color="#94A3B8" strokeWidth={3} />
              }
            </div>
            <span style={{ fontSize: 13, color: f.enabled ? '#374151' : '#94A3B8' }}>
              {f.label}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      {isCurrent ? (
        <div style={{
          padding: '10px', borderRadius: 10, textAlign: 'center',
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          fontSize: 13, fontWeight: 600, color: '#2563EB',
        }}>
          Your current plan
        </div>
      ) : (
        <button
          onClick={() => onSelect(plan)}
          disabled={loading || !plan.has_stripe_price}
          style={{
            width: '100%', padding: '11px', borderRadius: 10, border: 'none',
            background: plan.is_popular
              ? 'linear-gradient(135deg, #7C3AED, #2563EB)'
              : '#0F172A',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: (loading || !plan.has_stripe_price) ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            opacity: !plan.has_stripe_price ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? 'Redirecting...'
            : !plan.has_stripe_price ? 'Not available'
            : 'Subscribe Now'}
        </button>
      )}

      {!plan.has_stripe_price && (
        <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 5 }}>
          Contact admin to enable this plan
        </div>
      )}
    </div>
  )
}

export default function BillingPage() {
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const [checkoutLoading, setCheckoutLoading] = useState(null)
  const [showCancel, setShowCancel] = useState(false)

  const success  = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['agency-billing'],
    queryFn: () => api.get('/agency/billing').then(r => r.data.data),
    refetchInterval: success ? 3000 : false,  // poll after Stripe redirect to catch webhook
  })

  const doCheckout = async (plan) => {
    setCheckoutLoading(plan.id)
    try {
      const res = await api.post(`/agency/billing/checkout/${plan.id}`)
      window.location.href = res.data.url   // redirect to Stripe Checkout
    } catch (e) {
      alert(e.response?.data?.message || 'Could not start checkout.')
      setCheckoutLoading(null)
    }
  }

  const doPortal = async () => {
    try {
      const res = await api.post('/agency/billing/portal')
      window.location.href = res.data.url
    } catch (e) {
      alert(e.response?.data?.message || 'Could not open billing portal.')
    }
  }

  const doCancel = useMutation({
    mutationFn: () => api.delete('/agency/billing/cancel'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agency-billing'] })
      setShowCancel(false)
    },
  })

  const sub   = data?.subscription
  const plans = data?.plans || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Billing & Plans</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
          Manage your subscription and billing details
        </p>
      </div>

      {/* Success / Canceled banners */}
      {success && (
        <div style={{
          padding: '14px 18px', borderRadius: 12,
          background: '#ECFDF5', border: '1px solid #A7F3D0',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Check size={18} color="#059669" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>Payment successful!</div>
            <div style={{ fontSize: 12, color: '#059669', marginTop: 2 }}>
              Your subscription is now active. It may take a few seconds to update.
            </div>
          </div>
          <button onClick={() => refetch()} style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 7, border: '1px solid #A7F3D0',
            background: '#fff', fontSize: 11, fontWeight: 600, color: '#059669',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
      )}

      {canceled && (
        <div style={{
          padding: '14px 18px', borderRadius: 12,
          background: '#FFF7ED', border: '1px solid #FDE68A',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <AlertCircle size={18} color="#D97706" />
          <div style={{ fontSize: 13, color: '#92400E' }}>
            Checkout was cancelled. Choose a plan below to subscribe.
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading billing info...</div>
        </div>
      ) : (
        <>
          {/* ── Current Subscription Card ── */}
          {sub ? (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{
                padding: '18px 24px', borderBottom: '1px solid #E2E8F0',
                background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CreditCard size={20} color="#2563EB" />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Current Subscription</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                      {sub.plan.name} — {sub.plan.price_formatted}
                    </div>
                  </div>
                </div>
                <StatusBadge status={sub.status} />
              </div>

              <div style={{ padding: 24 }}>
                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                  {[
                    {
                      label: 'Renewal Date',
                      value: sub.current_period_end || '—',
                      sub: sub.days_until_renewal != null ? `${sub.days_until_renewal} days left` : null,
                      color: '#2563EB',
                    },
                    {
                      label: 'Trial Ends',
                      value: sub.trial_ends_at || 'N/A',
                      sub: sub.status === 'trialing' ? 'Currently on trial' : null,
                      color: '#7C3AED',
                    },
                    {
                      label: 'Status',
                      value: STATUS_CONFIG[sub.status]?.label || sub.status,
                      sub: sub.canceled_at ? `Cancelled on ${sub.canceled_at}` : null,
                      color: STATUS_CONFIG[sub.status]?.color || '#64748B',
                    },
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: '14px 16px', borderRadius: 12,
                      background: '#F8FAFC', border: '1px solid #F1F5F9',
                    }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>
                        {item.value}
                      </div>
                      {item.sub && (
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{item.sub}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Past due warning */}
                {sub.status === 'past_due' && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.6 }}>
                      <strong>Payment failed.</strong> Please update your payment method to avoid service interruption.
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={doPortal} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 18px', borderRadius: 10,
                    border: '1px solid #E2E8F0', background: '#fff',
                    fontSize: 13, fontWeight: 600, color: '#374151',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>
                    <ExternalLink size={13} />
                    Manage Billing Portal
                  </button>

                  {sub.status === 'active' && !showCancel && (
                    <button onClick={() => setShowCancel(true)} style={{
                      padding: '9px 18px', borderRadius: 10,
                      border: '1px solid #FECACA', background: '#FEF2F2',
                      fontSize: 13, fontWeight: 600, color: '#DC2626',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}>
                      Cancel Subscription
                    </button>
                  )}

                  {showCancel && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', borderRadius: 10,
                      background: '#FEF2F2', border: '1px solid #FECACA',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>
                        Cancel immediately?
                      </span>
                      <button onClick={() => setShowCancel(false)} style={{
                        padding: '4px 12px', borderRadius: 6, border: '1px solid #E2E8F0',
                        background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>No</button>
                      <button onClick={() => doCancel.mutate()} disabled={doCancel.isPending} style={{
                        padding: '4px 12px', borderRadius: 6, border: 'none',
                        background: '#DC2626', color: '#fff', fontSize: 11,
                        fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      }}>
                        {doCancel.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* No subscription banner */
            <div style={{
              padding: '24px', borderRadius: 16, textAlign: 'center',
              background: '#FFF7ED', border: '1px solid #FDE68A',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                No active subscription
              </div>
              <div style={{ fontSize: 13, color: '#B45309' }}>
                Choose a plan below to unlock all features
              </div>
            </div>
          )}

          {/* ── Plans Grid ── */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>
              {sub ? 'Change Plan' : 'Choose a Plan'}
            </h3>

            {plans.length === 0 ? (
              <div style={{
                padding: '40px', textAlign: 'center',
                background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0',
                color: '#94A3B8', fontSize: 13,
              }}>
                No plans available. Contact your administrator.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`,
                gap: 20,
              }}>
                {plans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    currentPlanId={sub?.plan?.id}
                    onSelect={doCheckout}
                    loading={checkoutLoading === plan.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* MYR note */}
          <div style={{
            padding: '12px 16px', borderRadius: 12,
            background: '#F8FAFC', border: '1px solid #E2E8F0',
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <span style={{ fontSize: 16 }}>🇲🇾</span>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              All prices are in Malaysian Ringgit (MYR). Payments are processed securely via Stripe.
              Supported methods: Visa, Mastercard, FPX, GrabPay (subject to Stripe availability).
            </span>
          </div>
        </>
      )}
    </div>
  )
}