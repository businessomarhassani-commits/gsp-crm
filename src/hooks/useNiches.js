import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

const KEY = 'niches'

export function useNiches() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: [KEY, session?.user?.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('niches')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateNiche() {
  const qc = useQueryClient()
  const { session } = useAuthStore()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('niches')
        .insert({ ...values, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Niche created!')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useUpdateNiche() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase.from('niches').update(values).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Niche updated!')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteNiche() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('niches').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Niche deleted')
    },
    onError: (e) => toast.error(e.message),
  })
}
