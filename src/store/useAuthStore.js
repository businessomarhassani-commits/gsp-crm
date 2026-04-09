import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  session: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) set({ profile: data })
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },

  updateProfile: async (updates) => {
    const { session } = get()
    if (!session) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single()
    if (!error && data) set({ profile: data })
    return { data, error }
  },
}))
