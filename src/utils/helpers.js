// ─── Currency Formatter ───────────────────────────────────────────────────────
export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount)

// ─── Date Formatters ──────────────────────────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(date))
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

// ─── String Helpers ───────────────────────────────────────────────────────────
export const truncate = (str, n = 50) =>
  str?.length > n ? str.slice(0, n) + '...' : str

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export const slugify = (str = '') =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')

// ─── Role Config ──────────────────────────────────────────────────────────────
export const ROLE_CONFIG = {
  super_admin: {
    label: 'Super Admin',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
  },
  agency_admin: {
    label: 'Agency Admin',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  agent: {
    label: 'Agent',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
  },
}

// ─── Lead Status Config ───────────────────────────────────────────────────────
export const LEAD_STATUS_CONFIG = {
  new: {
    label: 'New',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  contacted: {
    label: 'Contacted',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  qualified: {
    label: 'Qualified',
    color: '#059669',
    bg: '#ECFDF5',
  },
  visiting: {
    label: 'Visiting',
    color: '#D97706',
    bg: '#FFF7ED',
  },
  negotiating: {
    label: 'Negotiating',
    color: '#DC2626',
    bg: '#FEF2F2',
  },
  closed: {
    label: 'Closed',
    color: '#065F46',
    bg: '#D1FAE5',
  },
  lost: {
    label: 'Lost',
    color: '#64748B',
    bg: '#F1F5F9',
  },
}

// ─── Lead Source Config ───────────────────────────────────────────────────────
export const LEAD_SOURCE_CONFIG = {
  manual:     { label: 'Manual',     icon: '✏️' },
  whatsapp:   { label: 'WhatsApp',   icon: '💬' },
  web_widget: { label: 'Web Widget', icon: '🌐' },
  email:      { label: 'Email',      icon: '📧' },
  referral:   { label: 'Referral',   icon: '🤝' },
}

// ─── Property Type Config ─────────────────────────────────────────────────────
export const PROPERTY_TYPE_CONFIG = {
  apartment:  { label: 'Apartment',  icon: '🏢' },
  villa:      { label: 'Villa',      icon: '🏡' },
  plot:       { label: 'Plot',       icon: '🗺️' },
  commercial: { label: 'Commercial', icon: '🏬' },
}

// ─── Timeline Config ──────────────────────────────────────────────────────────
export const TIMELINE_CONFIG = {
  immediate:    { label: 'Immediate' },
  '1_3_months': { label: '1–3 Months' },
  '3_6_months': { label: '3–6 Months' },
  '6_plus_months': { label: '6+ Months' },
}

// ─── Score Color Helper ───────────────────────────────────────────────────────
export const getScoreColor = (score) => {
  if (score >= 70) return '#10B981'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

// ─── Agency Status Config ─────────────────────────────────────────────────────
export const AGENCY_STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#059669', bg: '#ECFDF5' },
  trial:     { label: 'Trial',     color: '#D97706', bg: '#FFF7ED' },
  suspended: { label: 'Suspended', color: '#DC2626', bg: '#FEF2F2' },
}