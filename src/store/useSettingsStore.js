import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set) => ({
      claudeApiKey: '',
      notificationsEnabled: true,

      setClaudeApiKey: (key) => set({ claudeApiKey: key }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
    }),
    {
      name: 'successpro-settings',
    }
  )
)
