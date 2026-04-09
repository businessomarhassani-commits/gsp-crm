// Default rates (user can override in settings)
const DEFAULT_RATES = { usdToMad: 10.0, eurToMad: 10.9 }

/**
 * Convert an amount from one currency to another.
 * @param {number} amount
 * @param {string} from  - 'MAD' | 'USD' | 'EUR'
 * @param {string} to    - 'MAD' | 'USD' | 'EUR'
 * @param {{ usdToMad: number, eurToMad: number }} rates
 */
export function convertCurrency(amount, from, to, rates = DEFAULT_RATES) {
  if (from === to) return amount
  const { usdToMad, eurToMad } = rates

  // Convert to MAD first
  let mad = amount
  if (from === 'USD') mad = amount * usdToMad
  if (from === 'EUR') mad = amount * eurToMad

  // Convert from MAD to target
  if (to === 'MAD') return mad
  if (to === 'USD') return mad / usdToMad
  if (to === 'EUR') return mad / eurToMad
  return amount
}

const SYMBOLS = { MAD: 'د.م.', USD: '$', EUR: '€' }

/**
 * Format a number as currency string.
 */
export function formatCurrency(amount, currency = 'MAD') {
  const sym = SYMBOLS[currency] || currency
  const num = Number(amount || 0)
  if (currency === 'MAD') return `${sym} ${num.toLocaleString('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  return `${sym}${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function getCurrencySymbol(currency) {
  return SYMBOLS[currency] || currency
}
