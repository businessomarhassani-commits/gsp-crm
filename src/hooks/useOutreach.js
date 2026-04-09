import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

const KEY = 'outreach_logs'

export function useOutreachLogs(prospectId) {
  return useQuery({
    queryKey: [KEY, prospectId],
    enabled: !!prospectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outreach_logs')
        .select('*, profiles(full_name)')
        .eq('prospect_id', prospectId)
        .order('date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAllOutreach(filters = {}) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: [KEY, 'all', session?.user?.id, filters],
    enabled: !!session,
    queryFn: async () => {
      let q = supabase
        .from('outreach_logs')
        .select('*, prospects(full_name, business_name), profiles(full_name)')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false })
      if (filters.type) q = q.eq('type', filters.type)
      if (filters.from) q = q.gte('date', filters.from)
      if (filters.to) q = q.lte('date', filters.to)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useCreateOutreach() {
  const qc = useQueryClient()
  const { session } = useAuthStore()
  return useMutation({
    mutationFn: async ({ prospect_id, ...values }) => {
      const { data, error } = await supabase
        .from('outreach_logs')
        .insert({ ...values, prospect_id, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY, data.prospect_id] })
      qc.invalidateQueries({ queryKey: [KEY, 'all'] })
      toast.success('Outreach logged!')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteOutreach() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, prospect_id }) => {
      const { error } = await supabase.from('outreach_logs').delete().eq('id', id)
      if (error) throw error
      return prospect_id
    },
    onSuccess: (prospect_id) => {
      qc.invalidateQueries({ queryKey: [KEY, prospect_id] })
      qc.invalidateQueries({ queryKey: [KEY, 'all'] })
      toast.success('Log deleted')
    },
    onError: (e) => toast.error(e.message),
  })
}
