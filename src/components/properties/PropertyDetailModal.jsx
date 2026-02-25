import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, MapPin, Pencil, Trash2, Check } from 'lucide-react'
import api from '../../lib/axios'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { formatCurrency, formatDate } from '../../utils/helpers'

const PROPERTY_STATUS_CONFIG = {
  available:  { label: 'Available',  color: '#059669', bg: '#ECFDF5' },
  sold:       { label: 'Sold',       color: '#DC2626', bg: '#FEF2F2' },
  rented:     { label: 'Rented',     color: '#7C3AED', bg: '#F5F3FF' },
  off_market: { label: 'Off Market', color: '#64748B', bg: '#F1F5F9' },
}

const PROPERTY_TYPE_ICONS = {
  apartment: '🏢', villa: '🏡', plot: '🗺️',
  commercial: '🏬', office: '🏛️', warehouse: '🏭',
}

const AMENITIES_LIST = [
  'Parking', 'Gym', 'Swimming Pool', 'Security', 'Lift',
  'Power Backup', 'Garden', 'Club House', 'CCTV', 'WiFi',
  'Intercom', 'Water Supply', 'Gas Pipeline', 'Balcony', 'Terrace',
]

export default function PropertyDetailModal({ property: initial, onClose, apiBase = '/agency', isAgent = false }) {
  const qc = useQueryClient()
  const [mode, setMode]           = useState('view')   // view | edit
  const [localStatus, setLocalStatus] = useState(initial.status)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [form, setForm]           = useState({})
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const { data: property = initial } = useQuery({
    queryKey: ['property', initial.id, apiBase],
    queryFn: () => api.get(`${apiBase}/properties/${initial.id}`)
      .then(r => r.data?.data || r.data),
  })

  // Sync status + form when data loads
  useEffect(() => {
    if (property?.status) setLocalStatus(property.status)
    if (property) {
      setForm({
        title:        property.title        || '',
        description:  property.description  || '',
        type:         property.type         || 'apartment',
        listing_type: property.listing_type || 'sale',
        price:        property.price        || '',
        address:      property.address      || '',
        city:         property.city         || '',
        area:         property.area         || '',
        pincode:      property.pincode      || '',
        bedrooms:     property.bedrooms     || '',
        bathrooms:    property.bathrooms    || '',
        area_sqft:    property.area_sqft    || '',
        floor:        property.floor        || '',
        total_floors: property.total_floors || '',
        built_year:   property.built_year   || '',
        is_furnished: property.is_furnished || false,
        is_featured:  property.is_featured  || false,
        amenities:    property.amenities    || [],
      })
    }
  }, [property?.id, property?.status])

  // ─── Update status ────────────────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: (status) => api.put(`/agency/properties/${property.id}`, { status }),
    onMutate:   (status) => setLocalStatus(status),
    onSuccess:  (res) => {
      const updated = res.data?.data || res.data
      if (updated) qc.setQueryData(['property', initial.id, apiBase], updated)
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: ['property-stats'] })
    },
    onError: () => setLocalStatus(property.status),
  })

  // ─── Save edits ───────────────────────────────────────────────────────────
  const saveEdit = useMutation({
    mutationFn: (data) => api.put(`/agency/properties/${property.id}`, data),
    onSuccess: (res) => {
      const updated = res.data?.data || res.data
      if (updated) qc.setQueryData(['property', initial.id, apiBase], updated)
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: ['property-stats'] })
      setMode('view')
    },
    onError: (err) => console.error('Update failed:', err.response?.data),
  })

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteProperty = useMutation({
    mutationFn: () => api.delete(`/agency/properties/${property.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: ['property-stats'] })
      onClose()
    },
    onError: (err) => console.error('Delete failed:', err.response?.data),
  })

  const toggleAmenity = (a) => {
    setForm(p => ({
      ...p,
      amenities: p.amenities.includes(a)
        ? p.amenities.filter(x => x !== a)
        : [...p.amenities, a],
    }))
  }

  const statusCfg = PROPERTY_STATUS_CONFIG[localStatus] || PROPERTY_STATUS_CONFIG.available
  const typeIcon  = PROPERTY_TYPE_ICONS[property.type] || '🏠'
  const amenities = property.amenities || []

  const selectStyle = {
    border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px',
    fontSize: 14, color: '#0F172A', background: '#fff', outline: 'none',
    cursor: 'pointer', width: '100%', fontFamily: "'DM Sans', sans-serif",
  }

  const labelStyle = {
    fontSize: 13, fontWeight: 600, color: '#374151',
    marginBottom: 6, display: 'block',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Cover image ── */}
        <div style={{
          height: 160, background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', borderRadius: '20px 20px 0 0', overflow: 'hidden',
          flexShrink: 0,
        }}>
          {property.cover_image
            ? <img src={property.cover_image} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 56 }}>{typeIcon}</span>
          }

          {/* Top left badges */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: statusCfg.bg, color: statusCfg.color,
            }}>
              {statusCfg.label}
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: property.listing_type === 'sale' ? '#FFF7ED' : '#EFF6FF',
              color: property.listing_type === 'sale' ? '#D97706' : '#2563EB',
            }}>
              {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
            </span>
            {property.is_featured && (
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: '#FEF9C3', color: '#A16207',
              }}>
                ⭐ Featured
              </span>
            )}
          </div>

          {/* Top right: action buttons + close */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
            {!isAgent && mode === 'view' && (
              <>
                <button
                  onClick={() => setMode('edit')}
                  title="Edit Property"
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.8)',
                    background: 'rgba(255,255,255,0.9)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <Pencil size={14} color="#2563EB" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete Property"
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.8)',
                    background: 'rgba(255,255,255,0.9)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <Trash2 size={14} color="#DC2626" />
                </button>
              </>
            )}
            <button
              onClick={() => mode === 'edit' ? setMode('view') : onClose()}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.8)',
                background: 'rgba(255,255,255,0.9)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} color="#374151" />
            </button>
          </div>
        </div>

        {/* ── Delete Confirm Banner ── */}
        {showDeleteConfirm && (
          <div style={{
            background: '#FEF2F2', borderBottom: '1px solid #FECACA',
            padding: '12px 24px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>
              🗑️ Are you sure you want to delete this property?
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: '1px solid #E2E8F0',
                  background: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', color: '#374151', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProperty.mutate()}
                disabled={deleteProperty.isPending}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none',
                  background: '#DC2626', color: '#fff', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: deleteProperty.isPending ? 0.7 : 1,
                }}
              >
                {deleteProperty.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* ════════ VIEW MODE ════════ */}
          {mode === 'view' && (
            <>
              {/* Title + Price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                    {property.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13 }}>
                    <MapPin size={13} />
                    {[property.area, property.city].filter(Boolean).join(', ') || 'Location not set'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#2563EB' }}>
                    {property.price ? formatCurrency(property.price) : 'Price on Request'}
                  </div>
                  {property.area_sqft && property.price && (
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>
                      ₹{Math.round(property.price / property.area_sqft).toLocaleString('en-IN')}/sqft
                    </div>
                  )}
                </div>
              </div>

              {/* Status change — agency admin only */}
              {!isAgent && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    Update Status
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {Object.entries(PROPERTY_STATUS_CONFIG).map(([status, cfg]) => {
                      const isActive = localStatus === status
                      return (
                        <button key={status}
                          onClick={() => !isActive && updateStatus.mutate(status)}
                          disabled={updateStatus.isPending}
                          style={{
                            flex: 1, padding: '8px', borderRadius: 8,
                            border: `1.5px solid ${isActive ? cfg.color : '#E2E8F0'}`,
                            background: isActive ? cfg.bg : '#fff',
                            color: isActive ? cfg.color : '#94A3B8',
                            fontSize: 12, fontWeight: isActive ? 700 : 500,
                            cursor: isActive ? 'default' : 'pointer',
                            transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Key details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { icon: '🛏',  label: 'Bedrooms',  value: property.bedrooms   || '—' },
                  { icon: '🚿',  label: 'Bathrooms', value: property.bathrooms  || '—' },
                  { icon: '📐',  label: 'Area',      value: property.area_sqft  ? `${property.area_sqft} sqft` : '—' },
                  { icon: '🏗️', label: 'Floor',     value: property.floor && property.total_floors ? `${property.floor}/${property.total_floors}` : (property.floor || '—') },
                  { icon: '📅',  label: 'Built',     value: property.built_year || '—' },
                  { icon: '🛋️', label: 'Furnished', value: property.is_furnished ? 'Yes' : 'No' },
                  { icon: '📍',  label: 'Pincode',   value: property.pincode    || '—' },
                  { icon: '🔑',  label: 'Type',      value: property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : '—' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: '#F8FAFC', border: '1px solid #F1F5F9', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {property.description && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    Description
                  </div>
                  <p style={{
                    fontSize: 14, color: '#374151', lineHeight: 1.7,
                    background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', margin: 0,
                  }}>
                    {property.description}
                  </p>
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                    Amenities ({amenities.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {amenities.map(a => (
                      <span key={a} style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                        background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE',
                      }}>
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontSize: 12, color: '#94A3B8', paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                Property ID #{property.id} · Added by {property.created_by?.name || 'Unknown'} · {formatDate(property.created_at)}
              </div>
            </>
          )}

          {/* ════════ EDIT MODE ════════ */}
          {mode === 'edit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>
                Basic Information
              </div>

              <Input label="Property Title *" value={form.title}
                onChange={e => set('title', e.target.value)} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} style={selectStyle}>
                    <option value="apartment">🏢 Apartment</option>
                    <option value="villa">🏡 Villa</option>
                    <option value="plot">🗺️ Plot</option>
                    <option value="commercial">🏬 Commercial</option>
                    <option value="office">🏛️ Office</option>
                    <option value="warehouse">🏭 Warehouse</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Listing Type</label>
                  <select value={form.listing_type} onChange={e => set('listing_type', e.target.value)} style={selectStyle}>
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status || localStatus} onChange={e => set('status', e.target.value)} style={selectStyle}>
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                    <option value="off_market">Off Market</option>
                  </select>
                </div>
                <Input label="Price (₹)" type="number" value={form.price}
                  onChange={e => set('price', e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={3} placeholder="Describe the property..."
                  style={{
                    width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
                    padding: '10px 12px', fontSize: 14, color: '#0F172A',
                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>

              {/* Location */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                Location
              </div>
              <Input label="Address" value={form.address} onChange={e => set('address', e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} />
                <Input label="Area" value={form.area} onChange={e => set('area', e.target.value)} />
              </div>
              <Input label="Pincode" value={form.pincode} onChange={e => set('pincode', e.target.value)} />

              {/* Property details */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                Property Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <Input label="Bedrooms"  type="number" value={form.bedrooms}  onChange={e => set('bedrooms', e.target.value)} />
                <Input label="Bathrooms" type="number" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
                <Input label="Area sqft" type="number" value={form.area_sqft} onChange={e => set('area_sqft', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <Input label="Floor"        type="number" value={form.floor}        onChange={e => set('floor', e.target.value)} />
                <Input label="Total Floors" type="number" value={form.total_floors} onChange={e => set('total_floors', e.target.value)} />
                <Input label="Built Year"   type="number" value={form.built_year}   onChange={e => set('built_year', e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  { key: 'is_furnished', label: '🛋️ Furnished' },
                  { key: 'is_featured',  label: '⭐ Featured' },
                ].map(cb => (
                  <label key={cb.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151' }}>
                    <input type="checkbox" checked={form[cb.key] || false}
                      onChange={e => set(cb.key, e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }}
                    />
                    {cb.label}
                  </label>
                ))}
              </div>

              {/* Amenities */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                Amenities
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AMENITIES_LIST.map(a => {
                  const selected = (form.amenities || []).includes(a)
                  return (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)} style={{
                      padding: '6px 14px', borderRadius: 20, border: '1px solid',
                      fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      borderColor: selected ? '#2563EB' : '#E2E8F0',
                      background: selected ? '#EFF6FF' : '#fff',
                      color: selected ? '#2563EB' : '#64748B',
                      fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                    }}>
                      {selected ? '✓ ' : ''}{a}
                    </button>
                  )
                })}
              </div>

            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            {mode === 'edit' ? '✏️ Editing property' : `ID #${property.id} · ${formatDate(property.created_at)}`}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {mode === 'edit' ? (
              <>
                <Button variant="secondary" onClick={() => setMode('view')}>Cancel</Button>
                <Button
                  onClick={() => saveEdit.mutate(form)}
                  loading={saveEdit.isPending}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                {!isAgent && (
                  <Button
                    variant="secondary"
                    onClick={() => setMode('edit')}
                    icon={<Pencil size={14} />}
                  >
                    Edit
                  </Button>
                )}
                <Button variant="secondary" onClick={onClose}>Close</Button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}