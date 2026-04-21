import { ShieldAlert, X } from 'lucide-react'

export default function ImpersonationBanner({ userName, onExit }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-[#E8A838] text-[#0A0A0A] px-3 sm:px-4 h-12 flex items-center gap-2 sm:gap-3 shadow-lg">
      <ShieldAlert size={14} strokeWidth={2.5} className="shrink-0" />

      {/* Short text on mobile, full text on desktop */}
      <p className="text-xs sm:text-[13px] font-semibold flex-1 min-w-0 truncate">
        <span className="sm:hidden">
          Admin — <strong className="truncate">{userName}</strong>
        </span>
        <span className="hidden sm:inline">
          Vous consultez le CRM de <strong>{userName}</strong> en tant qu'administrateur
        </span>
      </p>

      <button
        onClick={onExit}
        className="shrink-0 flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] font-bold bg-[#0A0A0A] text-[#E8A838] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md hover:bg-[#111] transition-colors whitespace-nowrap"
      >
        <X size={11} />
        <span className="sm:hidden">Retour</span>
        <span className="hidden sm:inline">Retour admin</span>
      </button>
    </div>
  )
}
