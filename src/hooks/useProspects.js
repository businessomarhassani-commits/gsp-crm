import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

const KEY = 'prospects'

export function useProspects(filters = {}) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: [KEY, session?.user?.id, filters],
    enabled: !!session,
    queryFn: async () => {
      let q = supabase
        .from('prospects')
        .select('*, niches(name, color)')
        .order('created_at', { ascending: false })
      if (filters.niche_id) q = q.eq('niche_id', filters.niche_id)
      if (filters.status) q = q.eq('status', filters.status)
      if (filters.search) q = q.ilike('full_name', `%${filters.search}%`)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useProspect(id) {
  return useQuery({
    queryKey: [KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospects')
        .select('*, niches(name, color)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useCreateProspect() {
  const qc = useQueryClient()
  const { session } = useAuthStore()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('prospects')
        .insert({ ...values, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Prospect added!') },
    onError: (e) => toast.error(e.message),
  })
}

export function useUpdateProspect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase.from('prospects').update(values).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.setQueryData([KEY, data.id], data)
      toast.success('Prospect updated!')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteProspect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('prospects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Prospect deleted') },
    onError: (e) => toast.error(e.message),
  })
}

export function useBulkCreateProspects() {
  const qc = useQueryClient()
  const { session } = useAuthStore()
  return useMutation({
    mutationFn: async (prospects) => {
      const rows = prospects.map((p) => ({ ...p, user_id: session.user.id }))
      const { data, error } = await supabase.from('prospects').insert(rows).select()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success(`${data.length} prospects imported!`)
    },
    onError: (e) => toast.error(e.message),
  })
}
