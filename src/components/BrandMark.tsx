export function BrandMark({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={`flex-none text-brand-500 ${className}`}
    >
      <rect x="3" y="3" width="14" height="14" />
      <line x1="17" y1="13" x2="17" y2="21" />
      <line x1="13" y1="17" x2="21" y2="17" />
    </svg>
  )
}
