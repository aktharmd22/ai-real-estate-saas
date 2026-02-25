import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, LayoutGrid, List } from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell, TableEmpty } from '../../components/ui/Table'
import { formatDate, formatCurrency, LEAD_STATUS_CONFIG } from '../../utils/helpers'
import CreateLeadModal from '../../components/leads/CreateLeadModal'
import LeadDetailModal from '../../components/leads/LeadDetailModal'

export default function LeadsPage() {
  const [view, setView]             = useState('table')
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedLead, setSelected] = useState(null)
  const qc = useQueryClient()

  // ─── Detect role → choose correct API base ───────────────────────────────
  const { user } = useAuthStore()
  const isAgent  = user?.role === 'agent'
  const apiBase  = isAgent ? '/agent' : '/agency'

  // ─── Stats ───────────────────────────────────────────────────────────────
  const { data: statsData } = useQuery({
    queryKey: ['lead-stats', apiBase],
    queryFn: () => api.get(`${apiBase}/leads/stats`).then(r => r.data.data),
  })

  // ─── Leads list ──────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['leads', apiBase, search, statusFilter],
    queryFn: () => api.get(`${apiBase}/leads`, {
      params: { search, status: statusFilter, per_page: 20 }
    }).then(r => r.data),
  })

  // ─── Kanban data ─────────────────────────────────────────────────────────
  const { data: kanbanData } = useQuery({
    queryKey: ['leads-kanban', apiBase],
    queryFn: () => api.get(`${apiBase}/leads/kanban`).then(r => r.data.data),
    enabled: view === 'kanban',
  })

  // ─── Update status mutation ───────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`${apiBase}/leads/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['leads'])
      qc.invalidateQueries(['leads-kanban'])
      qc.invalidateQueries(['lead-stats'])
    },
  })

  const leads = data?.data || []
  const stats = statsData || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>
            {isAgent ? 'My Leads' : 'Leads'}
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
            {data?.meta?.total || 0} {isAgent ? 'leads assigned to you' : 'total leads in your pipeline'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* View toggle */}
          <div style={{
            display: 'flex', background: '#F1F5F9',
            borderRadius: 8, padding: 3, gap: 2,
          }}>
            {[
              { id: 'table',  icon: List },
              { id: 'kanban', icon: LayoutGrid },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{
                padding: '6px 10px', borderRadius: 6, border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                background: view === v.id ? '#fff' : 'transparent',
                color: view === v.id ? '#2563EB' : '#64748B',
                boxShadow: view === v.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}>
                <v.icon size={15} />
              </button>
            ))}
          </div>

          <Button icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
            New Lead
          </Button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {[
          { label: 'Total',      value: stats.total      || 0, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'New',        value: stats.new        || 0, color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Qualified',  value: stats.qualified  || 0, color: '#059669', bg: '#ECFDF5' },
          { label: 'Closed',     value: stats.closed     || 0, color: '#065F46', bg: '#ECFDF5' },
          { label: 'Lost',       value: stats.lost       || 0, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'This Month', value: stats.this_month || 0, color: '#D97706', bg: '#FFF7ED' },
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

      {/* ── TABLE VIEW ── */}
      {view === 'table' && (
        <Card padding={false}>
          {/* Filters */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <Search size={14} color="#94A3B8" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email or phone..."
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 14, color: '#0F172A', flex: 1,
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatus(e.target.value)}
              style={{
                border: '1px solid #E2E8F0', borderRadius: 8,
                padding: '6px 12px', fontSize: 13, color: '#374151',
                background: '#fff', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">All Statuses</option>
              {Object.entries(LEAD_STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <Table>
            <TableHead>
              <TableHeader>Lead</TableHeader>
              <TableHeader>Contact</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Budget</TableHeader>
              <TableHeader>Location</TableHeader>
              {!isAgent && <TableHeader>Assigned To</TableHeader>}
              <TableHeader>Score</TableHeader>
              <TableHeader>Created</TableHeader>
            </TableHead>
            <TableBody>
              {isLoading && <TableEmpty message="Loading leads..." colSpan={isAgent ? 7 : 8} />}
              {!isLoading && leads.length === 0 && (
                <TableEmpty
                  message={isAgent ? 'No leads assigned to you yet.' : 'No leads found. Create your first lead!'}
                  colSpan={isAgent ? 7 : 8}
                />
              )}
              {leads.map(lead => {
                const statusCfg = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.new
                return (
                  <TableRow key={lead.id} onClick={() => setSelected(lead)}>

                    {/* Name */}
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #2563EB20, #7C3AED20)',
                          border: '1px solid #E2E8F0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#2563EB',
                        }}>
                          {lead.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                            {lead.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                            via {lead.source}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div style={{ fontSize: 13 }}>
                        <div style={{ color: '#374151' }}>{lead.email || '—'}</div>
                        <div style={{ color: '#64748B', marginTop: 2 }}>{lead.phone || '—'}</div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge color={statusCfg.color} bg={statusCfg.bg}>
                        {statusCfg.label}
                      </Badge>
                    </TableCell>

                    {/* Budget */}
                    <TableCell>
                      <div style={{ fontSize: 13, color: '#374151' }}>
                        {lead.budget_min || lead.budget_max
                          ? `${lead.budget_min ? formatCurrency(lead.budget_min) : '?'} — ${lead.budget_max ? formatCurrency(lead.budget_max) : '?'}`
                          : '—'
                        }
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      <span style={{ fontSize: 13, color: '#374151' }}>
                        {lead.preferred_location || '—'}
                      </span>
                    </TableCell>

                    {/* Assigned To — hidden for agents */}
                    {!isAgent && (
                      <TableCell>
                        {lead.assigned_to ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, color: '#fff',
                            }}>
                              {lead.assigned_to.name?.charAt(0)}
                            </div>
                            <span style={{ fontSize: 13, color: '#374151' }}>
                              {lead.assigned_to.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>Unassigned</span>
                        )}
                      </TableCell>
                    )}

                    {/* Score */}
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 32, height: 6, borderRadius: 999,
                          background: '#F1F5F9', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 999,
                            width: `${lead.score}%`,
                            background: lead.score >= 70 ? '#10B981'
                              : lead.score >= 40 ? '#F59E0B' : '#EF4444',
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#64748B' }}>{lead.score}</span>
                      </div>
                    </TableCell>

                    {/* Created */}
                    <TableCell>{formatDate(lead.created_at)}</TableCell>

                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ── KANBAN VIEW ── */}
      {view === 'kanban' && (
        <div style={{
          display: 'flex', gap: 16,
          overflowX: 'auto', paddingBottom: 8,
        }}>
          {Object.entries(LEAD_STATUS_CONFIG).map(([status, config]) => {
            const columnLeads = kanbanData?.[status] || []
            return (
              <div key={status} style={{
                minWidth: 260, maxWidth: 260,
                background: '#F8FAFC',
                borderRadius: 14, border: '1px solid #E2E8F0',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {/* Column header */}
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid #E2E8F0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#fff',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: config.color,
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      {config.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 20,
                    background: config.bg, color: config.color,
                  }}>
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{
                  padding: '10px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  maxHeight: 600, overflowY: 'auto', minHeight: 100,
                }}>
                  {columnLeads.length === 0 && (
                    <div style={{
                      padding: '20px 0', textAlign: 'center',
                      fontSize: 12, color: '#CBD5E1',
                    }}>
                      No leads
                    </div>
                  )}
                  {columnLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => setSelected(lead)}
                      style={{
                        background: '#fff', borderRadius: 10,
                        border: '1px solid #E2E8F0', padding: '12px 14px',
                        cursor: 'pointer', transition: 'all 0.15s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A', marginBottom: 6 }}>
                        {lead.name}
                      </div>
                      {lead.phone && (
                        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                          📞 {lead.phone}
                        </div>
                      )}
                      {lead.preferred_location && (
                        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                          📍 {lead.preferred_location}
                        </div>
                      )}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginTop: 8,
                      }}>
                        <span style={{
                          fontSize: 11, color: '#94A3B8',
                          background: '#F8FAFC', padding: '2px 8px',
                          borderRadius: 6, border: '1px solid #E2E8F0',
                        }}>
                          {lead.source}
                        </span>
                        {!isAgent && lead.assigned_to && (
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 700, color: '#fff',
                          }}>
                            {lead.assigned_to.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {showCreate && (
        <CreateLeadModal
          apiBase={apiBase}
          onClose={() => setShowCreate(false)}
        />
      )}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          apiBase={apiBase}
          onClose={() => setSelected(null)}
        />
      )}

    </div>
  )
}