import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Users, Mail, Shield, Trash2, Crown, Eye, PenTool, Megaphone } from 'lucide-react'
import { useTeam, useInviteTeamMember, useUpdateTeamMember, useRemoveTeamMember } from '../hooks/useTeam'
import { useAuthStore } from '../store/useAuthStore'
import { useUIStore } from '../store/useUIStore'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input, FormSelect } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { TEAM_ROLES } from '../lib/constants'
import { format } from 'date-fns'

const schema = z.object({
  email: z.string().email('Valid email required'),
  role: z.string().min(1, 'Select a role'),
})

const ROLE_ICONS = { owner: Crown, admin: Shield, sales_rep: Megaphone, copywriter: PenTool, viewer: Eye }
const ROLE_COLORS = { owner: '#f59e0b', admin: '#3b82f6', sales_rep: '#10b981', copywriter: '#8b5cf6', viewer: '#94a3b8' }

const PERMISSION_MATRIX = [
  { feature: 'Dashboard',        owner: true, admin: true,  sales_rep: true,  copywriter: false, viewer: true },
  { feature: 'Prospects & CRM',  owner: true, admin: true,  sales_rep: true,  copywriter: false, viewer: true },
  { feature: 'Clients',          owner: true, admin: true,  sales_rep: true,  copywriter: false, viewer: true },
  { feature: 'Outreach',         owner: true, admin: true,  sales_rep: true,  copywriter: false, viewer: false },
  { feature: 'Tasks',            owner: true, admin: true,  sales_rep: true,  copywriter: false, viewer: false },
  { feature: 'Scraper',          owner: true, admin: true,  sales_rep: false, copywriter: false, viewer: false },
  { feature: 'Copy Studio',      owner: true, admin: true,  sales_rep: false, copywriter: true,  viewer: false },
  { feature: 'Creative Studio',  owner: true, admin: true,  sales_rep: false, copywriter: true,  viewer: false },
  { feature: 'Niches',           owner: true, admin: true,  sales_rep: false, copywriter: false, viewer: false },
  { feature: 'Team',             owner: true, admin: false, sales_rep: false, copywriter: false, viewer: false },
  { feature: 'Settings',         owner: true, admin: true,  sales_rep: false, copywriter: false, viewer: false },
]

export default function Team() {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const { profile } = useAuthStore()
  const { data: members, isLoading } = useTeam()
  const { mutate: invite, isPending: inviting } = useInviteTeamMember()
  const { mutate: updateRole } = useUpdateTeamMember()
  const { mutate: removeMember, isPending: removing } = useRemoveTeamMember()

  const [showInvite, setShowInvite] = useState(false)
  const [removeId, setRemoveId] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team"
        subtitle={`${(members?.length || 0) + 1} members`}
        actions={<Button icon={Users} onClick={() => setShowInvite(true)}>Invite Member</Button>}
      />

      {/* Current Team */}
      <GlassCard className="overflow-hidden">
        <div className={`px-6 py-4 border-b text-xs font-medium uppercase tracking-wider ${isDark ? 'border-white/6 text-white/35' : 'border-black/6 text-slate-400'}`}>Members</div>

        {/* Owner row */}
        <div className={`flex items-center gap-4 px-6 py-5 border-b ${isDark ? 'border-white/4' : 'border-black/4'}`}>
          <Avatar name={profile?.full_name || profile?.email} size="md" />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${isDark ? 'text-white/90' : 'text-slate-800'}`}>{profile?.full_name || 'You'}</p>
            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{profile?.email}</p>
          </div>
          <Badge color={ROLE_COLORS.owner}>Owner</Badge>
        </div>

        {!members?.length ? (
          <EmptyState icon={Users} title="No team members yet" message="Invite collaborators to work together on your CRM." action={<Button onClick={() => setShowInvite(true)}>Send First Invite</Button>} />
        ) : (
          members.map(m => {
            const RoleIcon = ROLE_ICONS[m.role] || Eye
            const roleColor = ROLE_COLORS[m.role] || '#94a3b8'
            return (
              <div key={m.id} className={`flex items-center gap-4 px-6 py-5 border-b table-row-hover ${isDark ? 'border-white/4' : 'border-black/4'}`}>
                <Avatar name={m.profiles?.full_name || m.email} size="md" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDark ? 'text-white/85' : 'text-slate-700'}`}>{m.profiles?.full_name || m.email}</p>
                  <p className={`text-xs ${isDark ? 'text-white/35' : 'text-slate-400'}`}>
                    {m.email} · Invited {format(new Date(m.invited_at), 'MMM d, yyyy')}
                    {!m.accepted_at && <span className="ml-2 text-amber-400">Pending</span>}
                  </p>
                </div>
                <select
                  value={m.role}
                  onChange={e => updateRole({ id: m.id, role: e.target.value })}
                  className={`text-xs rounded-lg px-2 py-1 border cursor-pointer outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-slate-700'}`}
                >
                  {TEAM_ROLES.filter(r => r.value !== 'owner').map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <button onClick={() => setRemoveId(m.id)} className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-red-500/15 text-white/25 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-400'}`}>
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })
        )}
      </GlassCard>

      {/* Permission Matrix */}
      <GlassCard className="p-7">
        <h3 className={`text-base font-semibold mb-5 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>Role Permissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className={`text-left pb-2 pr-4 font-medium ${isDark ? 'text-white/35' : 'text-slate-400'}`}>Feature</th>
                {['owner','admin','sales_rep','copywriter','viewer'].map(role => {
                  const Icon = ROLE_ICONS[role] || Eye
                  return (
                    <th key={role} className={`text-center pb-2 px-3 font-medium ${isDark ? 'text-white/35' : 'text-slate-400'}`}>
                      <div className="flex flex-col items-center gap-1">
                        <Icon size={12} style={{ color: ROLE_COLORS[role] }} />
                        {TEAM_ROLES.find(r => r.value === role)?.label}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map(row => (
                <tr key={row.feature} className={`border-t ${isDark ? 'border-white/4' : 'border-black/4'}`}>
                  <td className={`py-2 pr-4 ${isDark ? 'text-white/55' : 'text-slate-600'}`}>{row.feature}</td>
                  {['owner','admin','sales_rep','copywriter','viewer'].map(role => (
                    <td key={role} className="py-2 px-3 text-center">
                      {row[role]
                        ? <span className="text-emerald-400 text-base">✓</span>
                        : <span className={`${isDark ? 'text-white/15' : 'text-slate-200'}`}>–</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member" size="sm">
        <form onSubmit={handleSubmit(vals => { invite(vals); reset(); setShowInvite(false) })} className="space-y-3">
          <Input label="Email Address *" type="email" icon={Mail} placeholder="colleague@company.com" error={errors.email?.message} {...register('email')} />
          <FormSelect label="Role *" error={errors.role?.message} {...register('role')}>
            <option value="">Select role…</option>
            {TEAM_ROLES.filter(r => r.value !== 'owner').map(r => (
              <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
            ))}
          </FormSelect>
          <Button type="submit" loading={inviting} className="w-full" icon={Mail}>Send Invitation</Button>
        </form>
      </Modal>

      <ConfirmModal
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={() => { removeMember(removeId); setRemoveId(null) }}
        title="Remove Member"
        message="This team member will lose access to your SuccessPro workspace."
        loading={removing}
      />
    </div>
  )
}
