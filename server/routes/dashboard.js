const express = require('express')
const supabase = require('../db')
const { auth } = require('../middleware/auth')
const router = express.Router()

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  const uid = req.user.id

  const [{ data: leads }, { data: clients }, { data: reminders }] = await Promise.all([
    supabase.from('leads').select('id, name, project_type, status, created_at, budget, city').eq('user_id', uid).order('created_at', { ascending: false }),
    supabase.from('clients').select('project_value').eq('user_id', uid),
    supabase.from('reminders').select('id, title, description, reminder_date, lead_id, client_id').eq('user_id', uid).eq('status', 'pending').order('reminder_date', { ascending: true }).limit(5)
  ])

  const totalLeads = leads?.length || 0
  const wonLeads = leads?.filter(l => l.status === 'Gagné').length || 0
  const totalRevenue = clients?.reduce((sum, c) => sum + (Number(c.project_value) || 0), 0) || 0
  const clientCount = clients?.length || 0
  const avgDeal = clientCount > 0 ? totalRevenue / clientCount : 0
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0

  res.json({
    total_revenue: totalRevenue,
    closed_clients: clientCount,
    average_deal_value: avgDeal,
    conversion_rate: Number(conversionRate),
    recent_leads: leads?.slice(0, 5) || [],
    upcoming_reminders: reminders || []
  })
})

module.exports = router
