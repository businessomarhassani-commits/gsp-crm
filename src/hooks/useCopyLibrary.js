import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

const KEY = 'copy_library'

export function useCopyLibrary(filters = {}) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: [KEY, session?.user?.id, filters],
    enabled: !!session,
    queryFn: async () => {
      let q = supabase
        .from('copy_library')
        .select('*, niches(name, color)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      if (filters.niche_id) q = q.eq('niche_id', filters.niche_id)
      if (filters.outreach_type) q = q.eq('outreach_type', filters.outreach_type)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useSaveCopy() {
  const qc = useQueryClient()
  const { session } = useAuthStore()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('copy_library')
        .insert({ ...values, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Copy saved to library!') },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteCopy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('copy_library').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Copy deleted') },
    onError: (e) => toast.error(e.message),
  })
}
