export default function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/60 uppercase tracking-wider font-medium mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color || 'text-gold'}`}>{value}</p>
          {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gold" />
          </div>
        )}
      </div>
    </div>
  )
}
