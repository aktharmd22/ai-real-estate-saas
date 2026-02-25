import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import api from '../../lib/axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell, TableEmpty } from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import { formatDate, getInitials } from '../../utils/helpers'
import CreateAgentModal from '../../components/agency/CreateAgentModal'

export default function AgentsPage() {
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['agents', search],
    queryFn: () => api.get('/agency/users', { params: { search, role: 'agent' } }).then(r => r.data),
  })

  const toggleStatus = useMutation({
    mutationFn: (id) => api.patch(`/agency/users/${id}/toggle-status`),
    onSuccess: () => qc.invalidateQueries(['agents']),
  })

  const agents = data?.data || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Team Members</h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0' }}>
            {data?.meta?.total || 0} agents in your agency
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setShowModal(true)}>
          Add Agent
        </Button>
      </div>

      <Card padding={false}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Search size={15} color="#94A3B8" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents..."
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: '#0F172A', flex: 1,
            }}
          />
        </div>

        <Table>
          <TableHead>
            <TableHeader>Agent</TableHeader>
            <TableHeader>Email</TableHeader>
            <TableHeader>Phone</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Joined</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableHead>
          <TableBody>
            {isLoading && <TableEmpty message="Loading..." colSpan={6} />}
            {!isLoading && agents.length === 0 && (
              <TableEmpty message="No agents yet. Add your first agent." colSpan={6} />
            )}
            {agents.map(agent => (
              <TableRow key={agent.id}>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: '#fff', fontWeight: 700, flexShrink: 0,
                    }}>
                      {getInitials(agent.name)}
                    </div>
                    <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                      {agent.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{agent.email}</TableCell>
                <TableCell>{agent.phone || '—'}</TableCell>
                <TableCell>
                  <Badge
                    color={agent.status === 'active' ? '#059669' : '#DC2626'}
                    bg={agent.status === 'active' ? '#ECFDF5' : '#FEF2F2'}
                  >
                    {agent.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(agent.created_at)}</TableCell>
                <TableCell>
                  <button
                    onClick={() => toggleStatus.mutate(agent.id)}
                    style={{
                      padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', border: '1px solid',
                      borderColor: agent.status === 'active' ? '#FECACA' : '#A7F3D0',
                      color: agent.status === 'active' ? '#DC2626' : '#059669',
                      background: agent.status === 'active' ? '#FEF2F2' : '#ECFDF5',
                    }}
                  >
                    {agent.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {showModal && <CreateAgentModal onClose={() => setShowModal(false)} />}
    </div>
  )
}