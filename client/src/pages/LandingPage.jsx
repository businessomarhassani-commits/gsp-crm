import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Kanban, Zap, Bell, TrendingUp, BarChart2,
  Check, ChevronDown, Menu, X, Star, ArrowRight,
  Shield, Clock, Globe,
} from 'lucide-react'
import Logo from '../components/Logo'

const APP_URL = 'https://app.archicrm.ma'

// ─── Reusable components ──────────────────────────────────────────────────────

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

  const handleAnchor = (e, href) => {
    e.preventDefault()
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? 'bg-[#0A0A0A]/95 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-[#0A0A0A]'} border-b-2 border-[#E8A838]`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link to="/landing" className="flex items-center gap-2.5 shrink-0">
          <Logo size={28} />
          <span className="font-bold text-[15px]">
            <span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={e => handleAnchor(e, l.href)}
              className="px-3 py-2 text-[13px] text-white/55 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <a
            href={`${APP_URL}/login`}
            className="hidden sm:block text-[13px] text-white/55 hover:text-white transition-colors"
          >
            Connexion
          </a>
          <a
            href={`${APP_URL}/signup`}
            className="bg-[#E8A838] hover:bg-[#d4952a] text-[#0A0A0A] text-[13px] font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Commencer l'essai gratuit
          </a>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-t border-white/[0.07] px-4 pb-4 space-y-1">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={e => handleAnchor(e, l.href)}
              className="block px-3 py-3 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-2 border-t border-white/[0.07]">
            <a
              href={`${APP_URL}/login`}
              className="block px-3 py-3 text-[13px] text-white/60 hover:text-white transition-colors rounded-lg"
            >
              Connexion
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 text-[14px] pr-4">{question}</span>
        <ChevronDown
          size={18}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-gray-500 text-[14px] leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-[Inter,sans-serif]">
      <NavBar />

      {/* ── 1. HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0A0A0A] pt-16">
        {/* Faded background logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <svg viewBox="0 0 32 32" fill="none" className="w-[520px] h-[520px] opacity-[0.035]">
            <polygon points="16,4 30,26 2,26" fill="#E8A838"/>
            <polygon points="16,8 28,28 4,28" fill="#E8A838"/>
          </svg>
        </div>
        {/* Subtle gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E8A838]/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8A838]/10 border border-[#E8A838]/25 text-[#E8A838] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8A838]" />
            Essai gratuit 30 jours — aucune carte requise
          </div>

          <h1 className="text-[36px] sm:text-[52px] lg:text-[60px] font-bold text-white leading-[1.1] tracking-tight mb-6">
            Le CRM conçu pour les<br />
            <span className="text-[#E8A838]">architectes marocains</span>
          </h1>

          <p className="text-[17px] sm:text-[19px] text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
            Gérez vos leads, clients et projets en un seul endroit.
            Essai gratuit 30 jours, sans carte bancaire.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`${APP_URL}/signup`}
              className="inline-flex items-center justify-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] text-[#0A0A0A] font-bold text-[15px] px-7 py-3.5 rounded-xl transition-colors"
            >
              Commencer gratuitement
              <ArrowRight size={16} />
            </a>
            <a
              href="#fonctionnalites"
              onClick={e => { e.preventDefault(); document.querySelector('#fonctionnalites')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="inline-flex items-center justify-center gap-2 border border-white/15 text-white/70 hover:text-white hover:border-white/30 font-medium text-[15px] px-7 py-3.5 rounded-xl transition-colors"
            >
              Voir la démo
            </a>
          </div>

          {/* Hero bottom fade */}
          <div className="mt-20 relative">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0A0A0A] to-transparent z-10" />
            <div className="bg-[#111111] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl mx-auto max-w-3xl">
              {/* Fake browser bar */}
              <div className="bg-[#1a1a1a] border-b border-white/[0.06] px-4 py-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="ml-3 flex-1 bg-white/[0.05] rounded-md h-6 flex items-center px-3">
                  <span className="text-white/25 text-xs">app.archicrm.ma</span>
                </div>
              </div>
              {/* Mock dashboard */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {[
                  { label: 'Leads ce mois', value: '24' },
                  { label: 'Clients actifs', value: '8' },
                  { label: "Taux d'conv.", value: '33%' },
                  { label: 'CA Total', value: '840k' },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-white font-bold text-xl">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 grid grid-cols-3 gap-2">
                {['Nouveau','Contacté','Proposition','Rendez-vous','Gagné','Perdu'].map((s, i) => (
                  <div key={s} className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`w-2 h-2 rounded-full ${['bg-gray-400','bg-blue-400','bg-yellow-400','bg-purple-400','bg-green-400','bg-red-400'][i]}`} />
                      <span className="text-white/40 text-[10px] font-medium">{s}</span>
                    </div>
                    <div className="space-y-1.5">
                      {Array.from({ length: Math.floor(Math.random() * 2) + 1 }).map((_, j) => (
                        <div key={j} className="bg-white/[0.05] rounded h-6" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SOCIAL PROOF BAR ──────────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-center text-gray-400 text-[13px] font-medium uppercase tracking-wider mb-8">
            Rejoignez les architectes qui font confiance à ArchiCRM
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x divide-gray-100">
            {[
              { icon: Clock,  stat: '30 jours',      label: "d'essai gratuit" },
              { icon: Globe,  stat: '100%',           label: 'en français' },
              { icon: Shield, stat: 'Support',        label: 'inclus dès le premier jour' },
            ].map(({ icon: Icon, stat, label }) => (
              <div key={stat} className="flex flex-col items-center text-center sm:px-8">
                <div className="w-10 h-10 rounded-xl bg-[#E8A838]/10 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-[#E8A838]" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat}</p>
                <p className="text-gray-400 text-sm mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES ──────────────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-[#E8A838] text-[13px] font-semibold uppercase tracking-widest mb-3">Fonctionnalités</p>
          <h2 className="text-[30px] sm:text-[38px] font-bold text-gray-900 leading-tight">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-gray-400 text-[16px] mt-3 max-w-xl mx-auto">
            Conçu spécifiquement pour les cabinets d'architecture marocains.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              Icon: Users,
              title: 'Gestion des Leads',
              desc: 'Suivez chaque prospect de la première prise de contact jusqu\'au contrat signé.',
            },
            {
              Icon: Kanban,
              title: 'Pipeline Visuel',
              desc: 'Visualisez l\'avancement de vos projets avec un tableau Kanban intuitif.',
            },
            {
              Icon: Zap,
              title: 'Intégration Meta Ads',
              desc: 'Recevez automatiquement vos leads Facebook et Instagram directement dans le CRM.',
            },
            {
              Icon: Bell,
              title: 'Rappels & Suivi',
              desc: 'Ne manquez plus jamais un rendez-vous ou une relance client.',
            },
            {
              Icon: TrendingUp,
              title: 'Suivi Financier',
              desc: 'Suivez votre chiffre d\'affaires et vos deals conclus mois par mois.',
            },
            {
              Icon: BarChart2,
              title: 'Tableau de Bord',
              desc: 'Des statistiques claires pour piloter votre activité en un coup d\'œil.',
            },
          ].map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="group bg-white border border-gray-100 hover:border-[#E8A838]/40 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:shadow-[#E8A838]/5"
            >
              <div className="w-11 h-11 rounded-xl bg-[#E8A838]/10 group-hover:bg-[#E8A838]/20 flex items-center justify-center mb-4 transition-colors">
                <Icon size={20} className="text-[#E8A838]" strokeWidth={1.8} />
              </div>
              <h3 className="font-semibold text-gray-900 text-[15px] mb-2">{title}</h3>
              <p className="text-gray-400 text-[14px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. PRICING ───────────────────────────────────────────────────────── */}
      <section id="tarifs" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[#E8A838] text-[13px] font-semibold uppercase tracking-widest mb-3">Tarifs</p>
            <h2 className="text-[30px] sm:text-[38px] font-bold text-gray-900 leading-tight">
              Un tarif simple et transparent
            </h2>
            <p className="text-gray-400 text-[16px] mt-3">
              Pas de surprise, pas de frais cachés.
            </p>
          </div>

          {/* Single pricing card */}
          <div className="max-w-md mx-auto">
            <div className="relative bg-[#0A0A0A] rounded-2xl border-2 border-[#E8A838] p-8 shadow-2xl shadow-[#E8A838]/10">
              {/* Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-[#E8A838] text-[#0A0A0A] text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                  30 jours gratuits
                </span>
              </div>

              <div className="text-center mb-8 pt-2">
                <p className="text-white/40 text-[13px] uppercase tracking-widest font-semibold mb-4">Professionnel</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-[48px] font-bold text-white leading-none">500</span>
                  <div className="mb-1.5">
                    <span className="text-[#E8A838] font-semibold text-lg">DH</span>
                    <p className="text-white/30 text-[12px]">/ mois</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Gestion illimitée des leads',
                  'Pipeline Kanban',
                  'Intégration Meta Ads',
                  'Rappels automatiques',
                  'Suivi financier',
                  'Tableau de bord analytique',
                  'Support par email',
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-[14px] text-white/75">
                    <div className="w-5 h-5 rounded-full bg-[#E8A838]/15 flex items-center justify-center shrink-0">
                      <Check size={11} className="text-[#E8A838]" strokeWidth={2.5} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={`${APP_URL}/signup`}
                className="block w-full text-center bg-[#E8A838] hover:bg-[#d4952a] text-[#0A0A0A] font-bold text-[15px] py-3.5 rounded-xl transition-colors"
              >
                Commencer l'essai gratuit
              </a>
              <p className="text-center text-white/25 text-[12px] mt-3">
                Aucune carte bancaire requise. Annulez à tout moment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-[#E8A838] text-[13px] font-semibold uppercase tracking-widest mb-3">Témoignages</p>
          <h2 className="text-[30px] sm:text-[38px] font-bold text-gray-900 leading-tight">
            Ce que disent nos clients
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            {
              name: 'Karim Bensaïd',
              role: 'Architecte DPLG, Casablanca',
              text: 'ArchiCRM a transformé ma façon de gérer les prospects. En 2 mois, mon taux de conversion a augmenté de 40%. L\'intégration Meta Ads est particulièrement puissante.',
            },
            {
              name: 'Nadia El Fassi',
              role: 'Cabinet d\'architecture, Rabat',
              text: 'Enfin un CRM pensé pour nous ! L\'interface en français, le pipeline visuel et les rappels automatiques me font gagner des heures chaque semaine.',
            },
          ].map(({ name, role, text }) => (
            <div key={name} className="bg-white border border-gray-100 rounded-2xl p-6 relative">
              {/* Gold quote mark */}
              <div className="text-[56px] leading-none text-[#E8A838]/20 font-serif absolute top-4 left-5 select-none">"</div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="text-[#E8A838] fill-[#E8A838]" />
                ))}
              </div>

              <p className="text-gray-600 text-[14px] leading-relaxed mb-5">{text}</p>

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
          ))}
        </div>
      </section>

      {/* ── 6. FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[#E8A838] text-[13px] font-semibold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-[30px] sm:text-[38px] font-bold text-gray-900 leading-tight">
              Questions fréquentes
            </h2>
          </div>

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
            ].map(item => (
              <FAQItem key={item.question} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-[#0A0A0A] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-[#E8A838]/[0.06] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-[28px] sm:text-[38px] font-bold text-white leading-tight mb-4">
            Prêt à transformer votre gestion client ?
          </h2>
          <p className="text-white/45 text-[16px] mb-8">
            Rejoignez les architectes marocains qui ont choisi ArchiCRM pour développer leur activité.
          </p>
          <a
            href={`${APP_URL}/signup`}
            className="inline-flex items-center gap-2 bg-[#E8A838] hover:bg-[#d4952a] text-[#0A0A0A] font-bold text-[15px] px-8 py-4 rounded-xl transition-colors"
          >
            Commencer l'essai gratuit — 30 jours
            <ArrowRight size={16} />
          </a>
          <p className="text-white/25 text-[13px] mt-4">Aucune carte bancaire requise</p>
        </div>
      </section>

      {/* ── 8. FOOTER ────────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-[#060606] border-t border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Logo size={24} />
                <span className="font-bold text-[14px]">
                  <span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span>
                </span>
              </div>
              <p className="text-white/30 text-[13px]">Le CRM des architectes marocains</p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-center sm:justify-end">
              <Link to="/terms"   className="text-white/35 hover:text-white/70 text-[13px] transition-colors">Mentions légales</Link>
              <Link to="/privacy" className="text-white/35 hover:text-white/70 text-[13px] transition-colors">Politique de confidentialité</Link>
              <a href="mailto:contact@archicrm.ma" className="text-white/35 hover:text-white/70 text-[13px] transition-colors">Contact</a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-white/20 text-[12px]">© 2025 ArchiCRM. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
