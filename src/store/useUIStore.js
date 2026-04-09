import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',           // 'dark' | 'light'
      sidebarCollapsed: false,
      language: 'English',

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.classList.toggle('dark', next === 'dark')
      },

      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'successpro-ui',
      partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed, language: s.language }),
    }
  )
)
