import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const KEY = 'payments'

export function usePayments(clientId) {
  return useQuery({
    queryKey: [KEY, clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', clientId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase.from('payments').insert(values).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY, data.client_id] })
      toast.success('Payment recorded!')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useUpdatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { data, error } = await supabase.from('payments').update(values).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY, data.client_id] })
      toast.success('Payment updated!')
    },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeletePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, client_id }) => {
      const { error } = await supabase.from('payments').delete().eq('id', id)
      if (error) throw error
      return client_id
    },
    onSuccess: (client_id) => {
      qc.invalidateQueries({ queryKey: [KEY, client_id] })
      toast.success('Payment deleted')
    },
    onError: (e) => toast.error(e.message),
  })
}
