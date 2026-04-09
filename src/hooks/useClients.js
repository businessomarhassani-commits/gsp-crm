import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

const KEY = 'clients'

export function useClients() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: [KEY, session?.user?.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, prospects(full_name, business_name, email, phone, niche_id, niches(name, color))')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useClient(id) {
  return useQuery({
    queryKey: [KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, prospects(full_name, business_name, email, phone, city, country, niche_id, niches(name, color))')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  const { session } = useAuthStore()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...values, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Client created!') },
    onError: (e) => toast.error(e.message),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase.from('clients').update(values).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Client updated!') },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Client removed') },
    onError: (e) => toast.error(e.message),
  })
}
