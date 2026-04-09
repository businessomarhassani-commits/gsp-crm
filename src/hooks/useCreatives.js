import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

const KEY = 'creatives'

export function useCreatives(filters = {}) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: [KEY, session?.user?.id, filters],
    enabled: !!session,
    queryFn: async () => {
      let q = supabase
        .from('creatives')
        .select('*, niches(name, color)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      if (filters.niche_id) q = q.eq('niche_id', filters.niche_id)
      if (filters.status) q = q.eq('status', filters.status)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useCreateCreative() {
  const qc = useQueryClient()
  const { session } = useAuthStore()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('creatives')
        .insert({ ...values, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Creative saved!') },
    onError: (e) => toast.error(e.message),
  })
}

export function useUpdateCreative() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase.from('creatives').update(values).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Creative updated!') },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteCreative() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('creatives').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Creative deleted') },
    onError: (e) => toast.error(e.message),
  })
}
