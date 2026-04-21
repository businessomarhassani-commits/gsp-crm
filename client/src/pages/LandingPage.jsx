import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Kanban, Zap, Bell, TrendingUp, BarChart2, Link2,
  Check, ChevronDown, Menu, X, Star, ArrowRight,
  Shield, Clock, MessageCircle,
} from 'lucide-react'
import Logo from '../components/Logo'

const APP_URL = 'https://app.archicrm.ma'

// ─── Scroll-fade hook ─────────────────────────────────────────────────────────
function useFadeIn() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function FadeIn({ children, className = '', delay = 0 }) {
  const [ref, visible] = useFadeIn()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Fonctionnalités', href: '#fonctionnalites' },
    { label: 'Tarifs',          href: '#tarifs' },
    { label: 'Contact',         href: '#contact' },
  ]

  const scrollTo = (e, href) => {
    e.preventDefault()
    setMobileOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 bg-[#0A0A0A] border-b-2 border-[#E8A838] ${scrolled ? 'shadow-lg shadow-black/30' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link to="/landing" className="flex items-center gap-2.5 shrink-0">
          <Logo size={28} />
          <span className="font-bold text-[15px]">
            <span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={e => scrollTo(e, l.href)}
              className="px-3 py-2 text-[13px] text-white/55 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <a href={`${APP_URL}/login`} className="hidden md:block text-[13px] text-white/50 hover:text-white transition-colors">
            Connexion
          </a>
          <a href={`${APP_URL}/signup`}
            className="bg-[#E8A838] hover:bg-[#d4952a] active:scale-95 text-[#0A0A0A] text-[13px] font-bold px-4 py-2 rounded-lg transition-all whitespace-nowrap">
            Commencer
          </a>
          <button onClick={() => setMobileOpen(v => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-t border-white/[0.07] px-4 pb-5 pt-2 space-y-1">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={e => scrollTo(e, l.href)}
              className="block px-3 py-3 text-[14px] text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
              {l.label}
            </a>
          ))}
          <div className="pt-2 border-t border-white/[0.06]">
            <a href={`${APP_URL}/login`} className="block px-3 py-3 text-[14px] text-white/50 hover:text-white rounded-lg transition-colors">
              Connexion
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

// ─── FAQ accordion item ───────────────────────────────────────────────────────
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors gap-4">
        <span className="font-medium text-gray-900 text-[14px]">{question}</span>
        <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-40' : 'max-h-0'}`}>
        <p className="px-5 pb-4 text-gray-500 text-[14px] leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-[Inter,sans-serif] overflow-x-hidden">
      <NavBar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0A0A0A] pt-16">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#E8A838]/[0.05] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <svg viewBox="0 0 32 32" fill="none" className="w-[600px] h-[600px] opacity-[0.03]">
            <polygon points="16,4 30,26 2,26" fill="#E8A838"/>
            <polygon points="16,8 28,28 4,28" fill="#E8A838"/>
          </svg>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          {/* Launch badge */}
          <div className="inline-flex items-center gap-2 bg-[#E8A838]/10 border border-[#E8A838]/25 text-[#E8A838] text-xs font-semibold px-3 py-1.5 rounded-full mb-7">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8A838] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8A838]" />
            </span>
            Offre de lancement — 30 jours gratuits
          </div>

          <h1 className="text-[34px] sm:text-[52px] lg:text-[60px] font-bold text-white leading-[1.08] tracking-tight mb-5">
            Arrêtez de perdre<br />vos leads.
          </h1>

          <p className="text-[16px] sm:text-[19px] text-white/50 max-w-xl mx-auto leading-relaxed mb-8">
            ArchiCRM transforme chaque prospect en client. Conçu exclusivement pour les cabinets d'architecture marocains.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <a href={`${APP_URL}/signup`}
              className="inline-flex items-center justify-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] active:scale-95 text-[#0A0A0A] font-bold text-[15px] px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-[#E8A838]/20">
              Commencer gratuitement
              <ArrowRight size={16} />
            </a>
            <a href="#fonctionnalites" onClick={e => { e.preventDefault(); document.querySelector('#fonctionnalites')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="inline-flex items-center justify-center gap-2 border border-white/15 text-white/65 hover:text-white hover:border-white/30 font-medium text-[15px] px-7 py-3.5 rounded-xl transition-all active:scale-95">
              Voir la démo
            </a>
          </div>

          {/* Urgency line */}
          <p className="text-white/30 text-[13px]">
            ⏱ Offre de lancement — 30 jours gratuits, sans carte bancaire
          </p>

          {/* Mock dashboard */}
          <div className="mt-14 relative">
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
            {/* Glow ring */}
            <div className="absolute -inset-1 bg-[#E8A838]/10 rounded-3xl blur-xl pointer-events-none" />
            <div className="relative bg-[#111111] border border-white/[0.09] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 mx-auto max-w-3xl">
              {/* Browser bar */}
              <div className="bg-[#1a1a1a] border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <span className="w-3 h-3 rounded-full bg-green-500/50" />
                <div className="ml-2 flex-1 bg-white/[0.05] rounded-md h-5 flex items-center px-3">
                  <span className="text-white/20 text-[11px]">app.archicrm.ma</span>
                </div>
                {/* Live badge */}
                <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                  </span>
                  <span className="text-green-400 text-[10px] font-semibold">En direct</span>
                </div>
              </div>

              {/* Stat cards */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-2.5">
                {[
                  { label: 'Leads ce mois', value: '24', delta: '+8' },
                  { label: 'Clients actifs', value: '8',  delta: '+2' },
                  { label: 'Conversion',     value: '33%', delta: '+5%' },
                  { label: 'CA Total (DH)',   value: '840k', delta: '+12%' },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1.5">{s.label}</p>
                    <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                    <p className="text-green-400 text-[10px] mt-1 font-medium">{s.delta}</p>
                  </div>
                ))}
              </div>

              {/* Kanban mini */}
              <div className="px-4 pb-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: 'Nouveau',    color: 'bg-gray-400',   count: 4 },
                  { label: 'Contacté',   color: 'bg-blue-400',   count: 2 },
                  { label: 'RDV',        color: 'bg-purple-400', count: 3 },
                  { label: 'Proposition',color: 'bg-yellow-400', count: 1 },
                  { label: 'Gagné',      color: 'bg-green-400',  count: 2 },
                  { label: 'Perdu',      color: 'bg-red-400',    count: 1 },
                ].map(col => (
                  <div key={col.label} className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${col.color}`} />
                      <span className="text-white/35 text-[9px] font-medium truncate">{col.label}</span>
                    </div>
                    <div className="space-y-1">
                      {Array.from({ length: col.count > 2 ? 2 : col.count }).map((_, j) => (
                        <div key={j} className="bg-white/[0.06] rounded h-5" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ─────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100">
        <FadeIn className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          {/* City trust signal */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <div className="flex -space-x-2">
              {['K','N','A','M','Y'].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-[#E8A838]/15 border-2 border-white flex items-center justify-center">
                  <span className="text-[#E8A838] text-[11px] font-bold">{l}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-[13px] text-center">
              Déjà utilisé par des architectes à{' '}
              <span className="text-gray-800 font-medium">Casablanca, Rabat, Fès, Marrakech</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x divide-gray-100">
            {[
              { Icon: Clock,          stat: '30 jours',   label: "d'essai offerts sans engagement" },
              { Icon: Globe,          stat: '100%',        label: 'en français & darija-friendly' },
              { Icon: MessageCircle,  stat: 'Support',     label: 'WhatsApp inclus' },
            ].map(({ Icon, stat, label }) => (
              <div key={stat} className="flex flex-col items-center text-center sm:px-8">
                <div className="w-10 h-10 rounded-xl bg-[#E8A838]/10 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-[#E8A838]" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat}</p>
                <p className="text-gray-400 text-sm mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-[#E8A838] text-[12px] font-semibold uppercase tracking-widest mb-3">Fonctionnalités</p>
          <h2 className="text-[28px] sm:text-[36px] font-bold text-gray-900 leading-tight">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-gray-400 text-[15px] mt-3 max-w-xl mx-auto">
            Chaque fonctionnalité pensée pour les cabinets d'architecture marocains.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[
            { Icon: Users,      title: 'Gestion des Leads',      desc: "Suivez chaque prospect de la première prise de contact jusqu'au contrat signé." },
            { Icon: Kanban,     title: 'Pipeline Visuel',         desc: "Visualisez l'avancement de vos projets avec un tableau Kanban intuitif." },
            { Icon: Zap,        title: 'Intégration Meta Ads',    desc: 'Recevez automatiquement vos leads Facebook et Instagram directement dans le CRM.' },
            { Icon: Bell,       title: 'Rappels & Suivi',         desc: 'Ne manquez plus jamais un rendez-vous ou une relance client.' },
            { Icon: TrendingUp, title: 'Suivi Financier',         desc: "Suivez votre chiffre d'affaires et vos deals conclus mois par mois." },
            { Icon: BarChart2,  title: 'Tableau de Bord',         desc: "Des statistiques claires pour piloter votre activité en un coup d'œil." },
            { Icon: Link2,      title: 'API & Intégrations',      desc: 'Connectez ArchiCRM à vos outils existants via notre API simple.' },
          ].map(({ Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 60}>
              <div className="group h-full bg-white border border-gray-100 hover:border-[#E8A838]/50 hover:shadow-lg hover:shadow-[#E8A838]/5 rounded-2xl p-6 transition-all duration-200 relative overflow-hidden">
                {/* Gold left border on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#E8A838] scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center rounded-r" />
                <div className="w-11 h-11 rounded-xl bg-[#E8A838]/10 group-hover:bg-[#E8A838]/20 flex items-center justify-center mb-4 transition-colors">
                  <Icon size={20} className="text-[#E8A838]" strokeWidth={1.8} />
                </div>
                <h3 className="font-semibold text-gray-900 text-[15px] mb-2">{title}</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed">{desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section id="tarifs" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-12">
            <p className="text-[#E8A838] text-[12px] font-semibold uppercase tracking-widest mb-3">Tarifs</p>
            <h2 className="text-[28px] sm:text-[36px] font-bold text-gray-900 leading-tight">
              Un tarif simple et transparent
            </h2>
            <p className="text-gray-400 text-[15px] mt-3">Pas de surprise, pas de frais cachés.</p>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="max-w-md mx-auto">
              {/* Urgency text above card */}
              <p className="text-center text-[13px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl py-2.5 px-4 mb-4">
                Offre de lancement — Prix garanti pendant 12 mois
              </p>

              <div className="relative bg-[#0A0A0A] rounded-2xl border-2 border-[#E8A838] p-7 sm:p-8 shadow-2xl shadow-[#E8A838]/10">
                {/* Badges row */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="bg-[#E8A838] text-[#0A0A0A] text-xs font-bold px-3 py-1 rounded-full">Populaire</span>
                  <span className="border border-[#E8A838]/40 text-[#E8A838] text-xs font-semibold px-3 py-1 rounded-full">30 jours gratuits</span>
                </div>

                <div className="text-center mb-2">
                  <p className="text-white/40 text-[12px] uppercase tracking-widest font-semibold mb-4">Professionnel</p>
                  <div className="flex items-end justify-center gap-2 mb-2">
                    <span className="text-[64px] font-bold text-white leading-none">500</span>
                    <div className="mb-2 text-left">
                      <p className="text-[#E8A838] font-bold text-[18px] leading-none">DH</p>
                      <p className="text-white/30 text-[12px] leading-tight">/ mois</p>
                    </div>
                  </div>
                  <p className="text-white/35 text-[13px] mb-6">
                    Soit moins de <span className="text-[#E8A838] font-semibold">17 DH par jour</span> pour ne plus perdre un seul lead.
                  </p>
                </div>

                <ul className="space-y-3 mb-7">
                  {[
                    'Gestion illimitée des leads',
                    'Pipeline Kanban',
                    'Intégration Meta Ads',
                    'Rappels automatiques',
                    'Suivi financier',
                    'Tableau de bord analytique',
                    'Support WhatsApp',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-3 text-[14px] text-white/75">
                      <div className="w-5 h-5 rounded-full bg-[#E8A838]/15 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-[#E8A838]" strokeWidth={2.5} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <a href={`${APP_URL}/signup`}
                  className="block w-full text-center bg-[#E8A838] hover:bg-[#d4952a] active:scale-95 text-[#0A0A0A] font-bold text-[15px] py-3.5 rounded-xl transition-all shadow-lg shadow-[#E8A838]/20">
                  Commencer l'essai gratuit
                </a>

                <p className="text-center text-white/25 text-[12px] mt-3">
                  Aucune carte bancaire requise. Annulez à tout moment.
                </p>

                {/* Trust checks */}
                <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                  {['Sans engagement', 'Résiliable à tout moment', 'Données sécurisées'].map(t => (
                    <span key={t} className="flex items-center gap-1 text-[11px] text-white/30">
                      <Check size={10} className="text-[#E8A838]/60" strokeWidth={2.5} />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-12">
          <p className="text-[#E8A838] text-[12px] font-semibold uppercase tracking-widest mb-3">Témoignages</p>
          <h2 className="text-[28px] sm:text-[36px] font-bold text-gray-900 leading-tight">
            Ce que disent nos clients
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {[
            {
              name: 'Karim Bensouda',
              role: 'Architecte DPLG, Casablanca',
              text: "En 3 mois, j'ai doublé mon taux de conversion grâce au suivi automatique des leads. Je ne peux plus m'en passer.",
            },
            {
              name: 'Naïla El Fassi',
              role: "Cabinet d'Architecture, Rabat",
              text: "L'intégration Meta Ads m'a sauvé la mise. Mes leads Facebook arrivent directement dans le CRM, plus aucun oublié.",
            },
          ].map(({ name, role, text }, i) => (
            <FadeIn key={name} delay={i * 100}>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 h-full relative">
                {/* Quote mark */}
                <div className="text-[64px] leading-none text-[#E8A838]/15 font-serif absolute top-3 left-5 select-none pointer-events-none">"</div>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className="text-[#E8A838] fill-[#E8A838]" />
                  ))}
                </div>

                <p className="text-gray-600 text-[14px] leading-relaxed mb-5 relative z-10">{text}</p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8A838]/15 border border-[#E8A838]/25 flex items-center justify-center shrink-0">
                    <span className="text-[#E8A838] font-bold text-sm">{name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-[14px]">{name}</p>
                    <p className="text-gray-400 text-[12px]">{role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-10">
            <p className="text-[#E8A838] text-[12px] font-semibold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-[28px] sm:text-[36px] font-bold text-gray-900 leading-tight">
              Questions fréquentes
            </h2>
          </FadeIn>

          <FadeIn delay={80}>
            <div className="space-y-3">
              {[
                {
                  question: "Est-ce que l'essai est vraiment gratuit ?",
                  answer: "Oui, 30 jours complets sans aucune carte bancaire requise. Vous accédez à toutes les fonctionnalités dès le premier jour.",
                },
                {
                  question: "Puis-je annuler à tout moment ?",
                  answer: "Oui, aucun engagement. Vous annulez quand vous voulez, sans frais ni justification nécessaire.",
                },
                {
                  question: "Le CRM est-il en arabe ?",
                  answer: "L'interface est entièrement en français, optimisée pour le marché marocain. Une version en arabe est prévue dans une prochaine mise à jour.",
                },
                {
                  question: "Comment fonctionne l'intégration Meta Ads ?",
                  answer: "Vous connectez votre page Facebook en 2 clics depuis les paramètres. Dès lors, chaque lead généré par vos formulaires Facebook ou Instagram est automatiquement importé dans ArchiCRM en temps réel.",
                },
                {
                  question: "Mes données sont-elles sécurisées ?",
                  answer: "Oui, toutes vos données sont hébergées sur des serveurs sécurisés avec chiffrement SSL. Vous restez propriétaire de vos données à tout moment.",
                },
                {
                  question: "Puis-je importer mes leads existants ?",
                  answer: "Oui, vous pouvez importer vos leads depuis Excel ou CSV directement dans ArchiCRM.",
                },
              ].map(item => (
                <FAQItem key={item.question} {...item} />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-[#0A0A0A] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[350px] bg-[#E8A838]/[0.06] rounded-full blur-3xl" />
        </div>
        <FadeIn className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-[28px] sm:text-[40px] font-bold text-white leading-tight mb-4">
            Prêt à ne plus perdre<br className="hidden sm:block" /> un seul lead ?
          </h2>
          <p className="text-white/40 text-[16px] mb-8 max-w-lg mx-auto">
            Rejoignez les architectes marocains qui pilotent leur activité avec ArchiCRM.
          </p>
          <a href={`${APP_URL}/signup`}
            className="inline-flex items-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] active:scale-95 text-[#0A0A0A] font-bold text-[15px] sm:text-[17px] px-8 py-4 rounded-xl transition-all shadow-xl shadow-[#E8A838]/20">
            Commencer mon essai gratuit — 30 jours
            <ArrowRight size={18} />
          </a>
          <p className="text-white/20 text-[13px] mt-4 space-x-3">
            <span>Aucune carte bancaire</span>
            <span>·</span>
            <span>Accès immédiat</span>
            <span>·</span>
            <span>Annulation facile</span>
          </p>
        </FadeIn>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-[#060606] border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Logo size={24} />
                <span className="font-bold text-[14px]">
                  <span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span>
                </span>
              </div>
              <p className="text-white/25 text-[13px]">Le CRM des architectes marocains</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center sm:justify-end">
              <Link to="/terms"   className="text-white/30 hover:text-white/60 text-[13px] transition-colors">Mentions légales</Link>
              <Link to="/privacy" className="text-white/30 hover:text-white/60 text-[13px] transition-colors">Confidentialité</Link>
              <a href="mailto:contact@archicrm.ma" className="text-white/30 hover:text-white/60 text-[13px] transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/[0.05] text-center">
            <p className="text-white/15 text-[12px]">© 2025 ArchiCRM. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
