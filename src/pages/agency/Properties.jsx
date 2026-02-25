import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, LayoutGrid, List, Home, Building2 } from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell, TableEmpty } from '../../components/ui/Table'
import { formatCurrency, formatDate } from '../../utils/helpers'
import CreatePropertyModal from '../../components/properties/CreatePropertyModal'
import PropertyDetailModal from '../../components/properties/PropertyDetailModal'

const PROPERTY_STATUS_CONFIG = {
  available:  { label: 'Available',  color: '#059669', bg: '#ECFDF5' },
  sold:       { label: 'Sold',       color: '#DC2626', bg: '#FEF2F2' },
  rented:     { label: 'Rented',     color: '#7C3AED', bg: '#F5F3FF' },
  off_market: { label: 'Off Market', color: '#64748B', bg: '#F1F5F9' },
}

const PROPERTY_TYPE_ICONS = {
  apartment:  '🏢',
  villa:      '🏡',
  plot:       '🗺️',
  commercial: '🏬',
  office:     '🏛️',
  warehouse:  '🏭',
}

export default function PropertiesPage() {
  const { user }  = useAuthStore()
  const isAgent   = user?.role === 'agent'
  const apiBase   = isAgent ? '/agent' : '/agency'
  const qc        = useQueryClient()

  const [view, setView]             = useState('grid')
  const [search, setSearch]         = useState('')
  const [typeFilter, setType]       = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [listingFilter, setListing] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected]     = useState(null)

  // Stats
  const { data: statsData } = useQuery({
    queryKey: ['property-stats', apiBase],
    queryFn: () => api.get(`${apiBase}/properties/stats`).then(r => r.data.data),
  })

  // Properties list
  const { data, isLoading } = useQuery({
    queryKey: ['properties', apiBase, search, typeFilter, statusFilter, listingFilter],
    queryFn: () => api.get(`${apiBase}/properties`, {
      params: {
        search,
        type: typeFilter,
        status: statusFilter,
        listing_type: listingFilter,
        per_page: 12,
      }
    }).then(r => r.data),
  })

  const properties = data?.data || []
  const stats      = statsData  || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Properties</h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
            {data?.meta?.total || 0} properties in your portfolio
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3, gap: 2 }}>
            {[{ id: 'grid', icon: LayoutGrid }, { id: 'table', icon: List }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{
                padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                background: view === v.id ? '#fff' : 'transparent',
                color: view === v.id ? '#2563EB' : '#64748B',
                boxShadow: view === v.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}>
                <v.icon size={15} />
              </button>
            ))}
          </div>
          {!isAgent && (
            <Button icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
              Add Property
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {[
          { label: 'Total',     value: stats.total     || 0, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Available', value: stats.available || 0, color: '#059669', bg: '#ECFDF5' },
          { label: 'Sold',      value: stats.sold      || 0, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Rented',    value: stats.rented    || 0, color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'For Sale',  value: stats.for_sale  || 0, color: '#D97706', bg: '#FFF7ED' },
          { label: 'For Rent',  value: stats.for_rent  || 0, color: '#0891B2', bg: '#ECFEFF' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #E2E8F0', padding: '14px 16px',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0',
        padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <Search size={14} color="#94A3B8" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, city or area..."
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: '#0F172A', flex: 1,
            }}
          />
        </div>
        {[
          {
            value: typeFilter, onChange: setType,
            placeholder: 'All Types',
            options: [
              { value: 'apartment', label: '🏢 Apartment' },
              { value: 'villa',     label: '🏡 Villa' },
              { value: 'plot',      label: '🗺️ Plot' },
              { value: 'commercial',label: '🏬 Commercial' },
              { value: 'office',    label: '🏛️ Office' },
              { value: 'warehouse', label: '🏭 Warehouse' },
            ],
          },
          {
            value: statusFilter, onChange: setStatus,
            placeholder: 'All Statuses',
            options: Object.entries(PROPERTY_STATUS_CONFIG).map(([k, v]) => ({
              value: k, label: v.label,
            })),
          },
          {
            value: listingFilter, onChange: setListing,
            placeholder: 'Sale & Rent',
            options: [
              { value: 'sale', label: 'For Sale' },
              { value: 'rent', label: 'For Rent' },
            ],
          },
        ].map((f, i) => (
          <select key={i} value={f.value} onChange={e => f.onChange(e.target.value)} style={{
            border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 12px',
            fontSize: 13, color: '#374151', background: '#fff',
            outline: 'none', cursor: 'pointer',
          }}>
            <option value="">{f.placeholder}</option>
            {f.options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}
      </div>

      {/* GRID VIEW */}
      {view === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {isLoading && [1,2,3,4,5,6].map(i => (
            <div key={i} style={{
              height: 280, borderRadius: 16, background: '#F8FAFC',
              border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite',
            }} />
          ))}

          {!isLoading && properties.length === 0 && (
            <div style={{
              gridColumn: '1/-1', textAlign: 'center', padding: '60px 0',
              color: '#94A3B8', fontSize: 14,
            }}>
              <Home size={40} color="#E2E8F0" style={{ marginBottom: 12 }} />
              <div>No properties found.</div>
              {!isAgent && (
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    marginTop: 12, padding: '8px 20px', borderRadius: 8,
                    background: '#2563EB', color: '#fff', border: 'none',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Add First Property
                </button>
              )}
            </div>
          )}

          {properties.map(property => {
            const statusCfg = PROPERTY_STATUS_CONFIG[property.status] || PROPERTY_STATUS_CONFIG.available
            const typeIcon  = PROPERTY_TYPE_ICONS[property.type] || '🏠'
            return (
              <div
                key={property.id}
                onClick={() => setSelected(property)}
                style={{
                  background: '#fff', borderRadius: 16,
                  border: '1px solid #E2E8F0', overflow: 'hidden',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Cover image / placeholder */}
                <div style={{
                  height: 160, background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {property.cover_image ? (
                    <img
                      src={property.cover_image}
                      alt={property.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: 48 }}>{typeIcon}</span>
                  )}

                  {/* Status badge overlay */}
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    padding: '3px 10px', borderRadius: 20,
                    background: statusCfg.bg, color: statusCfg.color,
                    fontSize: 11, fontWeight: 700,
                    border: `1px solid ${statusCfg.color}30`,
                  }}>
                    {statusCfg.label}
                  </div>

                  {/* Listing type badge */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    padding: '3px 10px', borderRadius: 20,
                    background: property.listing_type === 'sale' ? '#FFF7ED' : '#EFF6FF',
                    color: property.listing_type === 'sale' ? '#D97706' : '#2563EB',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                  </div>

                  {property.is_featured && (
                    <div style={{
                      position: 'absolute', bottom: 10, left: 10,
                      padding: '2px 8px', borderRadius: 20,
                      background: '#FEF9C3', color: '#A16207',
                      fontSize: 10, fontWeight: 700,
                    }}>
                      ⭐ Featured
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                    {property.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 10 }}>
                    📍 {[property.area, property.city].filter(Boolean).join(', ') || '—'}
                  </div>

                  {/* Price */}
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#2563EB', marginBottom: 10 }}>
                    {property.price ? formatCurrency(property.price) : 'Price on Request'}
                  </div>

                  {/* Details row */}
                  <div style={{
                    display: 'flex', gap: 12, fontSize: 12, color: '#64748B',
                    paddingTop: 10, borderTop: '1px solid #F1F5F9',
                  }}>
                    {property.bedrooms && (
                      <span>🛏 {property.bedrooms} Bed</span>
                    )}
                    {property.bathrooms && (
                      <span>🚿 {property.bathrooms} Bath</span>
                    )}
                    {property.area_sqft && (
                      <span>📐 {property.area_sqft} sqft</span>
                    )}
                    {!property.bedrooms && !property.bathrooms && !property.area_sqft && (
                      <span style={{ color: '#CBD5E1' }}>No details added</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {view === 'table' && (
        <Card padding={false}>
          <Table>
            <TableHead>
              <TableHeader>Property</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Listing</TableHeader>
              <TableHeader>Price</TableHeader>
              <TableHeader>Location</TableHeader>
              <TableHeader>Details</TableHeader>
              <TableHeader>Added</TableHeader>
            </TableHead>
            <TableBody>
              {isLoading && <TableEmpty message="Loading properties..." colSpan={8} />}
              {!isLoading && properties.length === 0 && (
                <TableEmpty message="No properties found." colSpan={8} />
              )}
              {properties.map(property => {
                const statusCfg = PROPERTY_STATUS_CONFIG[property.status] || PROPERTY_STATUS_CONFIG.available
                const typeIcon  = PROPERTY_TYPE_ICONS[property.type] || '🏠'
                return (
                  <TableRow key={property.id} onClick={() => setSelected(property)}>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                        {property.title}
                      </div>
                      {property.is_featured && (
                        <span style={{ fontSize: 10, color: '#A16207' }}>⭐ Featured</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: 14 }}>{typeIcon}</span>{' '}
                      <span style={{ fontSize: 13, color: '#374151', textTransform: 'capitalize' }}>
                        {property.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge color={statusCfg.color} bg={statusCfg.bg}>
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: property.listing_type === 'sale' ? '#FFF7ED' : '#EFF6FF',
                        color: property.listing_type === 'sale' ? '#D97706' : '#2563EB',
                      }}>
                        {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#2563EB' }}>
                        {property.price ? formatCurrency(property.price) : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: 13, color: '#374151' }}>
                        {[property.area, property.city].filter(Boolean).join(', ') || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: 12, color: '#64748B' }}>
                        {[
                          property.bedrooms  ? `${property.bedrooms} bed`   : null,
                          property.bathrooms ? `${property.bathrooms} bath` : null,
                          property.area_sqft ? `${property.area_sqft} sqft` : null,
                        ].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(property.created_at)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modals */}
      {showCreate && (
        <CreatePropertyModal onClose={() => setShowCreate(false)} />
      )}
      {selected && (
        <PropertyDetailModal
          property={selected}
          apiBase={apiBase}
          isAgent={isAgent}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}