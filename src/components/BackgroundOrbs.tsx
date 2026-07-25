interface Orb {
  top?: string
  left?: string
  right?: string
  bottom?: string
  size: number
  blur: number
  opacity: number
  gradient: string
}

const ORBS: Orb[] = [
  { top: '-120px', left: '-100px', size: 480, blur: 90, opacity: 0.28, gradient: 'radial-gradient(circle, #5AC8FA, #0A84FF)' },
  { top: '200px', right: '-140px', size: 420, blur: 100, opacity: 0.22, gradient: 'radial-gradient(circle, #BF5AF2, #0A84FF)' },
  { bottom: '-160px', left: '30%', size: 400, blur: 100, opacity: 0.16, gradient: 'radial-gradient(circle, #34C759, #5AC8FA)' },
]

/** The soft blurred color washes every screen floats over — what makes the glass-surface cards read as glass instead of flat gray boxes. */
export function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {ORBS.map((orb, index) => (
        <div
          key={index}
          className="absolute rounded-full"
          style={{
            top: orb.top,
            left: orb.left,
            right: orb.right,
            bottom: orb.bottom,
            width: orb.size,
            height: orb.size,
            background: orb.gradient,
            filter: `blur(${orb.blur}px)`,
            opacity: orb.opacity,
          }}
        />
      ))}
    </div>
  )
}
