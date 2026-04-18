const express = require('express')
const supabase = require('../db')
const { auth } = require('../middleware/auth')
const router = express.Router()

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  const uid = req.user.id

  const [{ data: leads }, { data: clients }, { data: reminders }] = await Promise.all([
    supabase.from('leads').select('id, name, project_type, status, created_at, budget, city, source').eq('user_id', uid).order('created_at', { ascending: false }),
    supabase.from('clients').select('project_value, closing_date').eq('user_id', uid),
    supabase.from('reminders').select('id, title, description, reminder_date, lead_id, client_id').eq('user_id', uid).eq('status', 'pending').order('reminder_date', { ascending: true }).limit(5)
  ])

  const totalLeads = leads?.length || 0
  const wonLeads = leads?.filter(l => l.status === 'Gagné').length || 0
  const totalRevenue = clients?.reduce((sum, c) => sum + (Number(c.project_value) || 0), 0) || 0
  const clientCount = clients?.length || 0
  const avgDeal = clientCount > 0 ? totalRevenue / clientCount : 0
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0

  // Build last 6 months chart data
  const now = new Date()
  const monthLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: monthLabels[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      leads: 0,
      clients: 0,
    })
  }

  leads?.forEach(l => {
    if (!l.created_at) return
    const d = new Date(l.created_at)
    const entry = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth() + 1)
    if (entry) entry.leads += 1
  })

  clients?.forEach(c => {
    if (!c.closing_date) return
    const d = new Date(c.closing_date)
    const entry = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth() + 1)
    if (entry) entry.clients += 1
  })

  // Status distribution for donut chart
  const statusCounts = {}
  leads?.forEach(l => {
    statusCounts[l.status] = (statusCounts[l.status] || 0) + 1
  })
  const status_distribution = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  res.json({
    total_revenue: totalRevenue,
    closed_clients: clientCount,
    average_deal_value: avgDeal,
    conversion_rate: Number(conversionRate),
    total_leads: totalLeads,
    won_leads: wonLeads,
    monthly_chart: months,
    status_distribution,
    recent_leads: leads?.slice(0, 5) || [],
    upcoming_reminders: reminders || []
  })
})

module.exports = router
