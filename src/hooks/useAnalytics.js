import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns'

export function useAnalytics() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: ['analytics', session?.user?.id],
    enabled: !!session,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const uid = session.user.id

      const [prospects, clients, outreach, tasks, payments] = await Promise.all([
        supabase.from('prospects').select('id, status, niche_id, niches(name, color)').eq('user_id', uid),
        supabase.from('clients').select('id, monthly_fee, fee_currency, niche_id').eq('user_id', uid),
        supabase.from('outreach_logs').select('id, type, date').eq('user_id', uid),
        supabase.from('tasks').select('id, completed, due_date').eq('user_id', uid),
        supabase.from('payments').select('amount, currency, status, client_id'),
      ])

      const ps = prospects.data || []
      const cs = clients.data || []
      const ol = outreach.data || []
      const ts = tasks.data || []
      const pays = payments.data || []

      const totalProspects = ps.length
      const totalClients = cs.length
      const conversionRate = totalProspects > 0 ? ((cs.length / totalProspects) * 100).toFixed(1) : 0

      // MRR (sum of monthly fees in MAD — simplified, no currency conversion)
      const totalMRR = cs.reduce((acc, c) => acc + Number(c.monthly_fee || 0), 0)

      // Status funnel
      const funnel = ['new','contacted','interested','proposal_sent','client','not_interested','follow_up_later'].map(s => ({
        status: s, count: ps.filter(p => p.status === s).length
      }))

      // Weekly outreach (last 7 weeks)
      const weeks = []
      for (let i = 6; i >= 0; i--) {
        const weekStart = format(startOfWeek(subWeeks(new Date(), i)), 'yyyy-MM-dd')
        const weekEnd = format(endOfWeek(subWeeks(new Date(), i)), 'yyyy-MM-dd')
        const label = format(startOfWeek(subWeeks(new Date(), i)), 'MMM d')
        const count = ol.filter(o => o.date >= weekStart && o.date <= weekEnd).length
        weeks.push({ label, count })
      }

      // Per-niche stats
  const nicheMap = {}
      ps.forEach(p => {
        if (!p.niche_id) return
        if (!nicheMap[p.niche_id]) nicheMap[p.niche_id] = { name: p.niches?.name || 'Unknown', color: p.niches?.color, prospects: 0, clients: 0 }
        nicheMap[p.niche_id].prospects++
        if (p.status === 'client') nicheMap[p.niche_id].clients++
      })
      cs.forEach(c => {
        if (c.niche_id && nicheMap[c.niche_id]) {
          nicheMap[c.niche_id].mrr = (nicheMap[c.niche_id].mrr || 0) + Number(c.monthly_fee || 0)
        }
      })
      const nicheStats = Object.values(nicheMap)

      // Today tasks
      const today = format(new Date(), 'yyyy-MM-dd')
      const todayDue = ts.filter(t => !t.completed && t.due_date <= today).length
      const completedToday = ts.filter(t => t.completed).length

      // Outreach by type
      const outreachByType = ['cold_call','cold_email','instagram_dm','linkedin_message','door_to_door'].map(type => ({
        type, count: ol.filter(o => o.type === type).length
      }))

      return {
        totalProspects, totalClients, totalMRR, conversionRate,
        funnel, weeks, nicheStats, todayDue, completedToday,
        outreachByType, outreach: ol,
      }
    },
  })
}
