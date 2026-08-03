interface AvatarProps {
  src?: string | null
  name: string
  size?: number
  className?: string
}

/** User profile picture; falls back to the initial letter of `name` when there's no `src`. */
export function Avatar({ src, name, size = 32, className = '' }: AvatarProps) {
  if (src) {
    return (
      <span
        className={`flex flex-none items-center justify-center overflow-hidden rounded-full bg-surface ${className}`}
        style={{ width: size, height: size }}
      >
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </span>
    )
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full bg-brand-100 font-heading font-semibold text-brand-800 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  )
}
