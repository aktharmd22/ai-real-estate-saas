import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '../../lib/axios'
import Button from '../ui/Button'
import Input from '../ui/Input'

const AMENITIES_LIST = [
  'Parking', 'Gym', 'Swimming Pool', 'Security', 'Lift',
  'Power Backup', 'Garden', 'Club House', 'CCTV', 'WiFi',
  'Intercom', 'Water Supply', 'Gas Pipeline', 'Balcony', 'Terrace',
]

export default function CreatePropertyModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '', description: '', type: 'apartment', status: 'available',
    listing_type: 'sale', price: '', price_unit: 'total',
    address: '', city: '', area: '', pincode: '',
    bedrooms: '', bathrooms: '', area_sqft: '',
    floor: '', total_floors: '', built_year: '',
    is_furnished: false, is_featured: false,
    amenities: [],
  })
  const [errors, setErrors] = useState({})

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const toggleAmenity = (a) => {
    setForm(p => ({
      ...p,
      amenities: p.amenities.includes(a)
        ? p.amenities.filter(x => x !== a)
        : [...p.amenities, a],
    }))
  }

  const create = useMutation({
    mutationFn: (data) => api.post('/agency/properties', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: ['property-stats'] })
      onClose()
    },
    onError: (err) => setErrors(err.response?.data?.errors || {}),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    const cleaned = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    )
    create.mutate(cleaned)
  }

  const selectStyle = {
    border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px',
    fontSize: 14, color: '#0F172A', background: '#fff', outline: 'none',
    cursor: 'pointer', width: '100%', fontFamily: "'DM Sans', sans-serif",
  }

  const labelStyle = {
    fontSize: 13, fontWeight: 600, color: '#374151',
    marginBottom: 6, display: 'block',
  }

  const sectionLabel = {
    fontSize: 11, fontWeight: 700, color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 14, paddingTop: 20,
    borderTop: '1px solid #F1F5F9',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        maxHeight: '92vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
          borderRadius: '20px 20px 0 0',
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Add New Property
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
              Fill in property details to add to your portfolio
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

          {/* Basic Info */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Basic Information
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
            <Input label="Property Title *" placeholder="3BHK Apartment in Bandra West"
              value={form.title} onChange={e => set('title', e.target.value)}
              error={errors.title?.[0]} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Property Type *</label>
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
                <label style={labelStyle}>Listing Type *</label>
                <select value={form.listing_type} onChange={e => set('listing_type', e.target.value)} style={selectStyle}>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                  <option value="off_market">Off Market</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Price (₹)</label>
                <input
                  type="number"
                  placeholder="5000000"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  style={{ ...selectStyle, border: errors.price ? '1px solid #FCA5A5' : '1px solid #E2E8F0' }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe the property..."
                rows={3}
                style={{
                  width: '100%', border: '1px solid #E2E8F0', borderRadius: 8,
                  padding: '10px 12px', fontSize: 14, color: '#0F172A',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Location */}
          <div style={sectionLabel}>Location</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
            <Input label="Full Address" placeholder="123 MG Road, Bandra West"
              value={form.address} onChange={e => set('address', e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="City" placeholder="Mumbai"
                value={form.city} onChange={e => set('city', e.target.value)} />
              <Input label="Area / Locality" placeholder="Bandra West"
                value={form.area} onChange={e => set('area', e.target.value)} />
            </div>
            <Input label="Pincode" placeholder="400050"
              value={form.pincode} onChange={e => set('pincode', e.target.value)} />
          </div>

          {/* Property Details */}
          <div style={sectionLabel}>Property Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <Input label="Bedrooms" type="number" placeholder="3"
                value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} />
              <Input label="Bathrooms" type="number" placeholder="2"
                value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
              <Input label="Area (sqft)" type="number" placeholder="1200"
                value={form.area_sqft} onChange={e => set('area_sqft', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <Input label="Floor No." type="number" placeholder="5"
                value={form.floor} onChange={e => set('floor', e.target.value)} />
              <Input label="Total Floors" type="number" placeholder="12"
                value={form.total_floors} onChange={e => set('total_floors', e.target.value)} />
              <Input label="Built Year" type="number" placeholder="2020"
                value={form.built_year} onChange={e => set('built_year', e.target.value)} />
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { key: 'is_furnished', label: '🛋️ Furnished' },
                { key: 'is_featured',  label: '⭐ Featured Listing' },
              ].map(cb => (
                <label key={cb.key} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', fontSize: 14, color: '#374151', fontWeight: 500,
                }}>
                  <input
                    type="checkbox"
                    checked={form[cb.key]}
                    onChange={e => set(cb.key, e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }}
                  />
                  {cb.label}
                </label>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div style={sectionLabel}>Amenities</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {AMENITIES_LIST.map(a => {
              const selected = form.amenities.includes(a)
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: '1px solid',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    borderColor: selected ? '#2563EB' : '#E2E8F0',
                    background: selected ? '#EFF6FF' : '#fff',
                    color: selected ? '#2563EB' : '#64748B',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.15s',
                  }}
                >
                  {selected ? '✓ ' : ''}{a}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'flex-end',
            paddingTop: 20, borderTop: '1px solid #F1F5F9',
          }}>
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Add Property</Button>
          </div>

        </form>
      </div>
    </div>
  )
}