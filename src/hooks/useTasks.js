import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const KEY = 'tasks'

export function useTasks(filters = {}) {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: [KEY, session?.user?.id, filters],
    enabled: !!session,
    queryFn: async () => {
      let q = supabase
        .from('tasks')
        .select('*, prospects(full_name, business_name, phone)')
        .eq('user_id', session.user.id)
        .order('due_date', { ascending: true })
      if (filters.completed !== undefined) q = q.eq('completed', filters.completed)
      if (filters.from) q = q.gte('due_date', filters.from)
      if (filters.to) q = q.lte('due_date', filters.to)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useOverdueTasks() {
  const { session } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  return useQuery({
    queryKey: [KEY, 'overdue', session?.user?.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, prospects(full_name, business_name)')
        .eq('user_id', session.user.id)
        .eq('completed', false)
        .lt('due_date', today)
      if (error) throw error
      return data
    },
  })
}

export function useTodayTasks() {
  const { session } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  return useQuery({
    queryKey: [KEY, 'today', session?.user?.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, prospects(full_name, business_name, phone)')
        .eq('user_id', session.user.id)
        .eq('completed', false)
        .lte('due_date', today)
        .order('due_date', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  const { session } = useAuthStore()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...values, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Task created!') },
    onError: (e) => toast.error(e.message),
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Task completed!') },
    onError: (e) => toast.error(e.message),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Task deleted') },
    onError: (e) => toast.error(e.message),
  })
}
