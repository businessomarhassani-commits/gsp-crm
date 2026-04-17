const express = require('express')
const supabase = require('../db')
const { auth } = require('../middleware/auth')
const router = express.Router()

// GET /api/finance/summary
router.get('/summary', auth, async (req, res) => {
  const { from, to } = req.query
  let query = supabase.from('clients').select('project_value').eq('user_id', req.user.id)
  if (from) query = query.gte('closing_date', from)
  if (to) query = query.lte('closing_date', to)
  const { data: clients } = await query
  const values = (clients || []).map(c => Number(c.project_value) || 0)
  const total = values.reduce((sum, v) => sum + v, 0)
  const count = values.length
  const avg = count > 0 ? total / count : 0
  const max = count > 0 ? Math.max(...values) : 0
  res.json({ total_revenue: total, total_clients: count, average_value: avg, max_value: max })
})

// GET /api/finance/monthly
router.get('/monthly', auth, async (req, res) => {
  // Determine date range
  const now = new Date()
  let fromDate, toDate

  if (req.query.from && req.query.to) {
    fromDate = new Date(req.query.from)
    toDate = new Date(req.query.to)
  } else {
    // Default: last 12 months
    toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // end of current month
    fromDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1) // start of same month last year
  }

  const fromStr = fromDate.toISOString().slice(0, 10)
  const toStr = toDate.toISOString().slice(0, 10)

  const { data: clients } = await supabase
    .from('clients')
    .select('project_value, closing_date')
    .eq('user_id', req.user.id)
    .gte('closing_date', fromStr)
    .lte('closing_date', toStr)

  // Build array of all months in range
  const months = []
  const cur = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1)

  while (cur <= end) {
    months.push({ month: cur.getMonth() + 1, year: cur.getFullYear(), total: 0 })
    cur.setMonth(cur.getMonth() + 1)
  }

  clients?.forEach(c => {
    if (c.closing_date) {
      const d = new Date(c.closing_date)
      const entry = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth() + 1)
      if (entry) entry.total += Number(c.project_value) || 0
    }
  })

  res.json(months)
})

// GET /api/finance/deals
router.get('/deals', auth, async (req, res) => {
  const { from, to } = req.query
  let query = supabase
    .from('clients')
    .select('id, name, project_type, project_value, closing_date, city')
    .eq('user_id', req.user.id)
    .order('closing_date', { ascending: false })
  if (from) query = query.gte('closing_date', from)
  if (to) query = query.lte('closing_date', to)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router
