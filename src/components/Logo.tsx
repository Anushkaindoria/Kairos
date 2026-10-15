export default function Logo({
  size = 52, light = false, showText = true, tagline = true,
}: { size?: number; light?: boolean; showText?: boolean; tagline?: boolean }) {
  const ink = light ? '#ffffff' : '#1e1b4b'
  return (
    <div className="flex items-center gap-3">
            <svg width={size * 1.2} height={size} viewBox="0 0 74 62" aria-hidden="true">
        <defs>
          <linearGradient id="kGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#4f46e5" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* K */}
        <g stroke={ink} strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 11 V47" />
          <path d="M12 31 L32 11" />
          <path d="M19 30 L31 47" />
        </g>
        {/* growth bars */}
        <rect x="38" y="38" width="5" height="9" rx="1.5" fill="url(#kGrad)" />
        <rect x="45" y="32" width="5" height="15" rx="1.5" fill="url(#kGrad)" />
        <rect x="52" y="26" width="5" height="21" rx="1.5" fill="url(#kGrad)" />
        {/* swoosh arrow */}
        <path d="M14 56 Q62 63 64 26" fill="none" stroke="url(#kGrad)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M64 8 L57 25 L71 25 Z" fill="#22d3ee" strokeLinejoin="round" />
      </svg>
      {showText && (
        <div className="leading-none">
          <div className="text-[1.8rem] font-extrabold tracking-[0.16em]">
            <span className={light ? 'text-white' : 'text-ink-900'}>KAI</span>
            <span className="bg-gradient-to-r from-brand-600 to-accent-400 bg-clip-text text-transparent">ROS</span>
          </div>
          {tagline && (
            <div className={`text-[10px] font-medium tracking-[0.12em] mt-1.5 ${light ? 'text-slate-300' : 'text-slate-500'}`}>
              Capital velocity, on autopilot
            </div>
          )}
        </div>
      )}
    </div>
  )
}