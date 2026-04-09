import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import toast from 'react-hot-toast'

const KEY = 'team_members'

export function useTeam() {
  const { session } = useAuthStore()
  return useQuery({
    queryKey: [KEY, session?.user?.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*, profiles!member_id(full_name, avatar_url)')
        .eq('owner_id', session.user.id)
        .order('invited_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useInviteTeamMember() {
  const qc = useQueryClient()
  const { session } = useAuthStore()
  return useMutation({
    mutationFn: async ({ email, role }) => {
      const { data, error } = await supabase
        .from('team_members')
        .insert({ email, role, owner_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Invitation sent!') },
    onError: (e) => toast.error(e.message),
  })
}

export function useUpdateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }) => {
      const { data, error } = await supabase.from('team_members').update({ role }).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Role updated!') },
    onError: (e) => toast.error(e.message),
  })
}

export function useRemoveTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('team_members').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast.success('Member removed') },
    onError: (e) => toast.error(e.message),
  })
}
