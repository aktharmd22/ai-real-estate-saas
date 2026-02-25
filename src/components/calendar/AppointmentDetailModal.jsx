import { useState } from 'react'
import { X, Pencil, Trash2, Clock, MapPin, Link, User, Tag } from 'lucide-react'
import Button from '../ui/Button'
import AppointmentModal from './AppointmentModal'

const TYPE_CONFIG = {
  site_visit: { label: 'Site Visit', color: '#2563EB', bg: '#EFF6FF', icon: '🏠' },
  call:       { label: 'Call',       color: '#059669', bg: '#ECFDF5', icon: '📞' },
  meeting:    { label: 'Meeting',    color: '#7C3AED', bg: '#F5F3FF', icon: '🤝' },
  follow_up:  { label: 'Follow Up', color: '#D97706', bg: '#FFF7ED', icon: '🔔' },
  other:      { label: 'Other',     color: '#64748B', bg: '#F1F5F9', icon: '📌' },
}

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: '#2563EB', bg: '#EFF6FF' },
  completed: { label: 'Completed', color: '#059669', bg: '#ECFDF5' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2' },
  no_show:   { label: 'No Show',  color: '#D97706', bg: '#FFF7ED' },
}

function formatDatetime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export default function AppointmentDetailModal({
  appointment, isAgent, onClose, onEdit, onDelete, onStatusChange
}) {
  const [showEdit, setShowEdit]         = useState(false)
  const [showDeleteConfirm, setDelConf] = useState(false)
  const [appt, setAppt]                 = useState(appointment)

  const typeCfg   = TYPE_CONFIG[appt.type]     || TYPE_CONFIG.other
  const statusCfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled

  // Duration in minutes
  const durationMins = appt.starts_at && appt.ends_at
    ? Math.round((new Date(appt.ends_at) - new Date(appt.starts_at)) / 60000)
    : null

  const nextStatuses = {
    scheduled: ['completed', 'cancelled', 'no_show'],
    completed: ['scheduled'],
    cancelled: ['scheduled'],
    no_show:   ['scheduled'],
  }

  if (showEdit) {
    return (
      <AppointmentModal
        appointment={appt}
        isAgent={isAgent}
        onClose={() => setShowEdit(false)}
        onSaved={(updated) => {
          if (updated) setAppt(updated)
          setShowEdit(false)
          onEdit(updated || appt)
        }}
      />
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* Coloured header band */}
        <div style={{
          padding: '20px 24px',
          background: `linear-gradient(135deg, ${typeCfg.bg}, #fff)`,
          borderBottom: '1px solid #E2E8F0',
          borderRadius: '20px 20px 0 0',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* Type icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: typeCfg.bg, border: `2px solid ${typeCfg.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {typeCfg.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                  {appt.title}
                </h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 700,
                    background: typeCfg.bg, color: typeCfg.color,
                    border: `1px solid ${typeCfg.color}25`,
                  }}>
                    {typeCfg.label}
                  </span>
                  <span style={{
                    fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 700,
                    background: statusCfg.bg, color: statusCfg.color,
                  }}>
                    {statusCfg.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {!isAgent && (
                <>
                  <button
                    onClick={() => setShowEdit(true)}
                    title="Edit"
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
                      background: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Pencil size={14} color="#2563EB" />
                  </button>
                  <button
                    onClick={() => setDelConf(true)}
                    title="Delete"
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: '1px solid #FECACA',
                      background: '#FEF2F2', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={14} color="#DC2626" />
                  </button>
                </>
              )}
              <button onClick={onClose} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
                background: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={16} color="#64748B" />
              </button>
            </div>
          </div>
        </div>

        {/* Delete confirm banner */}
        {showDeleteConfirm && (
          <div style={{
            background: '#FEF2F2', borderBottom: '1px solid #FECACA',
            padding: '10px 24px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>
              🗑️ Delete this appointment?
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDelConf(false)} style={{
                padding: '5px 14px', borderRadius: 7, border: '1px solid #E2E8F0',
                background: '#fff', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>Cancel</button>
              <button onClick={() => onDelete(appt.id)} style={{
                padding: '5px 14px', borderRadius: 7, border: 'none',
                background: '#DC2626', color: '#fff', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>Yes, Delete</button>
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Date + Time */}
            <InfoRow icon={<Clock size={14} color="#94A3B8" />} label="Date & Time">
              <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                {formatDatetime(appt.starts_at)}
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                {formatTime(appt.starts_at)} — {formatTime(appt.ends_at)}
                {durationMins && (
                  <span style={{ marginLeft: 8, color: '#94A3B8' }}>
                    ({durationMins < 60
                      ? `${durationMins} min`
                      : `${Math.floor(durationMins/60)}h ${durationMins%60 > 0 ? `${durationMins%60}m` : ''}`
                    })
                  </span>
                )}
              </div>
            </InfoRow>

            {appt.location && (
              <InfoRow icon={<MapPin size={14} color="#94A3B8" />} label="Location">
                <span style={{ fontSize: 14, color: '#374151' }}>{appt.location}</span>
              </InfoRow>
            )}

            {appt.meeting_link && (
              <InfoRow icon={<Link size={14} color="#94A3B8" />} label="Meeting Link">
                <a
                  href={appt.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 14, color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}
                >
                  {appt.meeting_link}
                </a>
              </InfoRow>
            )}

            {appt.assigned_to && (
              <InfoRow icon={<User size={14} color="#94A3B8" />} label="Assigned To">
                <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                  {appt.assigned_to.name}
                </span>
              </InfoRow>
            )}

            {(appt.lead || appt.property) && (
              <InfoRow icon={<Tag size={14} color="#94A3B8" />} label="Linked To">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {appt.lead && (
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: '#F5F3FF', color: '#7C3AED',
                    }}>
                      🎯 {appt.lead.name}
                      {appt.lead.phone && ` · ${appt.lead.phone}`}
                    </span>
                  )}
                  {appt.property && (
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: '#EFF6FF', color: '#2563EB',
                    }}>
                      🏠 {appt.property.title}
                    </span>
                  )}
                </div>
              </InfoRow>
            )}

            {appt.description && (
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: '#F8FAFC', border: '1px solid #F1F5F9',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  Description
                </div>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                  {appt.description}
                </p>
              </div>
            )}

            {appt.notes && (
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: '#FFFBEB', border: '1px solid #FDE68A',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  📝 Internal Notes
                </div>
                <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6, margin: 0 }}>
                  {appt.notes}
                </p>
              </div>
            )}

            {/* Quick status update */}
            {!isAgent && nextStatuses[appt.status]?.length > 0 && (
              <div style={{
                paddingTop: 16, borderTop: '1px solid #F1F5F9',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Quick Status Update
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {nextStatuses[appt.status].map(status => {
                    const sCfg = STATUS_CONFIG[status]
                    const icons = { completed: '✓', cancelled: '✕', no_show: '👻', scheduled: '↩' }
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          onStatusChange(appt.id, status)
                          setAppt(p => ({ ...p, status }))
                        }}
                        style={{
                          flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${sCfg.color}40`,
                          background: sCfg.bg, color: sCfg.color, fontSize: 12,
                          fontWeight: 700, cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                        }}
                      >
                        {icons[status]} Mark {sCfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            Appointment #{appt.id}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isAgent && (
              <Button variant="secondary" icon={<Pencil size={13} />} onClick={() => setShowEdit(true)}>
                Edit
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, children }) {
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 10,
      background: '#F8FAFC', border: '1px solid #F1F5F9',
    }}>
      <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 3 }}>
          {label}
        </div>
        {children}
      </div>
    </div>
  )
}