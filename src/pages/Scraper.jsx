import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, CheckSquare, Square, MapPin, MessageCircle, Briefcase, Star, Globe, Users } from 'lucide-react'
import { useBulkCreateProspects } from '../hooks/useProspects'
import { useNiches } from '../hooks/useNiches'
import { useUIStore } from '../store/useUIStore'
import { GlassCard } from '../components/ui/GlassCard'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input, FormSelect } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/LoadingSpinner'

// ─── Mock Data Generators ────────────────────────────────────────────────────
const MAR_CITIES = ['Casablanca','Rabat','Marrakech','Fès','Agadir','Tanger','Meknès','Oujda','Tétouan','Safi','Settat','Kénitra']
const BUSINESS_PREFIXES = ['Atlas','Medina','Royal','Moroccan','Hassan','Andalous','Sahara','Argan','Zaytoun','Berbère']
const BUSINESS_TYPES = ['Restaurant','Café','Salon','Boutique','Garage','Pharmacie','Cabinet Dentaire','Clinique','Gym','Hotel','Hôtel','Agence','Studio']
const ARABIC_NAMES = ['Mohammed Benali','Fatima Zahra','Ahmed Khalil','Youssef Amrani','Leila Hajji','Omar Tazi','Sofia Berrada','Karim Mansouri','Zineb Alaoui','Hassan Chraibi']
const CATEGORIES = ['Restaurant','Café','Salon de coiffure','Boutique vêtements','Garage automobile','Pharmacie','Dentiste','Salle de sport','Hôtel','Agence immobilière']
const IG_BIOS = ['📍 Casablanca | DM pour plus d\'infos', '🇲🇦 Service premium | Contact direct', 'Business Maroc 🌟 | WhatsApp disponible', '✨ Qualité & service | DM ouvert']

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randomPhone() { return `+212 6${randomInt(10,99)} ${randomInt(100,999)} ${randomInt(100,999)}` }
function randomRating() { return (Math.random() * 2 + 3).toFixed(1) }

function generateGoogleMapsResults(keyword, city, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `gm-${Date.now()}-${i}`,
    full_name: ARABIC_NAMES[i % ARABIC_NAMES.length],
    business_name: `${randomFrom(BUSINESS_PREFIXES)} ${randomFrom(BUSINESS_TYPES)}`,
    phone: randomPhone(),
    city,
    country: 'Morocco',
    source: 'Google Maps',
    website: Math.random() > 0.6 ? `www.${keyword.toLowerCase().replace(/\s/g,'')}-${city.toLowerCase()}.ma` : '',
    _meta: { rating: randomRating(), category: randomFrom(CATEGORIES), address: `${randomInt(1,200)} Rue ${randomFrom(['Hassan II','Mohammed V','Atlas','Fès'])}, ${city}`, reviews: randomInt(5, 340) }
  }))
}

function generateInstagramResults(keyword, city, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `ig-${Date.now()}-${i}`,
    full_name: ARABIC_NAMES[i % ARABIC_NAMES.length],
    business_name: `${randomFrom(BUSINESS_PREFIXES)} ${keyword}`,
    instagram_handle: `@${keyword.toLowerCase().replace(/\s/g,'')}_${city.toLowerCase()}_${randomInt(1,99)}`,
    city,
    country: 'Morocco',
    source: 'Instagram',
    email: Math.random() > 0.5 ? `contact@${keyword.toLowerCase()}.ma` : '',
    _meta: { followers: randomInt(500, 50000), bio: randomFrom(IG_BIOS), posts: randomInt(12, 800) }
  }))
}

function generateLinkedInResults(keyword, city, count) {
  const TITLES = ['Gérant','Directeur','CEO','Fondateur','Manager','Responsable Commercial','Entrepreneur']
  return Array.from({ length: count }, (_, i) => ({
    id: `li-${Date.now()}-${i}`,
    full_name: ARABIC_NAMES[i % ARABIC_NAMES.length],
    business_name: `${randomFrom(BUSINESS_PREFIXES)} ${keyword} ${city}`,
    linkedin_url: `linkedin.com/in/${ARABIC_NAMES[i % ARABIC_NAMES.length].split(' ').join('-').toLowerCase()}-${randomInt(10,99)}`,
    city,
    country: 'Morocco',
    source: 'LinkedIn',
    _meta: { title: randomFrom(TITLES), connections: randomInt(50, 3000) }
  }))
}

// ─── Column definitions per source ───────────────────────────────────────────
const COLS = {
  google_maps: [
    { key: 'business_name', label: 'Business' },
    { key: 'full_name',     label: 'Owner' },
    { key: 'phone',         label: 'Phone' },
    { key: '_meta.rating',  label: 'Rating', render: r => `⭐ ${r?._meta?.rating}` },
    { key: '_meta.address', label: 'Address', render: r => r?._meta?.address },
    { key: 'website',       label: 'Website' },
  ],
  instagram: [
    { key: 'business_name',      label: 'Name' },
    { key: 'instagram_handle',   label: 'Handle' },
    { key: '_meta.followers',    label: 'Followers', render: r => Number(r?._meta?.followers).toLocaleString() },
    { key: '_meta.bio',          label: 'Bio', render: r => r?._meta?.bio },
    { key: 'email',              label: 'Email' },
    { key: 'city',               label: 'City' },
  ],
  linkedin: [
    { key: 'full_name',         label: 'Name' },
    { key: '_meta.title',       label: 'Title', render: r => r?._meta?.title },
    { key: 'business_name',     label: 'Company' },
    { key: 'city',              label: 'City' },
    { key: '_meta.connections', label: 'Connections', render: r => Number(r?._meta?.connections).toLocaleString() },
    { key: 'linkedin_url',      label: 'Profile' },
  ],
}

export default function Scraper() {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const { data: niches } = useNiches()
  const { mutate: bulkImport, isPending: importing } = useBulkCreateProspects()

  const [source, setSource] = useState('google_maps')
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('')
  const [nicheId, setNicheId] = useState('')
  const [limit, setLimit] = useState('25')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [scraped, setScraped] = useState(false)

  const SOURCE_TABS = [
    { value: 'google_maps', label: 'Google Maps', icon: MapPin },
    { value: 'instagram',   label: 'Instagram',   icon: MessageCircle },
    { value: 'linkedin',    label: 'LinkedIn',     icon: Briefcase },
  ]

  async function handleScrape() {
    if (!keyword.trim() || !city.trim()) return
    setLoading(true)
    setResults([])
    setSelected(new Set())

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1800))

    const n = Number(limit)
    let data = []
    if (source === 'google_maps') data = generateGoogleMapsResults(keyword, city, n)
    else if (source === 'instagram') data = generateInstagramResults(keyword, city, n)
    else data = generateLinkedInResults(keyword, city, n)

    setResults(data)
    setScraped(true)
    setLoading(false)
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === results.length) setSelected(new Set())
    else setSelected(new Set(results.map(r => r.id)))
  }

  function handleImport() {
    const toImport = results
      .filter(r => selected.has(r.id))
      .map(({ id, _meta, ...prospect }) => ({ ...prospect, niche_id: nicheId || null, status: 'new' }))
    bulkImport(toImport)
    setSelected(new Set())
    setResults(prev => prev.filter(r => !selected.has(r.id)))
  }

  const cols = COLS[source]

  return (
    <div className="space-y-5">
      <PageHeader title="Data Scraper" subtitle="Find and import prospects from multiple sources" />

      {/* Source Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl w-fit ${isDark ? 'bg-white/6' : 'bg-black/5'}`}>
        {SOURCE_TABS.map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => { setSource(value); setResults([]); setScraped(false) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              source === value
                ? (isDark ? 'bg-white/12 text-white' : 'bg-white text-slate-700 shadow-sm')
                : (isDark ? 'text-white/45 hover:text-white/70' : 'text-slate-400 hover:text-slate-600')
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Search Form */}
      <GlassCard className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input label="Search Keyword" placeholder="e.g. Restaurant, Dentiste, Gym" value={keyword} onChange={e => setKeyword(e.target.value)} icon={Search} />
          <Input label="City" placeholder="e.g. Casablanca" value={city} onChange={e => setCity(e.target.value)} icon={MapPin} />
          <FormSelect label="Niche (optional)" value={nicheId} onChange={e => setNicheId(e.target.value)}>
            <option value="">No niche</option>
            {niches?.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </FormSelect>
          <FormSelect label="Results Limit" value={limit} onChange={e => setLimit(e.target.value)}>
            {['10','25','50'].map(l => <option key={l} value={l}>{l} results</option>)}
          </FormSelect>
        </div>
        <Button
          className="mt-4"
          icon={Search}
          loading={loading}
          disabled={!keyword.trim() || !city.trim()}
          onClick={handleScrape}
        >
          Scrape {SOURCE_TABS.find(s => s.value === source)?.label}
        </Button>
      </GlassCard>

      {/* Results */}
      <AnimatePresence>
        {loading && (
          <GlassCard className="overflow-hidden">
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-5 h-5 rounded-full border-2 border-blue-500/50 border-t-blue-500 animate-spin-smooth" />
                <span className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Scraping {SOURCE_TABS.find(s => s.value === source)?.label}…</span>
              </div>
              <table className="w-full"><tbody>{Array(5).fill(0).map((_, i) => <SkeletonRow key={i} cols={6} />)}</tbody></table>
            </div>
          </GlassCard>
        )}

        {!loading && scraped && results.length === 0 && (
          <GlassCard>
            <EmptyState icon={Search} title="No results" message="Try a different keyword or city." />
          </GlassCard>
        )}

        {!loading && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="overflow-hidden">
              <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-white/6' : 'border-black/6'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={toggleAll} className="cursor-pointer">
                    {selected.size === results.length
                      ? <CheckSquare size={16} className="text-blue-400" />
                      : <Square size={16} className={isDark ? 'text-white/30' : 'text-slate-300'} />}
                  </button>
                  <span className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                    {results.length} results · {selected.size} selected
                  </span>
                </div>
                <Button
                  icon={Download}
                  size="sm"
                  disabled={selected.size === 0}
                  loading={importing}
                  onClick={handleImport}
                >
                  Import Selected ({selected.size})
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/6' : 'border-black/6'}`}>
                      <th className="w-10 px-4 py-3" />
                      {cols.map(c => (
                        <th key={c.key} className={`text-xs font-medium text-left px-3 py-3 ${isDark ? 'text-white/35' : 'text-slate-400'}`}>{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(row => (
                      <tr key={row.id}
                        className={`border-b table-row-hover cursor-pointer ${isDark ? 'border-white/4' : 'border-black/4'} ${selected.has(row.id) ? (isDark ? 'bg-blue-500/8' : 'bg-blue-50/50') : ''}`}
                        onClick={() => toggleSelect(row.id)}>
                        <td className="px-4 py-3">
                          {selected.has(row.id)
                            ? <CheckSquare size={14} className="text-blue-400" />
                            : <Square size={14} className={isDark ? 'text-white/20' : 'text-slate-300'} />}
                        </td>
                        {cols.map(c => (
                          <td key={c.key} className={`px-3 py-3 text-xs max-w-[160px] truncate ${isDark ? 'text-white/65' : 'text-slate-600'}`}>
                            {c.render ? c.render(row) : (row[c.key] || '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
