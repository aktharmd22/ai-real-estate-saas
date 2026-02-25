import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, MoreHorizontal, Building2 } from 'lucide-react'
import api from '../../lib/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell, TableEmpty } from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import { formatDate } from '../../utils/helpers'
import CreateAgencyModal from '../../components/agency/CreateAgencyModal'

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#059669', bg: '#ECFDF5' },
  trial:     { label: 'Trial',     color: '#D97706', bg: '#FFF7ED' },
  suspended: { label: 'Suspended', color: '#DC2626', bg: '#FEF2F2' },
}

export default function AgenciesPage() {
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['agencies', search],
    queryFn: () => api.get('/super-admin/agencies', { params: { search } }).then(r => r.data),
  })

  const toggleStatus = useMutation({
    mutationFn: (id) => api.patch(`/super-admin/agencies/${id}/toggle-status`),
    onSuccess: () => qc.invalidateQueries(['agencies']),
  })

  const agencies = data?.data || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Agencies</h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
            {data?.meta?.total || 0} total agencies on the platform
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setShowModal(true)}>
          New Agency
        </Button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total',     value: data?.meta?.total || 0,  color: '#2563EB', bg: '#EFF6FF', icon: '🏢' },
          { label: 'Active',    value: agencies.filter(a => a.status === 'active').length,    color: '#059669', bg: '#ECFDF5', icon: '✅' },
          { label: 'Trial',     value: agencies.filter(a => a.status === 'trial').length,     color: '#D97706', bg: '#FFF7ED', icon: '⏳' },
          { label: 'Suspended', value: agencies.filter(a => a.status === 'suspended').length, color: '#DC2626', bg: '#FEF2F2', icon: '🚫' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0',
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: stat.bg, flexShrink: 0,
            }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <Card padding={false}>
        {/* Search bar */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Search size={15} color="#94A3B8" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agencies by name or email..."
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: '#0F172A', flex: 1,
            }}
          />
        </div>

        <Table>
          <TableHead>
            <TableHeader>Agency</TableHeader>
            <TableHeader>Admin Email</TableHeader>
            <TableHeader>Plan</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Agents</TableHeader>
            <TableHeader>Created</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell className="text-center py-16 text-slate-400" style={{ gridColumn: '1/-1' }}>
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && agencies.length === 0 && (
              <TableEmpty message="No agencies found" colSpan={7} />
            )}
            {agencies.map(agency => {
              const status = STATUS_CONFIG[agency.status] || STATUS_CONFIG.trial
              return (
                <TableRow key={agency.id}>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: '#fff', fontWeight: 700, flexShrink: 0,
                      }}>
                        {agency.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{agency.name}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{agency.city}, {agency.country}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{agency.email}</TableCell>
                  <TableCell>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                      {agency.subscription?.plan?.name || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge color={status.color} bg={status.bg}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>
                      {agency.users_count || 0}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(agency.created_at)}</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => toggleStatus.mutate(agency.id)}
                        style={{
                          padding: '4px 12px', borderRadius: 6, fontSize: 12,
                          fontWeight: 600, cursor: 'pointer', border: '1px solid',
                          borderColor: agency.status === 'active' ? '#FECACA' : '#A7F3D0',
                          color: agency.status === 'active' ? '#DC2626' : '#059669',
                          background: agency.status === 'active' ? '#FEF2F2' : '#ECFDF5',
                        }}
                      >
                        {agency.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {showModal && <CreateAgencyModal onClose={() => setShowModal(false)} />}
    </div>
  )
}