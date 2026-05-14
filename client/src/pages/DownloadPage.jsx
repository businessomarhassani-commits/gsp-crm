import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Download, Check, X, ChevronDown, ChevronUp, ArrowLeft, Wifi, HardDrive, Usb } from 'lucide-react'
import Logo from '../components/Logo'

const VERSION = '1.0.0'
const WIN_SIZE = '83 MB'

// ── Windows SVG icon ─────────────────────────────────────────────────────────
function WindowsIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <rect width="88" height="88" rx="16" fill="#0078D4" />
      <g transform="translate(16,16)">
        <rect x="0"  y="0"  width="24" height="24" fill="white" />
        <rect x="32" y="0"  width="24" height="24" fill="white" />
        <rect x="0"  y="32" width="24" height="24" fill="white" />
        <rect x="32" y="32" width="24" height="24" fill="white" />
      </g>
    </svg>
  )
}

// ── Apple SVG icon ────────────────────────────────────────────────────────────
function AppleIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <rect width="88" height="88" rx="16" fill="#1C1C1E" />
      <path
        d="M56.3 44.8c-.1-5.9 4.8-8.7 5-8.9-2.7-4-6.9-4.5-8.4-4.6-3.6-.4-7 2.1-8.8 2.1-1.8 0-4.6-2-7.6-2-3.9.1-7.5 2.3-9.5 5.8-4.1 7.1-1 17.5 2.9 23.3 1.9 2.8 4.2 5.9 7.2 5.8 2.9-.1 4-1.9 7.5-1.9s4.5 1.9 7.6 1.8c3.1-.1 5.1-2.8 7-5.6 2.2-3.2 3.1-6.3 3.2-6.4-.1-.1-6.1-2.4-6.1-9.4zM50.7 27.5c1.6-2 2.7-4.7 2.4-7.5-2.3.1-5.1 1.6-6.8 3.6-1.5 1.7-2.8 4.5-2.4 7.1 2.5.2 5.2-1.3 6.8-3.2z"
        fill="white"
      />
    </svg>
  )
}

// ── Comparison row ────────────────────────────────────────────────────────────
function CompRow({ label, web, desktop, webOk = false, desktopOk = true }) {
  return (
    <tr className="border-t border-white/[0.05]">
      <td className="py-3 px-4 text-white/40 text-[13px]">{label}</td>
      <td className="py-3 px-4 text-center">
        {typeof web === 'string'
          ? <span className="text-white/50 text-[12px]">{web}</span>
          : web
            ? <Check size={15} className="text-[#E8A838] mx-auto" />
            : <X size={15} className="text-red-500/60 mx-auto" />
        }
      </td>
      <td className="py-3 px-4 text-center">
        {typeof desktop === 'string'
          ? <span className="text-white/70 text-[12px]">{desktop}</span>
          : desktop
            ? <Check size={15} className="text-[#E8A838] mx-auto" />
            : <X size={15} className="text-red-500/60 mx-auto" />
        }
      </td>
    </tr>
  )
}

// ── FAQ accordion item ────────────────────────────────────────────────────────
function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/[0.07] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-white text-[13px] font-medium">{q}</span>
        {open ? <ChevronUp size={15} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={15} className="text-white/30 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-white/40 text-[13px] leading-relaxed border-t border-white/[0.05] pt-3">
          {a}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DownloadPage() {
  const location = useLocation()

  // Scroll to anchor on load
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [location.hash])

  // Mac is not yet built (Windows-only build machine)
  const macAvailable = false

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-[Inter,sans-serif]">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="border-b-2 border-[#E8A838]/40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-bold text-[16px]">
              <span className="text-white">Archi</span><span className="text-[#E8A838]">CRM</span>
            </span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-[13px] transition-colors"
          >
            <ArrowLeft size={14} />
            Retour à la connexion
          </Link>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-14 text-center">
        <h1 className="text-[2.6rem] sm:text-5xl font-bold leading-tight mb-4">
          <span className="text-[#E8A838]">ArchiCRM</span> Bureau
        </h1>
        <p className="text-white/45 text-[17px] leading-relaxed max-w-lg mx-auto mb-8">
          Votre CRM complet, même sans internet
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: <HardDrive size={13} />, label: '100% Hors ligne' },
            { icon: <Wifi size={13} />,      label: 'Sync automatique' },
            { icon: <Usb size={13} />,       label: 'Portable USB' },
          ].map(b => (
            <span key={b.label}
              className="flex items-center gap-1.5 bg-[#E8A838]/10 border border-[#E8A838]/25 text-[#E8A838] text-[12px] font-semibold px-3.5 py-1.5 rounded-full"
            >
              {b.icon}{b.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── COMPARISON TABLE ────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-white/60 text-[11px] uppercase tracking-widest font-semibold text-center mb-5">
          Comparaison des versions
        </h2>
        <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#E8A838]/10">
                <th className="py-3.5 px-4 text-left text-[12px] font-semibold text-white/40 uppercase tracking-wider">Fonctionnalité</th>
                <th className="py-3.5 px-4 text-center text-[12px] font-semibold text-white/60 uppercase tracking-wider">Version Web</th>
                <th className="py-3.5 px-4 text-center text-[12px] font-bold text-[#E8A838] uppercase tracking-wider">Version Bureau</th>
              </tr>
            </thead>
            <tbody>
              <CompRow label="Accès"           web="Navigateur"  desktop="Application dédiée" />
              <CompRow label="Internet requis" web={true}        desktop={false} />
              <CompRow label="Données"         web="Cloud"       desktop="Locale + sync" />
              <CompRow label="Portable USB"    web={false}       desktop={true} />
              <CompRow label="Mises à jour"    web="Automatiques" desktop="Manuelles" />
            </tbody>
          </table>
        </div>
      </section>

      {/* ── DOWNLOAD CARDS ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-white/60 text-[11px] uppercase tracking-widest font-semibold text-center mb-6">
          Choisissez votre plateforme
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Windows card */}
          <div id="windows" className="bg-[#111] border-2 border-[#E8A838]/35 rounded-2xl p-7 flex flex-col scroll-mt-24">
            <div className="flex items-center gap-4 mb-5">
              <WindowsIcon size={52} />
              <div>
                <h3 className="text-white font-bold text-[17px]">ArchiCRM pour Windows</h3>
                <p className="text-white/35 text-[12px] mt-0.5">Windows 10 / 11 — 64 bit</p>
              </div>
            </div>

            <div className="flex gap-5 mb-6">
              <div>
                <p className="text-white/25 text-[10px] uppercase tracking-wider mb-0.5">Taille</p>
                <p className="text-white/70 text-[13px] font-semibold">{WIN_SIZE}</p>
              </div>
              <div>
                <p className="text-white/25 text-[10px] uppercase tracking-wider mb-0.5">Version</p>
                <p className="text-white/70 text-[13px] font-semibold">v{VERSION}</p>
              </div>
            </div>

            <a
              href="/api/download/windows"
              className="flex items-center justify-center gap-2.5 bg-[#E8A838] hover:bg-[#d49730] text-[#0A0A0A] font-bold text-[14px] py-3.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-[#E8A838]/15 mt-auto"
            >
              <Download size={17} />
              Télécharger .exe
            </a>
            <p className="text-white/25 text-[11px] text-center mt-3">
              Installation simple — double-cliquez et suivez les étapes
            </p>
          </div>

          {/* Mac card */}
          <div id="mac" className="bg-[#111] border border-white/[0.07] rounded-2xl p-7 flex flex-col scroll-mt-24 relative overflow-hidden">
            {!macAvailable && (
              <div className="absolute top-3.5 right-3.5">
                <span className="bg-white/[0.08] text-white/35 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/[0.08]">
                  Bientôt disponible
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 mb-5">
              <AppleIcon size={52} />
              <div>
                <h3 className={`font-bold text-[17px] ${macAvailable ? 'text-white' : 'text-white/40'}`}>
                  ArchiCRM pour Mac
                </h3>
                <p className="text-white/25 text-[12px] mt-0.5">macOS 11+ (Intel + Apple Silicon)</p>
              </div>
            </div>

            <div className="flex gap-5 mb-6">
              <div>
                <p className="text-white/15 text-[10px] uppercase tracking-wider mb-0.5">Taille</p>
                <p className="text-white/30 text-[13px] font-semibold">TBD</p>
              </div>
              <div>
                <p className="text-white/15 text-[10px] uppercase tracking-wider mb-0.5">Version</p>
                <p className="text-white/30 text-[13px] font-semibold">v{VERSION}</p>
              </div>
            </div>

            {macAvailable ? (
              <a
                href="/api/download/mac"
                className="flex items-center justify-center gap-2.5 bg-[#E8A838] hover:bg-[#d49730] text-[#0A0A0A] font-bold text-[14px] py-3.5 rounded-xl transition-all hover:scale-[1.02] mt-auto"
              >
                <Download size={17} />
                Télécharger .dmg
              </a>
            ) : (
              <a
                href="mailto:hassaniomar759@gmail.com?subject=Demande%20version%20Mac%20ArchiCRM"
                className="flex items-center justify-center gap-2.5 bg-white/[0.05] hover:bg-white/[0.09] text-white/35 hover:text-white/55 font-bold text-[14px] py-3.5 rounded-xl transition-colors mt-auto border border-white/[0.08]"
              >
                <Download size={17} />
                Demander la version Mac
              </a>
            )}
            <div className="text-center mt-3 space-y-1">
              <p className="text-white text-[12px] font-medium">
                {macAvailable ? 'Ouvrez le .dmg et glissez ArchiCRM dans Applications' : 'Version Mac disponible sur demande'}
              </p>
              <p className="text-white/30 text-[11px]">
                {macAvailable ? '' : 'Contactez-nous pour obtenir la version Mac'}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── INSTALLATION STEPS ──────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-white font-bold text-[18px] text-center mb-8">
          Installation en <span className="text-[#E8A838]">3 étapes</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              n: '1',
              title: 'Téléchargez',
              desc: 'Cliquez sur le bouton ci-dessus pour télécharger le fichier d\'installation.',
            },
            {
              n: '2',
              title: 'Installez',
              desc: 'Double-cliquez sur le fichier téléchargé. L\'installation dure moins de 30 secondes.',
            },
            {
              n: '3',
              title: 'Connectez-vous',
              desc: 'Utilisez vos identifiants ArchiCRM ou créez un compte local pour travailler hors ligne.',
            },
          ].map(s => (
            <div key={s.n} className="bg-[#111] border border-white/[0.06] rounded-2xl p-6 text-center">
              <div className="w-10 h-10 bg-[#E8A838]/10 border-2 border-[#E8A838]/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#E8A838] font-bold text-[16px]">{s.n}</span>
              </div>
              <h3 className="text-white font-semibold text-[14px] mb-2">{s.title}</h3>
              <p className="text-white/35 text-[12.5px] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-white font-bold text-[18px] text-center mb-7">Questions fréquentes</h2>
        <div className="space-y-2">
          <FAQ
            q="Mes données sont-elles sécurisées ?"
            a="Oui. Toutes vos données sont stockées localement sur votre ordinateur dans une base SQLite. Elles ne quittent votre machine que lors de la synchronisation cloud, qui utilise une connexion HTTPS chiffrée vers nos serveurs Supabase."
          />
          <FAQ
            q="Puis-je utiliser les deux versions (web + bureau) ?"
            a="Oui, absolument. Les deux versions se synchronisent automatiquement. Quand vous ajoutez un lead sur le web, il apparaîtra dans l'application de bureau dès la prochaine synchronisation (toutes les 5 minutes si internet est disponible)."
          />
          <FAQ
            q="Comment transférer mes données sur clé USB ?"
            a="Dans l'application de bureau, allez dans Fichier → Exporter les données. Choisissez votre clé USB comme destination. Le fichier .db peut être importé sur n'importe quel autre ordinateur via Fichier → Importer les données."
          />
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] px-6 py-8 text-center">
        <p className="text-white/15 text-[12px]">
          © 2025 ArchiCRM · Tous droits réservés{' · '}
          <Link to="/privacy" className="hover:text-white/40 transition-colors">Confidentialité</Link>
          {' · '}
          <Link to="/terms" className="hover:text-white/40 transition-colors">CGU</Link>
          {' · '}
          <a href="mailto:contact@crm.archi" className="hover:text-white/40 transition-colors">Contact</a>
        </p>
      </footer>
    </div>
  )
}
