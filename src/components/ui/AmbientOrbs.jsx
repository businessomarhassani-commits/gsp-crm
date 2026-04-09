import { useUIStore } from '../../store/useUIStore'

export function AmbientOrbs() {
  const { theme } = useUIStore()
  if (theme !== 'dark') return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Blue orb - top right */}
      <div
        className="orb animate-float"
        style={{ width: 600, height: 600, top: -200, right: -100, background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)', animationDelay: '0s' }}
      />
      {/* Purple orb - bottom left */}
      <div
        className="orb animate-float2"
        style={{ width: 500, height: 500, bottom: -150, left: -80, background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', animationDelay: '-3s' }}
      />
      {/* Cyan orb - center */}
      <div
        className="orb animate-float"
        style={{ width: 400, height: 400, top: '40%', left: '40%', background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)', animationDelay: '-5s' }}
      />
    </div>
  )
}
