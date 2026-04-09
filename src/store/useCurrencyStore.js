import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { convertCurrency, formatCurrency } from '../lib/currency'

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      activeCurrency: 'MAD',
      rates: { usdToMad: 10.0, eurToMad: 10.9 },

      setActiveCurrency: (currency) => set({ activeCurrency: currency }),

      setRates: (rates) => set({ rates }),

      // Convert amount from given currency to active currency, then format
      formatAmount: (amount, fromCurrency = 'MAD') => {
        const { activeCurrency, rates } = get()
        const converted = convertCurrency(Number(amount || 0), fromCurrency, activeCurrency, rates)
        return formatCurrency(converted, activeCurrency)
      },

      // Just convert (no formatting)
      convert: (amount, fromCurrency = 'MAD') => {
        const { activeCurrency, rates } = get()
        return convertCurrency(Number(amount || 0), fromCurrency, activeCurrency, rates)
      },
    }),
    {
      name: 'successpro-currency',
      partialize: (s) => ({ activeCurrency: s.activeCurrency, rates: s.rates }),
    }
  )
)
