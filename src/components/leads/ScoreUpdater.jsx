import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/axios'
import Button from '../ui/Button'

export default function ScoreUpdater({ lead, apiBase, onUpdate }) {
  const [score, setScore] = useState(lead.score || 0)

  const update = useMutation({
    mutationFn: (val) => api.put(`${apiBase}/leads/${lead.id}`, { score: val }),
    onSuccess: () => onUpdate(),
  })

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      background: '#F8FAFC', border: '1px solid #F1F5F9',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
      }}>
        <div style={{ fontSize: 11, color: '#94A3B8' }}>Lead Score</div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444',
        }}>
          {score}/100
        </div>
      </div>

      {/* Score bar */}
      <div style={{ background: '#E2E8F0', borderRadius: 999, height: 8, marginBottom: 10 }}>
        <div style={{
          height: '100%', borderRadius: 999, transition: 'width 0.3s',
          width: `${score}%`,
          background: score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444',
        }} />
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={100}
        value={score}
        onChange={e => setScore(Number(e.target.value))}
        style={{ width: '100%', marginBottom: 10, cursor: 'pointer' }}
      />

      {/* Quick score buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[
          { label: 'Cold',   value: 20, color: '#EF4444', bg: '#FEF2F2' },
          { label: 'Warm',   value: 50, color: '#F59E0B', bg: '#FFF7ED' },
          { label: 'Hot',    value: 80, color: '#10B981', bg: '#ECFDF5' },
          { label: 'Closed', value: 100, color: '#2563EB', bg: '#EFF6FF' },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={() => setScore(btn.value)}
            style={{
              flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid',
              borderColor: score === btn.value ? btn.color : '#E2E8F0',
              background: score === btn.value ? btn.bg : '#fff',
              color: score === btn.value ? btn.color : '#64748B',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <Button
        size="sm"
        onClick={() => update.mutate(score)}
        loading={update.isPending}
        disabled={score === (lead.score || 0)}
      >
        Save Score
      </Button>
    </div>
  )
}