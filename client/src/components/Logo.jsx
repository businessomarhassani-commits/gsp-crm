export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back triangle (slightly offset) */}
      <polygon points="16,4 30,26 2,26" fill="#E8A838" opacity="0.35" />
      {/* Front triangle */}
      <polygon points="16,8 28,28 4,28" fill="#E8A838" />
    </svg>
  )
}
