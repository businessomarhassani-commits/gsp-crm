import { ShieldAlert, X } from 'lucide-react'

export default function ImpersonationBanner({ userName, onExit }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-[#E8A838] text-[#0A0A0A] px-4 py-2.5 flex items-center gap-3 shadow-lg">
      <ShieldAlert size={16} strokeWidth={2.5} className="shrink-0" />
      <p className="text-[13px] font-semibold flex-1">
        Vous consultez le CRM de <strong>{userName}</strong> en tant qu'administrateur — Session lecture seule
      </p>
      <button
        onClick={onExit}
        className="flex items-center gap-1.5 text-[12px] font-bold bg-[#0A0A0A] text-[#E8A838] px-3 py-1 rounded-md hover:bg-[#111] transition-colors"
      >
        <X size={12} />
        Retour admin
      </button>
    </div>
  )
}
