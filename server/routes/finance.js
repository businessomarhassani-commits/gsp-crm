const express = require('express')
const supabase = require('../db')
const { auth } = require('../middleware/auth')
const router = express.Router()

// GET /api/finance/summary
router.get('/summary', auth, async (req, res) => {
  const { data: clients } = await supabase
    .from('clients').select('project_value').eq('user_id', req.user.id)
  const values = (clients || []).map(c => Number(c.project_value) || 0)
  const total = values.reduce((sum, v) => sum + v, 0)
  const count = values.length
  const avg = count > 0 ? total / count : 0
  const max = count > 0 ? Math.max(...values) : 0
  res.json({ total_revenue: total, total_clients: count, average_value: avg, max_value: max })
})

// GET /api/finance/monthly
router.get('/monthly', auth, async (req, res) => {
  const year = new Date().getFullYear()
  const { data: clients } = await supabase
    .from('clients')
    .select('project_value, closing_date')
    .eq('user_id', req.user.id)
    .gte('closing_date', `${year}-01-01`)
    .lte('closing_date', `${year}-12-31`)

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    year,
    total: 0
  }))

  clients?.forEach(c => {
    if (c.closing_date) {
      const m = new Date(c.closing_date).getMonth()
      months[m].total += Number(c.project_value) || 0
    }
  })

  res.json(months)
})

// GET /api/finance/deals
router.get('/deals', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, project_type, project_value, closing_date, city')
    .eq('user_id', req.user.id)
    .order('closing_date', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router
