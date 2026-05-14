import { useState } from 'react'
import { Download, Monitor, CheckCircle, Shield, Zap, Globe, ArrowRight, Copy, Check } from 'lucide-react'

const DOWNLOAD_URL =
  'https://github.com/businessomarhassani-commits/gsp-crm/releases/latest/download/ArchiCRM-Setup-1.0.0.exe'

const VERSION = '1.0.0'

export default function DownloadPage() {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(DOWNLOAD_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ── Header ── */}
      <header className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <polygon points="16,4 30,26 2,26" fill="#E8A838" opacity="0.35"/>
            <polygon points="16,8 28,28 4,28" fill="#E8A838"/>
          </svg>
          <span className="font-bold text-[16px]">
            <span className="text-white">Archi</span>
            <span className="text-[#E8A838]">CRM</span>
          </span>
        </div>
        <a
          href="https://app.crm.archi"
          className="text-white/40 hover:text-white text-[13px] transition-colors flex items-center gap-1.5"
        >
          <Globe size={14} />
          Accéder au CRM en ligne
        </a>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        {/* Platform badge */}
        <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-1.5 text-[12px] text-white/40 mb-8">
          <Monitor size={12} />
          Application de bureau — Windows
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
          Télécharger{' '}
          <span className="text-[#E8A838]">ArchiCRM</span>
          <br />pour Windows
        </h1>
        <p className="text-white/40 text-[17px] leading-relaxed max-w-xl mx-auto mb-10">
          Accédez à votre CRM directement depuis votre bureau, sans navigateur.
          Rapide, fluide, toujours à portée de main.
        </p>

        {/* Download button */}
        <a
          href={DOWNLOAD_URL}
          className="inline-flex items-center gap-3 bg-[#E8A838] hover:bg-[#d49730] text-[#0A0A0A] font-bold text-[16px] px-8 py-4 rounded-2xl transition-all hover:scale-[1.02] shadow-2xl shadow-[#E8A838]/20 group"
        >
          <Download size={20} />
          Télécharger ArchiCRM v{VERSION}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </a>

        <p className="text-white/20 text-[12px] mt-4">
          ArchiCRM-Setup-{VERSION}.exe · Windows 10 / 11 (64-bit)
        </p>

        {/* Copy link */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-[12px] text-white/30 font-mono max-w-sm truncate">
            {DOWNLOAD_URL.replace('https://github.com/', 'github.com/')}
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[12px] text-white/40 hover:text-white/70 transition-all"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <Zap size={18} className="text-[#E8A838]" />,
              title: 'Lancement rapide',
              desc: 'Ouvrez ArchiCRM en un clic depuis votre barre des tâches, sans ouvrir un navigateur.'
            },
            {
              icon: <Shield size={18} className="text-[#E8A838]" />,
              title: 'Sécurisé',
              desc: 'Connexion chiffrée HTTPS à votre compte ArchiCRM. Vos données restent sur nos serveurs sécurisés.'
            },
            {
              icon: <CheckCircle size={18} className="text-[#E8A838]" />,
              title: 'Toujours à jour',
              desc: 'L\'application se connecte à app.crm.archi — vous avez toujours la dernière version automatiquement.'
            }
          ].map(f => (
            <div key={f.title} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <div className="w-9 h-9 bg-[#E8A838]/10 rounded-xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-[14px] mb-2">{f.title}</h3>
              <p className="text-white/35 text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Requirements + Instructions ── */}
      <section className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Requirements */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="font-semibold text-[14px] mb-5 text-white/70 uppercase tracking-widest text-[11px]">
            Configuration requise
          </h2>
          <ul className="space-y-3">
            {[
              ['Système', 'Windows 10 ou 11 (64-bit)'],
              ['Processeur', 'Intel / AMD x64'],
              ['RAM', '4 Go minimum'],
              ['Espace disque', '300 Mo'],
              ['Connexion', 'Internet requise'],
              ['Version', `v${VERSION}`]
            ].map(([label, value]) => (
              <li key={label} className="flex justify-between text-[13px]">
                <span className="text-white/30">{label}</span>
                <span className="text-white/70 font-medium">{value}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Installation */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="font-semibold text-[14px] mb-5 text-white/70 uppercase tracking-widest text-[11px]">
            Installation
          </h2>
          <ol className="space-y-4">
            {[
              'Téléchargez le fichier ArchiCRM-Setup.exe ci-dessus.',
              'Double-cliquez sur le fichier téléchargé pour lancer l\'installation.',
              'Suivez les instructions — l\'installation dure moins de 30 secondes.',
              'ArchiCRM s\'ouvre automatiquement et un raccourci est créé sur le bureau.',
              'Connectez-vous avec vos identifiants ArchiCRM habituels.'
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-[13px]">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E8A838]/15 border border-[#E8A838]/30 text-[#E8A838] text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-white/50 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] px-6 py-8 text-center">
        <p className="text-white/15 text-[12px]">
          © 2025 ArchiCRM · <a href="/privacy" className="hover:text-white/40 transition-colors">Confidentialité</a>
          {' · '}
          <a href="/terms" className="hover:text-white/40 transition-colors">Mentions légales</a>
          {' · '}
          <a href="mailto:contact@crm.archi" className="hover:text-white/40 transition-colors">Contact</a>
        </p>
      </footer>
    </div>
  )
}
