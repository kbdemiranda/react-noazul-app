const BANK_LOGOS: { pattern: RegExp; src: string }[] = [
  { pattern: /nubank/i, src: '/logos/nubank.png' },
  { pattern: /ita[uú]/i, src: '/logos/itau.png' },
]

function findLogo(name: string): string | null {
  return BANK_LOGOS.find((entry) => entry.pattern.test(name))?.src ?? null
}

interface BankLogoProps {
  name: string
  size?: number
  className?: string
}

/** Real logo for known banks/issuers (matched against account.bankName or card.issuer); falls back to an initial-letter avatar. */
export function BankLogo({ name, size = 36, className = '' }: BankLogoProps) {
  const logo = findLogo(name)

  if (logo) {
    return (
      <span
        className={`flex flex-none items-center justify-center overflow-hidden rounded-full bg-white ${className}`}
        style={{ width: size, height: size }}
      >
        <img src={logo} alt={name} className="h-full w-full object-cover" />
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
